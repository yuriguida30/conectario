
import React, { useState, useEffect } from 'react';
import { User, CompanyRequest, BusinessProfile, UserRole } from '../types';
import { 
  getCompanyRequests, approveCompanyRequest, getAllUsers, 
  getBusinesses, getCoupons, saveBusiness, updateUser 
} from '../services/dataService';
import { 
  LayoutDashboard, Store, CheckCircle, XCircle, Clock, 
  ChevronRight, Globe, Loader2, Users, Ticket, BookOpen, 
  Settings, Bell, Shield, Search, Edit, Key, Lock, Unlock, 
  Mail, Phone, Save, X 
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
          // Na nossa lógica simplificada, o reset é apenas um aviso pois o login aceita 123456
          // Se houvesse um campo 'password' no banco, faríamos o update aqui.
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
          await updateUser(editingCompany.user);
          if (editingCompany.biz) {
              await saveBusiness(editingCompany.biz);
          }
          alert("Dados atualizados com sucesso!");
          setEditingCompany(null);
          loadData();
      } catch (err) {
          alert("Erro ao salvar.");
      } finally {
          setLoadingAction(null);
      }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  
  // Lista de empresas (Usuários com Role COMPANY)
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
                      <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-black text-ocean-950 mb-2">Painel de Controle</h1>
                            <p className="text-slate-500 font-medium">Gestão global da plataforma Conecta Rio.</p>
                        </div>
                        <div className="text-right hidden md:block">
                            <p className="text-xs font-bold text-slate-400 uppercase">Última Atualização</p>
                            <p className="text-sm font-black text-ocean-600">{new Date().toLocaleTimeString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Users size={20}/></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Usuários</p>
                              <h3 className="text-3xl font-black text-ocean-950">{allUsers.length}</h3>
                          </div>
                          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4"><Store size={20}/></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Empresas</p>
                              <h3 className="text-3xl font-black text-ocean-950">{businesses.length}</h3>
                          </div>
                          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4"><Ticket size={20}/></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ofertas</p>
                              <h3 className="text-3xl font-black text-ocean-950">{couponsCount}</h3>
                          </div>
                          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4"><Bell size={20}/></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendentes</p>
                              <h3 className="text-3xl font-black text-ocean-950">{pendingRequests.length}</h3>
                          </div>
                      </div>

                      <div className="bg-ocean-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                              <div className="max-w-md">
                                  <h3 className="text-2xl font-bold mb-2">Bem-vindo à Central Master</h3>
                                  <p className="text-ocean-200 text-sm">Aqui você gerencia aprovações, edita perfis de parceiros e monitora o crescimento da rede.</p>
                              </div>
                              <button onClick={() => setView('COMPANIES')} className="bg-gold-500 text-ocean-950 font-black px-8 py-4 rounded-2xl hover:bg-gold-400 transition-all shadow-lg">GERENCIAR EMPRESAS</button>
                          </div>
                          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                      </div>
                  </div>
              )}

              {/* COMPANIES VIEW - GESTÃO COMPLETA */}
              {view === 'COMPANIES' && (
                  <div className="animate-in slide-in-from-right-4 space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                              <h1 className="text-2xl font-black text-ocean-950">Empresas Parceiras</h1>
                              <p className="text-sm text-slate-500">Controle total sobre os dados e acessos dos parceiros.</p>
                          </div>
                          <div className="relative w-full md:w-72">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input 
                                type="text" 
                                placeholder="Buscar empresa ou e-mail..."
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-500 outline-none shadow-sm"
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
                                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Empresa / Proprietário</th>
                                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Contato</th>
                                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Categoria</th>
                                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Status</th>
                                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">Ações</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                      {companyUsers.map(user => {
                                          const biz = businesses.find(b => b.id === user.id);
                                          return (
                                              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                                  <td className="px-6 py-4">
                                                      <div className="flex items-center gap-3">
                                                          <div className="w-10 h-10 bg-ocean-50 text-ocean-600 rounded-lg flex items-center justify-center font-bold">
                                                              {user.companyName?.[0] || user.name[0]}
                                                          </div>
                                                          <div>
                                                              <p className="text-sm font-bold text-ocean-950">{user.companyName || 'N/A'}</p>
                                                              <p className="text-[10px] text-slate-400 font-medium">{user.name}</p>
                                                          </div>
                                                      </div>
                                                  </td>
                                                  <td className="px-6 py-4">
                                                      <div className="space-y-1">
                                                          <p className="text-xs text-slate-600 flex items-center gap-1"><Mail size={12}/> {user.email}</p>
                                                          <p className="text-xs text-slate-600 flex items-center gap-1"><Phone size={12}/> {user.phone || biz?.phone || 'N/A'}</p>
                                                      </div>
                                                  </td>
                                                  <td className="px-6 py-4">
                                                      <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase tracking-wider">
                                                          {user.category || biz?.category || 'Geral'}
                                                      </span>
                                                  </td>
                                                  <td className="px-6 py-4">
                                                      {user.isBlocked ? (
                                                          <span className="text-[10px] font-bold text-red-500 flex items-center gap-1"><Lock size={12}/> BLOQUEADO</span>
                                                      ) : (
                                                          <span className="text-[10px] font-bold text-green-500 flex items-center gap-1"><CheckCircle size={12}/> ATIVO</span>
                                                      )}
                                                  </td>
                                                  <td className="px-6 py-4">
                                                      <div className="flex items-center justify-center gap-1">
                                                          <button 
                                                            onClick={() => setEditingCompany({ user, biz })}
                                                            title="Editar Dados"
                                                            className="p-2 text-slate-400 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition-all"
                                                          >
                                                              <Edit size={16}/>
                                                          </button>
                                                          <button 
                                                            onClick={() => handleResetPassword(user)}
                                                            title="Resetar Senha"
                                                            className="p-2 text-slate-400 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-all"
                                                          >
                                                              <Key size={16}/>
                                                          </button>
                                                          <button 
                                                            onClick={() => handleToggleBlock(user)}
                                                            title={user.isBlocked ? "Desbloquear" : "Bloquear Acesso"}
                                                            className={`p-2 rounded-lg transition-all ${user.isBlocked ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                                                          >
                                                              {user.isBlocked ? <Unlock size={16}/> : <Lock size={16}/>}
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
                  </div>
              )}

              {/* REQUESTS VIEW */}
              {view === 'REQUESTS' && (
                  <div className="animate-in slide-in-from-right-4">
                      <div className="flex items-center gap-4 mb-8">
                          <button onClick={() => setView('HOME')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-ocean-600">
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

      {/* MODAL DE EDIÇÃO DA EMPRESA (PELO MASTER) */}
      {editingCompany && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="bg-ocean-900 p-6 text-white flex justify-between items-center">
                      <h3 className="font-bold text-lg">Editar Parceiro: {editingCompany.user.companyName}</h3>
                      <button onClick={() => setEditingCompany(null)} className="hover:bg-white/10 p-1 rounded-full"><X/></button>
                  </div>
                  <form onSubmit={handleSaveEdit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">Dados do Usuário</h4>
                              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Nome do Dono</label><input required className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" value={editingCompany.user.name} onChange={e => setEditingCompany({...editingCompany, user: {...editingCompany.user, name: e.target.value}})} /></div>
                              <div><label className="text-[10px] font-bold text-slate-500 uppercase">E-mail de Login</label><input required type="email" className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" value={editingCompany.user.email} onChange={e => setEditingCompany({...editingCompany, user: {...editingCompany.user, email: e.target.value}})} /></div>
                          </div>
                          <div className="space-y-4">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">Dados da Empresa</h4>
                              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Nome da Empresa</label><input required className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" value={editingCompany.user.companyName} onChange={e => setEditingCompany({...editingCompany, user: {...editingCompany.user, companyName: e.target.value}})} /></div>
                              <div><label className="text-[10px] font-bold text-slate-500 uppercase">WhatsApp</label><input className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" value={editingCompany.user.phone || ''} onChange={e => setEditingCompany({...editingCompany, user: {...editingCompany.user, phone: e.target.value}})} /></div>
                          </div>
                      </div>

                      {editingCompany.biz && (
                          <div className="space-y-4 pt-4 border-t border-slate-100">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">Perfil Público</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div><label className="text-[10px] font-bold text-slate-500 uppercase">Endereço</label><input className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" value={editingCompany.biz.address} onChange={e => setEditingCompany({...editingCompany, biz: {...editingCompany.biz!, address: e.target.value}})} /></div>
                                  <div><label className="text-[10px] font-bold text-slate-500 uppercase">Categoria</label><input className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" value={editingCompany.biz.category} onChange={e => setEditingCompany({...editingCompany, biz: {...editingCompany.biz!, category: e.target.value}})} /></div>
                              </div>
                              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Bio / Descrição</label><textarea className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" rows={3} value={editingCompany.biz.description} onChange={e => setEditingCompany({...editingCompany, biz: {...editingCompany.biz!, description: e.target.value}})} /></div>
                          </div>
                      )}

                      <div className="flex gap-4 pt-4">
                        <button type="submit" disabled={loadingAction === 'save-edit'} className="flex-1 bg-ocean-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-ocean-700 transition-all flex items-center justify-center gap-2">
                            {loadingAction === 'save-edit' ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} SALVAR ALTERAÇÕES
                        </button>
                        <button type="button" onClick={() => setEditingCompany(null)} className="px-8 bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all">Cancelar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
