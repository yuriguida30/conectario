
import { GoogleGenAI } from "@google/genai";

export const generateCouponDescription = async (businessName: string, category: string, discount: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere uma chamada vendedora e curta (máximo 15 palavras) para um cupom de ${discount}% na empresa ${businessName}. Categoria: ${category}.`,
    });
    return response.text || `Garanta ${discount}% de desconto na ${businessName}!`;
  } catch {
    return `Desconto de ${discount}% na ${businessName}!`;
  }
};

// IA Scraper removed as per user request
