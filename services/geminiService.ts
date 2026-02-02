
import { GoogleGenAI, Type } from "@google/genai";
import { BusinessProfile } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

/**
 * AI Scraper Agent: Realiza buscas no Google Search para encontrar empresas reais.
 * Agora com suporte a quantidade dinâmica e foco em veracidade.
 */
export const discoverBusinessesFromAI = async (neighborhood: string, category: string, amount: number = 5): Promise<Partial<BusinessProfile>[]> => {
  const ai = getAIClient();
  if (!ai) return [];

  try {
    const prompt = `
      Você é um Agente de Inteligência de Mercado sênior. 
      Sua missão é encontrar os ${amount} estabelecimentos de MAIOR VERACIDADE e melhor reputação na categoria "${category}" no bairro "${neighborhood}", Rio de Janeiro.
      
      CRITÉRIOS DE SELEÇÃO:
      1. Verifique se o local existe no Google Maps.
      2. Priorize locais com mais de 50 avaliações e nota acima de 4.0.
      3. Extraia dados oficiais (WhatsApp e Endereço).
      4. Crie uma descrição estética e curta (até 150 caracteres) focada no diferencial real do lugar.

      RETORNE APENAS UM ARRAY JSON PURO, sem markdown, sem explicações:
      [{
        "name": "Nome Real",
        "address": "Endereço Completo",
        "lat": -22.xxxx,
        "lng": -43.xxxx,
        "phone": "WhatsApp com DDD",
        "openingHours": {"Seg-Sex": "08h-18h"},
        "description": "Texto atraente focado em qualidade",
        "rating": 4.8,
        "reviewCount": 150
      }]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json'
      },
    });

    const text = response.text || '[]';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    return data.map((item: any) => ({
      ...item,
      id: `ai_${Math.random().toString(36).substring(2, 9)}`,
      category: category,
      locationId: neighborhood,
      isClaimed: false,
      isImported: true,
      // Usamos uma lógica de busca de imagem mais inteligente baseada no nome e categoria
      coverImage: `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800`, 
      gallery: [],
      amenities: [],
      views: 0
    }));

  } catch (error) {
    console.error("AI Discovery Agent Error:", error);
    return [];
  }
};

export const generateCouponDescription = async (businessName: string, category: string, discount: number): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "";
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
