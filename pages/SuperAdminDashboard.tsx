
import React, { useState, useEffect } from 'react';
import { User, AppCategory, AppLocation } from '../types';
import { getCategories, getLocations, saveImportedBusinesses, getAIsessionCache } from '../services/dataService';
import { discoverBusinessesFromAI } from '../services/geminiService';
import { Search, Store, Sparkles, Loader2, Globe, CheckCircle2, MapPin, X, Link, Timer, Image as ImageIcon, Info, Zap } from 'lucide-react';

interface SuperAdminDashboardProps {
  onNavigate: (page: string) => void;
  currentUser: User;
  onLogout: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate, currentUser, onLogout }) => {
  const [categories, setCategories] = useState<AppCategory[]>(getCategories());
  const [locations, setLocations] = useState<AppLocation[]>(getLocations());
  
  const [scanning, setScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [discovered, setDiscovered] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [scanNeighborhood, setScanNeighborhood] = useState('');
  const [scanCategory, setScanCategory] = useState('');
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    const refresh = () => {
        setCategories(getCategories());
        setLocations(getLocations());
    };
    refresh();
    window.addEventListener('dataUpdated', refresh);
    return () => window.removeEventListener('dataUpdated', refresh);
  }, []);

  const handleStartScan = async () => {
      if (scanning) return;
      if(!scanNeighborhood || !scanCategory) return alert("Selecione bairro e categoria.");
      
      const cached = getAIsessionCache(scanNeighborhood, scanCategory);
      if (cached) {
          setDiscovered(cached.businesses);
          setSources(cached.sources || []);
          setIsFallback(false);
          return;
      }

      setScanning(true);
      setDiscovered([]);
      setSources([]);
      setIsFallback(false);
      
      try {
          const result = await discoverBusinessesFromAI(scanNeighborhood, scanCategory, 5);
          setDiscovered(result.businesses);
          setSources(result.sources || []);
          setIsFallback(result.isFallback);
      } catch (e: any) {
          alert("O servidor da IA está muito ocupado agora. Tente novamente em 5 segundos.");
      } finally {
          setScanning(false);
      }
  };

  const handleImportDiscovery = async () => {
      if(discovered.length === 0 || isImporting) return;
      setIsImporting(true);
      try {
          await saveImportedBusinesses(discovered);
          setDiscovered([]);
          setSources([]);
          alert("Empresas importadas com sucesso!");
      } catch (e) {
          alert("Erro ao salvar.");
      } finally {
          setIsImporting(false);
      }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 pt-16">
      <div className="w-full md:w-72 bg-white border-r border-slate-200 p-4 flex flex-col z-40">
         <div className="mb-8 px-4">
             <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Painel Admin</h2>
             <p className="text-ocean-950 font-bold text-sm">{currentUser.name}</p>
         </div>
         <nav className="flex md:flex-col gap-1">
             <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-ocean-600 text-white shadow-lg">
                 <Sparkles size={18} /> AI Discovery 3.0
             </button>
             <button onClick={() => onNavigate('home')} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">
                 <Store size={18} /> Ver Site
             </button>
             <button onClick={onLogout} className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50">
                 Sair
             </button>
         </nav>
      </div>

      <div className="flex-1 p-4 md:p-10">
          <div className="max-w-5xl">
              <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-2xl font-bold text-ocean-950 flex items-center gap-2"><Globe className="text-ocean-600"/> Importador Inteligente</h1>
                    <p className="text-sm text-slate-500">Encontre comércios reais usando inteligência artificial.</p>
                  </div>
                  {discovered.length > 0 && (
                      <button onClick={handleImportDiscovery} disabled={isImporting} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 hover:bg-green-700 disabled:opacity-50">
                        {isImporting ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>}
                        IMPORTAR PARA O SITE
                      </button>
                  )}
              </div>

              {isFallback && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl mb-6 flex items-center gap-4 text-blue-800 animate-in slide-in-from-top-4">
                      <Zap className="text-blue-600 animate-pulse" />
                      <div className="flex-1">
                          <p className="font-bold text-sm">MODO INTELIGENTE ATIVO</p>
                          <p className="text-xs">O limite de busca do Google foi atingido. Estamos usando a memória avançada da IA para localizar os comércios de {scanNeighborhood} para você.</p>
                      </div>
                  </div>
              )}

              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="flex flex-col gap-1">
                         <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Bairro</label>
                         <select className="border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold w-full" value={scanNeighborhood} onChange={e => setScanNeighborhood(e.target.value)}>
                            <option value="">Escolha...</option>
                            {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                         </select>
                      </div>
                      <div className="flex flex-col gap-1">
                         <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Categoria</label>
                         <select className="border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold w-full" value={scanCategory} onChange={e => setScanCategory(e.target.value)}>
                            <option value="">Escolha...</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                         </select>
                      </div>
                      <button 
                            onClick={handleStartScan} 
                            disabled={scanning}
                            className={`col-span-2 font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 bg-ocean-600 text-white hover:bg-ocean-700 active:scale-95 disabled:opacity-50`}
                        >
                            {scanning ? <Loader2 className="animate-spin" size={20}/> : <Search size={20}/>}
                            {scanning ? 'Sincronizando...' : 'Pesquisar Agora'}
                        </button>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {discovered.map((biz, idx) => (
                      <div key={idx} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-shadow animate-in fade-in">
                          <div className="h-44 bg-slate-100 relative">
                              <img src={biz.coverImage} className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800"} alt="cover" />
                              <button onClick={() => setDiscovered(p => p.filter(x => x.id !== biz.id))} className="absolute top-2 right-2 bg-white/20 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-md">
                                  <X size={14}/>
                              </button>
                          </div>
                          <div className="p-5 flex-1 flex flex-col">
                              <h4 className="font-bold text-ocean-950 text-lg mb-1">{biz.name}</h4>
                              <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><MapPin size={12}/> {biz.address}</p>
                              <p className="text-xs text-slate-600 mb-4 line-clamp-2">"{biz.description}"</p>
                              <div className="mt-auto flex gap-2">
                                  <a href={biz.sourceUrl} target="_blank" className="flex-1 bg-ocean-50 text-ocean-600 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-ocean-100">
                                      <Link size={12}/> VER FONTES
                                  </a>
                              </div>
                          </div>
                      </div>
                  ))}
                  {discovered.length === 0 && !scanning && (
                      <div className="col-span-2 py-32 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[3rem]">
                          <ImageIcon size={48} className="mx-auto mb-4 opacity-10" />
                          <p className="text-sm font-medium">Os locais validados aparecerão aqui.</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};
