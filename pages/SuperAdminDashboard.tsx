
import React, { useState, useEffect } from 'react';
import { User, CompanyRequest, BusinessProfile, UserRole, BusinessPlan } from '../types';
import { 
  getCompanyRequests, approveCompanyRequest, getAllUsers, 
  getBusinesses, getCoupons, saveBusiness, updateUser, getAdminStats,
  resetUserPassword, deleteBusiness, deleteUser
} from '../services/dataService';
import { 
  LayoutDashboard, Store, CheckCircle, Clock, 
  ChevronRight, Loader2, Users, Ticket, 
  Settings, Bell, Shield, Search, Edit, Key, Trash2,
  PieChart as PieIcon, DollarSign, Mail, X, Save
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend } from 'recharts';

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

export const SuperAdminDashboard: React.FC<{ onNavigate: (page: string) => void; currentUser: User; onLogout: () => void }> = ({ onNavigate, currentUser, onLogout }) => {
  const [view, setView] = useState<'HOME' | 'REQUESTS' | 'USERS' | 'COMPANIES'>('HOME');
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modal de Edição de Usuário
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', email: '' });

  const loadData = async () => {
    setLoadingData(true);
    try {
        const reqs = await getCompanyRequests();
        setRequests(reqs || []);
        setAllUsers(getAllUsers() || []);
        setBusinesses(getBusinesses() || []);
        const s = await getAdminStats();
        setStats(s);
    } catch (e) {
        console.error("Erro ao carregar dados do admin:", e);
    } finally {
        setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('dataUpdated', handleUpdate);
    return () => window.removeEventListener('dataUpdated', handleUpdate);
  }, []);

  const handleOpenEdit = (user: User) => {
      setEditingUser(user);
      setEditFormData({ name: user.name, email: user.email });
  };

  const handleSaveUserEdit = async () => {
      if (!editingUser) return;
      setActionLoading('saving_user');
      try {
          const updated = { ...editingUser, name: editFormData.name, email: editFormData.email };
          await updateUser(updated);
          await loadData();
          setEditingUser(null);
      } catch (e) {
          alert("Erro ao atualizar dados do usuário.");
      } finally {
          setActionLoading(null);
      }
  };

  const handleResetPassword = async (user: User) => {
    if (!user?.email) {
        alert("Este usuário não possui um e-mail cadastrado.");
        return;
    }
    if (!window.confirm(`Deseja enviar um e-mail de redefinição de senha para ${user.name || 'Usuário'} (${user.email})?`)) return;
    
    setActionLoading(user.id);
    try {
        await resetUserPassword(user.email);
        alert(`E-mail de redefinição enviado com sucesso para ${user.email}`);
    } catch (e: any) {
        alert(e.message || "Erro ao solicitar redefinição de senha. Verifique se o e-mail existe no Firebase Auth.");
    } finally {
        setActionLoading(null);
    }
  };

  const handleDeleteBiz = async (id: string, name: string) => {
      if (!window.confirm(`TEM CERTEZA que deseja EXCLUIR permanentemente a empresa "${name}"? Esta ação não pode ser desfeita.`)) return;
      setActionLoading(id);
      try {
          await deleteBusiness(id);
          await loadData();
      } catch (e) {
          alert("Erro ao deletar empresa.");
      } finally {
          setActionLoading(null);
      }
  };

  const handleDeleteUser = async (id: string, name: string) => {
      if (id === currentUser.id) return alert("Você não pode excluir a si mesmo.");
      if (!window.confirm(`TEM CERTEZA que deseja EXCLUIR o usuário "${name}"?`)) return;
      setActionLoading(id);
      try {
          await deleteUser(id);
          await loadData();
      } catch (e) {
          alert("Erro ao deletar usuário.");
      } finally {
          setActionLoading(null);
      }
  };

  const safeSearch = (searchTerm || '').toLowerCase();

  const filteredUsers = (allUsers || []).filter(u => {
    const name = (u?.name || '').toLowerCase();
    const email = (u?.email || '').toLowerCase();
    return name.includes(safeSearch) || email.includes(safeSearch);
  });

  const filteredBusinesses = (businesses || []).filter(b => {
    const name = (b?.name || '').toLowerCase();
    return name.includes(safeSearch);
  });

  if (loadingData && !stats) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-ocean-600" size={48} /></div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 pt-8 md:pt-16">
      {/* SIDEBAR */}
      <div className="w-full md:w-72 bg-white border-r border-slate-200 p-6 flex flex-col z-40">
         <div className="mb-8 flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                 <Shield size={20} />
             </div>
             <div>
                 <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Control</h2>
                 <p className="text-ocean-950 font-black text-sm">Painel Central</p>
             </div>
         </div>
         <nav className="flex flex-col gap-1">
             <button onClick={() => setView('HOME')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'HOME' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <LayoutDashboard size={18} /> Panorâmica
             </button>
             <button onClick={() => setView('COMPANIES')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'COMPANIES' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <Store size={18} /> Empresas
             </button>
             <button onClick={() => setView('USERS')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'USERS' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <Users size={18} /> Usuários
             </button>
             <button onClick={() => setView('REQUESTS')} className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'REQUESTS' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <div className="flex items-center gap-3"><Bell size={18} /> Solicitações</div>
                 {requests.filter(r => r.status === 'PENDING').length > 0 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">{requests.filter(r => r.status === 'PENDING').length}</span>}
             </button>
             <div className="my-4 border-t border-slate-100"></div>
             <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
                 Sair
             </button>
         </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-4 md:p-10 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
              {/* SEARCH BAR */}
              {(view === 'USERS' || view === 'COMPANIES') && (
                  <div className="mb-8 relative max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        className="w-full bg-white border border-slate-200 pl-12 pr-4 py-4 rounded-2xl shadow-sm outline-none font-bold text-sm"
                        placeholder="Pesquisar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
              )}

              {view === 'HOME' && (
                  <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Cidadãos</p>
                              <h3 className="text-4xl font-black text-ocean-950">{stats?.totalUsers || 0}</h3>
                          </div>
                          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Economia</p>
                              <h3 className="text-4xl font-black text-ocean-950">R$ {stats?.totalEconomy?.toFixed(0) || 0}</h3>
                          </div>
                          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Lojistas</p>
                              <h3 className="text-4xl font-black text-ocean-950">{stats?.totalBusinesses || 0}</h3>
                          </div>
                          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Cupons</p>
                              <h3 className="text-4xl font-black text-ocean-950">{stats?.totalCoupons || 0}</h3>
                          </div>
                      </div>

                      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm h-80">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie data={stats?.chartData || []} innerRadius={80} outerRadius={100} paddingAngle={8} dataKey="value">
                                    {(stats?.chartData || []).map((_: any, index: number) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <ReTooltip />
                                  <Legend />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              )}

              {view === 'USERS' && (
                  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                      <table className="w-full text-left">
                          <thead className="bg-slate-50">
                              <tr>
                                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase">Usuário</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase">Cargo</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Ações</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {filteredUsers.map(u => (
                                  <tr key={u.id} className="hover:bg-slate-50/50">
                                      <td className="px-6 py-5">
                                          <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-full bg-ocean-50 text-ocean-600 flex items-center justify-center font-black text-sm">
                                                  {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full rounded-full object-cover" /> : (u.name?.[0] || '?')}
                                              </div>
                                              <div>
                                                <p className="font-bold text-ocean-950 text-sm">{u.name || 'Sem nome'}</p>
                                                <p className="text-[10px] text-slate-400">{u.email || 'Sem e-mail'}</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-5">
                                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase ${u.role === UserRole.SUPER_ADMIN ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {u.role}
                                          </span>
                                      </td>
                                      <td className="px-6 py-5">
                                          <div className="flex justify-center items-center gap-2">
                                              <button 
                                                onClick={() => handleOpenEdit(u)}
                                                className="p-3 bg-white text-slate-400 rounded-xl hover:bg-ocean-600 hover:text-white transition-all shadow-sm border border-slate-100"
                                                title="Editar Informações"
                                              >
                                                  <Edit size={18} />
                                              </button>
                                              <button 
                                                onClick={() => handleResetPassword(u)}
                                                disabled={actionLoading === u.id}
                                                className="p-3 bg-white text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-sm border border-orange-100 active:scale-95"
                                                title="Resetar Senha"
                                              >
                                                  {actionLoading === u.id ? <Loader2 className="animate-spin" size={18}/> : <Key size={18} />}
                                              </button>
                                              <button 
                                                onClick={() => handleDeleteUser(u.id, u.name)}
                                                disabled={actionLoading === u.id}
                                                className="p-3 bg-white text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-slate-100"
                                                title="Excluir Usuário"
                                              >
                                                  {actionLoading === u.id ? <Loader2 className="animate-spin" size={18}/> : <Trash2 size={18} />}
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}

              {view === 'COMPANIES' && (
                  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                      <table className="w-full text-left">
                          <thead className="bg-slate-50">
                              <tr>
                                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase">Empresa</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase">Setor</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Ações</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {filteredBusinesses.map(b => {
                                  const companyUser = allUsers.find(u => u.id === b.id);
                                  return (
                                    <tr key={b.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <img src={b.coverImage || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-2xl object-cover" />
                                                <div>
                                                    <p className="font-black text-ocean-950 text-sm">{b.name || 'Sem nome'}</p>
                                                    <p className="text-[10px] text-slate-400">{companyUser?.email || 'Sem e-mail cadastrado'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-bold text-ocean-600">{b.category}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex justify-center items-center gap-2">
                                                {companyUser && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleOpenEdit(companyUser)}
                                                            className="p-3 bg-white text-slate-400 rounded-xl hover:bg-ocean-600 hover:text-white transition-all shadow-sm border border-slate-100"
                                                            title="Editar Informações do Responsável"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleResetPassword(companyUser)}
                                                            disabled={actionLoading === companyUser.id}
                                                            className="p-3 bg-white text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-sm border border-orange-100 active:scale-95"
                                                            title="Redefinir Senha do Responsável"
                                                        >
                                                            {actionLoading === companyUser.id ? <Loader2 className="animate-spin" size={18}/> : <Key size={18} />}
                                                        </button>
                                                    </>
                                                )}
                                                <button 
                                                    onClick={() => handleDeleteBiz(b.id, b.name)}
                                                    disabled={actionLoading === b.id}
                                                    className="p-3 bg-white text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-slate-100"
                                                    title="Excluir Empresa"
                                                >
                                                    {actionLoading === b.id ? <Loader2 className="animate-spin" size={18}/> : <Trash2 size={18} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              )}

              {view === 'REQUESTS' && (
                  <div className="grid grid-cols-1 gap-4">
                      {requests.map(req => (
                          <div key={req.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                              <div className="flex items-center gap-6">
                                  <div className="w-16 h-16 bg-ocean-50 text-ocean-600 rounded-3xl flex items-center justify-center font-black text-xl">
                                      {(req.companyName?.[0] || '?')}
                                  </div>
                                  <div>
                                      <h3 className="text-xl font-black text-ocean-950">{req.companyName}</h3>
                                      <p className="text-xs text-slate-400 font-bold uppercase">{req.category}</p>
                                  </div>
                              </div>
                              <div className="flex gap-2 w-full md:w-auto">
                                  {req.status === 'PENDING' && (
                                      <button 
                                        onClick={async () => { setActionLoading(req.id); await approveCompanyRequest(req.id); await loadData(); setActionLoading(null); }}
                                        className="bg-ocean-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2"
                                      >
                                          {actionLoading === req.id ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16} />} Aprovar
                                      </button>
                                  )}
                              </div>
                          </div>
                      ))}
                      {requests.length === 0 && <p className="text-center py-20 text-slate-400 uppercase font-black text-xs">Nenhuma solicitação</p>}
                  </div>
              )}
          </div>
      </div>

      {/* MODAL DE EDIÇÃO DE USUÁRIO */}
      {editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <h3 className="text-xl font-black text-ocean-950">Editar Usuário</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {editingUser.id}</p>
                      </div>
                      <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                          <X size={24} className="text-slate-400" />
                      </button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Nome Completo</label>
                          <input 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-sm focus:ring-4 focus:ring-ocean-500/10 outline-none transition-all"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Endereço de E-mail</label>
                          <input 
                            type="email"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-sm focus:ring-4 focus:ring-ocean-500/10 outline-none transition-all"
                            value={editFormData.email}
                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                          />
                          <p className="text-[10px] text-orange-500 font-bold mt-2 ml-1">
                              * Atenção: Alterar o e-mail aqui apenas atualiza o banco de dados. Para enviar o link de reset, este e-mail deve ser válido.
                          </p>
                      </div>
                  </div>

                  <div className="p-8 bg-slate-50 flex gap-3">
                      <button 
                        onClick={() => setEditingUser(null)}
                        className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-500 font-black rounded-2xl text-xs hover:bg-slate-100 transition-all"
                      >
                          CANCELAR
                      </button>
                      <button 
                        onClick={handleSaveUserEdit}
                        disabled={actionLoading === 'saving_user'}
                        className="flex-1 px-6 py-4 bg-ocean-600 text-white font-black rounded-2xl text-xs shadow-lg shadow-ocean-600/20 flex items-center justify-center gap-2 hover:bg-ocean-700 transition-all"
                      >
                          {actionLoading === 'saving_user' ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />} SALVAR
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
