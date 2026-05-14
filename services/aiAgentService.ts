
import { GoogleGenAI, Type } from "@google/genai";
import { BusinessProfile } from "../types";

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY_PESQU || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    throw new Error("Chave de API (GEMINI_API_KEY_PESQU) não encontrada. Por favor, configure-a no menu Settings.");
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
  researcher: `Você é um Pesquisador de Elite do guia LAGOS GO. Seu trabalho é pesquisar LOCALIZAÇÕES REAIS e VERIFICADAS na Região dos Lagos (Arraial do Cabo, Cabo Frio, Búzios). 
Se o comando for para múltiplos locais (ex: "5 trilhas"), você deve listar os 5 nomes primeiro e depois detalhar o primeiro.
IMPORTANTE: Busque detalhes sobre estrutura para cadeirantes, banheiros, se é pet friendly e a dificuldade real (se for trilha).`,
  
  analyzer: `Você é o Censor do Lagos GO. Seu papel é garantir que o local PESQUISADO existe e as informações não são genéricas. 
Exija do pesquisador: "Onde exatamente fica a entrada?", "Qual o valor médio (se houver)?", "Existe sinal de celular no local?". 
Não aceite relatórios superficiais.`,

  visualizer: `Você é o Curador Visual. Para cada local, você deve fornecer:
1. Termos exatos de busca para fotos REAIS (ex: "Trilha do Morro da Guia Cabo Frio vista aérea pôr do sol").
2. Descrição detalhada da 'Foto Capa' ideal para o guia.
3. 3 tags visuais (ex: #ÁguaCristalina, #PôrDoSol, #História).`,

  strategist: `Você é o Diretor de Produto. Decida a Categoria (Gastronomia, Hospedagem, Passeios, Entretenimento, Comércio, Serviços) e Subcategoria. 
Defina o "Status de Verificação" e por que esse local merece estar no Lagos GO.`,

  copywriter: `Você é o mestre da conversão. Escreva um título curto e impactante e uma descrição de 3 parágrafos:
1. A experiência (O que sentirá lá).
2. O prático (O que tem lá).
3. Chamada (Por que ir agora).
Use tom amigável, local e sofisticado.`,

  finalizer: `Você é o Engenheiro de Integração. Transforme a conversa em uma lista de objetos JSON. 
Se foram solicitados N locais, e agora estamos processando um deles, gere o JSON desse local.`
};

export async function runAgentStep(role: string, input: string, context?: string, feedback?: string): Promise<string> {
  const ai = getAI();
  const model = "gemini-1.5-flash"; 
  
  const prompt = `
CONTEXTO DO PROJETO:
Você trabalha para o "LAGOS GO", o maior guia turístico da Região dos Lagos (RJ). 
Sua missão é criar postagens em massa com ALTA QUALIDADE e VERACIDADE.

Instrução do seu Papel:
${(SYSTEM_PROMPTS as any)[role]}

COMANDO DO COMANDANTE (USUÁRIO):
${input}

${feedback ? `\nAJUSTE SOLICITADO PELO COMANDANTE: "${feedback}"\n` : ''}

Contexto da conversa até agora:
${context || 'Iniciando operação.'}

Responda com foco em INTEGRALIDADE e DETALHE para o guia:
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Erro no processamento do agente.";
  } catch (error) {
    console.error(`AI Agent Error (${role}):`, error);
    throw error;
  }
}

export async function finalizeLocation(finalContent: string, quantity: number = 1): Promise<Partial<BusinessProfile>[]> {
  const ai = getAI();
  const model = "gemini-1.5-flash"; 
  
  const response = await ai.models.generateContent({
    model,
    contents: `Com base em todas as pesquisas e discussões anteriores, gere uma LISTA de objetos JSON para os locais identificados.
    
    Quantidade de locais esperada: ${quantity}
    
    Conteúdo Base:
    ${finalContent}
    
    ESTRUTURA DO JSON (ARRAY DE OBJETOS):
    - name (string)
    - category (Gastronomia, Hospedagem, Passeios, Entretenimento, Comércio, Serviços)
    - subcategory (string)
    - description (string longa e formatada)
    - address (string completa)
    - lat (number)
    - lng (number)
    - amenities (array de IDs como: wifi, parking, access, pet, bathroom, food)
    - rating (4.0 a 5.0)
    - reviewCount (number entre 10 e 200)
    
    IMPORTANTE: Retorne APENAS o JSON puro em um array [{}, {}].`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
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
            rating: { type: Type.NUMBER },
            reviewCount: { type: Type.NUMBER }
          },
          required: ["name", "category", "description", "address", "lat", "lng"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Erro ao converter JSON final da IA:", e);
    return [];
  }
}
