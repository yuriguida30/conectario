
import React, { useState, useEffect } from 'react';
import { User, CompanyRequest, UserRole, AppCategory, AppLocation, AppAmenity, BlogPost, Collection, BusinessProfile, FeaturedConfig, SupportMessage, AppConfig, BusinessClaimRequest } from '../types';
import { 
    getCompanyRequests, approveRequest, rejectRequest, getAllUsers, updateUser, deleteUser, getCategories, addCategory, deleteCategory, getLocations, addLocation, deleteLocation, getAmenities, addAmenity, deleteAmenity, getBlogPosts, saveBlogPost, deleteBlogPost, getCollections, saveCollection, deleteCollection, getBusinesses, saveBusiness, getFeaturedConfig, saveFeaturedConfig, getSupportMessages, getAppConfig, saveAppConfig, adminResetPassword, createCompanyDirectly, addSubCategory, removeSubCategory, 
    saveImportedBusinesses, getClaimRequests, approveClaim
} from '../services/dataService';
import { discoverBusinessesFromAI } from '../services/geminiService';
import { 
    Check, X, Clock, Shield, Users, Settings, LayoutGrid, Map, Plus, Trash2, BookOpen, Edit, Save, Coffee, LogOut, User as UserIcon, Mail, Layers, Search, Star, MessageSquare, Palette, Lock, Unlock, Key, Building2, MapPin, Store, Crown, Filter, Sparkles, Loader2, Globe, CheckCircle2, ChevronRight
} from 'lucide-react';

interface SuperAdminDashboardProps {
  onNavigate: (page: string) => void;
  currentUser: User;
  onLogout: () => void;
}

