
import { GoogleGenAI } from "@google/genai";
import { BusinessProfile } from "../types";

export const discoverBusinessesFromAI = async (
  neighborhood: string, 
  category: string, 
  amount: number = 5
): Promise<{ businesses: Partial<BusinessProfile>[], sources: any[] }> => {
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY não configurada.");

  const ai = new GoogleGenAI({ apiKey });
  const model = ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    config: {
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  const prompt = `
    Aja como um guia local do Rio de Janeiro. 
    Liste ${amount} estabelecimentos REAIS de "${category}" no bairro "${neighborhood}".
    Retorne APENAS um JSON: [{"name": "...", "address": "...", "phone": "...", "rating": 4.5, "description": "..."}]
  `;

  try {
    // Tentativa 1: Com Google Search (Dados em tempo real)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    return parseAIResponse(response.text || "[]", category, neighborhood, response.candidates?.[0]?.groundingMetadata?.groundingChunks || []);
  } catch (error: any) {
    // Tentativa 2: Fallback (Sem Google Search para evitar erro 429)
    console.warn("Google Search Limitado. Usando modo criativo...");
    const fallbackResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return parseAIResponse(fallbackResponse.text || "[]", category, neighborhood, []);
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
    });
    return response.text || "";
  } catch (error) {
    return "";
  }
};
