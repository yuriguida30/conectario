
import { GoogleGenAI } from "@google/genai";
import { BusinessProfile } from "../types";

/**
 * AI Discovery Agent: Usa o poder de busca do Gemini 3 Pro para encontrar dados VIVOS.
 */
export const discoverBusinessesFromAI = async (
  neighborhood: string, 
  category: string, 
  amount: number = 5
): Promise<{ businesses: any[], sources: any[] }> => {
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY não configurada.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    AJA COMO UM PESQUISADOR LOCAL PROFISSIONAL.
    Encontre ${amount} estabelecimentos REAIS, ATIVOS e POPULARES de "${category}" no bairro "${neighborhood}", Rio de Janeiro.
    
    CRITÉRIOS OBRIGATÓRIOS:
    1. Você deve encontrar o INSTAGRAM ou SITE oficial para extrair URLs de imagens reais.
    2. 'coverImage' deve ser a foto principal/fachada.
    3. 'gallery' deve conter 2 fotos (ambiente, pratos ou serviços).
    4. Se não encontrar uma URL de imagem direta que funcione, descreva o lugar com precisão.

    DADOS NECESSÁRIOS PARA CADA LUGAR:
    - Nome exato.
    - Endereço real com ponto de referência.
    - WhatsApp ou Telefone.
    - Rating real (ex: 4.8).
    - Descrição curta e atrativa.
    - Link do Instagram ou Site oficial.

    RETORNE APENAS UM JSON VÁLIDO:
    [{"name": "...", "address": "...", "phone": "...", "rating": 4.5, "description": "...", "instagram": "...", "coverImage": "URL_IMAGEM_REAL", "gallery": ["URL_1", "URL_2"]}]
    
    Importante: Procure por imagens reais no Google Search para garantir que não são placeholders genéricos.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Usa busca web real para veracidade total
        temperature: 0.2
      },
    });

    const text = response.text || "[]";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Limpeza de Markdown se necessário
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
      sourceUrl: item.instagram || item.website || `https://www.google.com/search?q=${encodeURIComponent(item.name + ' ' + neighborhood)}`,
      // Fallback inteligente se a imagem for inválida
      coverImage: item.coverImage?.startsWith('http') ? item.coverImage : `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800`,
      gallery: Array.isArray(item.gallery) ? item.gallery : []
    }));

    return { businesses, sources: groundingChunks };
  } catch (error: any) {
    console.error("AI Discovery Error:", error);
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