type Tab = 'DISCOVERY' | 'REQUESTS' | 'CLAIMS' | 'BUSINESSES' | 'USERS' | 'SETTINGS' | 'BRANDING';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate, currentUser, onLogout }) => {
  // Agora a aba padrão é a Discovery para facilitar
  const [activeTab, setActiveTab] = useState<Tab>('DISCOVERY');
  
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [claimRequests, setClaimRequests] = useState<BusinessClaimRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [locations, setLocations] = useState<AppLocation[]>([]);
  
  // AI Agent States
  const [scanning, setScanning] = useState(false);
  const [discovered, setDiscovered] = useState<Partial<BusinessProfile>[]>([]);
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
      
      setScanning(true);
      setDiscovered([]);
      setStatusMsg("Agente verificando veracidade no Google Maps...");
      
      try {
          // Pequeno delay para simular o "pensamento" do agente e dar feedback visual
          setTimeout(() => setStatusMsg("Analisando as melhores avaliações dos clientes..."), 2000);
          setTimeout(() => setStatusMsg("Extraindo informações oficiais de contato..."), 4000);
          
          const results = await discoverBusinessesFromAI(scanNeighborhood, scanCategory, scanAmount);
          setDiscovered(results);
          setStatusMsg("");
      } catch (e) {
          alert("Erro na varredura da IA.");
      } finally {
          setScanning(false);
      }
  };

  const handleImportDiscovery = async () => {
      if(discovered.length === 0) return;
      if(!confirm(`Deseja importar estas ${discovered.length} empresas?`)) return;
      
      await saveImportedBusinesses(discovered as BusinessProfile[]);
      alert("Sucesso! Empresas inseridas no guia.");
      setDiscovered([]);
      refreshAll();
  };

  const navItemClass = (tab: Tab) => {
    const isActive = activeTab === tab;
    return `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
        isActive 
        ? 'bg-ocean-600 text-white shadow-lg shadow-ocean-600/20' 
        : 'text-slate-500 hover:bg-slate-50'
    }`;
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 pt-16">
      
      {/* Sidebar / Top Nav Mobile */}
      <div className="w-full md:w-72 bg-white border-r border-slate-200 p-4 flex flex-col z-40">
         <div className="hidden md:block mb-8 px-2">
             <h2 className="text-xl font-bold text-ocean-950 flex items-center gap-2"><Shield className="text-gold-500" /> Painel Admin</h2>
             <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Controle do Sistema</p>
         </div>

         {/* Menu lateral que vira scroll no mobile */}
         <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible hide-scrollbar pb-2 md:pb-0">
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
             <button onClick={() => setActiveTab('BRANDING')} className={navItemClass('BRANDING')}>
                 <Palette size={18} /> Branding
             </button>
             <button onClick={() => setActiveTab('USERS')} className={navItemClass('USERS')}>
                 <Users size={18} /> Usuários
             </button>
         </nav>

         <button onClick={onLogout} className="hidden md:flex mt-auto items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50">
             <LogOut size={18} /> Sair
         </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 md:p-10 overflow-y-auto">
          
          {activeTab === 'DISCOVERY' && (
              <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-ocean-600 p-3 rounded-2xl text-white shadow-lg"><Sparkles size={24}/></div>
                            <h1 className="text-2xl font-bold text-ocean-950">AI Discovery Agent</h1>
                        </div>
                        <p className="text-sm text-slate-500">Busca inteligente de empresas reais no Google e Redes Sociais.</p>
                      </div>
                      
                      {discovered.length > 0 && (
                          <button 
                            onClick={handleImportDiscovery} 
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                          >
                            APROVAR E IMPORTAR {discovered.length} EMPRESAS
                          </button>
                      )}
                  </div>

                  {/* Scraper Controls */}
                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-10">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                          <div className="space-y-2">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bairro</label>
                              <select className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold" value={scanNeighborhood} onChange={e => setScanNeighborhood(e.target.value)}>
                                  <option value="">Onde buscar?</option>
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
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade</label>
                              <select className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold" value={scanAmount} onChange={e => setScanAmount(Number(e.target.value))}>
                                  <option value={3}>3 empresas</option>
                                  <option value={5}>5 empresas</option>
                                  <option value={10}>10 empresas</option>
                              </select>
                          </div>
                          <button 
                            onClick={handleStartScan} 
                            disabled={scanning}
                            className="bg-ocean-600 hover:bg-ocean-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 h-[48px]"
                          >
                              {scanning ? <Loader2 className="animate-spin" size={20}/> : <Search size={20}/>}
                              {scanning ? 'Agente Trabalhando...' : 'Rodar Agente'}
                          </button>
                      </div>
                      {scanning && (
                          <div className="mt-4 flex items-center justify-center gap-3 py-4 bg-ocean-50 rounded-2xl animate-pulse">
                              <Sparkles size={16} className="text-ocean-600"/>
                              <p className="text-sm font-bold text-ocean-700">{statusMsg}</p>
                          </div>
                      )}
                  </div>

                  {/* Results Grid */}
                  {discovered.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-8">
                          {discovered.map((biz, idx) => (
                              <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-start group relative">
                                  <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden shrink-0">
                                      <img src={biz.coverImage} className="w-full h-full object-cover"/>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <h4 className="font-bold text-ocean-950 truncate">{biz.name}</h4>
                                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-1 truncate"><MapPin size={10}/> {biz.address}</p>
                                      <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded text-[10px] font-bold text-yellow-700 w-fit mb-2">
                                          <Star size={10} fill="currentColor"/> {biz.rating} ({biz.reviewCount} avaliações)
                                      </div>
                                      <p className="text-xs text-slate-600 line-clamp-2">"{biz.description}"</p>
                                  </div>
                                  <button onClick={() => setDiscovered(p => p.filter(x => x.id !== biz.id))} className="text-slate-300 hover:text-red-500 p-2"><X size={18}/></button>
                              </div>
                          ))}
                      </div>
                  )}

                  {!scanning && discovered.length === 0 && (
                      <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 border-dashed">
                          <p className="text-slate-400 font-medium">Selecione os filtros acima para o Agente iniciar a busca.</p>
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'CLAIMS' && (
              <div className="max-w-4xl">
                  <h1 className="text-2xl font-bold text-ocean-950 mb-6">Reivindicações Pendentes</h1>
                  {claimRequests.filter(c => c.status === 'PENDING').length === 0 ? (
                      <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">Sem novos pedidos.</div>
                  ) : (
                      <div className="space-y-4">
                          {claimRequests.filter(c => c.status === 'PENDING').map(claim => (
                              <div key={claim.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center">
                                  <div>
                                      <h3 className="font-bold text-ocean-900">{claim.businessName}</h3>
                                      <p className="text-sm text-slate-500">{claim.requesterName} • {claim.requesterPhone}</p>
                                  </div>
                                  <button onClick={() => approveClaim(claim.id)} className="bg-ocean-600 text-white px-6 py-2 rounded-xl font-bold text-sm">Aprovar Posse</button>
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
