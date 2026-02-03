
import React, { useState, useEffect } from 'react';
import { User, AppCategory, AppLocation } from '../types';
import { getCategories, getLocations, saveImportedBusinesses, getAIsessionCache } from '../services/dataService';
import { discoverBusinessesFromAI } from '../services/geminiService';
import { Search, Store, Sparkles, Loader2, Globe, CheckCircle2, MapPin, X, Link, Timer, Image as ImageIcon, RefreshCcw, AlertCircle } from 'lucide-react';

interface SuperAdminDashboardProps {
  onNavigate: (page: string) => void;
  currentUser: User;
  onLogout: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate, currentUser, onLogout }) => {
  // Garantia de dados instantâneos
  const [categories, setCategories] = useState<AppCategory[]>(getCategories());
  const [locations, setLocations] = useState<AppLocation[]>(getLocations());
  
  const [scanning, setScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [discovered, setDiscovered] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [scanNeighborhood, setScanNeighborhood] = useState('');
  const [scanCategory, setScanCategory] = useState('');
  
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const refresh = () => {
        setCategories(getCategories());
        setLocations(getLocations());
    };
    refresh();
    window.addEventListener('dataUpdated', refresh);
    return () => window.removeEventListener('dataUpdated', refresh);
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleStartScan = async () => {
      if (scanning) return;
      if(!scanNeighborhood || !scanCategory) return alert("Selecione bairro e categoria.");
      
      // Tenta recuperar do cache local primeiro para não travar
      const cached = getAIsessionCache(scanNeighborhood, scanCategory);
      if (cached) {
          setDiscovered(cached.businesses);
          setSources(cached.sources);
          return;
      }

      if (cooldown > 0) return;

      setScanning(true);
      setDiscovered([]);
      setSources([]);
      
      try {
          const result = await discoverBusinessesFromAI(scanNeighborhood, scanCategory, 5);
          setDiscovered(result.businesses);
          setSources(result.sources || []);
      } catch (e: any) {
          if (e.message?.includes("429")) {
              setCooldown(45); 
          } else {
              alert("Erro de conexão. Tente novamente.");
          }
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
          alert("Importação concluída com sucesso!");
      } catch (e) {
          alert("Erro ao salvar no banco.");
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
                    <p className="text-sm text-slate-500">Localizando empresas reais com fotos e redes sociais.</p>
                  </div>
                  {discovered.length > 0 && (
                      <button onClick={handleImportDiscovery} disabled={isImporting} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 hover:bg-green-700 disabled:opacity-50">
                        {isImporting ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>}
                        IMPORTAR AGORA
                      </button>
                  )}
              </div>

              {cooldown > 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex items-center gap-4 text-amber-800 animate-in slide-in-from-top-4">
                      <Timer className="animate-pulse" />
                      <div className="flex-1">
                          <p className="font-bold text-sm">GOOGLE OCUPADO (AGUARDANDO {cooldown}s)</p>
                          <p className="text-xs">A conta gratuita tem limites de tempo. Enquanto esperamos, tente pesquisar outro bairro ou categoria que já foi pesquisada hoje.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-white/50 px-3 py-1 rounded text-xs font-bold border border-amber-200">
                             Limites do Free Tier
                        </div>
                      </div>
                  </div>
              )}

              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="flex flex-col gap-1">
                         <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Bairro</label>
                         <select className="border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold w-full" value={scanNeighborhood} onChange={e => setScanNeighborhood(e.target.value)}>
                            <option value="">Escolha um bairro...</option>
                            {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                         </select>
                      </div>
                      <div className="flex flex-col gap-1">
                         <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Categoria</label>
                         <select className="border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold w-full" value={scanCategory} onChange={e => setScanCategory(e.target.value)}>
                            <option value="">Escolha uma categoria...</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                         </select>
                      </div>
                      <button 
                            onClick={handleStartScan} 
                            disabled={scanning}
                            className={`col-span-2 font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${cooldown > 0 && !getAIsessionCache(scanNeighborhood, scanCategory) ? 'bg-slate-200 text-slate-400' : 'bg-ocean-600 text-white hover:bg-ocean-700 active:scale-95'}`}
                        >
                            {scanning ? <Loader2 className="animate-spin" size={20}/> : <Search size={20}/>}
                            {scanning ? 'Verificando com o Google...' : cooldown > 0 && !getAIsessionCache(scanNeighborhood, scanCategory) ? `Aguarde ${cooldown}s` : 'Pesquisar Lugares Reais'}
                        </button>
                  </div>
              </div>

              {sources.length > 0 && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 mb-6 animate-in fade-in">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Fontes Verificadas (Google):</h5>
                      <div className="flex flex-wrap gap-2">
                          {sources.map((chunk, i) => chunk.web && (
                              <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-100 text-ocean-600 px-2 py-1 rounded hover:bg-ocean-50 truncate max-w-[200px] border border-slate-200">
                                  {chunk.web.title || chunk.web.uri}
                              </a>
                          ))}
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {discovered.map((biz, idx) => (
                      <div key={idx} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-shadow animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 100}ms` }}>
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
                                  {biz.sourceUrl && (
                                      <a href={biz.sourceUrl} target="_blank" className="flex-1 bg-ocean-50 text-ocean-600 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-ocean-100">
                                          <Link size={12}/> VER FONTE
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
                          <p className="text-[10px] uppercase mt-2">Escolha bairro e categoria para começar de graça.</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};
