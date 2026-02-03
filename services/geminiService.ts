
import { GoogleGenAI } from "@google/genai";
import { BusinessProfile } from "../types";

/**
 * AI Scraper Agent: Busca empresas REAIS usando Google Search.
 * Se a cota de busca falhar, ele retorna erro para evitar alucinações (dados falsos).
 */
export const discoverBusinessesFromAI = async (
  neighborhood: string, 
  category: string, 
  amount: number = 5
): Promise<{ businesses: any[], sources: any[] }> => {
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY não configurada.");

  const ai = new GoogleGenAI({ apiKey });

  // Prompt focado em extrair dados REAIS e VERIFICÁVEIS
  const prompt = `
    INSTRUÇÃO OBRIGATÓRIA: Use a ferramenta googleSearch para encontrar EXATAMENTE ${amount} estabelecimentos REAIS e ATIVOS de "${category}" no bairro "${neighborhood}", Rio de Janeiro.
    
    REGRAS CRÍTICAS:
    1. NÃO INVENTE nomes. Se não encontrar resultados reais no Google Search, retorne um array vazio [].
    2. Procure por sites oficiais, perfis de Instagram ou páginas no Google Maps para extrair o telefone e endereço CORRETO.
    3. Para cada estabelecimento, identifique uma URL de referência (Maps ou Site).

    Retorne APENAS um JSON no formato:
    [{"name": "...", "address": "...", "phone": "...", "rating": 4.5, "description": "...", "sourceUrl": "URL_DO_GOOGLE_MAPS_OU_SITE"}]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.0, // Zero criatividade para evitar mentiras
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    const text = response.text || "[]";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
    const rawData = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");

    const businesses = rawData.map((item: any, index: number) => ({
      ...item,
      id: `real_${Math.random().toString(36).substring(2, 9)}`,
      category,
      locationId: neighborhood,
      isClaimed: false,
      isImported: true,
      // Tenta associar o link de referência do grounding ao item, se disponível
      sourceUrl: item.sourceUrl || (groundingChunks[index]?.web?.uri) || null,
      coverImage: `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800`,
      views: 0,
      rating: item.rating || 4.5
    }));

    return { businesses, sources: groundingChunks };
  } catch (error: any) {
    console.error("Erro no Agente Real:", error);
    // Repassa o erro 429 ou qualquer outro para a UI tratar com transparência
    throw error;
  }
};

export const generateCouponDescription = async (businessName: string, category: string, discount: number): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return `Aproveite ${discount}% de desconto!`;
  const ai = new GoogleGenAI({ apiKey });
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
