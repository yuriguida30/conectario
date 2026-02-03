
import { GoogleGenAI } from "@google/genai";
import { setAIsessionCache, getAIsessionCache } from "./dataService";

const NEIGHBORHOOD_COORDS: Record<string, string> = {
  "Centro": "-22.915,-43.200,-22.890,-43.170",
  "Copacabana": "-22.985,-43.200,-22.960,-43.180",
  "Barra da Tijuca": "-23.020,-43.400,-22.980,-43.300",
  "Campo Grande": "-22.920,-43.580,-22.880,-43.530",
  "Sepetiba": "-23.000,-43.720,-22.960,-43.680"
};

export const discoverBusinessesFromAI = async (
  neighborhood: string, 
  category: string, 
  amount: number = 5
): Promise<{ businesses: any[], sources: any[], isFallback: boolean }> => {
  
  const cached = getAIsessionCache(neighborhood, category);
  if (cached) return { ...cached, isFallback: false };

  // 1. CONSULTA AVANÇADA AO MAPA (BUSCANDO IDENTIDADE DO LOCAL)
  const bbox = NEIGHBORHOOD_COORDS[neighborhood] || "-23.000,-43.700,-22.800,-43.100";
  
  // Mapeamento de categorias do app para tags do OpenStreetMap
  const categoryMap: Record<string, string> = {
    'Gastronomia': 'node["amenity"~"restaurant|cafe|fast_food|pizzeria|ice_cream"]',
    'Hospedagem': 'node["tourism"~"hotel|guest_house|hostel"]',
    'Passeios': 'node["tourism"~"attraction|viewpoint|museum"]',
    'Comércio': 'node["shop"]',
    'Serviços': 'node["amenity"~"bank|pharmacy|hospital"]'
  };

  const tagQuery = categoryMap[category] || 'node["amenity"]';
  
  const osmQuery = `[out:json][timeout:30];
    (
      ${tagQuery}(${bbox});
    );
    out body ${amount * 2};`;

  let realData: any[] = [];
  try {
    const osmResponse = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(osmQuery)}`);
    const osmJson = await osmResponse.json();
    realData = osmJson.elements.map((el: any) => ({
      name: el.tags.name || "",
      address: el.tags["addr:street"] ? `${el.tags["addr:street"]}, ${el.tags["addr:housenumber"] || 'S/N'}` : "Rio de Janeiro, RJ",
      phone: el.tags.phone || el.tags["contact:phone"] || el.tags["contact:whatsapp"] || "",
      website: el.tags.website || el.tags["contact:website"] || "",
      instagram: el.tags["contact:instagram"] || el.tags["instagram"] || "",
      cuisine: el.tags.cuisine || "",
      stars: el.tags.stars || ""
    })).filter((e: any) => e.name !== "").slice(0, amount);
  } catch (e) {
    console.error("Erro no OpenStreetMap");
  }

  if (realData.length === 0) return { businesses: [], sources: [], isFallback: false };

  // 2. IA COMO "CURADOR CARIOCA" - FOCO EM ASSERTIVIDADE
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    VOCÊ É UM CURADOR GASTRONÔMICO E TURÍSTICO DO RIO DE JANEIRO.
    DADOS REAIS RECEBIDOS DO MAPA: ${JSON.stringify(realData)}

    SUA MISSÃO:
    Para cada local, crie uma descrição "vendedora" baseada EXATAMENTE no nome e no tipo de culinária/serviço.
    Exemplo: Se o nome for "Sorveteria", fale de gelatos. Se for "Pizzaria", fale de massas.
    
    FORMATAÇÃO DE IMAGEM:
    Para o campo "coverImage", use este padrão: https://images.unsplash.com/photo-[ID]?auto=format&fit=crop&q=80&w=800
    Escolha fotos que REALMENTE pareçam com o lugar (Ex: Restaurante chique vs Quiosque de praia).

    RETORNE APENAS JSON:
    [{
      "name": "Nome Real do Mapa",
      "address": "Endereço Real",
      "phone": "Telefone Real",
      "category": "${category}",
      "description": "Descrição Assertiva e Localizada",
      "coverImage": "URL_UNSPLASH_RELEVANTE_AO_TEMA",
      "instagram": "Link se houver"
    }]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.2 } 
    });

    const text = response.text || "[]";
    const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
    const formattedData = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");

    const businesses = formattedData.map((item: any) => ({
      ...item,
      id: `ai_${Math.random().toString(36).substring(2, 9)}`,
      isClaimed: false,
      isImported: true,
      whatsapp: item.phone?.replace(/\D/g, ''),
      sourceUrl: item.instagram ? `https://instagram.com/${item.instagram.replace('@','')}` : `https://www.google.com/search?q=${encodeURIComponent(item.name + ' ' + neighborhood)}`,
      gallery: []
    }));

    const result = { businesses, sources: [], isFallback: false };
    setAIsessionCache(neighborhood, category, result);
    return result;

  } catch (error) {
    console.error("Erro na IA");
    return { businesses: [], sources: [], isFallback: false };
  }
};

export const generateCouponDescription = async (businessName: string, category: string, discount: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere uma chamada de venda curta para um cupom de ${discount}% na ${businessName}. Seja assertivo sobre o que o lugar oferece.`,
    });
    return response.text || `Desconto de ${discount}% na ${businessName}!`;
  } catch {
    return `Desconto de ${discount}% na ${businessName}!`;
  }
};
