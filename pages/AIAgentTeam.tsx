
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Search, BarChart3, Target, PenTool, CheckCircle2, 
  Loader2, Send, ChevronRight, AlertCircle, Sparkles, 
  Database, User as UserIcon, ShieldCheck, MapPin, ArrowRight
} from 'lucide-react';
import { AgentStep, INITIAL_STEPS, runAgentStep, finalizeLocation } from '../services/aiAgentService';
import { createAdminPlace, getCities, getNeighborhoods, getCategories } from '../services/dataService';
import { useNotification } from '../components/NotificationSystem';
import { BusinessProfile } from '../types';

export const AIAgentTeam: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { notify } = useNotification();
  const [targetPlace, setTargetPlace] = useState('');
  const [steps, setSteps] = useState<AgentStep[]>(INITIAL_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalData, setFinalData] = useState<Partial<BusinessProfile> | null>(null);
  const [logs, setLogs] = useState<{role: string, msg: string}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, steps]);

  const addLog = (role: string, msg: string) => {
    setLogs(prev => [...prev, { role, msg }]);
  };

  const startChain = async () => {
    if (!targetPlace.trim()) return;
    
    setIsProcessing(true);
    setFinalData(null);
    setSteps(INITIAL_STEPS.map(s => ({ ...s, content: '', status: 'pending' })));
    setLogs([{ role: 'system', msg: `Iniciando protocolo de criação para: ${targetPlace}` }]);
    setCurrentStepIndex(0);
  };

  useEffect(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length && isProcessing) {
      processStep(currentStepIndex);
    } else if (currentStepIndex === steps.length) {
      finishProcess();
    }
  }, [currentStepIndex, isProcessing]);

  const processStep = async (index: number) => {
    const step = steps[index];
    setSteps(prev => {
      const newSteps = [...prev];
      newSteps[index].status = 'working';
      return newSteps;
    });

    addLog(step.name, `Analisando dados para "${targetPlace}"...`);

    try {
      const previousContext = steps
        .slice(0, index)
        .map(s => `${s.name}: ${s.content}`)
        .join('\n\n');

      const result = await runAgentStep(step.role, targetPlace, previousContext);
      
      setSteps(prev => {
        const newSteps = [...prev];
        newSteps[index].content = result;
        newSteps[index].status = 'completed';
        return newSteps;
      });

      addLog(step.name, `Concluído. Passando bastão para o próximo especialista.`);
      
      // Artificial delay for UX feel
      setTimeout(() => {
        setCurrentStepIndex(index + 1);
      }, 1500);

    } catch (error) {
      setSteps(prev => {
        const newSteps = [...prev];
        newSteps[index].status = 'error';
        return newSteps;
      });
      setIsProcessing(false);
      addLog('system', `ERRO CRÍTICO no ${step.name}. Sequência interrompida.`);
    }
  };

  const finishProcess = async () => {
    addLog('system', 'Consolidando exigências e estruturando dados finais...');
    try {
      const allContent = steps.map(s => s.content).join('\n\n');
      const data = await finalizeLocation(allContent);
      setFinalData(data);
      addLog('finalizer', 'Objeto de dados pronto para inserção no Lagos GO.');
    } catch (error) {
      notify('error', 'Erro ao finalizar dados.');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToSystem = async () => {
    if (!finalData) return;
    try {
      // Basic validation for city/neighborhood (we use Arraial as default if not found)
      const cities = await getCities();
      const neighborhoods = await getNeighborhoods();
      const catList = await getCategories();

      const defaultCity = cities.find(c => c.name.toLowerCase().includes('arraial')) || cities[0];
      const defaultNH = neighborhoods.find(n => n.cityId === defaultCity?.id) || neighborhoods[0];

      await createAdminPlace({
        ...finalData,
        cityId: defaultCity?.id,
        neighborhoodId: defaultNH?.id,
        isClaimed: false,
        canBeClaimed: false,
        coverImage: finalData.coverImage || 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&q=80&w=1200'
      } as Partial<BusinessProfile>);

      notify('success', 'Local criado e revisado pela equipe de IA!');
      onBack();
    } catch (error) {
      notify('error', 'Erro ao salvar no sistema.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans selection:bg-ocean-500 selection:text-white">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors">
            <ChevronRight className="rotate-180" size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Sparkles className="text-ocean-400" />
              Célula de Inteligência <span className="text-ocean-500">Lagos GO</span>
            </h1>
            <p className="text-slate-400 font-medium">Equipe de especialistas virtuais para criação de conteúdo premium.</p>
          </div>
        </div>

        <div className="flex bg-slate-900/50 p-2 border border-slate-800 rounded-3xl w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Qual local vamos pesquisar hoje?" 
            value={targetPlace}
            onChange={(e) => setTargetPlace(e.target.value)}
            disabled={isProcessing}
            className="bg-transparent border-none focus:ring-0 px-6 py-3 w-full md:w-80 font-medium placeholder:text-slate-600"
          />
          <button 
            onClick={startChain}
            disabled={isProcessing || !targetPlace}
            className="bg-ocean-600 hover:bg-ocean-500 disabled:opacity-50 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 shadow-lg shadow-ocean-600/20"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            Iniciar Drone
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* AGENTS LIST */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Bot size={16} /> Status dos Especialistas
          </h2>
          {steps.map((step, idx) => (
            <motion.div 
              key={step.role}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-5 rounded-3xl border transition-all duration-500 relative overflow-hidden ${
                step.status === 'working' ? 'bg-ocean-500/10 border-ocean-500 shadow-lg shadow-ocean-500/10' :
                step.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/30' :
                'bg-slate-900 border-slate-800 opacity-60'
              }`}
            >
              {step.status === 'working' && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="absolute bottom-0 left-0 h-1 bg-ocean-500"
                  transition={{ duration: 5, repeat: Infinity }}
                />
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${
                    step.status === 'working' ? 'bg-ocean-500 text-white' :
                    step.status === 'completed' ? 'bg-emerald-500 text-white' :
                    'bg-slate-800 text-slate-500'
                  }`}>
                    {idx === 0 && <Search size={20} />}
                    {idx === 1 && <BarChart3 size={20} />}
                    {idx === 2 && <Target size={20} />}
                    {idx === 3 && <PenTool size={20} />}
                    {idx === 4 && <Database size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-tight">{step.name}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {step.status === 'pending' && 'Aguardando...'}
                      {step.status === 'working' && 'Processando Inteligência...'}
                      {step.status === 'completed' && 'Relatório Concluído'}
                      {step.status === 'error' && 'Falha Crítica'}
                    </p>
                  </div>
                </div>
                {step.status === 'completed' && <CheckCircle2 className="text-emerald-500" size={20} />}
                {step.status === 'working' && <Loader2 className="animate-spin text-ocean-500" size={20} />}
              </div>
            </motion.div>
          ))}
        </div>

        {/* WORKROOM & LOGS */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] h-[600px] flex flex-col shadow-2xl relative overflow-hidden">
            {/* TERMINAL HEADER */}
            <div className="bg-slate-800/50 p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                </div>
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest ml-4">Monitor de Processamento Multimodal</span>
              </div>
              <div className="text-[10px] font-mono text-slate-600 bg-black/20 px-3 py-1 rounded-lg">
                SEC_LEVEL: ALPHA-9
              </div>
            </div>

            {/* LOGS WINDOW */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 font-mono text-sm space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
              <AnimatePresence>
                {logs.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4 opacity-50">
                    <Bot size={64} className="animate-pulse" />
                    <p className="text-xs uppercase tracking-[0.3em] font-black">Aguardando comando do Super Admin...</p>
                  </div>
                )}
                {logs.map((log, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${log.role === 'system' ? 'text-ocean-400' : 'text-slate-300'}`}
                  >
                    <span className={`shrink-0 font-black uppercase text-[10px] mt-1 tracking-wider ${
                      log.role === 'system' ? 'w-24' : 'text-ocean-500 w-24'
                    }`}>[{log.role}]</span>
                    <p className="leading-relaxed whitespace-pre-wrap">{log.msg}</p>
                  </motion.div>
                ))}
                
                {currentStepIndex >= 0 && currentStepIndex < steps.length && steps[currentStepIndex].status === 'working' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-4 text-ocean-400 animate-pulse"
                  >
                    <span className="shrink-0 font-black uppercase text-[10px] mt-1 tracking-wider w-24">[PENSANDO]</span>
                    <div className="flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 bg-ocean-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-ocean-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-ocean-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FINAL PREVIEW ACTION */}
            <AnimatePresence>
              {finalData && (
                <motion.div 
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  className="absolute bottom-0 inset-x-0 bg-ocean-600 p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-ocean-400 shadow-[0_-20px_40px_rgba(12,74,110,0.5)] z-20"
                >
                  <div className="flex items-center gap-5">
                    <div className="bg-white/20 p-4 rounded-3xl">
                      <ShieldCheck className="text-white" size={32} />
                    </div>
                    <div>
                      <h4 className="font-black uppercase text-lg tracking-tight">Conteúdo Verificado</h4>
                      <p className="text-ocean-100 text-sm font-medium">Todos os especialistas aprovaram o local <b>{finalData.name}</b>.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                    <button 
                      onClick={() => setFinalData(null)}
                      className="flex-1 md:flex-none border border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Descartar
                    </button>
                    <button 
                      onClick={saveToSystem}
                      className="flex-1 md:flex-none bg-white text-ocean-950 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-3"
                    >
                      Publicar no Guia <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* CONTENT PREVIEW CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.filter(s => s.status === 'completed' && s.role !== 'finalizer').map((step, idx) => (
              <motion.div 
                key={step.role}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-xl text-ocean-400">
                    <PenTool size={16} />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entrega de {step.name}</span>
                </div>
                <div className="text-sm text-slate-400 line-clamp-4 leading-relaxed italic">
                  "{step.content.substring(0, 300)}..."
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
