
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
Se o comando for para múltiplos locais (ex: "5 trilhas"), você DEVE obrigatoriamente encontrar e listar os 5 nomes.
Para cada local, você deve detalhar:
- História e curiosidades locais.
- Infraestrutura completa (banheiros, acessibilidade, estacionamento, recepção de celular).
- Dificuldade, tempo de percurso e melhor horário para visita.
- Fauna e flora locais (se for área natural).
- Dicas de segurança e o que levar.`,
  
  analyzer: `Você é o Auditor de Qualidade do Lagos GO. Não aceite informações genéricas. 
Se o pesquisador disser "tem banheiros", pergunte "onde exatamente e qual o estado?".
Verifique se a localização (lat/lng) é compatível com o endereço.
Aponte furos na pesquisa e exija detalhes que um turista real precisaria saber.`,

  visualizer: `Você é o Curador de Mídia. Seu papel é orientar o administrador a encontrar as fotos perfeitas.
Para cada local:
1. Descreva 3 ângulos de fotos obrigatórios para o guia.
2. Forneça termos de busca precisos para Google Imagens e Instagram (ex: "Trilha da Ponta do Pai Vitório Búzios vista panoramica").
3. Identifique elementos visuais chave (cores dominantes, pontos de referência).`,

  strategist: `Você é o Diretor de Engajamento. Como esse local se encaixa no ecossistema do Lagos GO?
Defina a Categoria e Subcategoria.
Identifique o "Perfil do Público" (Aventureiros, Famílias, Casais, etc).
Crie 3 "Dicas de Especialista" (Insiders Tips) que só quem conhece bem o local saberia.`,

  copywriter: `Você é o mestre da narrativa (Storytelling). Use tom sofisticado, acolhedor e informativo.
Siga a estrutura:
1. Título Impactante.
2. Parágrafo de "Sensação" (A experiência emocional).
3. Parágrafo de "O que você encontra" (A parte prática).
4. Parágrafo de "Dica de Ouro LAGOS GO".
Otimize para SEO Local.`,

  finalizer: `Você é o Engenheiro de Dados. Transforme toda a inteligência coletada em um array de objetos JSON robustos.
Certifique-se de que cada campo (description, address, etc) esteja completo com base nas discussões anteriores.`
};

export async function runAgentStep(role: string, input: string, context?: string, feedback?: string): Promise<string> {
  const ai = getAI();
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
  const model = "gemini-3-flash-preview"; 
  
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
            reviewCount: { type: Type.NUMBER },
            bestTime: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            expertTips: { type: Type.ARRAY, items: { type: Type.STRING } }
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
