
import React, { useState, useEffect } from 'react';
import { User, CompanyRequest, UserRole, AppCategory, AppLocation, AppAmenity, BusinessProfile, BusinessClaimRequest } from '../types';
import { 
    getCompanyRequests, getAllUsers, getCategories, getLocations, saveImportedBusinesses, getClaimRequests, approveClaim
} from '../services/dataService';
import { discoverBusinessesFromAI } from '../services/geminiService';
import { 
    Clock, Shield, Users, Trash2, LogOut, Search, Star, Palette, Lock, Store, Sparkles, Loader2, Globe, CheckCircle2, MapPin, X, ExternalLink, Key, AlertCircle, Info, Settings, RefreshCw
} from 'lucide-react';

interface SuperAdminDashboardProps {
  onNavigate: (page: string) => void;
  currentUser: User;
  onLogout: () => void;
}

type Tab = 'DISCOVERY' | 'REQUESTS' | 'CLAIMS' | 'BUSINESSES' | 'USERS' | 'BRANDING';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate, currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('DISCOVERY');
  
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [claimRequests, setClaimRequests] = useState<BusinessClaimRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [locations, setLocations] = useState<AppLocation[]>([]);
  
  // AI Agent States
  const [scanning, setScanning] = useState(false);
  const [discovered, setDiscovered] = useState<Partial<BusinessProfile>[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [scanNeighborhood, setScanNeighborhood] = useState('');
  const [scanCategory, setScanCategory] = useState('');
  const [scanAmount, setScanAmount] = useState(5);
  const [statusMsg, setStatusMsg] = useState('');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    refreshAll();
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const envKey = process.env.API_KEY;
    if (envKey && envKey !== "" && envKey !== "undefined" && !envKey.includes("process.env")) {
      setHasKey(true);
    } else {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    }
  };

  const refreshAll = () => {
    setRequests(getCompanyRequests() || []);
    setClaimRequests(getClaimRequests() || []);
    setUsers(getAllUsers() || []);
    setCategories(getCategories() || []);
    setLocations(getLocations() || []);
  };

  const handleStartScan = async () => {
      if (!hasKey) return;
      if(!scanNeighborhood || !scanCategory) return alert("Selecione o bairro e a categoria.");
      
      setScanning(true);
      setDiscovered([]);
      setSources([]);
      setStatusMsg("Agente verificando veracidade no Google Search...");
      
      try {
          const result = await discoverBusinessesFromAI(scanNeighborhood, scanCategory, scanAmount);
          setDiscovered(result.businesses);
          setSources(result.sources);
          setStatusMsg("");
      } catch (e: any) {
          console.error("Erro handleStartScan:", e);
          alert(`Erro: ${e.message || 'Erro de conexão com a IA.'}`);
      } finally {
          setScanning(false);
      }
  };

  const handleImportDiscovery = async () => {
      if(discovered.length === 0) return;
      if(!confirm(`Deseja importar estas ${discovered.length} empresas para o guia oficial?`)) return;
      
      try {
          await saveImportedBusinesses(discovered as BusinessProfile[]);
          alert("Importação concluída com sucesso!");
          setDiscovered([]);
          setSources([]);
          refreshAll();
      } catch (err) {
          alert("Erro ao salvar no banco de dados.");
      }
  };

  const navItemClass = (tab: Tab) => {
    const isActive = activeTab === tab;
    return `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
        isActive 
        ? 'bg-ocean-600 text-white shadow-lg' 
        : 'text-slate-500 hover:bg-slate-50'
    }`;
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 pt-16">
      
      <div className="w-full md:w-72 bg-white border-r border-slate-200 p-4 flex flex-col z-40">
         <div className="hidden md:block mb-8 px-2">
             <h2 className="text-xl font-bold text-ocean-950 flex items-center gap-2"><Shield className="text-gold-500" /> Admin</h2>
             <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Super Controle</p>
         </div>

         <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible hide-scrollbar pb-2">
             <button onClick={() => setActiveTab('DISCOVERY')} className={navItemClass('DISCOVERY')}>
                 <Sparkles size={18} /> AI Agent Discovery
             </button>
             <button onClick={() => setActiveTab('CLAIMS')} className={navItemClass('CLAIMS')}>
                 <Lock size={18} /> Reivindicações
             </button>
             <button onClick={() => setActiveTab('REQUESTS')} className={navItemClass('REQUESTS')}>
                 <Clock size={18} /> Novos Parceiros
             </button>
             <button onClick={() => setActiveTab('BUSINESSES')} className={navItemClass('BUSINESSES')}>
                 <Store size={18} /> Guia Comercial
             </button>
             <button onClick={() => setActiveTab('USERS')} className={navItemClass('USERS')}>
                 <Users size={18} /> Usuários
             </button>
         </nav>

         <button onClick={onLogout} className="hidden md:flex mt-auto items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50">
             <LogOut size={18} /> Sair
         </button>
      </div>

      <div className="flex-1 p-4 md:p-10 overflow-y-auto">
          
          {activeTab === 'DISCOVERY' && (
              <div className="max-w-5xl animate-in fade-in">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-ocean-600 p-3 rounded-2xl text-white shadow-lg"><Sparkles size={24}/></div>
                            <h1 className="text-2xl font-bold text-ocean-950">AI Discovery Agent</h1>
                        </div>
                        <p className="text-sm text-slate-500 italic">"Povoando o seu guia com dados reais e verídicos via Google"</p>
                      </div>

                      {hasKey && discovered.length > 0 && (
                          <button 
                            onClick={handleImportDiscovery} 
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 active:scale-95 transition-all"
                          >
                            <CheckCircle2 size={18}/> APROVAR E IMPORTAR TUDO
                          </button>
                      )}
                  </div>

                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8">
                      {!hasKey ? (
                        <div className="animate-in slide-in-from-top-4 duration-500">
                            <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-3xl">
                                <div className="flex items-start gap-4">
                                    <div className="bg-amber-100 p-3 rounded-2xl text-amber-600 shrink-0">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-amber-900 text-lg mb-2">Configuração Necessária</h3>
                                        <p className="text-sm text-amber-800 leading-relaxed mb-6">
                                            O Agente de IA precisa de uma chave para vasculhar o Google Search. Siga os passos abaixo na sua conta Vercel:
                                        </p>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                            <div className="bg-white/50 p-4 rounded-2xl border border-amber-100">
                                                <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center text-xs font-black text-amber-700 mb-3">1</div>
                                                <p className="text-xs font-bold text-amber-900 mb-1">Painel Vercel</p>
                                                <p className="text-[10px] text-amber-700">Vá em Settings &gt; Environment Variables.</p>
                                            </div>
                                            <div className="bg-white/50 p-4 rounded-2xl border border-amber-100">
                                                <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center text-xs font-black text-amber-700 mb-3">2</div>
                                                <p className="text-xs font-bold text-amber-900 mb-1">Adicionar Key</p>
                                                <p className="text-[10px] text-amber-700">Nome: <b>API_KEY</b> <br/>Valor: Sua chave Gemini.</p>
                                            </div>
                                            <div className="bg-white/50 p-4 rounded-2xl border border-amber-100">
                                                <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center text-xs font-black text-amber-700 mb-3">3</div>
                                                <p className="text-xs font-bold text-amber-900 mb-1">Redeploy</p>
                                                <p className="text-[10px] text-amber-700">Vá em Deployments e clique em Redeploy.</p>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => window.location.reload()}
                                            className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20"
                                        >
                                            <RefreshCw size={18} /> Já configurei, recarregar página
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Localidade (Bairro)</label>
                                <select className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold" value={scanNeighborhood} onChange={e => setScanNeighborhood(e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                                <select className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold" value={scanCategory} onChange={e => setScanCategory(e.target.value)}>
                                    <option value="">O que buscar?</option>
                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Volume de Busca</label>
                                <select className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold" value={scanAmount} onChange={e => setScanAmount(Number(e.target.value))}>
                                    <option value={3}>3 Negócios</option>
                                    <option value={5}>5 Negócios</option>
                                    <option value={10}>10 Negócios</option>
                                </select>
                            </div>
                            <button 
                                onClick={handleStartScan} 
                                disabled={scanning}
                                className="bg-ocean-600 hover:bg-ocean-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 h-[48px] shadow-ocean-600/20"
                            >
                                {scanning ? <Loader2 className="animate-spin" size={20}/> : <Search size={20}/>}
                                {scanning ? 'Consultando Google Search...' : 'Iniciar Varredura IA'}
                            </button>
                        </div>
                      )}
                      
                      {scanning && (
                          <div className="mt-6 flex flex-col items-center gap-3 py-10 bg-ocean-50 rounded-[2rem] animate-pulse border border-ocean-100">
                              <Sparkles size={32} className="text-ocean-600"/>
                              <div className="text-center">
                                  <p className="text-lg font-bold text-ocean-900">{statusMsg}</p>
                                  <p className="text-xs text-ocean-600 mt-1 uppercase font-black tracking-widest opacity-60">Isso pode levar alguns segundos</p>
                              </div>
                          </div>
                      )}
                  </div>

                  {discovered.length > 0 && (
                      <div className="space-y-6 animate-in slide-in-from-bottom-8">
                          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Negócios Encontrados e Validados</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {discovered.map((biz, idx) => (
                                  <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-start relative group hover:border-ocean-300 transition-all">
                                      <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-inner">
                                          <img src={biz.coverImage} className="w-full h-full object-cover"/>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <h4 className="font-bold text-ocean-950 truncate">{biz.name}</h4>
                                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-1 truncate"><MapPin size={10}/> {biz.address}</p>
                                          <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded text-[10px] font-bold text-yellow-700 w-fit mb-2">
                                              <Star size={10} fill="currentColor"/> {biz.rating} (IA Verificado)
                                          </div>
                                          <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-2">"{biz.description}"</p>
                                      </div>
                                      <button 
                                        onClick={() => setDiscovered(p => p.filter(x => x.id !== biz.id))} 
                                        className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
                                      >
                                          <X size={18}/>
                                      </button>
                                  </div>
                              ))}
                          </div>
                          
                          {sources.length > 0 && (
                              <div className="bg-slate-100 p-6 rounded-3xl border border-slate-200">
                                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                      <Globe size={14}/> Fontes de Veracidade Consultadas pela IA
                                  </h5>
                                  <div className="flex flex-wrap gap-2">
                                      {sources.map((source, i) => (
                                          source.web && (
                                              <a 
                                                key={i} 
                                                href={source.web.uri} 
                                                target="_blank" 
                                                className="bg-white px-3 py-1.5 rounded-full text-[10px] font-bold text-ocean-600 border border-slate-200 flex items-center gap-1 hover:border-ocean-300 shadow-sm"
                                              >
                                                  {source.web.title || "Referência Google"} <ExternalLink size={10}/>
                                              </a>
                                          )
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};
