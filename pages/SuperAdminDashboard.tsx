
import React, { useState, useEffect } from 'react';
import { User, CompanyRequest, BusinessProfile, UserRole, BusinessPlan } from '../types';
import { 
  getCompanyRequests, approveCompanyRequest, getAllUsers, 
  getBusinesses, getCoupons, saveBusiness, updateUser, getAdminStats 
} from '../services/dataService';
import { 
  LayoutDashboard, Store, CheckCircle, Clock, 
  ChevronRight, Loader2, Users, Ticket, 
  Settings, Bell, Shield, Search, Edit, Key, Lock,
  Save, X, PieChart as PieIcon, TrendingUp, DollarSign
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
    window.addEventListener('dataUpdated', loadData);
    return () => window.removeEventListener('dataUpdated', loadData);
  }, []);

  if (loadingData && !stats) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-ocean-600" /></div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 pt-8 md:pt-16">
      {/* SIDEBAR MASTER */}
      <div className="w-full md:w-72 bg-white border-r border-slate-200 p-6 flex flex-col z-40">
         <div className="mb-8 flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                 <Shield size={20} />
             </div>
             <div>
                 <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Master Control</h2>
                 <p className="text-ocean-950 font-bold text-sm">Painel Central</p>
             </div>
         </div>
         <nav className="flex flex-col gap-1">
             <button onClick={() => setView('HOME')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'HOME' ? 'bg-ocean-600 text-white shadow-lg shadow-ocean-600/20' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <LayoutDashboard size={18} /> Panorâmica
             </button>
             <button onClick={() => setView('COMPANIES')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'COMPANIES' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <Store size={18} /> Empresas Parceiras
             </button>
             <button onClick={() => setView('REQUESTS')} className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'REQUESTS' ? 'bg-ocean-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <div className="flex items-center gap-3"><Bell size={18} /> Solicitações</div>
                 {requests.filter(r => r.status === 'PENDING').length > 0 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{requests.filter(r => r.status === 'PENDING').length}</span>}
             </button>
             <button onClick={onLogout} className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50">
                 Encerrar Sessão
             </button>
         </nav>
      </div>

      <div className="flex-1 p-4 md:p-10">
          <div className="max-w-6xl mx-auto">
              {view === 'HOME' && (
                  <div className="space-y-10 animate-in fade-in">
                      {/* KPIs PLATAFORMA */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg w-fit mb-4"><Users size={20}/></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cidadãos Ativos</p>
                              <h3 className="text-3xl font-black text-ocean-950">{stats?.totalUsers || 0}</h3>
                          </div>
                          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                              <div className="p-2 bg-green-50 text-green-600 rounded-lg w-fit mb-4"><DollarSign size={20}/></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Economia Gerada</p>
                              <h3 className="text-3xl font-black text-ocean-950">R$ {stats?.totalEconomy?.toFixed(0) || 0}</h3>
                          </div>
                          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg w-fit mb-4"><Store size={20}/></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lojistas Ativos</p>
                              <h3 className="text-3xl font-black text-ocean-950">{stats?.totalBusinesses || 0}</h3>
                          </div>
                          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                              <div className="p-2 bg-gold-50 text-gold-600 rounded-lg w-fit mb-4"><Ticket size={20}/></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cupons em Circulação</p>
                              <h3 className="text-3xl font-black text-ocean-950">{stats?.totalCoupons || 0}</h3>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* GRÁFICO CATEGORIAS */}
                          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                              <h3 className="text-lg font-black text-ocean-950 mb-6 flex items-center gap-2">
                                  <PieIcon className="text-ocean-600" size={20} /> Distribuição de Setores
                              </h3>
                              <div className="h-64 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                          <Pie
                                            data={stats?.chartData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                          >
                                            {stats?.chartData?.map((entry: any, index: number) => (
                                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                          </Pie>
                                          <ReTooltip />
                                          <Legend verticalAlign="bottom" height={36}/>
                                      </PieChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>

                          {/* ULTIMOS PEDIDOS */}
                          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                              <h3 className="text-lg font-black text-ocean-950 mb-6">Aprovação Pendente</h3>
                              <div className="space-y-4">
                                  {requests.filter(r => r.status === 'PENDING').slice(0, 3).map(req => (
                                      <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                          <div>
                                              <p className="font-bold text-sm">{req.companyName}</p>
                                              <p className="text-[10px] text-slate-400">{req.category}</p>
                                          </div>
                                          <button onClick={() => setView('REQUESTS')} className="text-ocean-600 text-[10px] font-black uppercase tracking-widest">Revisar</button>
                                      </div>
                                  ))}
                                  {requests.filter(r => r.status === 'PENDING').length === 0 && <p className="text-center py-10 text-slate-400 text-xs font-bold uppercase">Tudo em ordem!</p>}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {view === 'COMPANIES' && (
                  <div className="space-y-6">
                      <h1 className="text-2xl font-black text-ocean-950">Gestão de Parceiros</h1>
                      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                          <table className="w-full text-left">
                              <thead className="bg-slate-50 border-b border-slate-100">
                                  <tr>
                                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Parceiro</th>
                                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Plano</th>
                                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Ações</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                  {allUsers.filter(u => u.role === UserRole.COMPANY).map(u => (
                                      <tr key={u.id}>
                                          <td className="px-6 py-4 font-bold text-sm">{u.companyName || u.name}</td>
                                          <td className="px-6 py-4"><span className="text-[10px] font-black bg-ocean-50 text-ocean-600 px-2 py-1 rounded uppercase">{u.plan || 'FREE'}</span></td>
                                          <td className="px-6 py-4"><Edit size={16} className="text-slate-400 cursor-pointer hover:text-ocean-600"/></td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
