
import React, { useState, useEffect } from 'react';
import { User, CompanyRequest, UserRole, AppCategory, AppLocation, AppAmenity, BusinessProfile, BusinessClaimRequest } from '../types';
import { 
    getCompanyRequests, getAllUsers, getCategories, getLocations, saveImportedBusinesses, getClaimRequests, approveClaim
} from '../services/dataService';
import { discoverBusinessesFromAI } from '../services/geminiService';
import { 
    Clock, Shield, Users, LogOut, Search, Star, Store, Sparkles, Loader2, Globe, CheckCircle2, MapPin, X, ExternalLink, AlertCircle, RefreshCw, Timer, Image as ImageIcon, Instagram, Link
} from 'lucide-react';

interface SuperAdminDashboardProps {
  onNavigate: (page: string) => void;
  currentUser: User;
  onLogout: () => void;
}

type Tab = 'DISCOVERY' | 'REQUESTS' | 'CLAIMS' | 'BUSINESSES' | 'USERS';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate, currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('DISCOVERY');
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [locations, setLocations] = useState<AppLocation[]>([]);
  
  const [scanning, setScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [discovered, setDiscovered] = useState<any[]>([]);
  const [scanNeighborhood, setScanNeighborhood] = useState('');
  const [scanCategory, setScanCategory] = useState('');
  
  const [cooldown, setCooldown] = useState(0);

  const refreshAll = () => {
    setCategories(getCategories() || []);
    setLocations(getLocations() || []);
  };

  useEffect(() => {
    refreshAll();
    // Listener para carregar categorias assim que o Firebase retornar
    window.addEventListener('dataUpdated', refreshAll);
    return () => window.removeEventListener('dataUpdated', refreshAll);
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleStartScan = async () => {
      if (scanning || cooldown > 0) return;
      if(!scanNeighborhood || !scanCategory) return alert("Selecione bairro e categoria.");
      
      setScanning(true);
      setDiscovered([]);
      
      try {
          const result = await discoverBusinessesFromAI(scanNeighborhood, scanCategory, 5);
          if (result.businesses.length === 0) {
              alert("O Google não retornou dados para esta busca. Tente uma categoria mais genérica.");
          }
          setDiscovered(result.businesses);
      } catch (e: any) {
          console.error(e);
          if (e.message?.includes("429") || e.status === 429) {
              setCooldown(120); 
          } else {
              alert("Houve um problema na busca. Aguarde um instante e tente novamente.");
          }
      } finally {
          setScanning(false);
      }
  };

  const handleImportDiscovery = async () => {
      if(discovered.length === 0 || isImporting) return;
      if(!confirm(`Deseja importar estes ${discovered.length} locais verificados?`)) return;
      
      setIsImporting(true);
      try {
          await saveImportedBusinesses(discovered);
          setDiscovered([]);
          alert("Importação concluída com sucesso!");
          refreshAll();
      } catch (e) {
          console.error(e);
          alert("Erro ao salvar. Verifique sua conexão.");
      } finally {
          setIsImporting(false);
      }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 pt-16">
      <div className="w-full md:w-72 bg-white border-r border-slate-200 p-4 flex flex-col z-40">
         <div className="mb-8 px-4">
             <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Super Admin</h2>
             <p className="text-ocean-950 font-bold text-sm">{currentUser.name}</p>
         </div>
         <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible hide-scrollbar pb-2">
             <button onClick={() => setActiveTab('DISCOVERY')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'DISCOVERY' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <Sparkles size={18} /> AI Discovery 3.0
             </button>
             <button onClick={() => setActiveTab('BUSINESSES')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'BUSINESSES' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <Store size={18} /> Guia Oficial
             </button>
             <div className="mt-auto hidden md:block">
                 <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50">
                    <LogOut size={18} /> Sair do Painel
                 </button>
             </div>
         </nav>
      </div>

      <div className="flex-1 p-4 md:p-10">
          {activeTab === 'DISCOVERY' && (
              <div className="max-w-5xl animate-in fade-in">
                  <div className="flex justify-between items-center mb-8">
                      <div>
                        <h1 className="text-2xl font-bold text-ocean-950 flex items-center gap-2"><Globe className="text-ocean-600"/> Verificador de Lugares Reais</h1>
                        <p className="text-sm text-slate-500">Buscando dados ao vivo via Google Search (Imagens Reais).</p>
                      </div>
                      {discovered.length > 0 && (
                          <button 
                            onClick={handleImportDiscovery} 
                            disabled={isImporting}
                            className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
                          >
                            {isImporting ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>}
                            {isImporting ? 'IMPORTANDO...' : 'IMPORTAR SELECIONADOS'}
                          </button>
                      )}
                  </div>

                  {cooldown > 0 && (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex items-center gap-4 text-amber-800 animate-in slide-in-from-top-4">
                          <Timer className="animate-pulse" />
                          <div className="flex-1">
                              <p className="font-bold text-sm">LIMITE DE BUSCA ATINGIDO</p>
                              <p className="text-xs">O Google liberará uma nova consulta em <strong>{cooldown} segundos</strong>.</p>
                          </div>
                      </div>
                  )}

                  <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div className="flex flex-col gap-1">
                             <label className="text-[10px] font-bold text-slate-400 ml-1">BAIRRO</label>
                             <select className="border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold" value={scanNeighborhood} onChange={e => setScanNeighborhood(e.target.value)}>
                                <option value="">Selecione...</option>
                                {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                             </select>
                          </div>
                          <div className="flex flex-col gap-1">
                             <label className="text-[10px] font-bold text-slate-400 ml-1">CATEGORIA</label>
                             <select className="border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold" value={scanCategory} onChange={e => setScanCategory(e.target.value)}>
                                <option value="">Selecione...</option>
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                             </select>
                          </div>
                          <button 
                                onClick={handleStartScan} 
                                disabled={scanning || cooldown > 0}
                                className={`col-span-2 font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${cooldown > 0 ? 'bg-slate-200 text-slate-400' : 'bg-ocean-600 text-white hover:bg-ocean-700 active:scale-95'}`}
                            >
                                {scanning ? <Loader2 className="animate-spin" size={20}/> : <Search size={20}/>}
                                {scanning ? 'Consultando Google...' : cooldown > 0 ? `Aguarde ${cooldown}s` : 'Pesquisar Lugares Reais'}
                            </button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {discovered.map((biz, idx) => (
                          <div key={idx} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col relative group hover:shadow-xl transition-shadow">
                              <div className="h-44 bg-slate-100 relative">
                                  <img 
                                    src={biz.coverImage} 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => e.currentTarget.src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800"} 
                                    alt="cover" 
                                  />
                                  <div className="absolute top-2 left-2 flex gap-1">
                                      {biz.gallery?.slice(0, 2).map((img: string, i: number) => (
                                          <div key={i} className="w-12 h-12 rounded-lg border-2 border-white overflow-hidden shadow-md bg-slate-200">
                                              <img src={img} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                                          </div>
                                      ))}
                                  </div>
                                  <button onClick={() => setDiscovered(p => p.filter(x => x.id !== biz.id))} className="absolute top-2 right-2 bg-white/20 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-md transition-colors">
                                      <X size={16}/>
                                  </button>
                              </div>
                              <div className="p-5 flex-1 flex flex-col">
                                  <div className="flex justify-between items-start mb-2">
                                      <h4 className="font-bold text-ocean-950 text-lg leading-tight">{biz.name}</h4>
                                      <div className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                          <Star size={12} fill="currentColor"/> {biz.rating}
                                      </div>
                                  </div>
                                  <p className="text-xs text-slate-400 mb-3 flex items-center gap-1"><MapPin size={12}/> {biz.address}</p>
                                  <p className="text-xs text-slate-600 mb-4 line-clamp-2">"{biz.description}"</p>
                                  
                                  <div className="mt-auto pt-4 border-t border-slate-50 flex gap-2">
                                      {biz.sourceUrl && (
                                          <a href={biz.sourceUrl} target="_blank" className="flex-1 bg-ocean-50 text-ocean-600 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-ocean-100">
                                              {biz.sourceUrl.includes('instagram') ? <Instagram size={14}/> : <Link size={14}/>} 
                                              CONFERIR NO GOOGLE
                                          </a>
                                      )}
                                  </div>
                              </div>
                          </div>
                      ))}
                      {discovered.length === 0 && !scanning && (
                          <div className="col-span-2 py-32 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[3rem]">
                              <ImageIcon size={48} className="mx-auto mb-4 opacity-10" />
                              <p className="text-sm font-medium">Os locais validados aparecerão aqui.</p>
                              <p className="text-[10px] uppercase tracking-widest mt-2">Escolha o bairro e clique em pesquisar</p>
                          </div>
                      )}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
