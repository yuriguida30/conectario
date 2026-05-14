
import { GoogleGenAI, Type } from "@google/genai";
import { BusinessProfile } from "../types";

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    throw new Error("Chave de API do Gemini não encontrada no ambiente.");
  }
  return new GoogleGenAI({ apiKey });
}

export interface AgentStep {
  role: string;
  name: string;
  content: string;
  status: 'pending' | 'working' | 'completed' | 'error';
  feedback?: string;
}

export const INITIAL_STEPS: AgentStep[] = [
  { role: 'researcher', name: 'Pesquisador de Elite', content: '', status: 'pending' },
  { role: 'analyzer', name: 'Analista de Dados Crítico', content: '', status: 'pending' },
  { role: 'visualizer', name: 'Analista Visual & Curador', content: '', status: 'pending' }, 
  { role: 'strategist', name: 'Decisor Estratégico', content: '', status: 'pending' },
  { role: 'copywriter', name: 'Copywriter & SEO Expert', content: '', status: 'pending' },
  { role: 'finalizer', name: 'Engenheiro de Dados', content: '', status: 'pending' }
];

const SYSTEM_PROMPTS = {
  researcher: `Você é um Pesquisador de Elite especializado na Região dos Lagos. Sua missão é trazer a verdade nua e crua. 
Inclua: História real, fatos pouco conhecidos, coordenadas precisas, endereço completo e infraestrutura. 
Se você receber um feedback do Comandante, revise seus dados e aprofunde ainda mais nos pontos solicitados.`,
  
  analyzer: `Você é implacável. Se o Pesquisador foi vago, você DEVE criticar. 
Procure por inconsistências: a história faz sentido? O local realmente fica no bairro citado? 
Aponte erros e exija correções.`,

  visualizer: `Você é especialista em busca visual. Sua missão é identificar os melhores termos de busca para encontrar imagens REAIS deste local no Google/Unsplash. 
Sugira 3 URLs de imagens conceituais que representem fielmente o local e descreva como a imagem deve ser (ex: "Foto tirada do mirante, sem filtros excessivos, mostrando a tonalidade real da água"). 
Foque em REALISMO.`,

  strategist: `Você define o posicionamento. Baseado nos dados e imagens, qual o valor único desse local? 
Categorize com precisão cirúrgica para o Lagos GO.`,

  copywriter: `Transforme tudo em ouro. Use técnicas de Copywriting de alto nível (AIDA, PAS). 
Otimize para SEO local. A descrição deve ser irresistível mas honesta.`,

  finalizer: `Consolide tudo. Se houver falhas nas etapas anteriores de acordo com o Comandante, você deve alertar.`
};

export async function runAgentStep(role: string, input: string, context?: string, feedback?: string): Promise<string> {
  const ai = getAI();
  const model = "gemini-3-flash-preview"; 
  
  const prompt = `
Contexto Geral Anterior:
${context || 'Nenhum contexto prévio.'}

Instrução do seu Papel:
${(SYSTEM_PROMPTS as any)[role]}

ENTRADA ATUAL DO USUÁRIO:
${input}

${feedback ? `\nORDEM DIRETA DO COMANDANTE (REVISÃO): "${feedback}"\nVocê deve reformular sua resposta anterior focando estritamente neste comando.` : ''}

Responda agora com autoridade máxima:
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Erro ao gerar resposta.";
  } catch (error) {
    console.error(`AI Agent Error (${role}):`, error);
    throw error;
  }
}

export async function finalizeLocation(finalContent: string): Promise<Partial<BusinessProfile>> {
  const ai = getAI();
  const model = "gemini-3-flash-preview"; 
  
  const response = await ai.models.generateContent({
    model,
    contents: `Com base em todo o conteúdo abaixo, gere APENAS o JSON para o local.
    
    Conteúdo:
    ${finalContent}
    
    REGRAS DO JSON:
    1. Campos obrigatórios: name, category, description, address, amenities (array de IDs como wifi, parking, access, etc).
    2. Adicione lat e lng (números).
    3. rating deve ser entre 4.0 e 5.0.
    4. canBeClaimed deve ser false (pois são pontos verificados pela equipe).
    
    Categorias aceitas: Gastronomia, Hospedagem, Passeios, Entretenimento, Comércio, Serviços.
    
    IMPORTANTE: Retorne APENAS o JSON puro.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          subcategory: { type: Type.STRING },
          description: { type: Type.STRING },
          address: { type: Type.STRING },
          lat: { type: Type.NUMBER },
          lng: { type: Type.NUMBER },
          amenities: { type: Type.ARRAY, items: { type: Type.STRING } },
          phone: { type: Type.STRING },
          rating: { type: Type.NUMBER },
          reviewCount: { type: Type.NUMBER }
        },
        required: ["name", "category", "description", "address", "lat", "lng", "amenities"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
