
import { GoogleGenAI } from "@google/genai";
import { setAIsessionCache, getAIsessionCache } from "./dataService";

// Coordenadas aproximadas dos bairros para busca no OpenStreetMap
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

  console.log(`🔍 Buscando dados REAIS no OpenStreetMap para ${category} em ${neighborhood}...`);

  // 1. BUSCAR DADOS REAIS NO OPENSTREETMAP (OVERPASS API) - GRATUITO E REAL
  const bbox = NEIGHBORHOOD_COORDS[neighborhood] || "-23.000,-43.700,-22.800,-43.100";
  const osmCategory = category.toLowerCase().includes('gastro') ? 'restaurant' : 
                     category.toLowerCase().includes('hosp') ? 'hotel' : 'shop';
  
  const osmQuery = `[out:json][timeout:25];
    (
      node["amenity"="${osmCategory}"](${bbox});
      way["amenity"="${osmCategory}"](${bbox});
      node["shop"](${bbox});
    );
    out body ${amount};`;

  let realData: any[] = [];
  try {
    const osmResponse = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(osmQuery)}`);
    const osmJson = await osmResponse.json();
    realData = osmJson.elements.map((el: any) => ({
      name: el.tags.name || "Estabelecimento sem nome",
      address: el.tags["addr:street"] ? `${el.tags["addr:street"]}, ${el.tags["addr:housenumber"] || 'S/N'}` : "Endereço via Mapa",
      phone: el.tags.phone || el.tags["contact:phone"] || "",
      lat: el.lat || el.center?.lat,
      lng: el.lon || el.center?.lon
    })).filter((e: any) => e.name !== "Estabelecimento sem nome");
  } catch (e) {
    console.error("Erro ao acessar OpenStreetMap, usando conhecimento da IA.");
  }

  // 2. USAR GEMINI APENAS PARA FORMATAR E CRIAR DESCRIÇÕES (SEM GOOGLE SEARCH = SEM ERRO 429)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    VOCÊ É UM GUIA TURÍSTICO DO RIO DE JANEIRO.
    RECEBI ESTES DADOS REAIS DO MAPA: ${JSON.stringify(realData.slice(0, amount))}
    
    PARA CADA UM, CRIE UMA DESCRIÇÃO CURTA E ATRAENTE. 
    SE A LISTA ESTIVER VAZIA, USE SEU CONHECIMENTO INTERNO PARA CITAR 5 LUGARES REAIS EM ${neighborhood}.
    RETORNE APENAS JSON NO FORMATO:
    [{"name": "...", "address": "...", "phone": "...", "rating": 4.5, "description": "...", "coverImage": "URL_UNSPLASH_RELEVANTE"}]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.2 } // Sem ferramentas de busca para evitar 429
    });

    const jsonMatch = response.text.match(/\[\s*\{.*\}\s*\]/s);
    const formattedData = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");

    const businesses = formattedData.map((item: any) => ({
      ...item,
      id: `ai_${Math.random().toString(36).substring(2, 9)}`,
      category,
      locationId: neighborhood,
      isClaimed: false,
      isImported: true,
      whatsapp: item.phone?.replace(/\D/g, ''),
      sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(item.name + ' ' + neighborhood)}`,
      coverImage: item.coverImage || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800`,
      gallery: []
    }));

    const result = { businesses, sources: [], isFallback: realData.length === 0 };
    setAIsessionCache(neighborhood, category, result);
    return result;

  } catch (error) {
    console.error("Erro na IA:", error);
    throw error;
  }
};

export const generateCouponDescription = async (businessName: string, category: string, discount: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
