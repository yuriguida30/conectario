import { GoogleGenAI } from "@google/genai";
import { Coupon } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateCouponDescription = async (title: string, category: string, companyName: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) {
    console.warn("API Key is missing. Returning mock description.");
    return `Experimente o incrível ${title} no ${companyName}. Uma oferta imperdível na categoria ${category}! Venha conferir.`;
  }

  try {
    const prompt = `
      Você é um especialista em marketing para turismo em Arraial do Cabo.
      Escreva uma descrição curta, atraente e vendedora (máximo 150 caracteres) para um cupom de desconto.
      Empresa: ${companyName}
      Oferta: ${title}
      Categoria: ${category}
      Use emojis relacionados a praia e verão. Foque na experiência do turista.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || `Venha aproveitar ${title} no ${companyName}!`;
  } catch (error) {
    console.error("Gemini generation error:", error);
    return `Aproveite ${title} com um super desconto no ${companyName}!`;
  }
};

export const suggestCouponIdea = async (companyCategory: string): Promise<{ title: string; description: string }> => {
  const ai = getAIClient();
  if (!ai) {
      return {
          title: "Oferta Especial de Verão",
          description: "Desconto exclusivo para aproveitar o melhor de Arraial do Cabo."
      };
  }

  try {
    const prompt = `
      Sugira uma ideia criativa de cupom de desconto para uma empresa de ${companyCategory} em Arraial do Cabo.
      Retorne apenas um JSON com dois campos: "title" (título da oferta) e "description" (descrição curta).
      Não use markdown.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });
    
    const text = response.text || '{}';
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini suggestion error:", error);
    return {
        title: "Combo Promocional",
        description: "Pergunte ao balcão sobre nossas ofertas do dia!"
    };
  }
};