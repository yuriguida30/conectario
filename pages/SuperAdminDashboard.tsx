
import React, { useState, useEffect } from 'react';
import { User, CompanyRequest } from '../types';
import { getCompanyRequests, approveCompanyRequest, getAllUsers, getBusinesses, getCoupons } from '../services/dataService';
import { LayoutDashboard, Store, CheckCircle, XCircle, Clock, ChevronRight, Globe, Loader2, Users, Ticket, BookOpen, Settings, Bell, Shield } from 'lucide-react';

export const SuperAdminDashboard: React.FC<{ onNavigate: (page: string) => void; currentUser: User; onLogout: () => void }> = ({ onNavigate, currentUser, onLogout }) => {
  const [view, setView] = useState<'HOME' | 'REQUESTS' | 'USERS' | 'COMPANIES'>('HOME');
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [bizCount, setBizCount] = useState(0);
  const [couponsCount, setCouponsCount] = useState(0);
  
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const loadData = async () => {
    setLoadingData(true);
    const reqs = await getCompanyRequests();
    setRequests(reqs);
    setUsersCount(getAllUsers().length);
    setBizCount(getBusinesses().length);
    const cups = await getCoupons();
    setCouponsCount(cups.length);
    setLoadingData(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('dataUpdated', loadData);
    return () => window.removeEventListener('dataUpdated', loadData);
  }, []);

  const handleApprove = async (id: string) => {
      if(confirm('Aprovar esta empresa? Um perfil e acesso serão criados agora.')) {
          setLoadingAction(id);
          await approveCompanyRequest(id);
          setLoadingAction(null);
          alert("Empresa aprovada com sucesso!");
      }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 pt-8 md:pt-16">
      {/* SIDEBAR REESTRUTURADA */}
      <div className="w-full md:w-72 bg-white border-r border-slate-200 p-6 flex flex-col z-40">
         <div className="mb-8 flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                 <Shield size={20} />
             </div>
             <div>
                 <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Master Admin</h2>
                 <p className="text-ocean-950 font-bold text-sm">Painel Central</p>
             </div>
         </div>
         
         <nav className="flex flex-col gap-1">
             <button onClick={() => setView('HOME')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'HOME' ? 'bg-ocean-600 text-white shadow-lg shadow-ocean-600/20' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <LayoutDashboard size={18} /> Início
             </button>
             <button onClick={() => setView('REQUESTS')} className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'REQUESTS' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <div className="flex items-center gap-3"><Store size={18} /> Solicitações</div>
                 {pendingRequests.length > 0 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingRequests.length}</span>}
             </button>
             <button onClick={() => onNavigate('blog')} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">
                 <BookOpen size={18} /> Blog & Notícias
             </button>
             <button onClick={() => onNavigate('home')} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">
                 <Globe size={18} /> Ver Site Público
             </button>
             <button onClick={onLogout} className="mt-8 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
                 Sair do Sistema
             </button>
         </nav>
      </div>

      <div className="flex-1 p-4 md:p-10">
          <div className="max-w-6xl mx-auto">
              
              {/* VIEW INICIAL: CENTRO DE CONTROLE */}
              {view === 'HOME' && (
                  <div className="space-y-10 animate-in fade-in">
                      <div>
                          <h1 className="text-3xl font-black text-ocean-950 mb-2">Bom dia, Master</h1>
                          <p className="text-slate-500 font-medium">Veja o que está acontecendo no Conecta Rio hoje.</p>
                      </div>

                      {/* STATS */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Users size={20}/></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuários</p>
                              <h3 className="text-3xl font-black text-ocean-950">{usersCount}</h3>
                          </div>
                          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4"><Store size={20}/></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Parceiros</p>
                              <h3 className="text-3xl font-black text-ocean-950">{bizCount}</h3>
                          </div>
                          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4"><Ticket size={20}/></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cupons</p>
                              <h3 className="text-3xl font-black text-ocean-950">{couponsCount}</h3>
                          </div>
                          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4"><Bell size={20}/></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendentes</p>
                              <h3 className="text-3xl font-black text-ocean-950">{pendingRequests.length}</h3>
                          </div>
                      </div>

                      {/* QUICK ACTIONS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <button 
                            onClick={() => setView('REQUESTS')}
                            className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex items-center gap-6 group hover:border-orange-200 hover:shadow-xl transition-all text-left"
                          >
                              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                  <Bell size={36} />
                              </div>
                              <div>
                                  <h3 className="text-xl font-bold text-ocean-950">Aprovar Empresas</h3>
                                  <p className="text-sm text-slate-500 mt-1">Você tem {pendingRequests.length} novos pedidos aguardando.</p>
                              </div>
                              <ChevronRight className="ml-auto text-slate-300 group-hover:text-orange-500" />
                          </button>

                          <button 
                            onClick={() => onNavigate('blog')}
                            className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex items-center gap-6 group hover:border-ocean-200 hover:shadow-xl transition-all text-left"
                          >
                              <div className="w-20 h-20 bg-ocean-100 text-ocean-600 rounded-3xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                  <BookOpen size={36} />
                              </div>
                              <div>
                                  <h3 className="text-xl font-bold text-ocean-950">Postar no Blog</h3>
                                  <p className="text-sm text-slate-500 mt-1">Crie roteiros e dicas para os usuários.</p>
                              </div>
                              <ChevronRight className="ml-auto text-slate-300 group-hover:text-ocean-500" />
                          </button>
                      </div>
                  </div>
              )}

              {/* VIEW DE SOLICITAÇÕES */}
              {view === 'REQUESTS' && (
                  <div className="animate-in fade-in slide-in-from-right-4">
                      <div className="flex items-center gap-4 mb-8">
                          <button onClick={() => setView('HOME')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-ocean-600 transition-colors">
                              <LayoutDashboard size={20} />
                          </button>
                          <div>
                              <h1 className="text-2xl font-bold text-ocean-950">Solicitações de Parceria</h1>
                              <p className="text-sm text-slate-500">Analise e aprove novos negócios na plataforma.</p>
                          </div>
                      </div>

                      <div className="space-y-4">
                          {requests.map(req => (
                              <div key={req.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                                  <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                          <h3 className="font-bold text-ocean-950 text-lg">{req.companyName}</h3>
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${req.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                              {req.status === 'PENDING' ? 'PENDENTE' : 'APROVADO'}
                                          </span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500">
                                          <p><strong>Dono:</strong> {req.ownerName}</p>
                                          <p><strong>Ramo:</strong> {req.category}</p>
                                          <p><strong>WhatsApp:</strong> {req.phone}</p>
                                          <p><strong>Email:</strong> {req.email}</p>
                                      </div>
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                      {req.status === 'PENDING' ? (
                                          <button 
                                              onClick={() => handleApprove(req.id)} 
                                              disabled={loadingAction === req.id}
                                              className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
                                          >
                                              {loadingAction === req.id ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} Aprovar
                                          </button>
                                      ) : (
                                          <div className="bg-green-50 text-green-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                                              <CheckCircle size={16}/> Ativo
                                          </div>
                                      )}
                                  </div>
                              </div>
                          ))}
                          {requests.length === 0 && <p className="text-center py-20 text-slate-400 italic">Nenhuma solicitação no momento.</p>}
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
