
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Search, BarChart3, Target, PenTool, CheckCircle2, 
  Loader2, Send, ChevronRight, AlertCircle, Sparkles, 
  Database, User as UserIcon, ShieldCheck, MapPin, ArrowRight,
  RefreshCw, MessageSquare, Edit3, Trash2, Save, Camera, Plus, Minus
} from 'lucide-react';
import { AgentStep, INITIAL_STEPS, runAgentStep, finalizeLocation } from '../services/aiAgentService';
import { createAdminPlace, getCities, getNeighborhoods, getCategories } from '../services/dataService';
import { useNotification } from '../components/NotificationSystem';
import { BusinessProfile } from '../types';

export const AIAgentTeam: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { notify } = useNotification();
  const [targetPlace, setTargetPlace] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [steps, setSteps] = useState<AgentStep[]>(INITIAL_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalBatch, setFinalBatch] = useState<Partial<BusinessProfile>[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [isEditingFinal, setIsEditingFinal] = useState(false);
  const finalData = finalBatch[currentBatchIndex];
  const [logs, setLogs] = useState<{role: string, msg: string, time: string}[]>([]);
  const [activeFeedback, setActiveFeedback] = useState<{index: number, text: string} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, steps]);

  const addLog = (role: string, msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { role, msg, time }]);
  };

  const startChain = async () => {
    if (!targetPlace.trim()) return;
    
    setIsProcessing(true);
    setFinalBatch([]);
    setCurrentBatchIndex(0);
    setSteps(INITIAL_STEPS.map(s => ({ ...s, content: '', status: 'pending', feedback: undefined })));
    setLogs([{ role: 'system', msg: `Protocolo ALPHA de Massa iniciado. Objetivo: ${targetPlace} (Lote: ${quantity})`, time: new Date().toLocaleTimeString() }]);
    setCurrentStepIndex(0);
  };

  useEffect(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length && isProcessing) {
      if (steps[currentStepIndex].status !== 'completed') {
        processStep(currentStepIndex);
      } else {
        // Skip already completed steps (useful for re-runs)
        setCurrentStepIndex(prev => prev + 1);
      }
    } else if (currentStepIndex === steps.length) {
      finishProcess();
    }
  }, [currentStepIndex, isProcessing]);

  const processStep = async (index: number, manualFeedback?: string) => {
    const step = steps[index];
    setSteps(prev => {
      const newSteps = [...prev];
      newSteps[index].status = 'working';
      return newSteps;
    });

    addLog(step.name, manualFeedback ? `REPROCESSANDO para massa: "${manualFeedback}"` : `Extraindo camadas de inteligência para o lote em "${targetPlace}"...`);

    try {
      const previousContext = steps
        .slice(0, index)
        .map(s => `${s.name}: ${s.content}`)
        .join('\n\n');

      const result = await runAgentStep(step.role, targetPlace + ` (Gerar ${quantity} locais)`, previousContext, manualFeedback);
      
      setSteps(prev => {
        const newSteps = [...prev];
        newSteps[index].content = result;
        newSteps[index].status = 'completed';
        newSteps[index].feedback = manualFeedback;
        return newSteps;
      });

      addLog(step.name, `Relatório liberado para revisão.`);
      
      if (!manualFeedback) {
        setTimeout(() => {
          setCurrentStepIndex(index + 1);
        }, 1200);
      } else {
        setIsProcessing(false);
        setActiveFeedback(null);
      }

    } catch (error) {
      setSteps(prev => {
        const newSteps = [...prev];
        newSteps[index].status = 'error';
        return newSteps;
      });
      setIsProcessing(false);
      addLog('system', `FALHA CRÍTICA: O Agente ${step.name} foi interrompido.`);
    }
  };

  const handleFeedback = async () => {
    if (!activeFeedback || !activeFeedback.text.trim()) return;
    setIsProcessing(true);
    await processStep(activeFeedback.index, activeFeedback.text);
  };

  const finishProcess = async () => {
    addLog('system', `Sincronizando ${quantity} locais e estruturando saída de massa...`);
    try {
      const allContent = steps.map(s => s.content).join('\n\n');
      const batchData = await finalizeLocation(allContent, quantity);
      setFinalBatch(batchData);
      addLog('finalizer', `Lote de ${batchData.length} locais consolidado. Aguardando revisão de massa do Comandante.`);
    } catch (error) {
      notify('error', 'Falha na consolidação do Lote JSON.');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToSystem = async () => {
    if (finalBatch.length === 0) return;
    try {
      const cities = await getCities();
      const neighborhoods = await getNeighborhoods();
      
      const defaultCity = cities.find(c => c.name.toLowerCase().includes('arraial')) || cities[0];
      const defaultNH = neighborhoods.find(n => n.cityId === defaultCity?.id) || neighborhoods[0];

      for (const place of finalBatch) {
        await createAdminPlace({
          ...place,
          cityId: defaultCity?.id,
          neighborhoodId: defaultNH?.id,
          isClaimed: false,
          canBeClaimed: false,
          coverImage: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&q=80&w=1200'
        } as Partial<BusinessProfile>);
      }

      notify('success', `${finalBatch.length} locais publicados com sucesso no Lagos GO.`);
      onBack();
    } catch (error) {
      notify('error', 'Erro durante a persistência do lote.');
    }
  };

  const updateCurrentPlace = (updates: Partial<BusinessProfile>) => {
    setFinalBatch(prev => prev.map((item, idx) => idx === currentBatchIndex ? { ...item, ...updates } : item));
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-10 font-sans selection:bg-ocean-500 selection:text-white">
      {/* HUD HEADER */}
      <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row items-center justify-between gap-8 mb-12 border-b border-slate-800/50 pb-8">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="group p-4 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-ocean-600/20 hover:border-ocean-500/50 transition-all">
            <ChevronRight className="rotate-180 text-slate-400 group-hover:text-ocean-400" size={24} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-ocean-500/20 text-ocean-400 p-1 rounded-md">
                <ShieldCheck size={14} />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Ambiente de Comando Administrativo</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
              Célula <span className="text-ocean-500">Inteligente</span> Lagos GO
            </h1>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          {/* QUANTITY PICKER */}
          <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 p-2 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase ml-3">Quantidade:</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-30"
                disabled={isProcessing}
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-black text-ocean-400">{quantity}</span>
              <button 
                onClick={() => setQuantity(q => Math.min(5, q + 1))}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-30"
                disabled={isProcessing}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex bg-slate-900 border border-slate-700/50 p-2 rounded-2xl w-full md:w-[450px] shadow-2xl shadow-black/50 overflow-hidden group focus-within:border-ocean-500/50 transition-all">
            <input 
              type="text" 
              placeholder="Digite o nome do local (Ex: Praia do Forno, Restaurante X...)" 
              value={targetPlace}
              onChange={(e) => setTargetPlace(e.target.value)}
              disabled={isProcessing}
              className="bg-transparent border-none focus:ring-0 px-6 py-3 w-full font-medium placeholder:text-slate-600 italic"
            />
            <button 
              onClick={startChain}
              disabled={isProcessing || !targetPlace}
              className="bg-ocean-600 hover:bg-ocean-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 shadow-lg shadow-ocean-600/20 whitespace-nowrap"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              Estratégia
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* AGENTS SIDEBAR */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Bot size={14} className="text-ocean-400" /> Time de Operações
            </h2>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-ocean-500 animate-pulse" />
              <div className="w-1 h-1 rounded-full bg-ocean-500 animate-pulse [animation-delay:0.2s]" />
            </div>
          </div>
          
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <motion.div 
                key={step.role}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`group relative p-5 rounded-3xl border transition-all duration-500 overflow-hidden ${
                  step.status === 'working' ? 'bg-ocean-500/10 border-ocean-500 shadow-lg shadow-ocean-500/10' :
                  step.status === 'completed' ? 'bg-slate-900 border-slate-800' :
                  'bg-slate-900/30 border-slate-800/50 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-colors ${
                      step.status === 'working' ? 'bg-ocean-500 text-white' :
                      step.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-slate-800 text-slate-500'
                    }`}>
                      {idx === 0 && <Search size={18} />}
                      {idx === 1 && <BarChart3 size={18} />}
                      {idx === 2 && <Camera size={18} />}
                      {idx === 3 && <Target size={18} />}
                      {idx === 4 && <PenTool size={18} />}
                      {idx === 5 && <Database size={18} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-tight text-slate-200">{step.name}</h3>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                        {step.status === 'pending' && 'Offline'}
                        {step.status === 'working' && 'Analisando...'}
                        {step.status === 'completed' && 'Relatório Pronto'}
                      </p>
                    </div>
                  </div>
                  
                  {step.status === 'completed' && (
                    <button 
                      onClick={() => setActiveFeedback({ index: idx, text: '' })}
                      className="p-2 hover:bg-ocean-500/20 rounded-lg text-ocean-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Dar Ordem Direta"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>
                {step.status === 'working' && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-ocean-500 to-transparent"
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* MONITOR PRINCIPAL */}
        <div className="lg:col-span-9 space-y-8">
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800/80 rounded-[3rem] h-[700px] flex flex-col shadow-2xl relative overflow-hidden group/monitor">
            {/* TERMINAL HEADER */}
            <div className="bg-slate-900/80 p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse [animation-delay:0.2s]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse [animation-delay:0.4s]" />
                </div>
                <div className="h-4 w-[1px] bg-slate-800 mx-2" />
                <span className="text-[10px] font-mono text-ocean-400 font-bold uppercase tracking-[0.4em]">LOG DE PROCESSAMENTO ESTRATÉGICO</span>
              </div>
              <div className="flex items-center gap-4 font-mono text-[10px] text-slate-500">
                <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-500" /> LIVE_SYNC</span>
                <span className="bg-black/40 px-3 py-1 rounded-md border border-white/5">0.0.0.0:3000</span>
              </div>
            </div>

            {/* LOG FLOW */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 font-mono text-xs space-y-8 scrollbar-thin scrollbar-thumb-slate-800 selection:bg-ocean-600/30">
              <AnimatePresence>
                {logs.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-800/50 space-y-6">
                    <div className="relative">
                      <Sparkles size={80} className="animate-pulse" />
                      <div className="absolute inset-0 blur-2xl bg-ocean-500/20" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-[0.5em] font-black mb-2">Comando Central Arraial/Cabo Frio</p>
                      <p className="text-xs uppercase tracking-widest font-mono italic">Aguardando coordenadas de entrada...</p>
                    </div>
                  </div>
                )}
                {logs.map((log, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-6 group"
                  >
                    <div className="flex flex-col items-center shrink-0 w-16">
                      <span className="text-[9px] text-slate-600 mb-2">{log.time}</span>
                      <div className={`h-full w-[1px] ${log.role === 'system' ? 'bg-ocean-500/30' : 'bg-slate-800'}`} />
                    </div>
                    <div className="space-y-2 pb-4">
                      <span className={`inline-block font-black uppercase text-[10px] px-2 py-0.5 rounded ${
                        log.role === 'system' ? 'bg-ocean-500/10 text-ocean-400' : 'bg-slate-800 text-ocean-500'
                      }`}>
                        {log.role}
                      </span>
                      <p className={`leading-relaxed whitespace-pre-wrap max-w-4xl ${
                        log.role === 'system' ? 'text-ocean-100 font-bold' : 'text-slate-400'
                      }`}>
                        {log.msg}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* INTERACTIVE FEEDBACK OVERLAY */}
            <AnimatePresence>
              {activeFeedback && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-40 flex items-center justify-center p-10"
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-slate-900 border border-slate-700 p-10 rounded-[3rem] w-full max-w-2xl shadow-3xl"
                  >
                    <div className="flex items-center gap-5 mb-8">
                      <div className="bg-ocean-600 p-4 rounded-3xl text-white">
                        <MessageSquare size={32} />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black uppercase tracking-tight">Dar Ordem ao {steps[activeFeedback.index].name}</h4>
                        <p className="text-slate-400 text-sm font-medium">O que deve ser mudado ou aprofundado no relatório?</p>
                      </div>
                    </div>
                    <textarea 
                      value={activeFeedback.text}
                      onChange={(e) => setActiveFeedback({...activeFeedback, text: e.target.value})}
                      placeholder="Ex: 'Seja mais específico sobre a coordenada' ou 'O texto está muito longo'..."
                      className="w-full h-40 bg-black/40 border border-slate-800 rounded-3xl p-6 text-white font-medium focus:border-ocean-500 focus:ring-0 placeholder:text-slate-700"
                    />
                    <div className="flex gap-4 mt-8">
                      <button 
                        onClick={() => setActiveFeedback(null)}
                        className="flex-1 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleFeedback}
                        className="flex-[2] bg-ocean-600 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-ocean-600/20 hover:bg-ocean-500 transition-all flex items-center justify-center gap-3"
                      >
                        Enviar Ordem Direta <Send size={18} />
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FINAL APPROVAL / JSON REVIEW */}
            <AnimatePresence>
              {finalBatch.length > 0 && (
                <motion.div 
                  initial={{ y: 200 }}
                  animate={{ y: 0 }}
                  className="absolute bottom-0 inset-x-0 bg-ocean-600/95 backdrop-blur-xl p-8 flex flex-col xl:flex-row items-center justify-between gap-8 border-t border-white/20 shadow-[0_-50px_100px_rgba(0,0,0,0.5)] z-50"
                >
                  <div className="flex items-center gap-6">
                    <div className="bg-white p-4 rounded-[1.5rem] text-ocean-950 shadow-2xl">
                      <ShieldCheck size={32} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="bg-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                          Lote de Inteligência ({currentBatchIndex + 1} de {finalBatch.length})
                        </span>
                        <h4 className="font-black uppercase text-xl tracking-tighter text-white">{finalData?.name || 'Local Sem Nome'}</h4>
                      </div>
                      <div className="flex gap-2 items-center">
                        {finalBatch.map((_, i) => (
                          <button 
                            key={i} 
                            onClick={() => setCurrentBatchIndex(i)}
                            className={`h-2 rounded-full transition-all ${i === currentBatchIndex ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                            title={`Revisar Local ${i + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    <button 
                      onClick={() => setFinalBatch([])}
                      className="group flex items-center justify-center gap-2 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all"
                    >
                      <Trash2 size={16} /> Abortar Missão
                    </button>
                    <button 
                      onClick={() => setIsEditingFinal(true)}
                      className="group flex items-center justify-center gap-2 bg-ocean-500 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-ocean-500/20 hover:scale-105 transition-all"
                    >
                      <Edit3 size={16} /> Revisar Dados & Fotos
                    </button>
                    <button 
                      onClick={saveToSystem}
                      className="flex-1 xl:flex-none bg-white text-ocean-950 px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      Publicar Tudo <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* INTEL CARDS (SNEAK PEEK) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.filter(s => s.status === 'completed' && s.role !== 'finalizer').slice(-3).map((step, idx) => (
              <motion.div 
                key={step.role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] space-y-4 hover:border-ocean-500/30 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-ocean-500/10 rounded-xl text-ocean-400">
                      {step.role === 'researcher' && <Search size={16} />}
                      {step.role === 'visualizer' && <Camera size={16} />}
                      {step.role === 'copywriter' && <PenTool size={16} />}
                      {step.role === 'strategist' && <Target size={16} />}
                      {step.role === 'analyzer' && <BarChart3 size={16} />}
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Visão: {step.name}</span>
                  </div>
                  {step.feedback && <MessageSquare size={14} className="text-amber-500 animate-pulse" />}
                </div>
                <div className="text-xs text-slate-400 line-clamp-5 leading-relaxed font-medium italic">
                  "{step.content.substring(0, 400)}..."
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* FINAL EDIT MODAL */}
      <AnimatePresence>
        {isEditingFinal && finalData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setIsEditingFinal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-[3rem] shadow-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-10 border-b border-slate-800 flex items-center justify-between bg-slate-800/20">
                <div className="flex items-center gap-5">
                  <div className="bg-ocean-600 p-4 rounded-2xl">
                    <Edit3 size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white">Revisão Final do Comandante</h3>
                    <p className="text-slate-400 text-sm font-medium">Toque final nos metadados gerados pela IA.</p>
                  </div>
                </div>
                <button onClick={() => setIsEditingFinal(false)} className="p-3 hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                  <X className="rotate-0 hover:rotate-90 transition-transform" size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8">
                {/* Specialist Insights Header */}
                <div className="bg-ocean-500/5 border border-ocean-500/10 rounded-3xl p-6 mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="text-ocean-400" size={20} />
                    <h4 className="text-xs font-black uppercase tracking-widest text-ocean-400">Dossiê de Inteligência Local</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                      <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Visão Fotográfica</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed italic">{steps.find(s => s.role === 'visualizer')?.content.substring(0, 300) || 'Analisando...'}</p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                      <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Estratégia de Guia</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed italic">{steps.find(s => s.role === 'strategist')?.content.substring(0, 300) || 'Analisando...'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 italic text-glow-ocean">Nome Oficial do Local</label>
                    <input 
                      type="text" 
                      value={finalData?.name || ''}
                      onChange={(e) => updateCurrentPlace({ name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold focus:border-ocean-500 focus:ring-0 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 italic text-glow-ocean">Categoria Sugerida</label>
                    <input 
                      type="text" 
                      value={finalData?.category || ''}
                      onChange={(e) => updateCurrentPlace({ category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold focus:border-ocean-500 focus:ring-0 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 italic text-glow-ocean">Localização GPS / Endereço</label>
                  <input 
                    type="text" 
                    value={finalData?.address || ''}
                    onChange={(e) => updateCurrentPlace({ address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-medium focus:border-ocean-500 focus:ring-0 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 italic text-glow-ocean">Descrição Otimizada SEO (Guia)</label>
                  <textarea 
                    value={finalData?.description || ''}
                    onChange={(e) => updateCurrentPlace({ description: e.target.value })}
                    className="w-full h-64 bg-slate-950 border border-slate-800 rounded-[2rem] px-8 py-6 text-white font-medium leading-relaxed focus:border-ocean-500 focus:ring-0 scrollbar-thin transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 italic">Latitude</label>
                    <input 
                      type="number" 
                      value={finalData?.lat || 0}
                      onChange={(e) => updateCurrentPlace({ lat: parseFloat(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 italic">Longitude</label>
                    <input 
                      type="number" 
                      value={finalData?.lng || 0}
                      onChange={(e) => updateCurrentPlace({ lng: parseFloat(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 italic">Avaliação IA</label>
                    <input 
                      type="number" 
                      value={finalData?.rating || 0}
                      step="0.1"
                      onChange={(e) => updateCurrentPlace({ rating: parseFloat(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 italic">Amenidades & Facilidades</label>
                    <div className="flex flex-wrap gap-2">
                       {(finalData as any)?.amenities?.map((amenity: string, i: number) => (
                         <span key={i} className="bg-ocean-500/10 text-ocean-400 border border-ocean-500/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                           {amenity}
                         </span>
                       )) || <span className="text-slate-600 italic text-[10px]">Nenhuma amenidade identificada.</span>}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 italic">Dicas de Especialista (Insiders)</label>
                    <ul className="space-y-2">
                       {(finalData as any)?.expertTips?.map((tip: string, i: number) => (
                         <li key={i} className="flex gap-2 text-[10px] text-slate-400 leading-tight">
                           <span className="text-ocean-500 font-black">•</span> {tip}
                         </li>
                       )) || <li className="text-slate-600 italic text-[10px]">Sem dicas adicionais.</li>}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-10 border-t border-slate-800 bg-slate-800/20 flex gap-6">
                <button 
                  onClick={() => setIsEditingFinal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Continuar Revisão
                </button>
                <button 
                  onClick={() => setIsEditingFinal(false)}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3"
                >
                  Salvar Alterações <Save size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const X: React.FC<{ size?: number, className?: string }> = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
