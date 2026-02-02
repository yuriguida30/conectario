
import { GoogleGenAI, Type } from "@google/genai";
import { BusinessProfile } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("ERRO: API_KEY não encontrada no process.env");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * AI Scraper Agent: Realiza buscas no Google Search para encontrar empresas reais.
 */
export const discoverBusinessesFromAI = async (
  neighborhood: string, 
  category: string, 
  amount: number = 5
): Promise<{ businesses: Partial<BusinessProfile>[], sources: any[] }> => {
  const ai = getAIClient();
  if (!ai) throw new Error("API Key não configurada.");

  try {
    const prompt = `
      Aja como um Agente Scraper de Dados Geográficos.
      Encontre exatamente ${amount} estabelecimentos REAIS de "${category}" no bairro "${neighborhood}", Rio de Janeiro.
      
      Você DEVE usar o Google Search para verificar a existência desses locais.
      Priorize locais com boas avaliações e dados de contato claros.

      Para cada local, extraia:
      - Nome
      - Endereço completo
      - WhatsApp (se disponível) ou Telefone
      - Nota média (estrelas)
      - Uma descrição estética e vendedora de até 120 caracteres.

      Formate a resposta EXCLUSIVAMENTE como um bloco de código JSON contendo um array de objetos. 
      Exemplo de formato esperado:
      [{"name": "...", "address": "...", "phone": "...", "rating": 4.5, "description": "..."}]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Removido responseMimeType: 'application/json' pois conflita com as regras de grounding chunks
        temperature: 0.2,
      },
    });

    const text = response.text || "";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Lógica para extrair o JSON mesmo que a IA adicione texto em volta
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
        openingHours: { "Seg-Sex": item.openingHours || "09h - 18h" }
      }));

      return { businesses, sources };
    } catch (parseError) {
      console.error("Falha ao parsear JSON da IA:", text);
      return { businesses: [], sources: [] };
    }

  } catch (error) {
    console.error("Erro no Agente de Descoberta:", error);
    throw error;
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
