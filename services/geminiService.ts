
import { GoogleGenAI } from "@google/genai";
import { setAIsessionCache, getAIsessionCache } from "./dataService";

export const discoverBusinessesFromAI = async (
  neighborhood: string, 
  category: string, 
  amount: number = 5
): Promise<{ businesses: any[], sources: any[] }> => {
  
  const cached = getAIsessionCache(neighborhood, category);
  if (cached) return cached;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    AJA COMO UM GUIA TURÍSTICO DO RIO DE JANEIRO.
    Localize ${amount} estabelecimentos REAIS e ATIVOS de "${category}" no bairro "${neighborhood}".
    
    IMPORTANTE: Retorne nomes e endereços que existem de fato.
    RETORNE APENAS JSON:
    [{"name": "...", "address": "...", "phone": "...", "rating": 4.5, "description": "...", "instagram": "...", "coverImage": "URL_FOTO_REAL"}]
  `;

  // Função interna para processar o texto e extrair JSON
  const processAIResponse = (text: string, category: string, neighborhood: string, groundingChunks: any[] = []) => {
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
    // PRIMEIRA TENTATIVA: Com Google Search (Dados em tempo real)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    const result = processAIResponse(
        response.text || "[]", 
        category, 
        neighborhood, 
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    );
    setAIsessionCache(neighborhood, category, result);
    return result;

  } catch (error: any) {
    // SE DER ERRO DE LIMITE (429), TENTA SEGUNDA VEZ SEM GOOGLE SEARCH (USANDO MEMÓRIA DA IA)
    if (error.message?.includes("429")) {
        console.warn("Limite do Google Search atingido. Ativando modo IA offline...");
        try {
            const fallbackResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt + " (USE APENAS SEU CONHECIMENTO INTERNO, NÃO USE FERRAMENTAS DE BUSCA)",
                config: { temperature: 0.2 },
            });
            const result = processAIResponse(fallbackResponse.text || "[]", category, neighborhood);
            setAIsessionCache(neighborhood, category, result);
            return result;
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
