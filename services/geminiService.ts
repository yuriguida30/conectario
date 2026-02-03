
import { GoogleGenAI } from "@google/genai";
import { BusinessProfile } from "../types";

/**
 * AI Scraper Agent: Realiza buscas no Google Search para encontrar empresas reais.
 * Implementa fallback para evitar erro 429.
 */
export const discoverBusinessesFromAI = async (
  neighborhood: string, 
  category: string, 
  amount: number = 5
): Promise<{ businesses: Partial<BusinessProfile>[], sources: any[] }> => {
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY não configurada.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Aja como um guia local experiente do Rio de Janeiro. 
    Encontre ${amount} estabelecimentos reais e populares de "${category}" no bairro "${neighborhood}".
    Retorne APENAS um array JSON puro:
    [{"name": "...", "address": "...", "phone": "...", "rating": 4.5, "description": "..."}]
  `;

  try {
    // TENTATIVA 1: Busca em tempo real (Pode falhar por cota 429)
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.1,
          thinkingConfig: { thinkingBudget: 0 }
        },
      });

      return parseAIResponse(response.text || "[]", category, neighborhood, response.candidates?.[0]?.groundingMetadata?.groundingChunks || []);
    } catch (searchError: any) {
      // Se for erro de cota (429), tenta sem a ferramenta de busca
      if (searchError.message?.includes("429") || searchError.status === 429) {
        console.warn("Cota de busca exaurida. Usando modo offline...");
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt + " (Use seu conhecimento interno, pois a busca web está limitada agora)",
          config: {
            temperature: 0.3,
            thinkingConfig: { thinkingBudget: 0 }
          }
        });
        return parseAIResponse(fallbackResponse.text || "[]", category, neighborhood, []);
      }
      throw searchError;
    }
  } catch (error: any) {
    console.error("Erro fatal no Agente de Descoberta:", error);
    throw error;
  }
};

const parseAIResponse = (text: string, category: string, neighborhood: string, sources: any[]) => {
  const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
  const data = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
  const businesses = data.map((item: any) => ({
    ...item,
    id: `ai_${Math.random().toString(36).substring(2, 9)}`,
    category,
    locationId: neighborhood,
    isClaimed: false,
    isImported: true,
    coverImage: `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800`,
    views: 0,
    rating: item.rating || 4.5
  }));
  return { businesses, sources };
};

export const generateCouponDescription = async (businessName: string, category: string, discount: number): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return `Aproveite ${discount}% de desconto em ${businessName}!`;
  
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere uma frase curta e chamativa para um cupom de ${discount}% em ${businessName}.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "";
  } catch (error) {
    return `Desconto imperdível de ${discount}% na ${businessName}!`;
  }
};
