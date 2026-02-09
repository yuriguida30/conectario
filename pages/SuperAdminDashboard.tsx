
import React, { useState, useEffect } from 'react';
import { User, CompanyRequest, BusinessProfile, UserRole, BusinessPlan } from '../types';
import { 
  getCompanyRequests, approveCompanyRequest, getAllUsers, 
  getBusinesses, getCoupons, saveBusiness, updateUser, getAdminStats,
  resetUserPassword
} from '../services/dataService';
import { 
  LayoutDashboard, Store, CheckCircle, Clock, 
  ChevronRight, Loader2, Users, Ticket, 
  Settings, Bell, Shield, Search, Edit, Key, Lock,
  Save, X, PieChart as PieIcon, TrendingUp, DollarSign, Mail
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

  const loadData = async () => {
    setLoadingData(true);
    const reqs = await getCompanyRequests();
    setRequests(reqs);
    setAllUsers(getAllUsers());
    setBusinesses(getBusinesses());
    const s = await getAdminStats();
    setStats(s);
    setLoadingData(false);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('dataUpdated', handleUpdate);
    return () => window.removeEventListener('dataUpdated', handleUpdate);
  }, []);

  const handleResetPassword = async (user: User) => {
    if (!window.confirm(`Deseja enviar um e-mail de redefinição de senha para ${user.name} (${user.email})?`)) return;
    
    setActionLoading(user.id);
    try {
        await resetUserPassword(user.email);
        alert(`E-mail de redefinição enviado com sucesso para ${user.email}`);
    } catch (e: any) {
        alert(e.message || "Erro ao solicitar redefinição de senha.");
    } finally {
        setActionLoading(null);
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingData && !stats) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-ocean-600" size={48} /></div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 pt-8 md:pt-16">
      {/* SIDEBAR MASTER */}
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
             <button onClick={() => setView('HOME')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'HOME' ? 'bg-ocean-600 text-white shadow-lg shadow-ocean-600/20' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <LayoutDashboard size={18} /> Panorâmica
             </button>
             <button onClick={() => setView('COMPANIES')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'COMPANIES' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <Store size={18} /> Empresas Parceiras
             </button>
             <button onClick={() => setView('USERS')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'USERS' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <Users size={18} /> Todos os Usuários
             </button>
             <button onClick={() => setView('REQUESTS')} className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'REQUESTS' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <div className="flex items-center gap-3"><Bell size={18} /> Solicitações</div>
                 {requests.filter(r => r.status === 'PENDING').length > 0 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">{requests.filter(r => r.status === 'PENDING').length}</span>}
             </button>
             <div className="my-4 border-t border-slate-100"></div>
             <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
                 Encerrar Sessão
             </button>
         </nav>
      </div>

      <div className="flex-1 p-4 md:p-10">
          <div className="max-w-6xl mx-auto">
              
              {/* TOP BAR SEARCH */}
              {(view === 'USERS' || view === 'COMPANIES') && (
                  <div className="mb-8 relative max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        className="w-full bg-white border border-slate-200 pl-12 pr-4 py-4 rounded-2xl shadow-sm focus:ring-4 focus:ring-ocean-500/10 outline-none font-bold text-sm"
                        placeholder="Pesquisar por nome ou e-mail..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
              )}

              {view === 'HOME' && (
                  <div className="space-y-10 animate-in fade-in">
                      {/* KPIs PLATAFORMA */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-4"><Users size={24}/></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cidadãos Ativos</p>
                              <h3 className="text-4xl font-black text-ocean-950">{stats?.totalUsers || 0}</h3>
                          </div>
                          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                              <div className="p-3 bg-green-50 text-green-600 rounded-2xl w-fit mb-4"><DollarSign size={24}/></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Economia Gerada</p>
                              <h3 className="text-4xl font-black text-ocean-950">R$ {stats?.totalEconomy?.toFixed(0) || 0}</h3>
                          </div>
                          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit mb-4"><Store size={24}/></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lojistas Ativos</p>
                              <h3 className="text-4xl font-black text-ocean-950">{stats?.totalBusinesses || 0}</h3>
                          </div>
                          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                              <div className="p-3 bg-gold-50 text-gold-600 rounded-2xl w-fit mb-4"><Ticket size={24}/></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cupons Ativos</p>
                              <h3 className="text-4xl font-black text-ocean-950">{stats?.totalCoupons || 0}</h3>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                          {/* GRÁFICO CATEGORIAS */}
                          <div className="lg:col-span-7 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                              <h3 className="text-lg font-black text-ocean-950 mb-8 flex items-center gap-3">
                                  <PieIcon className="text-ocean-600" size={20} /> Segmentação de Parceiros
                              </h3>
                              <div className="h-72 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                          <Pie
                                            data={stats?.chartData}
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={8}
                                            dataKey="value"
                                          >
                                            {stats?.chartData?.map((_: any, index: number) => (
                                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                          </Pie>
                                          <ReTooltip 
                                            contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                          />
                                          <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                                      </PieChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>

                          {/* ULTIMOS PEDIDOS */}
                          <div className="lg:col-span-5 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                              <h3 className="text-lg font-black text-ocean-950 mb-6 flex items-center gap-2">
                                <Bell size={20} className="text-orange-500" /> Aprovação Pendente
                              </h3>
                              <div className="space-y-4">
                                  {requests.filter(r => r.status === 'PENDING').slice(0, 4).map(req => (
                                      <div key={req.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                          <div>
                                              <p className="font-black text-ocean-950 text-sm">{req.companyName}</p>
                                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{req.category}</p>
                                          </div>
                                          <button onClick={() => setView('REQUESTS')} className="bg-white p-2 rounded-xl text-ocean-600 shadow-sm border border-slate-100">
                                            <ChevronRight size={18} />
                                          </button>
                                      </div>
                                  ))}
                                  {requests.filter(r => r.status === 'PENDING').length === 0 && (
                                    <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                                        <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
                                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Tudo em dia!</p>
                                    </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {view === 'USERS' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4">
                      <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-black text-ocean-950">Gestão de Usuários</h1>
                        <span className="text-xs font-bold text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">{filteredUsers.length} total</span>
                      </div>
                      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                          <table className="w-full text-left">
                              <thead className="bg-slate-50 border-b border-slate-100">
                                  <tr>
                                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail / Perfil</th>
                                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo</th>
                                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações de Segurança</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                  {filteredUsers.map(u => (
                                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="px-6 py-5">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-10 h-10 rounded-full bg-ocean-50 text-ocean-600 flex items-center justify-center font-black text-sm border border-ocean-100">
                                                      {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full rounded-full object-cover" /> : u.name[0]}
                                                  </div>
                                                  <span className="font-bold text-ocean-950 text-sm">{u.name}</span>
                                              </div>
                                          </td>
                                          <td className="px-6 py-5">
                                              <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-600">{u.email}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">UID: {u.id.substring(0,8)}...</span>
                                              </div>
                                          </td>
                                          <td className="px-6 py-5">
                                              <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase ${
                                                u.role === UserRole.SUPER_ADMIN ? 'bg-red-50 text-red-600' :
                                                u.role === UserRole.COMPANY ? 'bg-ocean-50 text-ocean-600' : 'bg-slate-100 text-slate-500'
                                              }`}>
                                                {u.role}
                                              </span>
                                          </td>
                                          <td className="px-6 py-5">
                                              <div className="flex justify-center items-center gap-2">
                                                  <button 
                                                    onClick={() => handleResetPassword(u)}
                                                    disabled={actionLoading === u.id}
                                                    title="Resetar Senha"
                                                    className="p-3 bg-white text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-sm border border-orange-100 group active:scale-95"
                                                  >
                                                      {actionLoading === u.id ? <Loader2 className="animate-spin" size={18}/> : <Key size={18} />}
                                                  </button>
                                                  <button 
                                                    className="p-3 bg-white text-slate-400 rounded-xl hover:bg-ocean-600 hover:text-white transition-all shadow-sm border border-slate-100"
                                                    title="Editar Perfil"
                                                  >
                                                      <Edit size={18} />
                                                  </button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}

              {view === 'COMPANIES' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4">
                      <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-black text-ocean-950">Gestão de Parceiros</h1>
                        <span className="text-xs font-bold text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">{filteredBusinesses.length} total</span>
                      </div>
                      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                          <table className="w-full text-left">
                              <thead className="bg-slate-50 border-b border-slate-100">
                                  <tr>
                                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
                                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Setor / Local</th>
                                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plano</th>
                                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                  {businesses.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).map(b => {
                                      const companyUser = allUsers.find(u => u.id === b.id);
                                      return (
                                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                                                        <img src={b.coverImage} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-ocean-950 text-sm">{b.name}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold">{companyUser?.email || 'Sem e-mail'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-ocean-600">{b.category}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{b.locationId || 'Rio'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase border ${
                                                    b.plan === BusinessPlan.PREMIUM ? 'bg-gold-50 text-gold-600 border-gold-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                                }`}>
                                                    {b.plan || 'FREE'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center items-center gap-2">
                                                    <button 
                                                        onClick={() => companyUser && handleResetPassword(companyUser)}
                                                        disabled={!companyUser || actionLoading === companyUser?.id}
                                                        className="p-3 bg-white text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-sm border border-orange-100 active:scale-95"
                                                        title="Redefinir Senha do Responsável"
                                                    >
                                                        {actionLoading === companyUser?.id ? <Loader2 className="animate-spin" size={18}/> : <Key size={18} />}
                                                    </button>
                                                    <button 
                                                        className="p-3 bg-white text-slate-400 rounded-xl hover:bg-ocean-600 hover:text-white transition-all shadow-sm border border-slate-100"
                                                        title="Ver Detalhes"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}

              {view === 'REQUESTS' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4">
                      <h1 className="text-2xl font-black text-ocean-950">Solicitações de Entrada</h1>
                      <div className="grid grid-cols-1 gap-4">
                          {requests.map(req => (
                              <div key={req.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
                                  <div className="flex items-center gap-6">
                                      <div className="w-16 h-16 bg-ocean-50 text-ocean-600 rounded-3xl flex items-center justify-center font-black text-xl border border-ocean-100 shadow-inner">
                                          {req.companyName[0]}
                                      </div>
                                      <div>
                                          <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-xl font-black text-ocean-950">{req.companyName}</h3>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                                                req.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                                            }`}>{req.status}</span>
                                          </div>
                                          <div className="flex flex-wrap gap-x-6 gap-y-1">
                                              <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5"><Mail size={12}/> {req.email}</p>
                                              <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-widest"><Store size={12}/> {req.category}</p>
                                              <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5"><Clock size={12}/> {new Date(req.requestDate).toLocaleDateString()}</p>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex gap-2 w-full md:w-auto">
                                      {req.status === 'PENDING' && (
                                          <button 
                                            onClick={async () => { setActionLoading(req.id); await approveCompanyRequest(req.id); await loadData(); setActionLoading(null); }}
                                            className="flex-1 md:flex-none bg-ocean-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-lg shadow-ocean-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                          >
                                              {actionLoading === req.id ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16} />} APROVAR
                                          </button>
                                      )}
                                      <button className="flex-1 md:flex-none bg-slate-100 text-slate-500 px-8 py-4 rounded-2xl font-black text-xs hover:bg-slate-200 transition-colors">
                                          DETALHES
                                      </button>
                                  </div>
                              </div>
                          ))}
                          {requests.length === 0 && <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 text-slate-400 uppercase font-black tracking-widest text-xs">Nenhuma solicitação no momento</div>}
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
