
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
  { role: 'yuri', name: 'Yuri Verificador (Guardião)', content: '', status: 'pending' },
  { role: 'analyzer', name: 'Analista de Dados Crítico', content: '', status: 'pending' },
  { role: 'visualizer', name: 'Analista Visual & Curador', content: '', status: 'pending' },
  { role: 'strategist', name: 'Decisor Estratégico', content: '', status: 'pending' },
  { role: 'copywriter', name: 'Copywriter & SEO Expert', content: '', status: 'pending' },
  { role: 'finalizer', name: 'Engenheiro de Dados', content: '', status: 'pending' }
];

const SYSTEM_PROMPTS = {
  researcher: `Você é o Pesquisador-Chefe do LAGOS GO. 
Sua missão é fornecer informações REAIS e VIBRANTES sobre locais na Região dos Lagos.
REGRAS DE OURO:
1. RESPEITE A CIDADE: Se o Comandante pediu [Cidade], você NUNCA deve sugerir nada em outra cidade.
2. PERSONALIDADE NO DETALHE: Não traga apenas o básico. Descubra a história, o prato principal, o melhor ângulo para foto e a sensação de estar lá.
3. HORÁRIOS REAIS: Praias, praças e mirantes são "24 horas" ou "Nascer ao Pôr do Sol". Nunca os deixe como fechados.
4. NÃO INVENTE: Se não encontrar o número de locais reais na cidade, pare e declare: "LIMITE REAL ALCANÇADO".`,
  
  yuri: `Você é o YURI VERIFICADOR, o braço direito do Comandante.
Sua única função é ser o FILTRO DE ELITE.
MISSÃO:
1. CHECAR PERSONALIDADE: A descrição está rica e completa? Se estiver genérica ou curta ("Lugar bom"), REJEITE.
2. CHECAR HORÁRIOS: Verifique se locais públicos estão com horários de 24h ou ciclo solar. REJEITE se estiverem como "fechado".
3. CHECAR GEOGRAFIA: Garanta que o local é na cidade alvo.
VEREDITO: "APROVADO" ou "REJEITADO: [Motivo]".`,

  analyzer: `Você é o Auditor de Qualidade. 
Foque no detalhamento técnico: Endereço exato, coordenadas GPS e amenidades reais. 
Exija que o Pesquisador informe se o acesso é gratuito ou pago.`,

  visualizer: `Você é o Detetive Visual. 
Forneça o TERMO DE BUSCA PERFEITO para o Comandante encontrar a foto real.
Não gere URLs falsas.`,

  strategist: `Você define o DNA do local. 
Crie 3 "Dicas de Especialista" (Insiders Tips) que demonstrem conhecimento profundo da região.`,

  copywriter: `Você é um Copywriter de Luxo. 
Sua escrita deve ser magnética, luxuosa e informativa. Use o nome da cidade para SEO e descreva a experiência sensorial do local.`,

  finalizer: `Transforme em JSON. 
REGRAS FINAIS:
- openingHours: Para locais abertos, use "06:00 - 18:00" ou "24 horas".
- realImageUrl: Mantenha sempre vazio ("").`
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
            imageKeywords: { type: Type.STRING },
            realImageUrl: { type: Type.STRING }
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
    - imageKeywords (string de palavras-chave em inglês para busca de imagem real)
    - realImageUrl (URL direta da imagem real .jpg/png se identificada)
    
    IMPORTANTE: Retorne APENAS o JSON puro em um array [{}, {}].` }] }]
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Erro ao converter JSON final da IA:", e);
    return [];
  }
}
