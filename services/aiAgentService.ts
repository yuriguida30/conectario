
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
Sua missão é fornecer informações REAIS, VIBRANTES e COMPLETAS sobre locais na Região dos Lagos.
REGRAS DE OURO:
1. RESPEITE A CIDADE: Se o Comandante pediu [Cidade], você NUNCA deve sugerir nada em outra cidade.
2. CONTATO TOTAL: É OBRIGATÓRIO buscar o @instagram oficial, o site da empresa e o WhatsApp de contato para cada local.
3. PERSONALIDADE NO DETALHE: Não traga apenas o básico. Descubra a história, o prato principal (se for restaurante), diferenciais de hospedagem (se hotel) e a "alma" do lugar.
4. HORÁRIOS REAIS: Você deve detalhar o horário de funcionamento de SEG a DOM. Praias e praças são "24 horas" ou "Ciclo Solar". Hotels são "24 horas".
5. NÃO INVENTE: Se não encontrar o número de locais reais na cidade, pare e declare: "LIMITE REAL ALCANÇADO".`,
  
  yuri: `Você é o YURI VERIFICADOR, o braço direito do Comandante.
Sua única função é ser o FILTRO DE ELITE.
MISSÃO:
1. CHECAR QUALIDADE DA CÓPIA: A descrição está longa e persuasiva? Se for um texto de menos de 4 parágrafos ou genérico, REJEITE.
2. CHECAR CONTATOS: O local tem Instagram ou Site? Se for uma empresa comercial (Hotel/Restaurante) e não houver links, REJEITE e peça para o pesquisador buscar mais.
3. CHECAR HORÁRIOS: Verifique se locais têm horários condizentes para todos os dias. REJEITE se estiverem genéricos ou marcados como "fechado" indevidamente.
4. CHECAR GEOGRAFIA: Garanta que o local é na cidade alvo.
VEREDITO: "APROVADO" ou "REJEITADO: [Motivo detalhado]".`,

  analyzer: `Você é o Auditor de Qualidade. 
Foque no detalhamento técnico: Endereço exato (Rua, Número, Bairro), coordenadas GPS e amenidades reais. 
Verifique se o local oferece Wi-Fi, Estacionamento, Acessibilidade e se é Pet Friendly.`,

  visualizer: `Você é o Detetive Visual. 
Forneça o TERMO DE BUSCA PERFEITO (Google/Instagram) para que o Comandante encontre a foto real.
Identifique se o local tem perfis sociais ativos.`,

  strategist: `Você define o posicionamento do local. 
Crie 3 "Dicas de Especialista" (Insiders Tips) que demonstrem conhecimento profundo (ex: "Peça o prato X que não está no menu", "O melhor lugar para foto é atrás da pedra Y").`,

  copywriter: `Você é um Copywriter de SEO de Elite. 
Sua missão é criar uma descrição MAGNÉTICA e LONGA (mínimo 600 caracteres).
- Use o nome da cidade e do local repetidamente de forma natural para SEO.
- Destaque o valor da experiência.
- Use palavras-chave como "melhor hotel em X", "melhor restaurante em Y", "roteiro imperdível".`,

  finalizer: `Transforme em JSON Puro. 
REGRAS FINAIS DE FORMATAÇÃO:
- description: Deve ser o texto longo e otimizado do Copywriter.
- openingHours: Objeto contendo os horários para cada dia da semana.
- instagram: Nome de usuário sem o @.
- website: URL completa.
- whatsapp: Numero formatado.
- realImageUrl: Mantenha vazio ("").`
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
Sua missão é criar postagens com QUALIDADE DE REVISTA, RIQUEZA DE DADOS e OTIMIZAÇÃO SEO.

Instrução do seu Papel:
${(SYSTEM_PROMPTS as any)[role]}

COMANDO DO COMANDANTE (USUÁRIO):
${input}

${feedback ? `\nAJUSTE SOLICITADO PELO COMANDANTE: "${feedback}"\n` : ''}

Contexto da conversa até agora:
${context || 'Iniciando operação.'}

Responda com foco em PESQUISA PROFUNDA e COPYWRITING DE ALTO NÍVEL. Não aceite mediocridade.
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
            realImageUrl: { type: Type.STRING },
            website: { type: Type.STRING },
            instagram: { type: Type.STRING },
            whatsapp: { type: Type.STRING },
            openingHours: {
              type: Type.OBJECT,
              properties: {
                Segunda: { type: Type.STRING },
                Terça: { type: Type.STRING },
                Quarta: { type: Type.STRING },
                Quinta: { type: Type.STRING },
                Sexta: { type: Type.STRING },
                Sábado: { type: Type.STRING },
                Domingo: { type: Type.STRING }
              }
            }
          },
          required: ["name", "category", "description", "address", "lat", "lng"]
        }
      }
    },
    contents: [{ role: 'user', parts: [{ text: `Com base em todas as pesquisas e discussões anteriores, gere uma LISTA de objetos JSON para os locais identificados.
    
    Quantidade de locais esperada: ${quantity}
    
    Conteúdo Base:
    ${finalContent}
    
    REGRAS DE NEGÓCIO DO JSON:
    - description: DEVE ser a descrição longa (SEO) criada pelo Copywriter.
    - instagram: apenas o username (ex: lagosgo).
    - whatsapp: apenas números ou com formatação (5522...).
    - openingHours: preencha para todos os 7 dias baseando-se no bom senso ou pesquisa.
    - category: Uma destas: Gastronomia, Hospedagem, Passeios, Entretenimento, Comércio, Serviços.
    
    IMPORTANTE: Retorne APENAS o JSON puro em um array [{}, {}].` }] }]
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Erro ao converter JSON final da IA:", e);
    return [];
  }
}
