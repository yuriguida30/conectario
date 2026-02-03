
import { GoogleGenAI } from "@google/genai";
import { setAIsessionCache, getAIsessionCache } from "./dataService";

export const discoverBusinessesFromAI = async (
  neighborhood: string, 
  category: string, 
  amount: number = 5
): Promise<{ businesses: any[], sources: any[], isFallback: boolean }> => {
  
  const cached = getAIsessionCache(neighborhood, category);
  if (cached) return { ...cached, isFallback: false };

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    AJA COMO UM GUIA TURÍSTICO DO RIO DE JANEIRO.
    Localize ${amount} estabelecimentos REAIS e ATIVOS de "${category}" no bairro "${neighborhood}".
    
    IMPORTANTE: Retorne nomes e endereços que existem de fato.
    RETORNE APENAS JSON:
    [{"name": "...", "address": "...", "phone": "...", "rating": 4.5, "description": "...", "instagram": "...", "coverImage": "URL_FOTO_REAL"}]
  `;

  const processResponse = (text: string, groundingChunks: any[] = []) => {
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

    return { businesses, sources: groundingChunks };
  };

  try {
    // TENTATIVA 1: COM GOOGLE SEARCH
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const result = processResponse(response.text || "[]", response.candidates?.[0]?.groundingMetadata?.groundingChunks || []);
    setAIsessionCache(neighborhood, category, result);
    return { ...result, isFallback: false };

  } catch (error: any) {
    // TENTATIVA 2: SE O GOOGLE DER ERRO 429, USA A MEMÓRIA DA IA (ILIMITADA)
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      console.warn("Limite de busca excedido. Ativando IA de Memória Interna...");
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt + " (USE SEU CONHECIMENTO INTERNO, NÃO USE BUSCA GOOGLE)",
          config: { temperature: 0.2 },
        });
        const result = processResponse(fallbackResponse.text || "[]");
        setAIsessionCache(neighborhood, category, result);
        return { ...result, isFallback: true };
      } catch (innerError) {
        throw innerError;
      }
    }
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
