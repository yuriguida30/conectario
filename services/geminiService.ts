
import { GoogleGenAI } from "@google/genai";
import { BusinessProfile } from "../types";

// Coordenadas aproximadas para ajudar o Maps Grounding
const NEIGHBORHOOD_COORDS: Record<string, { lat: number, lng: number }> = {
  "Centro": { lat: -22.9068, lng: -43.1729 },
  "Copacabana": { lat: -22.9694, lng: -43.1868 },
  "Barra da Tijuca": { lat: -23.0003, lng: -43.3659 },
  "Campo Grande": { lat: -22.9035, lng: -43.5591 },
  "Sepetiba": { lat: -22.9739, lng: -43.6997 }
};

/**
 * AI Scraper Agent: Usa Google Maps Grounding para encontrar lugares REAIS.
 */
export const discoverBusinessesFromAI = async (
  neighborhood: string, 
  category: string, 
  amount: number = 5
): Promise<{ businesses: any[], sources: any[] }> => {
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY não configurada.");

  const ai = new GoogleGenAI({ apiKey });
  const coords = NEIGHBORHOOD_COORDS[neighborhood] || NEIGHBORHOOD_COORDS["Centro"];

  const prompt = `
    Encontre ${amount} estabelecimentos REAIS, ATIVOS e BEM AVALIADOS de "${category}" no bairro "${neighborhood}", Rio de Janeiro.
    
    Para cada lugar, você DEVE extrair:
    1. Nome exato do local.
    2. Endereço completo.
    3. Uma breve descrição do que vendem ou como é o ambiente.
    4. Nota média (rating).

    Retorne APENAS um JSON:
    [{"name": "...", "address": "...", "phone": "...", "rating": 4.5, "description": "...", "mapsUri": "..."}]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: coords.lat,
              longitude: coords.lng
            }
          }
        },
        temperature: 0.0
      },
    });

    const text = response.text || "[]";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
    const rawData = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");

    const businesses = rawData.map((item: any, index: number) => {
      // Tenta pegar o link do maps direto do grounding se o JSON da IA falhar em trazer
      const mapsLink = item.mapsUri || groundingChunks.find((c: any) => c.maps?.title?.includes(item.name))?.maps?.uri;

      return {
        ...item,
        id: `map_${Math.random().toString(36).substring(2, 9)}`,
        category,
        locationId: neighborhood,
        isClaimed: false,
        isImported: true,
        sourceUrl: mapsLink || `https://www.google.com/maps/search/${encodeURIComponent(item.name + ' ' + neighborhood)}`,
        coverImage: `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800`,
        views: 0,
        rating: item.rating || 4.5
      };
    });

    return { businesses, sources: groundingChunks };
  } catch (error: any) {
    console.error("Erro no Agente Maps:", error);
    throw error;
  }
};

export const generateCouponDescription = async (businessName: string, category: string, discount: number): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return `Aproveite ${discount}% de desconto!`;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere uma frase curta para um cupom de ${discount}% em ${businessName}.`,
    });
    return response.text || "";
  } catch {
    return `Desconto de ${discount}% na ${businessName}!`;
  }
};
