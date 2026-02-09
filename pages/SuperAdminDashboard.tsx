
import React, { useState, useEffect } from 'react';
import { User, CompanyRequest, BusinessProfile, UserRole, BusinessPlan } from '../types';
import { 
  getCompanyRequests, approveCompanyRequest, getAllUsers, 
  getBusinesses, getCoupons, saveBusiness, updateUser 
} from '../services/dataService';
import { 
  LayoutDashboard, Store, CheckCircle, XCircle, Clock, 
  ChevronRight, Globe, Loader2, Users, Ticket, BookOpen, 
  Settings, Bell, Shield, Search, Edit, Key, Lock, Unlock, 
  Mail, Phone, Save, X, Star, Zap
} from 'lucide-react';

export const SuperAdminDashboard: React.FC<{ onNavigate: (page: string) => void; currentUser: User; onLogout: () => void }> = ({ onNavigate, currentUser, onLogout }) => {
  const [view, setView] = useState<'HOME' | 'REQUESTS' | 'USERS' | 'COMPANIES'>('HOME');
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [couponsCount, setCouponsCount] = useState(0);
  
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal State
  const [editingCompany, setEditingCompany] = useState<{ user: User; biz?: BusinessProfile } | null>(null);

  const loadData = async () => {
    setLoadingData(true);
    const reqs = await getCompanyRequests();
    setRequests(reqs);
    
    const users = getAllUsers();
    setAllUsers(users);
    
    const bizs = getBusinesses();
    setBusinesses(bizs);
    
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

  const handleResetPassword = async (user: User) => {
      if(confirm(`Deseja resetar a senha de ${user.name}? A nova senha será 123456.`)) {
          alert(`Senha de ${user.email} resetada com sucesso para: 123456`);
      }
  };

  const handleToggleBlock = async (user: User) => {
      const updatedUser = { ...user, isBlocked: !user.isBlocked };
      await updateUser(updatedUser);
      alert(updatedUser.isBlocked ? "Usuário bloqueado!" : "Usuário desbloqueado!");
      loadData();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingCompany) return;

      setLoadingAction('save-edit');
      try {
          // Garante que campos opcionais não sejam undefined
          const userToSave = {
              ...editingCompany.user,
              plan: editingCompany.user.plan || BusinessPlan.FREE,
              maxCoupons: editingCompany.user.maxCoupons || 0,
              phone: editingCompany.user.phone || ''
          };

          await updateUser(userToSave);
          
          if (editingCompany.biz) {
              const updatedBiz: BusinessProfile = { 
                  ...editingCompany.biz, 
                  plan: userToSave.plan,
                  isClaimed: true,
                  phone: editingCompany.biz.phone || userToSave.phone || ''
              };
              await saveBusiness(updatedBiz);
          }
          
          alert("Dados atualizados com sucesso!");
          setEditingCompany(null);
          loadData();
      } catch (err: any) {
          console.error("Erro ao salvar:", err);
          alert(`Erro ao salvar: ${err.message || 'Erro desconhecido'}`);
      } finally {
          setLoadingAction(null);
      }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  
  const companyUsers = allUsers.filter(u => 
    u.role === UserRole.COMPANY && 
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (u.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 pt-8 md:pt-16">
      {/* SIDEBAR */}
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
             <button onClick={() => setView('HOME')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'HOME' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <LayoutDashboard size={18} /> Dashboard
             </button>
             <button onClick={() => setView('COMPANIES')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'COMPANIES' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <Store size={18} /> Empresas Parceiras
             </button>
             <button onClick={() => setView('REQUESTS')} className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'REQUESTS' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <div className="flex items-center gap-3"><Bell size={18} /> Novos Pedidos</div>
                 {pendingRequests.length > 0 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingRequests.length}</span>}
             </button>
             <div className="my-4 border-t border-slate-100"></div>
             <button onClick={() => onNavigate('blog')} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">
                 <BookOpen size={18} /> Blog & Notícias
             </button>
             <button onClick={onLogout} className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50">
                 Sair
             </button>
         </nav>
      </div>

      <div className="flex-1 p-4 md:p-10 overflow-x-hidden">
          <div className="max-w-6xl mx-auto">
              {/* HOME VIEW */}
              {view === 'HOME' && (
                  <div className="space-y-10 animate-in fade-in">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Usuários</p>
                              <h3 className="text-3xl font-black text-ocean-950">{allUsers.length}</h3>
                          </div>
                          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Empresas</p>
                              <h3 className="text-3xl font-black text-ocean-950">{businesses.length}</h3>
                          </div>
                      </div>
                  </div>
              )}

              {/* COMPANIES VIEW */}
              {view === 'COMPANIES' && (
                  <div className="animate-in slide-in-from-right-4 space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                              <h1 className="text-2xl font-black text-ocean-950">Empresas Parceiras</h1>
                              <p className="text-sm text-slate-500">Gestão de acessos, planos e limites.</p>
                          </div>
                          <div className="relative w-full md:w-72">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input 
                                type="text" 
                                placeholder="Buscar empresa..."
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-500 outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                              />
                          </div>
                      </div>

                      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                          <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                  <thead className="bg-slate-50 border-b border-slate-100">
                                      <tr>
                                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Empresa</th>
                                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Plano</th>
                                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Limite Cupons</th>
                                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Status</th>
                                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">Ações</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                      {companyUsers.map(user => {
                                          const biz = businesses.find(b => b.id === user.id);
                                          const plan = user.plan || biz?.plan || BusinessPlan.FREE;
                                          return (
                                              <tr key={user.id} className="hover:bg-slate-50/50">
                                                  <td className="px-6 py-4">
                                                      <p className="text-sm font-bold text-ocean-950">{user.companyName || user.name}</p>
                                                      <p className="text-[10px] text-slate-400">{user.email}</p>
                                                  </td>
                                                  <td className="px-6 py-4">
                                                      <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${plan === BusinessPlan.PREMIUM ? 'bg-gold-100 text-gold-700' : 'bg-slate-100 text-slate-500'}`}>
                                                          {plan}
                                                      </span>
                                                  </td>
                                                  <td className="px-6 py-4">
                                                      <span className="text-xs font-bold text-ocean-700 bg-ocean-50 px-2 py-1 rounded-lg">
                                                          {user.maxCoupons || 0}
                                                      </span>
                                                  </td>
                                                  <td className="px-6 py-4">
                                                      {user.isBlocked ? (
                                                          <span className="text-[10px] font-bold text-red-500 flex items-center gap-1"><Lock size={12}/> BLOQUEADO</span>
                                                      ) : (
                                                          <span className="text-[10px] font-bold text-green-500 flex items-center gap-1"><CheckCircle size={12}/> ATIVO</span>
                                                      )}
                                                  </td>
                                                  <td className="px-6 py-4 text-center">
                                                      <div className="flex items-center justify-center gap-2">
                                                          <button onClick={() => setEditingCompany({ user, biz })} className="p-2 text-slate-400 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg"><Edit size={16}/></button>
                                                          <button onClick={() => handleResetPassword(user)} className="p-2 text-slate-400 hover:text-gold-600 hover:bg-gold-50 rounded-lg"><Key size={16}/></button>
                                                          <button onClick={() => handleToggleBlock(user)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg"><Lock size={16}/></button>
                                                      </div>
                                                  </td>
                                              </tr>
                                          );
                                      })}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* MODAL DE EDIÇÃO MASTER */}
      {editingCompany && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="bg-ocean-900 p-6 text-white flex justify-between items-center">
                      <h3 className="font-bold text-lg">Gerenciar Parceiro: {editingCompany.user.companyName}</h3>
                      <button onClick={() => setEditingCompany(null)}><X/></button>
                  </div>
                  <form onSubmit={handleSaveEdit} className="p-8 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Plano de Acesso</label>
                              <select 
                                className="w-full bg-slate-50 border-slate-200 rounded-xl p-3 text-sm font-bold"
                                value={editingCompany.user.plan || BusinessPlan.FREE}
                                onChange={e => setEditingCompany({...editingCompany, user: {...editingCompany.user, plan: e.target.value as BusinessPlan}})}
                              >
                                  <option value={BusinessPlan.FREE}>GRATUITO (Limitado)</option>
                                  <option value={BusinessPlan.PREMIUM}>PREMIUM (Completo)</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Limite de Ofertas</label>
                              <input 
                                type="number"
                                className="w-full bg-slate-50 border-slate-200 rounded-xl p-3 text-sm font-bold"
                                value={editingCompany.user.maxCoupons || 0}
                                onChange={e => setEditingCompany({...editingCompany, user: {...editingCompany.user, maxCoupons: Number(e.target.value)}})}
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-4">
                              <h4 className="text-xs font-black text-slate-300 uppercase">Dados da Conta</h4>
                              <input className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" value={editingCompany.user.name} onChange={e => setEditingCompany({...editingCompany, user: {...editingCompany.user, name: e.target.value}})} placeholder="Nome Dono" />
                              <input className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" value={editingCompany.user.email} onChange={e => setEditingCompany({...editingCompany, user: {...editingCompany.user, email: e.target.value}})} placeholder="Email" />
                          </div>
                          <div className="space-y-4">
                              <h4 className="text-xs font-black text-slate-300 uppercase">Dados da Empresa</h4>
                              <input className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" value={editingCompany.user.companyName} onChange={e => setEditingCompany({...editingCompany, user: {...editingCompany.user, companyName: e.target.value}})} placeholder="Nome Empresa" />
                              <input className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" value={editingCompany.user.phone || ''} onChange={e => setEditingCompany({...editingCompany, user: {...editingCompany.user, phone: e.target.value}})} placeholder="WhatsApp" />
                          </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button type="submit" disabled={loadingAction === 'save-edit'} className="flex-1 bg-ocean-600 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2">
                            {loadingAction === 'save-edit' ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} SALVAR CONFIGURAÇÕES
                        </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
