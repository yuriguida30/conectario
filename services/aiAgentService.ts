
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
Sua missão é fornecer informações REAIS sobre locais na Região dos Lagos.
REGRAS CRÍTICAS:
1. RESPEITE A CIDADE: Se o Comandante pediu locais em [Cidade], você NUNCA deve sugerir nada em outra cidade.
2. SUBCATEGORIAS PRECISAS: Identifique a subcategoria real do local (ex: se é uma Praia, Praça, Mirante, Museu, etc). Se for Gastronomia, especifique se é Bar, Restaurante, Pizzaria, etc.
3. HORÁRIOS REAIS: Locais públicos como praias, praças e mirantes são "24 horas" ou funcionam do nascer ao pôr do sol. Não os marque como fechados.
4. NÃO INVENTE: Se não encontrar o número de locais reais solicitado na cidade específica, pare e declare: "LIMITE REAL ALCANÇADO".
5. NÃO DUPLICAR: Use a lista de locais existentes fornecida.`,
  
  yuri: `Você é o YURI VERIFICADOR, o braço direito do Comandante.
Sua única função é encontrar falhas e garantir a INTEGRIDADE TOTAL.
EXIGÊNCIAS DO COMANDANTE QUE VOCÊ DEVE GUARDAR:
1. BARREIRA GEOGRÁFICA: Se o Comandante pediu [Cidade], e você detectar um local de qualquer outra cidade, REJEITE.
2. BOM SENSO DE HORÁRIO: Locais públicos (praias, praças) NÃO podem ser criados como fechados. Verifique se o Pesquisador colocou horários condizentes.
3. SUBCATEGORIAS: Verifique se a subcategoria faz sentido com a Categoria (ex: "Praia" deve estar em "Passeios").
4. ANTIDUPLICIDADE: Se o local já existe na lista fornecida, REJEITE.
VEREDITO FINAL: "APROVADO" ou "REJEITADO: [Motivo detalhado]".`,

  analyzer: `Você é o Auditor de Qualidade. 
Foque no detalhamento técnico: Endereço exato, coordenadas GPS e amenidades reais. 
Para locais públicos, considere amenidades como: "Acesso Gratuito", "Pet Friendly", "Ar Livre".`,

  visualizer: `Você é o Curador de Mídia. 
PREPARAÇÃO PARA PESQUISA MANUAL: Sua única função é fornecer o TERMO DE BUSCA PERFEITO para o Comandante encontrar a foto real no Google/Instagram.
Não gere URLs falsas.`,

  strategist: `Você define o DNA do local. 
Refine a Subcategoria: Use termos como "Ar Livre", "Patrimônio Histórico", "Vida Noturna" se agregarem valor.
Garanta que a Categoria e Subcategoria estão 100% corretas.`,

  copywriter: `Storytelling de Elite. Destaque se o local é gratuito, acessível ou ideal para famílias. Use o nome da cidade alvo e o nome do local de forma natural.`,

  finalizer: `Transforme em JSON. 
Certifique-se de que o campo openingHours reflete o bom senso (ex: praias = "Segunda: 24 horas, Terça: 24 horas...").
Campo realImageUrl deve vir SEMPRE vazio ("") por padrão.`
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
