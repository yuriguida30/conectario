
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
    AJA COMO UM INVESTIGADOR LOCAL PROFISSIONAL NO RIO DE JANEIRO.
    Sua missão é encontrar ${amount} estabelecimentos REAIS e ATIVOS de "${category}" no bairro "${neighborhood}".
    
    INSTRUÇÕES CRÍTICAS PARA IMAGENS REAIS:
    1. Você DEVE encontrar o perfil oficial do Instagram, Facebook ou Site oficial de cada lugar.
    2. A 'coverImage' deve ser a URL de uma foto REAL da fachada ou prato principal do lugar. NÃO USE PLACEHOLDERS.
    3. 'gallery' deve ter 2 URLs de fotos REAIS do ambiente interno ou produtos.
    4. Priorize links de imagens que terminem em .jpg ou .png vindos de servidores confiáveis (ex: scontent.cdninstagram.com, static.wixstatic.com, etc).

    DADOS NECESSÁRIOS:
    - Nome oficial.
    - Endereço completo.
    - WhatsApp ou Telefone.
    - Rating (ex: 4.7).
    - Link do Instagram.
    - Uma descrição curta e comercial de 2 frases.

    RETORNE APENAS UM JSON VÁLIDO:
    [{"name": "...", "address": "...", "phone": "...", "rating": 4.5, "description": "...", "instagram": "...", "coverImage": "URL_IMAGEM_REAL", "gallery": ["URL_REAL_1", "URL_REAL_2"]}]
    
    Se não encontrar uma foto real de jeito nenhum, descreva o lugar detalhadamente no campo descrição.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1 // Mais determinístico para garantir JSON correto
      },
    });

    const text = response.text || "[]";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
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
