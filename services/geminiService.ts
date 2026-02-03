
import { GoogleGenAI } from "@google/genai";
import { setAIsessionCache, getAIsessionCache } from "./dataService";

export const discoverBusinessesFromAI = async (
  neighborhood: string, 
  category: string, 
  amount: number = 5
): Promise<{ businesses: any[], sources: any[] }> => {
  
  // VERIFICA SE JÁ PESQUISOU ISSO ANTES (ECONOMIZA COTA)
  const cached = getAIsessionCache(neighborhood, category);
  if (cached) return cached;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    AJA COMO UM GUIA TURÍSTICO DO RIO DE JANEIRO.
    Localize ${amount} estabelecimentos REAIS e ATIVOS de "${category}" no bairro "${neighborhood}".
    
    IMPORTANTÍSSIMO: Forneça o nome real, endereço real e instagram.
    RETORNE APENAS JSON:
    [{"name": "...", "address": "...", "phone": "...", "rating": 4.5, "description": "...", "instagram": "...", "coverImage": "URL_FOTO_REAL"}]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 } // Desativa o "pensar" para ser mais rápido e barato
      },
    });

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
      coverImage: item.coverImage || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800`,
      gallery: []
    }));

    const finalResult = { businesses, sources: groundingChunks };
    
    // GUARDA NA MEMÓRIA PARA A PRÓXIMA VEZ
    setAIsessionCache(neighborhood, category, finalResult);
    
    return finalResult;
  } catch (error: any) {
    console.error("Discovery Error:", error);
    throw error;
  }
};

export const generateCouponDescription = async (businessName: string, category: string, discount: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
