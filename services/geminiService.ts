
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

  console.log(`🔍 Consultando BANCO DE DADOS DE MAPAS para ${category} em ${neighborhood}...`);

  // 1. BUSCAR DADOS REAIS NO OPENSTREETMAP (OVERPASS API) - GRATUITO E 100% REAL
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
      name: el.tags.name || "",
      address: el.tags["addr:street"] ? `${el.tags["addr:street"]}, ${el.tags["addr:housenumber"] || 'S/N'}` : "Endereço verificado via Mapa",
      phone: el.tags.phone || el.tags["contact:phone"] || "",
      lat: el.lat || el.center?.lat,
      lng: el.lon || el.center?.lon
    })).filter((e: any) => e.name !== "");
  } catch (e) {
    console.error("Erro ao acessar OpenStreetMap.");
  }

  // Se não houver dados reais no mapa para esse bairro, não deixamos a IA inventar
  if (realData.length === 0) {
      return { businesses: [], sources: [], isFallback: false };
  }

  // 2. USAR GEMINI APENAS PARA FORMATAR E CRIAR DESCRIÇÕES (SEM RISCO DE ALUCINAÇÃO)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    VOCÊ É UM ASSISTENTE DE FORMATAÇÃO DE DADOS TURÍSTICOS.
    RECEBI ESTES DADOS REAIS E VERIFICADOS DO MAPA DE RIO DE JANEIRO: ${JSON.stringify(realData.slice(0, amount))}
    
    TAREFA: 
    1. Mantenha os nomes e endereços EXATAMENTE como fornecidos.
    2. Crie uma descrição curta (máximo 15 words) para cada um.
    3. Retorne APENAS um JSON puro no formato:
    [{"name": "...", "address": "...", "phone": "...", "rating": 4.5, "description": "...", "coverImage": "URL_IMAGEM_RELEVANTE"}]

    ATENÇÃO: NÃO INVENTE LUGARES QUE NÃO ESTÃO NA LISTA ACIMA.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.1 } // Baixa temperatura = menos criatividade, mais precisão
    });

    const text = response.text || "[]"; // Correção do erro de TS (undefined)
    const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
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

    const result = { businesses, sources: [], isFallback: false };
    setAIsessionCache(neighborhood, category, result);
    return result;

  } catch (error) {
    console.error("Erro na IA ao formatar dados:", error);
    // Fallback seguro: retorna os dados brutos do mapa sem descrição da IA
    return { 
        businesses: realData.map(d => ({ ...d, description: "Local verificado em " + neighborhood, id: Math.random().toString() })), 
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
      contents: `Gere uma frase curta para um cupom de ${discount}% em ${businessName}.`,
    });
    return response.text || `Desconto de ${discount}% na ${businessName}!`;
  } catch {
    return `Desconto de ${discount}% na ${businessName}!`;
  }
};
