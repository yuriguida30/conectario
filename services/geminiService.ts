import { GoogleGenAI } from "@google/genai";
import { Coupon } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateCouponDescription = async (title: string, category: string, companyName: string): Promise<string> => {
  if (!apiKey) {
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

    return response.text.trim();
  } catch (error) {
    console.error("Gemini generation error:", error);
    return `Aproveite ${title} com um super desconto no ${companyName}!`;
  }
};

export const suggestCouponIdea = async (companyCategory: string): Promise<{ title: string; description: string }> => {
  if (!apiKey) {
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
    
    // We use JSON mode roughly by parsing result, but let's keep it simple text parsing if schema fails or just asking for text.
    // Ideally use schema, but for simplicity here we parse manually or ask for simple format.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });
    
    const text = response.text;
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini suggestion error:", error);
    return {
        title: "Combo Promocional",
        description: "Pergunte ao balcão sobre nossas ofertas do dia!"
    };
  }
};
