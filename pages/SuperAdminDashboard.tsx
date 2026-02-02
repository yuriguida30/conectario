
import React, { useState, useEffect } from 'react';
import { User, CompanyRequest, UserRole, AppCategory, AppLocation, AppAmenity, BusinessProfile, BusinessClaimRequest } from '../types';
import { 
    getCompanyRequests, getAllUsers, getCategories, getLocations, saveImportedBusinesses, getClaimRequests, approveClaim
} from '../services/dataService';
import { discoverBusinessesFromAI } from '../services/geminiService';
import { 
    Clock, Shield, Users, Trash2, LogOut, Search, Star, Palette, Lock, Store, Sparkles, Loader2, Globe, CheckCircle2, MapPin, X, ExternalLink
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

  useEffect(() => {
    refreshAll();
  }, []);

  const refreshAll = () => {
    setRequests(getCompanyRequests() || []);
    setClaimRequests(getClaimRequests() || []);
    setUsers(getAllUsers() || []);
    setCategories(getCategories() || []);
    setLocations(getLocations() || []);
  };

  const handleStartScan = async () => {
      if(!scanNeighborhood || !scanCategory) return alert("Selecione o bairro e a categoria.");
      
      console.log("Iniciando Scan:", { scanNeighborhood, scanCategory, scanAmount });
      setScanning(true);
      setDiscovered([]);
      setSources([]);
      setStatusMsg("Agente verificando veracidade no Google Search...");
      
      try {
          const result = await discoverBusinessesFromAI(scanNeighborhood, scanCategory, scanAmount);
          console.log("Resultado da IA:", result);
          
          if (result.businesses.length === 0) {
              alert("O Agente não encontrou empresas com alta veracidade nesta busca. Tente outro bairro.");
          }
          
          setDiscovered(result.businesses);
          setSources(result.sources);
          setStatusMsg("");
      } catch (e: any) {
          console.error("Erro handleStartScan:", e);
          alert(`Erro na varredura: ${e.message || 'Verifique o console para detalhes.'}`);
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
      
      {/* Sidebar Navigation */}
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

      {/* Main Content */}
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
                      
                      {discovered.length > 0 && (
                          <button 
                            onClick={handleImportDiscovery} 
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 active:scale-95 transition-all"
                          >
                            <CheckCircle2 size={18}/> APROVAR E IMPORTAR TUDO
                          </button>
                      )}
                  </div>

                  {/* Scraper Panel */}
                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8">
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
                                  <option value={5}>5 Negócios (Recomendado)</option>
                                  <option value={10}>10 Negócios</option>
                              </select>
                          </div>
                          <button 
                            onClick={handleStartScan} 
                            disabled={scanning}
                            className="bg-ocean-600 hover:bg-ocean-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 h-[48px] shadow-ocean-600/20"
                          >
                              {scanning ? <Loader2 className="animate-spin" size={20}/> : <Search size={20}/>}
                              {scanning ? 'Vasculhando Web...' : 'Rodar Agente IA'}
                          </button>
                      </div>
                      {scanning && (
                          <div className="mt-6 flex flex-col items-center gap-3 py-6 bg-ocean-50 rounded-3xl animate-pulse border border-ocean-100">
                              <Sparkles size={24} className="text-ocean-600"/>
                              <p className="text-sm font-black text-ocean-700 uppercase tracking-widest">{statusMsg}</p>
                          </div>
                      )}
                  </div>

                  {/* Resultados */}
                  {discovered.length > 0 && (
                      <div className="space-y-6 animate-in slide-in-from-bottom-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {discovered.map((biz, idx) => (
                                  <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-start relative group">
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
                          
                          {/* Fontes (Grounding) */}
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
                                                className="bg-white px-3 py-1.5 rounded-full text-[10px] font-bold text-ocean-600 border border-slate-200 flex items-center gap-1 hover:border-ocean-300"
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

          {activeTab === 'CLAIMS' && (
              <div className="max-w-4xl">
                  <h1 className="text-2xl font-bold text-ocean-950 mb-6">Pedidos de Reivindicação</h1>
                  {claimRequests.filter(c => c.status === 'PENDING').length === 0 ? (
                      <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 border-dashed">Sem novos pedidos pendentes.</div>
                  ) : (
                      <div className="space-y-4">
                          {claimRequests.filter(c => c.status === 'PENDING').map(claim => (
                              <div key={claim.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
                                  <div>
                                      <h3 className="font-bold text-ocean-900 text-lg">{claim.businessName}</h3>
                                      <p className="text-sm text-slate-500">{claim.requesterName} ({claim.requesterEmail})</p>
                                      <p className="text-xs text-slate-400 mt-1">Tel: {claim.requesterPhone}</p>
                                  </div>
                                  <button onClick={() => approveClaim(claim.id)} className="bg-ocean-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all">Aprovar Posse</button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};
