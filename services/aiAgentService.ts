
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
  researcher: `Você é o Pesquisador-Chefe do LAGOS GO. Sua missão é fornecer informações EXTREMAMENTE DETALHADAS sobre locais na Região dos Lagos.
REGRAS DE OURO:
1. RESPEITE A CIDADE: O Comandante definiu uma cidade alvo. Se ele pediu "Cabo Frio", você NUNCA deve sugerir nada em Búzios, Arraial ou Niterói.
2. NÃO DUPLICAR: Use a lista de locais existentes fornecida. Se o local já está lá, ele é INVISÍVEL para você. Encontre novos.
3. INSUFICIÊNCIA: Se não encontrar o número de locais solicitado (ex: pediu 5 e só achou 2 reais na cidade), você deve declarar: "LIMITE ALCANÇADO: Apenas [N] locais autênticos encontrados em [Cidade]".`,
  
  analyzer: `Você é o Auditor de Qualidade. Sua única função é encontrar erros.
1. ERRO GEOGRÁFICO: Se o pesquisador sugerir um local fora da cidade alvo, marque como FALHA CRÍTICA e exija correção.
2. GENERICIDADE: "Lugar bonito" não é informação. Exija o nome da rua, o ponto de referência exato e se a estrada é de terra ou asfalto.`,

  visualizer: `Você é o Curador de Mídia. 
1. PALAVRAS-CHAVE REAIS: Forneça imageKeywords em INGLÊS que sejam 100% ligadas ao local.
2. FILTRO DE QUALIDADE: Se for um local muito obscuro que não terá fotos boas em bancos internacionais (Unsplash/Flickr/Google), defina imageKeywords como "NONE".
DICA: Use o formato "[Nome do Local], [Cidade], Brazil, [Característica principal]" para o imageKeywords.`,

  strategist: `Você define o DNA do local no guia. Por que um turista de elite escolheria este lugar?
Não aceite categorias erradas. Um quiosque na praia é GASTRONOMIA, não PASSEIOS.`,

  copywriter: `Storytelling Impecável. Use o nome da cidade alvo pelo menos 2 vezes no texto para reforçar o SEO local.`,

  finalizer: `Transforme tudo em JSON. Se o pesquisador declarou "LIMITE ALCANÇADO", gere o JSON apenas para os locais encontrados.`
};

export async function runAgentStep(role: string, input: string, context?: string, feedback?: string, manualApiKey?: string): Promise<string> {
  const apiKey = manualApiKey || process.env.GEMINI_API_KEY_PESQU || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    throw new Error("Chave de API não configurada.");
  }
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview"; 
  
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

Responda com foco em INTEGRALIDADE e DETALHE para o guia. Se o usuário pediu vários locais, você deve processar todos eles consistentemente.
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return response.text || "Erro no processamento do agente.";
  } catch (error) {
    console.error(`AI Agent Error (${role}):`, error);
    throw error;
  }
}

export async function finalizeLocation(finalContent: string, quantity: number = 1, manualApiKey?: string): Promise<Partial<BusinessProfile>[]> {
  const apiKey = manualApiKey || process.env.GEMINI_API_KEY_PESQU || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    throw new Error("Chave de API não configurada.");
  }
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview"; 
  
  const response = await ai.models.generateContent({
    model,
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
            reviewCount: { type: Type.NUMBER },
            bestTime: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            expertTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            imageKeywords: { type: Type.STRING }
          },
          required: ["name", "category", "description", "address", "lat", "lng"]
        }
      }
    },
    contents: [{ role: 'user', parts: [{ text: `Com base em todas as pesquisas e discussões anteriores, gere uma LISTA de objetos JSON para os locais identificados.
    
    Quantidade de locais esperada: ${quantity}
    
    Conteúdo Base:
    ${finalContent}
    
    ESTRUTURA DO JSON (ARRAY DE OBJETOS):
    - name (string)
    - category (Gastronomia, Hospedagem, Passeios, Entretenimento, Comércio, Serviços)
    - subcategory (string)
    - description (string longa que une storytellin com guia prático)
    - address (string completa)
    - lat (number)
    - lng (number)
    - amenities (array de strings: wifi, parking, access, bathroom, food, pet, shade)
    - rating (4.0 a 5.0)
    - reviewCount (10 a 200)
    - bestTime (pôr do sol, manhã, noite, etc)
    - difficulty (se aplicável: fácil, médio, difícil)
    - expertTips (array de strings com as dicas dos especialistas)
    - imageKeywords (string de palavras-chave em inglês para busca de imagem real EX: "cabo frio trail nature")
    
    IMPORTANTE: Retorne APENAS o JSON puro em um array [{}, {}].` }] }]
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Erro ao converter JSON final da IA:", e);
    return [];
  }
}
