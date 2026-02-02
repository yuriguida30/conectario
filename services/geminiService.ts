
import { GoogleGenAI, Type } from "@google/genai";
import { BusinessProfile } from "../types";

/**
 * AI Scraper Agent: Realiza buscas no Google Search para encontrar empresas reais.
 * Seguindo as diretrizes: Uso direto de process.env.API_KEY e instanciação por chamada.
 */
export const discoverBusinessesFromAI = async (
  neighborhood: string, 
  category: string, 
  amount: number = 5
): Promise<{ businesses: Partial<BusinessProfile>[], sources: any[] }> => {
  // Instanciação direta conforme diretrizes para garantir acesso ao process.env.API_KEY injetado
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const prompt = `
      Aja como um Agente de Inteligência de Mercado.
      Encontre exatamente ${amount} estabelecimentos REAIS e ATIVOS de "${category}" no bairro "${neighborhood}", Rio de Janeiro.
      
      Você DEVE usar a ferramenta googleSearch para validar a existência e reputação dos locais.
      Extraia: Nome, Endereço, WhatsApp (formato 5521...), Nota e uma Descrição curta.

      Retorne APENAS um array JSON:
      [{"name": "...", "address": "...", "phone": "...", "rating": 4.5, "description": "..."}]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const text = response.text || "";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Extração robusta de JSON do corpo da resposta
    const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
    const jsonStr = jsonMatch ? jsonMatch[0] : "[]";
    
    try {
      const rawData = JSON.parse(jsonStr);
      const businesses = rawData.map((item: any) => ({
        ...item,
        id: `ai_${Math.random().toString(36).substring(2, 9)}`,
        category: category,
        locationId: neighborhood,
        isClaimed: false,
        isImported: true,
        coverImage: `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800`, 
        gallery: [],
        amenities: [],
        views: 0,
        openingHours: { "Hoje": item.openingHours || "09h - 18h" }
      }));

      return { businesses, sources };
    } catch (parseError) {
      console.error("Erro ao processar resposta da IA:", text);
      return { businesses: [], sources: [] };
    }

  } catch (error) {
    console.error("Erro no Agente de Descoberta:", error);
    throw error;
  }
};

export const generateCouponDescription = async (businessName: string, category: string, discount: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere uma descrição atraente de até 100 caracteres para um cupom de ${discount}% de desconto no estabelecimento "${businessName}" da categoria "${category}".`,
    });
    return response.text || "";
  } catch (error) {
    return "";
  }
};
