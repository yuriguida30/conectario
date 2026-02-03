
import { GoogleGenAI } from "@google/genai";
import { BusinessProfile } from "../types";

/**
 * AI Scraper Agent: Realiza buscas no Google Search para encontrar empresas reais.
 */
export const discoverBusinessesFromAI = async (
  neighborhood: string, 
  category: string, 
  amount: number = 5
): Promise<{ businesses: Partial<BusinessProfile>[], sources: any[] }> => {
  
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY não encontrada no ambiente. Verifique as configurações da Vercel.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `
      Aja como um Agente de Inteligência de Mercado especializado no Rio de Janeiro.
      Encontre exatamente ${amount} estabelecimentos REAIS, POPULARES e ATIVOS de "${category}" no bairro "${neighborhood}", Rio de Janeiro.
      Use a ferramenta googleSearch para validar se eles ainda existem e qual a nota média.
      Retorne APENAS um array JSON puro (sem markdown):
      [{"name": "...", "address": "...", "phone": "...", "rating": 4.5, "description": "..."}]
    `;

    // Alterado para gemini-3-flash-preview para evitar erros de cota (429) em contas gratuitas
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

    // Tenta extrair o JSON da resposta
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
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "";
  
  const ai = new GoogleGenAI({ apiKey });
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
