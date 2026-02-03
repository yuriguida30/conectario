
import React, { useState, useEffect } from 'react';
import { User, CompanyRequest, UserRole, AppCategory, AppLocation, AppAmenity, BusinessProfile, BusinessClaimRequest } from '../types';
import { 
    getCompanyRequests, getAllUsers, getCategories, getLocations, saveImportedBusinesses, getClaimRequests, approveClaim
} from '../services/dataService';
import { discoverBusinessesFromAI } from '../services/geminiService';
import { 
    Clock, Shield, Users, LogOut, Search, Star, Store, Sparkles, Loader2, Globe, CheckCircle2, MapPin, X, ExternalLink, AlertCircle, RefreshCw, Timer, Image as ImageIcon
} from 'lucide-react';

interface SuperAdminDashboardProps {
  onNavigate: (page: string) => void;
  currentUser: User;
  onLogout: () => void;
}

type Tab = 'DISCOVERY' | 'REQUESTS' | 'CLAIMS' | 'BUSINESSES' | 'USERS';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate, currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('DISCOVERY');
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [locations, setLocations] = useState<AppLocation[]>([]);
  
  const [scanning, setScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [discovered, setDiscovered] = useState<any[]>([]);
  const [scanNeighborhood, setScanNeighborhood] = useState('');
  const [scanCategory, setScanCategory] = useState('');
  const [scanAmount, setScanAmount] = useState(5);
  
  // Cooldown Logic
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const refreshAll = () => {
    setRequests(getCompanyRequests() || []);
    setUsers(getAllUsers() || []);
    setCategories(getCategories() || []);
    setLocations(getLocations() || []);
  };

  const handleStartScan = async () => {
      if (scanning || cooldown > 0) return;
      if(!scanNeighborhood || !scanCategory) return alert("Selecione o bairro e a categoria.");
      
      setScanning(true);
      setDiscovered([]);
      
      try {
          const result = await discoverBusinessesFromAI(scanNeighborhood, scanCategory, scanAmount);
          setDiscovered(result.businesses);
      } catch (e: any) {
          console.error(e);
          if (e.message?.includes("429") || e.status === 429) {
              setCooldown(60);
          } else {
              alert("Erro de conexão com o Google Maps.");
          }
      } finally {
          setScanning(false);
      }
  };

  const handleImportDiscovery = async () => {
      if(discovered.length === 0 || isImporting) return;
      if(!confirm(`Importar ${discovered.length} locais com fotos validadas?`)) return;
      
      setIsImporting(true);
      try {
          await saveImportedBusinesses(discovered);
          setDiscovered([]);
          refreshAll();
          // Não usamos alert para não travar o loop de eventos
          console.log("Importado com sucesso");
      } catch (e) {
          alert("Erro ao salvar no banco de dados.");
      } finally {
          setIsImporting(false);
      }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 pt-16">
      <div className="w-full md:w-72 bg-white border-r border-slate-200 p-4 flex flex-col z-40">
         <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible hide-scrollbar pb-2">
             <button onClick={() => setActiveTab('DISCOVERY')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'DISCOVERY' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <Sparkles size={18} /> AI Discovery
             </button>
             <button onClick={() => setActiveTab('BUSINESSES')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'BUSINESSES' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <Store size={18} /> Guia Oficial
             </button>
         </nav>
      </div>

      <div className="flex-1 p-4 md:p-10">
          {activeTab === 'DISCOVERY' && (
              <div className="max-w-5xl animate-in fade-in">
                  <div className="flex justify-between items-center mb-8">
                      <div>
                        <h1 className="text-2xl font-bold text-ocean-950 flex items-center gap-2"><MapPin className="text-ocean-600"/> Importador de Dados Vivos</h1>
                        <p className="text-sm text-slate-500">Buscando empresas com fotos reais no Google Maps.</p>
                      </div>
                      {discovered.length > 0 && (
                          <button 
                            onClick={handleImportDiscovery} 
                            disabled={isImporting}
                            className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
                          >
                            {isImporting ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>}
                            {isImporting ? 'SALVANDO...' : 'IMPORTAR COM FOTOS'}
                          </button>
                      )}
                  </div>

                  {cooldown > 0 && (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex items-center gap-4 text-amber-800 animate-in slide-in-from-top-4">
                          <Timer className="animate-pulse" />
                          <div className="flex-1">
                              <p className="font-bold text-sm">Aguardando cota do Google</p>
                              <p className="text-xs">Espere <strong>{cooldown}s</strong> para a próxima busca gratuita.</p>
                          </div>
                      </div>
                  )}

                  <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <select className="border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold" value={scanNeighborhood} onChange={e => setScanNeighborhood(e.target.value)}>
                              <option value="">Bairro...</option>
                              {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                          </select>
                          <select className="border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold" value={scanCategory} onChange={e => setScanCategory(e.target.value)}>
                              <option value="">Categoria...</option>
                              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                          <button 
                                onClick={handleStartScan} 
                                disabled={scanning || cooldown > 0}
                                className={`col-span-2 font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${cooldown > 0 ? 'bg-slate-200 text-slate-400' : 'bg-ocean-600 text-white hover:bg-ocean-700'}`}
                            >
                                {scanning ? <Loader2 className="animate-spin" size={20}/> : <Search size={20}/>}
                                {scanning ? 'Vasculhando...' : cooldown > 0 ? `Aguarde ${cooldown}s` : 'Pesquisar Agora'}
                            </button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {discovered.map((biz, idx) => (
                          <div key={idx} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col relative group">
                              <div className="h-40 bg-slate-100 relative overflow-hidden">
                                  <img src={biz.coverImage} className="w-full h-full object-cover" alt="cover" />
                                  <div className="absolute top-2 left-2 flex gap-1">
                                      {biz.gallery?.map((img: string, i: number) => (
                                          <div key={i} className="w-10 h-10 rounded-lg border-2 border-white overflow-hidden shadow-md bg-slate-200">
                                              <img src={img} className="w-full h-full object-cover" />
                                          </div>
                                      ))}
                                  </div>
                              </div>
                              <div className="p-5 flex-1">
                                  <div className="flex justify-between items-start mb-1">
                                      <h4 className="font-bold text-ocean-950 truncate pr-4">{biz.name}</h4>
                                      <div className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                          <Star size={10} fill="currentColor"/> {biz.rating}
                                      </div>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mb-2 truncate"><MapPin size={10} className="inline mr-1"/> {biz.address}</p>
                                  <p className="text-xs text-slate-600 mb-4 line-clamp-2">"{biz.description}"</p>
                                  
                                  <div className="flex gap-2">
                                      {biz.sourceUrl && (
                                          <a href={biz.sourceUrl} target="_blank" className="flex-1 bg-ocean-50 text-ocean-600 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-ocean-100">
                                              <ExternalLink size={10}/> VER NO MAPA
                                          </a>
                                      )}
                                      <button onClick={() => setDiscovered(p => p.filter(x => x.id !== biz.id))} className="bg-slate-50 text-slate-400 px-3 py-2 rounded-xl hover:text-red-500">
                                          <X size={14}/>
                                      </button>
                                  </div>
                              </div>
                          </div>
                      ))}
                      {discovered.length === 0 && !scanning && (
                          <div className="col-span-2 py-20 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                              <ImageIcon size={40} className="mx-auto mb-4 opacity-20" />
                              <p className="text-sm font-medium">Os locais encontrados aparecerão aqui.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
