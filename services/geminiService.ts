
import { GoogleGenAI } from "@google/genai";
import { setAIsessionCache, getAIsessionCache } from "./dataService";

// Coordenadas para busca no mapa
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

  console.log(`🔍 Iniciando busca profunda para ${amount} locais em ${neighborhood}...`);

  // 1. BUSCA AMPLA NO MAPA (OSM)
  const bbox = NEIGHBORHOOD_COORDS[neighborhood] || "-23.000,-43.700,-22.800,-43.100";
  
  const categoryMap: Record<string, string> = {
    'Gastronomia': 'node["amenity"~"restaurant|cafe|fast_food|pizzeria|ice_cream|bar"]',
    'Hospedagem': 'node["tourism"~"hotel|guest_house|hostel|camp_site"]',
    'Passeios': 'node["tourism"~"attraction|viewpoint|museum|theme_park"]',
    'Comércio': 'node["shop"]',
    'Serviços': 'node["amenity"~"bank|pharmacy|hospital|atm|post_office"]'
  };

  const tagQuery = categoryMap[category] || 'node["amenity"]';
  
  // Pedimos o dobro do solicitado para ter margem de escolha pela IA
  const osmQuery = `[out:json][timeout:30];
    (
      ${tagQuery}(${bbox});
      way["tourism"](${bbox});
    );
    out body ${amount * 3};`;

  let rawOsmData: any[] = [];
  try {
    const osmResponse = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(osmQuery)}`);
    const osmJson = await osmResponse.json();
    rawOsmData = osmJson.elements.map((el: any) => ({
      name: el.tags.name || "",
      address: el.tags["addr:street"] ? `${el.tags["addr:street"]}, ${el.tags["addr:housenumber"] || 'S/N'}` : "Rio de Janeiro, RJ",
      phone: el.tags.phone || el.tags["contact:phone"] || el.tags["contact:whatsapp"] || "",
      website: el.tags.website || el.tags["contact:website"] || "",
      instagram: el.tags["contact:instagram"] || el.tags["instagram"] || "",
      type: el.tags.amenity || el.tags.tourism || el.tags.shop || "business"
    })).filter((e: any) => e.name !== "");
  } catch (e) {
    console.error("Erro ao buscar no OpenStreetMap");
  }

  if (rawOsmData.length === 0) return { businesses: [], sources: [], isFallback: false };

  // 2. IA COMO CURADOR ESTRATÉGICO
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    VOCÊ É UM EXPERT EM GEOLOCALIZAÇÃO E MARKETING DO RIO DE JANEIRO.
    RECEBI ESTES DADOS BRUTOS DO MAPA: ${JSON.stringify(rawOsmData)}

    SUA TAREFA:
    1. Selecione exatamente os ${amount} melhores lugares da lista acima.
    2. Para cada um, escreva uma descrição ASSERTIVA e PROFISSIONAL de 15 a 20 palavras.
       - Se for "Pizzaria", mencione forno a lenha ou massas.
       - Se for "Pousada", mencione conforto e hospitalidade.
       - Use gírias cariocas leves se apropriado para o local (ex: quiosques).
    3. Para "coverImage", use o Unsplash com termos de busca precisos baseados no NOME e TIPO do local.
       Ex: Se for um bar de praia, use fotos de quiosque. Se for hotel, use fotos de quartos.

    FORMATO DE RETORNO (JSON PURO):
    [{
      "name": "Nome",
      "address": "Endereço",
      "phone": "Telefone",
      "category": "${category}",
      "description": "Descrição Assertiva",
      "coverImage": "https://images.unsplash.com/photo-[ID]?auto=format&fit=crop&q=80&w=800",
      "instagram": "Username ou vazio"
    }]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        temperature: 0.3,
        responseMimeType: "application/json"
      } 
    });

    const text = response.text || "[]"; // Fix do erro de Build (undefined check)
    const formattedData = JSON.parse(text);

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
    console.error("Erro na processamento da IA:", error);
    // Retorna os dados do mapa limpos caso a IA falhe
    return { 
      businesses: rawOsmData.slice(0, amount).map(d => ({
        ...d,
        id: `map_${Math.random().toString(36).substring(2, 5)}`,
        description: `Local verificado em ${neighborhood}.`,
        coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800"
      })),
      sources: [],
      isFallback: false 
    };
  }
};

export const generateCouponDescription = async (businessName: string, category: string, discount: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere uma chamada vendedora e curta para um cupom de ${discount}% na ${businessName}. Foco na categoria ${category}.`,
    });
    return response.text || `Garanta ${discount}% de desconto na ${businessName}!`;
  } catch {
    return `Desconto de ${discount}% na ${businessName}!`;
  }
};
