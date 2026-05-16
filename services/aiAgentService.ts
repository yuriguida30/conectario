
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
2. CONTATO REAL OU NADA: Busque o @instagram oficial, site e WhatsApp. **IMPORTANTE:** Se não encontrar, deixe o campo VAZIO. É terminantemente PROIBIDO inventar usuários ou links baseados no nome do local.
3. PERSONALIDADE NO DETALHE: Não traga apenas o básico. Descubra a história, o prato principal (restaurante), diferenciais (hotel) e a "alma" do lugar.
4. HORÁRIOS REAIS: Você deve detalhar o horário de funcionamento de SEG a DOM. Hotels e praias costumam ser "24 horas", mas verifique.
5. NÃO INVENTE: Se não encontrar o número de locais reais na cidade, pare e declare: "LIMITE REAL ALCANÇADO".`,
  
  yuri: `Você é o YURI VERIFICADOR, o braço direito do Comandante.
Sua única função é ser o FILTRO DE ELITE.
MISSÃO:
1. AUDITOR DE LINKS (CRÍTICO): Verifique se os links de Instagram/Site são REAIS. Se você detectar que o link parece inventado (ex: instagram.com/nome_do_local sem ser oficial), REJEITE IMEDIATAMENTE. É melhor campo vazio do que mentira.
2. CHECAR QUALIDADE DA CÓPIA: A descrição está longa e persuasiva? Se for um texto de menos de 4 parágrafos ou genérico, REJEITE.
3. CHECAR HORÁRIOS: Verifique se locais têm horários condizentes. REJEITE se estiverem marcados como "fechado" indevidamente.
4. CHECAR GEOGRAFIA: Garanta que o local é na cidade alvo.
VEREDITO: "APROVADO" ou "REJEITADO: [Motivo detalhado]".`,

  analyzer: `Você é o Auditor de Qualidade. 
Foque no detalhamento técnico: Endereço exato (Rua, Número, Bairro), coordenadas GPS e amenidades reais. 
Verifique se o local oferece Wi-Fi, Estacionamento, Acessibilidade e se é Pet Friendly.`,

  visualizer: `Você é o Detetive Visual. 
Forneça o TERMO DE BUSCA PERFEITO (Google/Instagram) para que o Comandante encontre a foto real.
Confirme se as redes sociais citadas pelo pesquisador existem visualmente.`,

  strategist: `Você define o posicionamento do local. 
Crie 3 "Dicas de Especialista" (Insiders Tips) que demonstrem conhecimento profundo da região.`,

  copywriter: `Você é um Copywriter de SEO de Elite. 
Sua missão é criar uma descrição MAGNÉTICA, ÚTIL e LONGA (mínimo 800 caracteres).
- Explore a história, o ambiente e o porquê o turista DEVE visitar.
- Use palavras-chave estratégicas para a cidade e tipo de local.
- O texto deve ser digno de uma revista de luxo.`,

  finalizer: `Transforme em JSON Puro. 
REGRAS FINAIS DE FORMATAÇÃO:
- description: Deve ser o texto longo e otimizado do Copywriter.
- instagram: Nome de usuário sem o @. Se não houver, deixe VAZIO.
- website: URL completa. Se não houver, deixe VAZIO.
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
    - description: DEVE ser a descrição longa (SEO) criada pelo Copywriter (mínimo 800 caracteres).
    - instagram: apenas o username real. SE NÃO ENCONTRAR O REAL, DEIXE VAZIO ("").
    - website: URL completa real. SE NÃO ENCONTRAR A REAL, DEIXE VAZIO ("").
    - whatsapp: apenas números ou com formatação.
    - openingHours: preencha para todos os 7 dias (ex: "09:00 - 18:00" ou "24 horas").
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
