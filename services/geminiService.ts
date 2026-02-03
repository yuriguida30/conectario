
import { GoogleGenAI } from "@google/genai";
import { BusinessProfile } from "../types";

/**
 * AI Discovery Agent: Usa o Gemini 3 Flash (Mais rápido e limites maiores no Free Tier).
 */
export const discoverBusinessesFromAI = async (
  neighborhood: string, 
  category: string, 
  amount: number = 5
): Promise<{ businesses: any[], sources: any[] }> => {
  
  // Direct initialization with process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    VOCÊ É UM AGENTE DE TURISMO NO RIO DE JANEIRO.
    Encontre ${amount} estabelecimentos REAIS de "${category}" no bairro "${neighborhood}".
    
    REQUISITOS DE IMAGEM:
    1. Busque links de fotos REAIS do local (Fachada ou Ambiente).
    2. Priorize links do Instagram (ex: scontent.cdninstagram.com) ou de sites oficiais (.com.br).
    3. NÃO USE links quebrados ou genéricos.

    DADOS:
    - Nome, Endereço, WhatsApp, Rating, Instagram e uma Descrição curta.

    RETORNE APENAS JSON:
    [{"name": "...", "address": "...", "phone": "...", "rating": 4.5, "description": "...", "instagram": "...", "coverImage": "URL_REAL", "gallery": ["URL_1", "URL_2"]}]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2
      },
    });

    // Access .text property directly
    const text = response.text || "[]";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
    const rawData = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");

    const businesses = rawData.map((item: any) => ({
      ...item,
      id: `ai_${Math.random().toString(36).substring(2, 9)}`,
      category,
      locationId: neighborhood,
      isClaimed: false,
      isImported: true,
      whatsapp: item.phone?.replace(/\D/g, ''),
      sourceUrl: item.instagram || `https://www.google.com/search?q=${encodeURIComponent(item.name + ' ' + neighborhood)}`,
      coverImage: item.coverImage?.startsWith('http') ? item.coverImage : `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800`,
      gallery: Array.isArray(item.gallery) ? item.gallery : []
    }));

    return { businesses, sources: groundingChunks };
  } catch (error: any) {
    console.error("Discovery Error:", error);
    throw error;
  }
};

export const generateCouponDescription = async (businessName: string, category: string, discount: number): Promise<string> => {
  // Direct initialization with process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere uma frase curta para um cupom de ${discount}% em ${businessName}.`,
    });
    // Access .text property directly
    return response.text || "";
  } catch {
    return `Desconto de ${discount}% na ${businessName}!`;
  }
};
