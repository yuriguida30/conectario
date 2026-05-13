
import { GoogleGenAI, Type } from "@google/genai";
import { BusinessProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AgentStep {
  role: string;
  name: string;
  content: string;
  status: 'pending' | 'working' | 'completed' | 'error';
  criticism?: string;
}

export const INITIAL_STEPS: AgentStep[] = [
  { role: 'researcher', name: 'Pesquisador de Elite', content: '', status: 'pending' },
  { role: 'analyzer', name: 'Analista de Dados Crítico', content: '', status: 'pending' },
  { role: 'strategist', name: 'Decisor Estratégico', content: '', status: 'pending' },
  { role: 'copywriter', name: 'Copywriter & SEO Expert', content: '', status: 'pending' },
  { role: 'finalizer', name: 'Engenheiro de Dados', content: '', status: 'pending' }
];

const SYSTEM_PROMPTS = {
  researcher: `Você é um Pesquisador de Elite especializado na Região dos Lagos, Rio de Janeiro (focado em Arraial do Cabo e Cabo Frio). 
Sua missão é encontrar o máximo de informações reais sobre um local específico. 
Inclua: História, fatos curiosos, coordenadas geográficas aproximadas, endereços prováveis, tipo de público, melhores horários e infraestrutura disponível (banheiros, acessibilidade, etc).
Seja detalhista e factual.`,
  
  analyzer: `Você é um Analista de Dados Crítico e extremamente exigente. 
Seu trabalho é revisar o relatório do Pesquisador. 
Aponte o que falta: falta profundidade histórica? As coordenadas parecem imprecisas? O endereço está vago?
Dê uma nota de 0 a 10 para a pesquisa e liste exigências de melhoria.`,

  strategist: `Você é o Decisor Estratégico da marca Lagos GO. 
Seu objetivo é definir o tom da marca para este local. 
Qual é o "Gancho" principal? Por que um turista deveria ir lá em vez de outro lugar? 
Defina a categoria e subcategoria ideal dentro do app Conecta Rio.`,

  copywriter: `Você é um Copywriter Sênior e Especialista em SEO. 
Transforme os dados brutos e estratégicos em textos magnéticos, persuasivos e otimizados para busca.
Escreva um título chamativo e uma descrição que venda a experiência emocional de visitar o local.
Linguagem: Português do Brasil, tom sofisticado mas acolhedor.`,

  finalizer: `Você é um Engenheiro de Dados encarregado de estruturar a saída final. 
Você deve converter todas as discussões anteriores em um objeto JSON válido para o banco de dados.
Siga rigorosamente o esquema de dados fornecido.`
};

export async function runAgentStep(role: string, input: string, context?: string): Promise<string> {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
Contexto Geral Anterior:
${context || 'Nenhum contexto prévio.'}

Instrução do seu Papel:
${(SYSTEM_PROMPTS as any)[role]}

Entrada Atual:
${input}

Responda agora de acordo com seu papel:
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
  const model = "gemini-3.1-pro-preview";
  
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
