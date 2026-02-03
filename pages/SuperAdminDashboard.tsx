
import React, { useState, useEffect } from 'react';
import { User, CompanyRequest, UserRole, AppCategory, AppLocation, AppAmenity, BusinessProfile, BusinessClaimRequest } from '../types';
import { 
    getCompanyRequests, getAllUsers, getCategories, getLocations, saveImportedBusinesses, getClaimRequests, approveClaim
} from '../services/dataService';
import { discoverBusinessesFromAI } from '../services/geminiService';
import { 
    Clock, Shield, Users, LogOut, Search, Star, Store, Sparkles, Loader2, Globe, CheckCircle2, MapPin, X, ExternalLink, AlertCircle, RefreshCw
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
  const [discovered, setDiscovered] = useState<any[]>([]);
  const [scanNeighborhood, setScanNeighborhood] = useState('');
  const [scanCategory, setScanCategory] = useState('');
  const [scanAmount, setScanAmount] = useState(5);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    refreshAll();
    setHasKey(!!process.env.API_KEY);
  }, []);

  const refreshAll = () => {
    setRequests(getCompanyRequests() || []);
    setUsers(getAllUsers() || []);
    setCategories(getCategories() || []);
    setLocations(getLocations() || []);
  };

  const handleStartScan = async () => {
      if (scanning) return;
      if(!scanNeighborhood || !scanCategory) return alert("Selecione o bairro e a categoria.");
      
      setScanning(true);
      setDiscovered([]);
      
      try {
          const result = await discoverBusinessesFromAI(scanNeighborhood, scanCategory, scanAmount);
          if (result.businesses.length === 0) {
              alert("A IA não encontrou estabelecimentos verificáveis para esta busca no momento.");
          }
          setDiscovered(result.businesses);
      } catch (e: any) {
          console.error(e);
          if (e.message?.includes("429")) {
              alert("LIMITE DE BUSCA ATINGIDO: O Google Search da API gratuita tem um limite rigoroso de buscas por minuto. Por favor, aguarde 2 ou 3 minutos para tentar novamente.");
          } else {
              alert("Erro ao conectar com o Google Search. Verifique sua conexão.");
          }
      } finally {
          setScanning(false);
      }
  };

  const handleImportDiscovery = async () => {
      if(discovered.length === 0) return;
      if(!confirm(`Importar ${discovered.length} empresas REAIS para o guia?`)) return;
      await saveImportedBusinesses(discovered);
      alert("Importado com sucesso!");
      setDiscovered([]);
      refreshAll();
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
                        <h1 className="text-2xl font-bold text-ocean-950 flex items-center gap-2"><Globe className="text-ocean-600"/> Verificador de Empresas Reais</h1>
                        <p className="text-sm text-slate-500">Busca dados vivos no Google Search (Não aceita alucinações).</p>
                      </div>
                      {discovered.length > 0 && (
                          <button onClick={handleImportDiscovery} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2">
                            <CheckCircle2 size={18}/> IMPORTAR VALIDADOS
                          </button>
                      )}
                  </div>

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
                                disabled={scanning}
                                className="col-span-2 bg-ocean-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {scanning ? <Loader2 className="animate-spin" size={20}/> : <Search size={20}/>}
                                {scanning ? 'Vasculhando Google Search...' : 'Pesquisar Lugares Reais'}
                            </button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {discovered.map((biz, idx) => (
                          <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-start relative group">
                              <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-ocean-950">{biz.name}</h4>
                                  <p className="text-[11px] text-slate-400 mb-2 truncate"><MapPin size={10} className="inline mr-1"/> {biz.address}</p>
                                  <p className="text-xs text-slate-600 mb-3 line-clamp-2">"{biz.description}"</p>
                                  
                                  <div className="flex gap-2">
                                      {biz.sourceUrl && (
                                          <a href={biz.sourceUrl} target="_blank" className="bg-ocean-50 text-ocean-600 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-ocean-100">
                                              <ExternalLink size={10}/> CONFERIR NO GOOGLE
                                          </a>
                                      )}
                                      <div className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg text-[10px] font-bold">
                                          <Star size={10} className="inline mr-1" fill="currentColor"/> {biz.rating}
                                      </div>
                                  </div>
                              </div>
                              <button onClick={() => setDiscovered(p => p.filter(x => x.id !== biz.id))} className="text-slate-300 hover:text-red-500 p-1"><X size={18}/></button>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
