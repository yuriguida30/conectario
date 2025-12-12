
import React, { useState, useEffect } from 'react';
import { User, CompanyRequest, UserRole, AppCategory, AppLocation, AppAmenity, BlogPost, Collection, BusinessProfile, FeaturedConfig, SupportMessage, AppConfig } from '../types';
import { 
    getCompanyRequests, 
    approveRequest, 
    rejectRequest, 
    getAllUsers, 
    updateUser,
    deleteUser, 
    getCategories,
    addCategory,
    deleteCategory,
    getLocations,
    addLocation,
    deleteLocation,
    getAmenities,
    addAmenity,
    deleteAmenity,
    getBlogPosts,
    saveBlogPost,
    deleteBlogPost,
    getCollections,
    saveCollection,
    deleteCollection,
    getBusinesses,
    getFeaturedConfig,
    saveFeaturedConfig,
    getSupportMessages,
    getAppConfig,
    saveAppConfig,
    adminResetPassword,
    createCompanyDirectly,
    addSubCategory,
    removeSubCategory
} from '../services/dataService';
import { 
    Check, X, Clock, Shield, Users, Settings, LayoutGrid, Map, Plus, Trash2, BookOpen, Edit, Save, Coffee, LogOut, User as UserIcon, Mail, Layers, Search, Star, MessageSquare, Palette, Lock, Unlock, Key, Building2, MapPin
} from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';
import { LocationPicker } from '../components/LocationPicker';

interface SuperAdminDashboardProps {
  onNavigate: (page: string) => void;
  currentUser: User;
  onLogout: () => void;
}

type Tab = 'REQUESTS' | 'USERS' | 'SETTINGS' | 'BLOG' | 'COLLECTIONS' | 'FEATURED' | 'SUPPORT' | 'BRANDING';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate, currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('REQUESTS');
  
  // Data States
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [locations, setLocations] = useState<AppLocation[]>([]);
  const [amenities, setAmenities] = useState<AppAmenity[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<BusinessProfile[]>([]);
  const [featuredConfig, setFeaturedConfig] = useState<FeaturedConfig>({ title: '', subtitle: '', imageUrl: '', buttonText: '' });
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>({ appName: '', appNameHighlight: '' });

  // Inputs
  const [newCatName, setNewCatName] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [newLocCoords, setNewLocCoords] = useState<{lat: number, lng: number} | null>(null);
  const [newAmenityName, setNewAmenityName] = useState('');
  
  // Blog Edit State
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);

  // Collection Edit State
  const [editingCollection, setEditingCollection] = useState<Partial<Collection> | null>(null);
  const [collectionSearch, setCollectionSearch] = useState('');

  // User Permission Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Password Reset State
  const [passwordResetModal, setPasswordResetModal] = useState<{user: User, pass: string} | null>(null);

  // New Company Modal State
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
      name: '',
      email: '',
      password: '',
      companyName: '',
      category: 'Gastronomia'
  });

  useEffect(() => {
    refreshAll();
  }, []);

  const refreshAll = () => {
    setRequests(getCompanyRequests());
    setUsers(getAllUsers());
    setCategories(getCategories());
    setLocations(getLocations());
    setAmenities(getAmenities());
    setPosts(getBlogPosts());
    setCollections(getCollections());
    setAllBusinesses(getBusinesses());
    setFeaturedConfig(getFeaturedConfig());
    setSupportMessages(getSupportMessages());
    setAppConfig(getAppConfig());
  };

  // --- ACTIONS ---

  const handleApprove = (id: string) => {
    if (window.confirm('Aprovar empresa e criar login? A senha padrão será "123456".')) {
        approveRequest(id);
        refreshAll();
    }
  };

  const handleReject = (id: string) => {
    if (window.confirm('Rejeitar solicitação?')) {
        rejectRequest(id);
        refreshAll();
    }
  };

  const handleDeleteUser = (id: string) => {
      if (id === currentUser.id) {
          alert("Você não pode excluir a si mesmo.");
          return;
      }
      if (window.confirm('Excluir este usuário permanentemente?')) {
          deleteUser(id);
          refreshAll();
      }
  };

  const handleBlockToggle = (user: User) => {
      if (user.id === currentUser.id) {
          alert("Você não pode bloquear a si mesmo.");
          return;
      }
      const updatedUser = { ...user, isBlocked: !user.isBlocked };
      updateUser(updatedUser);
      refreshAll();
  };

  const handlePasswordReset = (e: React.FormEvent) => {
      e.preventDefault();
      if (!passwordResetModal || !passwordResetModal.pass) return;
      
      adminResetPassword(passwordResetModal.user.email, passwordResetModal.pass);
      // Simula a troca local para o fallback funcionar
      const localAuth = JSON.parse(localStorage.getItem('arraial_local_auth_db') || '{}');
      localAuth[passwordResetModal.user.email] = btoa(passwordResetModal.pass);
      localStorage.setItem('arraial_local_auth_db', JSON.stringify(localAuth));
      
      alert(`Senha de ${passwordResetModal.user.name} alterada com sucesso!`);
      setPasswordResetModal(null);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newCompanyForm.email || !newCompanyForm.password || !newCompanyForm.companyName) {
          alert("Preencha todos os campos obrigatórios.");
          return;
      }
      try {
          await createCompanyDirectly(newCompanyForm);
          alert("Empresa criada com sucesso!");
          setShowNewCompany(false);
          setNewCompanyForm({ name: '', email: '', password: '', companyName: '', category: 'Gastronomia' });
          refreshAll();
      } catch (e) {
          alert("Erro ao criar empresa. Tente novamente.");
      }
  };

  const handleUpdateUserPermissions = () => {
      if (editingUser) {
          updateUser(editingUser);
          setEditingUser(null);
          refreshAll();
      }
  };

  const handleAddCategory = () => {
      if (!newCatName) return;
      addCategory(newCatName);
      setNewCatName('');
      refreshAll();
  };

  const handleAddSubCategory = (catId: string, subName: string) => {
      if (!subName) return;
      addSubCategory(catId, subName);
      refreshAll();
  };

  const handleAddLocation = () => {
      if (!newLocName) {
          alert("Digite o nome do local");
          return;
      }
      addLocation(newLocName, newLocCoords?.lat, newLocCoords?.lng);
      setNewLocName('');
      setNewLocCoords(null);
      refreshAll();
  };

  const handleAddAmenity = () => {
      if (!newAmenityName) return;
      addAmenity(newAmenityName);
      setNewAmenityName('');
      refreshAll();
  };

  const handleSaveFeatured = (e: React.FormEvent) => {
      e.preventDefault();
      saveFeaturedConfig(featuredConfig);
      alert("Destaque atualizado com sucesso!");
  };

  const handleSaveBranding = (e: React.FormEvent) => {
      e.preventDefault();
      saveAppConfig(appConfig);
      alert("Identidade visual atualizada!");
  };

  // Blog Actions
  const handleSavePost = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingPost?.title || !editingPost?.excerpt) return;

      const newPost: BlogPost = {
          id: editingPost.id || Date.now().toString(),
          title: editingPost.title,
          excerpt: editingPost.excerpt,
          content: editingPost.content || '',
          category: (editingPost.category as any) || 'Dica',
          imageUrl: editingPost.imageUrl || 'https://via.placeholder.com/800x400',
          author: currentUser.name,
          date: editingPost.date || new Date().toLocaleDateString('pt-BR')
      };
      
      saveBlogPost(newPost);
      setEditingPost(null);
      refreshAll();
  };

  const handleDeletePost = (id: string) => {
      if(confirm('Excluir postagem?')) {
          deleteBlogPost(id);
          refreshAll();
      }
  };

  // Collection Actions
  const handleSaveCollection = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingCollection?.title) return;

      const newCol: Collection = {
          id: editingCollection.id || 'col_' + Date.now(),
          title: editingCollection.title,
          description: editingCollection.description || '',
          coverImage: editingCollection.coverImage || 'https://via.placeholder.com/800x600',
          businessIds: editingCollection.businessIds || [],
          featured: true
      };
      
      saveCollection(newCol);
      setEditingCollection(null);
      refreshAll();
  };

  const handleDeleteCollection = (id: string) => {
      if(confirm('Excluir coleção?')) {
          deleteCollection(id);
          refreshAll();
      }
  }

  const toggleBusinessInCollection = (bizId: string) => {
      if(!editingCollection) return;
      const current = editingCollection.businessIds || [];
      const updated = current.includes(bizId) 
          ? current.filter(id => id !== bizId) 
          : [...current, bizId];
      setEditingCollection({ ...editingCollection, businessIds: updated });
  }

  // --- RENDER HELPERS ---

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 pt-16">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-white border-r border-slate-200 p-4 md:min-h-screen flex flex-col">
         <div className="mb-8 px-2">
             <h2 className="text-xl font-bold text-ocean-950 flex items-center gap-2">
                 <Shield className="text-gold-500" /> Admin
             </h2>
             <p className="text-xs text-slate-400">Gerenciamento Global</p>
         </div>

         <nav className="space-y-2 flex-1">
             <button 
                onClick={() => setActiveTab('REQUESTS')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'REQUESTS' ? 'bg-ocean-50 text-ocean-700' : 'text-slate-500 hover:bg-slate-50'}`}
             >
                 <span className="flex items-center gap-3"><Clock size={18} /> Solicitações</span>
                 {pendingRequests.length > 0 && (
                     <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                 )}
             </button>
             <button 
                onClick={() => setActiveTab('BRANDING')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'BRANDING' ? 'bg-ocean-50 text-ocean-700' : 'text-slate-500 hover:bg-slate-50'}`}
             >
                 <Palette size={18} /> Identidade Visual
             </button>
             <button 
                onClick={() => setActiveTab('FEATURED')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'FEATURED' ? 'bg-ocean-50 text-ocean-700' : 'text-slate-500 hover:bg-slate-50'}`}
             >
                 <Star size={18} /> Destaque Home
             </button>
             <button 
                onClick={() => setActiveTab('COLLECTIONS')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'COLLECTIONS' ? 'bg-ocean-50 text-ocean-700' : 'text-slate-500 hover:bg-slate-50'}`}
             >
                 <Layers size={18} /> Coleções
             </button>
             <button 
                onClick={() => setActiveTab('USERS')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'USERS' ? 'bg-ocean-50 text-ocean-700' : 'text-slate-500 hover:bg-slate-50'}`}
             >
                 <Users size={18} /> Usuários
             </button>
             <button 
                onClick={() => setActiveTab('BLOG')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'BLOG' ? 'bg-ocean-50 text-ocean-700' : 'text-slate-500 hover:bg-slate-50'}`}
             >
                 <BookOpen size={18} /> Blog
             </button>
             <button 
                onClick={() => setActiveTab('SUPPORT')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'SUPPORT' ? 'bg-ocean-50 text-ocean-700' : 'text-slate-500 hover:bg-slate-50'}`}
             >
                 <MessageSquare size={18} /> Suporte
             </button>
             <button 
                onClick={() => setActiveTab('SETTINGS')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'SETTINGS' ? 'bg-ocean-50 text-ocean-700' : 'text-slate-500 hover:bg-slate-50'}`}
             >
                 <Settings size={18} /> Configs
             </button>
         </nav>
         
         <div className="mt-4 border-t border-slate-100 pt-4">
             <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
             >
                 <LogOut size={18} /> Sair
             </button>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
          
          {/* TAB: REQUESTS */}
          {activeTab === 'REQUESTS' && (
              <div className="max-w-4xl">
                  {/* ... Same as before ... */}
                  <h1 className="text-2xl font-bold text-ocean-950 mb-6">Solicitações de Empresas</h1>
                  {requests.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
                          Nenhuma solicitação recebida.
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {requests.map(req => (
                              <div key={req.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                                  {req.status === 'PENDING' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>}
                                  {req.status === 'APPROVED' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>}
                                  {req.status === 'REJECTED' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}
                                  
                                  <div className="flex flex-col md:flex-row justify-between gap-4">
                                      <div>
                                          <div className="flex items-center gap-2 mb-2">
                                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{req.category}</span>
                                              <span className="text-xs text-slate-300">•</span>
                                              <span className="text-xs text-slate-400">{new Date(req.requestDate).toLocaleDateString()}</span>
                                          </div>
                                          <h3 className="text-xl font-bold text-ocean-950">{req.companyName}</h3>
                                          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1"><UserIcon size={14}/> {req.ownerName}</p>
                                          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1"><Mail size={14}/> {req.email}</p>
                                          <p className="mt-3 text-slate-600 bg-slate-50 p-3 rounded-lg text-sm italic">"{req.description}"</p>
                                      </div>
                                      {req.status === 'PENDING' ? (
                                          <div className="flex flex-col gap-2 justify-center min-w-[140px]">
                                              <button onClick={() => handleApprove(req.id)} className="bg-green-100 hover:bg-green-200 text-green-700 text-sm font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                                                  <Check size={16} /> Aprovar
                                              </button>
                                              <button onClick={() => handleReject(req.id)} className="bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                                                  <X size={16} /> Rejeitar
                                              </button>
                                          </div>
                                      ) : (
                                          <div className="flex items-center justify-center min-w-[140px]">
                                              <span className={`font-bold text-sm px-3 py-1 rounded-full ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                  {req.status === 'APPROVED' ? 'APROVADO' : 'REJEITADO'}
                                              </span>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {/* ... (Other tabs logic preserved) ... */}
          {activeTab === 'BRANDING' && <div className="max-w-2xl"><h1 className="text-2xl font-bold text-ocean-950 mb-6">Identidade Visual & Marca</h1><div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg"><form onSubmit={handleSaveBranding} className="space-y-6"><div className="grid md:grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Principal</label><input className="w-full border rounded-lg p-3 font-bold text-lg" value={appConfig.appName} onChange={e => setAppConfig({...appConfig, appName: e.target.value})} placeholder="CONECTA" /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destaque (Cor)</label><input className="w-full border rounded-lg p-3 font-bold text-lg text-gold-500" value={appConfig.appNameHighlight} onChange={e => setAppConfig({...appConfig, appNameHighlight: e.target.value})} placeholder="RIO" /></div></div><div className="space-y-6"><ImageUpload label="Logo da Barra de Navegação (Pequeno)" currentImage={appConfig.logoUrl} onImageSelect={(base64) => setAppConfig({...appConfig, logoUrl: base64})} className="w-32" /><ImageUpload label="Logo de Login & Inscrição (Grande)" currentImage={appConfig.loginLogoUrl} onImageSelect={(base64) => setAppConfig({...appConfig, loginLogoUrl: base64})} className="w-48" /><ImageUpload label="Favicon (Ícone da Aba)" currentImage={appConfig.faviconUrl} onImageSelect={(base64) => setAppConfig({...appConfig, faviconUrl: base64})} className="w-16" /></div><button type="submit" className="w-full bg-ocean-600 text-white font-bold py-3 rounded-xl hover:bg-ocean-700 transition-colors shadow-lg">Salvar Identidade</button></form></div></div>}
          {activeTab === 'FEATURED' && <div className="max-w-2xl"><h1 className="text-2xl font-bold text-ocean-950 mb-6">Editar Destaque Premium (Home)</h1><div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg"><form onSubmit={handleSaveFeatured} className="space-y-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título Principal</label><input className="w-full border rounded-lg p-3" value={featuredConfig.title} onChange={e => setFeaturedConfig({...featuredConfig, title: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subtítulo / Descrição</label><textarea className="w-full border rounded-lg p-3" rows={3} value={featuredConfig.subtitle} onChange={e => setFeaturedConfig({...featuredConfig, subtitle: e.target.value})} /></div><div><ImageUpload label="Imagem de Fundo do Destaque" currentImage={featuredConfig.imageUrl} onImageSelect={(base64) => setFeaturedConfig({...featuredConfig, imageUrl: base64})} /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Texto do Botão</label><input className="w-full border rounded-lg p-3" value={featuredConfig.buttonText} onChange={e => setFeaturedConfig({...featuredConfig, buttonText: e.target.value})} /></div><button type="submit" className="w-full bg-ocean-600 text-white font-bold py-3 rounded-xl hover:bg-ocean-700 transition-colors">Salvar Alterações</button></form></div></div>}
          {activeTab === 'USERS' && <div className="max-w-5xl"><div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-ocean-950">Controle de Usuários e Permissões</h1><button onClick={() => setShowNewCompany(true)} className="bg-ocean-600 hover:bg-ocean-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg"><Plus size={20} /> Nova Empresa</button></div>{showNewCompany && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"><div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"><div className="bg-ocean-900 px-6 py-4 flex justify-between items-center"><h3 className="text-white font-bold flex items-center gap-2"><Building2 size={20}/> Criar Nova Empresa</h3><button onClick={() => setShowNewCompany(false)} className="text-white/80 hover:text-white"><X size={20}/></button></div><form onSubmit={handleCreateCompany} className="p-6 space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Dono</label><input required className="w-full border p-2.5 rounded-lg" value={newCompanyForm.name} onChange={e => setNewCompanyForm({...newCompanyForm, name: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Empresa</label><input required className="w-full border p-2.5 rounded-lg" value={newCompanyForm.companyName} onChange={e => setNewCompanyForm({...newCompanyForm, companyName: e.target.value})} /></div></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label><select className="w-full border p-2.5 rounded-lg" value={newCompanyForm.category} onChange={e => setNewCompanyForm({...newCompanyForm, category: e.target.value})}>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email de Login</label><input required type="email" className="w-full border p-2.5 rounded-lg" value={newCompanyForm.email} onChange={e => setNewCompanyForm({...newCompanyForm, email: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha de Acesso</label><input required type="text" className="w-full border p-2.5 rounded-lg font-mono bg-slate-50" value={newCompanyForm.password} onChange={e => setNewCompanyForm({...newCompanyForm, password: e.target.value})} /></div><div className="pt-2"><button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 shadow-lg">Criar Empresa & Perfil</button></div></form></div></div>)}{passwordResetModal && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm"><h3 className="text-lg font-bold mb-4">Nova senha para {passwordResetModal.user.name}</h3><form onSubmit={handlePasswordReset}><input type="text" className="w-full border p-3 rounded-lg mb-4" placeholder="Digite a nova senha" value={passwordResetModal.pass} onChange={e => setPasswordResetModal({...passwordResetModal, pass: e.target.value})} required /><div className="flex gap-2"><button type="button" onClick={() => setPasswordResetModal(null)} className="flex-1 py-2 text-slate-500 font-bold border rounded-lg">Cancelar</button><button type="submit" className="flex-1 py-2 bg-ocean-600 text-white font-bold rounded-lg hover:bg-ocean-700">Salvar Senha</button></div></form></div></div>)}{editingUser ? (<div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg mb-6 animate-in fade-in"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-ocean-900">Editar Permissões: {editingUser.name}</h3><button onClick={() => setEditingUser(null)}><X size={20} className="text-slate-400"/></button></div><div className="space-y-4"><div className="grid md:grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Função</label><select className="w-full border rounded-lg p-2 bg-slate-50" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}><option value={UserRole.CUSTOMER}>Cliente</option><option value={UserRole.COMPANY}>Empresa</option><option value={UserRole.SUPER_ADMIN}>Super Admin</option></select></div>{editingUser.role === UserRole.COMPANY && (<div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Limite de Cupons Ativos</label><input type="number" className="w-full border rounded-lg p-2" value={editingUser.maxCoupons || 0} onChange={e => setEditingUser({...editingUser, maxCoupons: parseInt(e.target.value)})} /></div>)}</div>{editingUser.role === UserRole.COMPANY && (<div className="bg-slate-50 p-4 rounded-xl space-y-3"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-5 h-5 text-ocean-600 rounded" checked={editingUser.permissions?.canCreateCoupons || false} onChange={e => setEditingUser({...editingUser, permissions: { ...editingUser.permissions!, canCreateCoupons: e.target.checked }})} /><span className="text-sm font-medium text-slate-700">Pode Criar Cupons</span></label><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-5 h-5 text-ocean-600 rounded" checked={editingUser.permissions?.canManageBusiness || false} onChange={e => setEditingUser({...editingUser, permissions: { ...editingUser.permissions!, canManageBusiness: e.target.checked }})} /><span className="text-sm font-medium text-slate-700">Pode Ter Página no Guia</span></label></div>)}<button onClick={handleUpdateUserPermissions} className="bg-ocean-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-ocean-700">Salvar Alterações</button></div></div>) : (<div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"><table className="w-full text-left border-collapse"><thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold"><tr><th className="p-4">Usuário</th><th className="p-4">Tipo</th><th className="p-4">Status</th><th className="p-4 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100 text-sm">{users.map(u => (<tr key={u.id} className={`transition-colors ${u.isBlocked ? 'bg-red-50' : 'hover:bg-slate-50'}`}><td className="p-4"><div className="font-bold text-ocean-900 flex items-center gap-2">{u.name}{u.isBlocked && <span className="bg-red-500 text-white text-[10px] px-2 rounded-full">BLOQUEADO</span>}</div><div className="text-xs text-slate-500">{u.email}</div></td><td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${u.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 text-purple-700' : u.role === UserRole.COMPANY ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span></td><td className="p-4">{u.role === UserRole.COMPANY && (<div className="flex flex-col gap-1 text-xs"><span className={u.permissions?.canCreateCoupons ? 'text-green-600' : 'text-red-400'}>{u.permissions?.canCreateCoupons ? 'Cupons: SIM' : 'Cupons: NÃO'}{u.permissions?.canCreateCoupons && ` (Max: ${u.maxCoupons})`}</span><span className={u.permissions?.canManageBusiness ? 'text-green-600' : 'text-red-400'}>{u.permissions?.canManageBusiness ? 'Guia: SIM' : 'Guia: NÃO'}</span></div>)}</td><td className="p-4 text-right"><div className="flex justify-end gap-1"><button onClick={() => setPasswordResetModal({user: u, pass: ''})} className="text-slate-500 hover:bg-slate-100 p-2 rounded" title="Trocar Senha"><Key size={18} /></button><button onClick={() => handleBlockToggle(u)} className={`${u.isBlocked ? 'text-red-600' : 'text-slate-500'} hover:bg-slate-100 p-2 rounded`} title={u.isBlocked ? 'Desbloquear' : 'Bloquear'}>{u.isBlocked ? <Lock size={18} /> : <Unlock size={18} />}</button><button onClick={() => setEditingUser(u)} className="text-ocean-600 hover:bg-ocean-50 p-2 rounded" title="Editar Permissões"><Settings size={18} /></button><button onClick={() => handleDeleteUser(u.id)} className="text-slate-400 hover:text-red-500 p-2 rounded hover:bg-red-50" title="Excluir"><Trash2 size={18} /></button></div></td></tr>))}</tbody></table></div>)}</div>}
          {activeTab === 'COLLECTIONS' && <div className="max-w-6xl"><div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-ocean-950">Coleções & Listas</h1><button onClick={() => setEditingCollection({ title: '', description: '', businessIds: [] })} className="bg-ocean-600 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg"><Plus size={20} /> Nova Coleção</button></div>{editingCollection ? (<div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl animate-in fade-in"><h3 className="text-lg font-bold mb-4">{editingCollection.id ? 'Editar Coleção' : 'Nova Coleção'}</h3><form onSubmit={handleSaveCollection} className="space-y-6"><div className="grid md:grid-cols-2 gap-6"><div className="space-y-4"><div><label className="block text-xs font-bold uppercase mb-1">Título da Coleção</label><input className="w-full border p-3 rounded-lg" value={editingCollection.title} onChange={e => setEditingCollection({...editingCollection, title: e.target.value})} required placeholder="Ex: Jantar Romântico" /></div><div><label className="block text-xs font-bold uppercase mb-1">Descrição</label><textarea className="w-full border p-3 rounded-lg" rows={3} value={editingCollection.description || ''} onChange={e => setEditingCollection({...editingCollection, description: e.target.value})} /></div><div><ImageUpload label="Imagem de Capa" currentImage={editingCollection.coverImage} onImageSelect={(base64) => setEditingCollection({...editingCollection, coverImage: base64})} /></div></div><div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><h4 className="font-bold text-sm mb-2">Adicionar Empresas</h4><div className="relative mb-2"><Search size={16} className="absolute left-3 top-2.5 text-slate-400" /><input type="text" placeholder="Filtrar empresas..." className="w-full pl-9 p-2 rounded-lg border text-sm" value={collectionSearch} onChange={e => setCollectionSearch(e.target.value)} /></div><div className="h-60 overflow-y-auto space-y-2 pr-2">{allBusinesses.filter(b => b.name.toLowerCase().includes(collectionSearch.toLowerCase())).map(biz => (<label key={biz.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${editingCollection.businessIds?.includes(biz.id) ? 'bg-ocean-100 border border-ocean-200' : 'bg-white border border-slate-100'}`}><input type="checkbox" className="rounded text-ocean-600 focus:ring-ocean-500 w-4 h-4" checked={editingCollection.businessIds?.includes(biz.id) || false} onChange={() => toggleBusinessInCollection(biz.id)} /><div className="flex-1"><div className="text-sm font-bold text-slate-800">{biz.name}</div><div className="text-xs text-slate-500">{biz.category}</div></div></label>))}</div><div className="mt-2 text-xs text-right text-slate-500">{editingCollection.businessIds?.length} selecionados</div></div></div><div className="flex gap-3 pt-4 border-t border-slate-100"><button type="button" onClick={() => setEditingCollection(null)} className="px-6 py-2 rounded-lg border hover:bg-slate-50 font-bold text-slate-600">Cancelar</button><button type="submit" className="px-8 py-2 rounded-lg bg-ocean-600 text-white font-bold hover:bg-ocean-700 shadow-lg">Salvar Coleção</button></div></form></div>) : (<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{collections.map(col => (<div key={col.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all group"><div className="h-40 relative"><img src={col.coverImage} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div><h3 className="absolute bottom-4 left-4 text-white font-bold text-xl shadow-black drop-shadow-md">{col.title}</h3></div><div className="p-4"><p className="text-sm text-slate-600 mb-4 line-clamp-2">{col.description}</p><div className="flex justify-between items-center text-xs text-slate-500"><span className="bg-slate-100 px-2 py-1 rounded font-bold">{col.businessIds.length} lugares</span><div className="flex gap-2"><button onClick={() => setEditingCollection(col)} className="text-ocean-600 hover:text-ocean-800 p-1"><Edit size={16}/></button><button onClick={() => handleDeleteCollection(col.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button></div></div></div></div>))}</div>)}</div>}
          {activeTab === 'BLOG' && <div className="max-w-6xl"><div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-ocean-950">Gestão de Blog & Dicas</h1><button onClick={() => setEditingPost({ title: '', excerpt: '', content: '' })} className="bg-ocean-600 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2"><Plus size={20} /> Nova Postagem</button></div>{editingPost ? (<div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg animate-in fade-in"><h3 className="text-lg font-bold mb-4">{editingPost.id ? 'Editar Postagem' : 'Nova Postagem'}</h3><form onSubmit={handleSavePost} className="space-y-4"><div><label className="block text-xs font-bold uppercase mb-1">Título</label><input className="w-full border p-3 rounded-lg" value={editingPost.title} onChange={e => setEditingPost({...editingPost, title: e.target.value})} required /></div><div className="grid md:grid-cols-2 gap-4"><div><label className="block text-xs font-bold uppercase mb-1">Categoria</label><select className="w-full border p-3 rounded-lg bg-white" value={editingPost.category || 'Dica'} onChange={e => setEditingPost({...editingPost, category: e.target.value as any})}><option value="Dica">Dica</option><option value="Roteiro">Roteiro</option><option value="Notícia">Notícia</option><option value="Curiosidade">Curiosidade</option></select></div><div><ImageUpload label="Imagem do Post" currentImage={editingPost.imageUrl} onImageSelect={(base64) => setEditingPost({...editingPost, imageUrl: base64})} /></div></div><div><label className="block text-xs font-bold uppercase mb-1">Resumo (Excerpt)</label><textarea className="w-full border p-3 rounded-lg" rows={2} value={editingPost.excerpt || ''} onChange={e => setEditingPost({...editingPost, excerpt: e.target.value})} required /></div><div><label className="block text-xs font-bold uppercase mb-1">Conteúdo Completo</label><textarea className="w-full border p-3 rounded-lg" rows={6} value={editingPost.content || ''} onChange={e => setEditingPost({...editingPost, content: e.target.value})} /></div><div className="flex gap-3 pt-2"><button type="button" onClick={() => setEditingPost(null)} className="px-6 py-2 rounded-lg border hover:bg-slate-50">Cancelar</button><button type="submit" className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700">Salvar Postagem</button></div></form></div>) : (<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{posts.map(post => (<div key={post.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"><img src={post.imageUrl} className="h-40 w-full object-cover" /><div className="p-4"><span className="text-xs font-bold text-ocean-600 bg-ocean-50 px-2 py-0.5 rounded">{post.category}</span><h3 className="font-bold text-ocean-950 mt-2 line-clamp-1">{post.title}</h3><p className="text-xs text-slate-500 mt-1 line-clamp-2">{post.excerpt}</p><div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-50"><button onClick={() => setEditingPost(post)} className="text-ocean-600 p-1 hover:bg-ocean-50 rounded"><Edit size={16}/></button><button onClick={() => handleDeletePost(post.id)} className="text-red-400 p-1 hover:bg-red-50 rounded"><Trash2 size={16}/></button></div></div></div>))}</div>)}</div>}
          {activeTab === 'SUPPORT' && <div className="max-w-4xl"><h1 className="text-2xl font-bold text-ocean-950 mb-6">Mensagens de Suporte</h1><div className="space-y-4">{supportMessages.length === 0 ? (<div className="text-center py-10 text-slate-400">Nenhuma mensagem.</div>) : supportMessages.map(msg => (<div key={msg.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><div className="flex justify-between items-start mb-2"><div><h3 className="font-bold text-ocean-900">{msg.userName}</h3><p className="text-xs text-slate-500">{msg.userEmail}</p></div><span className="text-xs text-slate-400">{new Date(msg.date).toLocaleDateString()}</span></div><p className="text-slate-700 text-sm bg-slate-50 p-4 rounded-xl">{msg.message}</p></div>))}</div></div>}

          {/* TAB: SETTINGS */}
          {activeTab === 'SETTINGS' && (
              <div className="max-w-6xl grid md:grid-cols-2 gap-8 pb-12">
                  
                  {/* Locations - UPDATED WITH COORDINATES */}
                  <div>
                      <h2 className="text-xl font-bold text-ocean-950 mb-4 flex items-center gap-2">
                          <Map size={20} className="text-ocean-500" /> Locais (Bairros)
                      </h2>
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex flex-col gap-3 mb-4">
                              <input 
                                type="text" 
                                placeholder="Nome do Local (ex: Prainha)..." 
                                className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-ocean-500 outline-none"
                                value={newLocName}
                                onChange={e => setNewLocName(e.target.value)}
                              />
                              <div className="border border-slate-100 rounded-xl overflow-hidden h-40">
                                  <LocationPicker 
                                    onLocationSelect={(lat, lng) => setNewLocCoords({lat, lng})}
                                    initialLat={-22.966} // Arraial default center
                                    initialLng={-42.026}
                                  />
                              </div>
                              <p className="text-[10px] text-slate-400">Clique no mapa para definir o centro deste bairro.</p>
                              
                              <button 
                                onClick={handleAddLocation} 
                                className="bg-ocean-600 hover:bg-ocean-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-bold text-sm w-full"
                              >
                                  <Plus size={16}/> Adicionar Bairro
                              </button>
                          </div>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                              {locations.map(loc => (
                                  <div key={loc.id} className="flex justify-between items-center bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl">
                                      <div>
                                          <span className="font-medium text-ocean-900 text-sm block">{loc.name}</span>
                                          {loc.lat && <span className="text-[10px] text-slate-400">GPS Definido</span>}
                                      </div>
                                      <button onClick={() => { if(confirm('Excluir local?')) { deleteLocation(loc.id); refreshAll(); } }} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  {/* Categories WITH SUBCATEGORIES */}
                  <div>
                      <h2 className="text-xl font-bold text-ocean-950 mb-4 flex items-center gap-2">
                          <LayoutGrid size={20} className="text-ocean-500" /> Categorias & Tags
                      </h2>
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex gap-2 mb-4">
                              <input 
                                type="text" 
                                placeholder="Nova Categoria Principal..." 
                                className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-ocean-500 outline-none"
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                              />
                              <button onClick={handleAddCategory} className="bg-ocean-600 hover:bg-ocean-700 text-white px-4 rounded-lg"><Plus size={20}/></button>
                          </div>
                          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                              {categories.map(cat => (
                                  <div key={cat.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                      <div className="flex justify-between items-center mb-3">
                                          <span className="font-bold text-ocean-900">{cat.name}</span>
                                          <button onClick={() => { if(confirm('Excluir categoria?')) { deleteCategory(cat.id); refreshAll(); } }} className="p-1 hover:text-red-500 text-slate-400"><X size={16} /></button>
                                      </div>
                                      
                                      {/* Subcategories Area */}
                                      <div className="bg-white border border-slate-100 rounded-lg p-3">
                                          <div className="flex flex-wrap gap-2 mb-2">
                                              {cat.subcategories && cat.subcategories.length > 0 ? (
                                                  cat.subcategories.map(sub => (
                                                      <span key={sub} className="bg-ocean-50 text-ocean-700 text-xs px-2 py-1 rounded-md flex items-center gap-1 border border-ocean-100">
                                                          {sub}
                                                          <button onClick={() => removeSubCategory(cat.id, sub)} className="hover:text-red-500"><X size={10}/></button>
                                                      </span>
                                                  ))
                                              ) : (
                                                  <span className="text-xs text-slate-400 italic">Sem subcategorias</span>
                                              )}
                                          </div>
                                          <div className="flex gap-2">
                                              <input 
                                                  id={`subinput-${cat.id}`}
                                                  type="text" 
                                                  placeholder="Add subcategoria..." 
                                                  className="flex-1 bg-slate-50 border-none rounded text-xs px-2 py-1 focus:ring-1 focus:ring-ocean-300"
                                                  onKeyDown={(e) => {
                                                      if(e.key === 'Enter') {
                                                          handleAddSubCategory(cat.id, e.currentTarget.value);
                                                          e.currentTarget.value = '';
                                                      }
                                                  }}
                                              />
                                              <button 
                                                  onClick={() => {
                                                      const input = document.getElementById(`subinput-${cat.id}`) as HTMLInputElement;
                                                      if(input) {
                                                          handleAddSubCategory(cat.id, input.value);
                                                          input.value = '';
                                                      }
                                                  }}
                                                  className="text-ocean-600 hover:bg-ocean-50 p-1 rounded"
                                              >
                                                  <Plus size={14}/>
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                   {/* Amenities */}
                   <div className="md:col-span-2">
                      <h2 className="text-xl font-bold text-ocean-900 mb-4 flex items-center gap-2">
                          <Coffee size={20} className="text-ocean-500" /> Comodidades (Amenities)
                      </h2>
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex gap-2 mb-4">
                              <input 
                                type="text" 
                                placeholder="Nova comodidade (ex: Vista p/ Mar)..." 
                                className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-ocean-500 outline-none"
                                value={newAmenityName}
                                onChange={e => setNewAmenityName(e.target.value)}
                              />
                              <button onClick={handleAddAmenity} className="bg-ocean-600 hover:bg-ocean-700 text-white px-4 rounded-lg"><Plus size={20}/></button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {amenities.map(a => (
                                  <div key={a.id} className="flex justify-between items-center bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-700">
                                      <span>{a.label}</span>
                                      <button onClick={() => { if(confirm('Excluir?')) { deleteAmenity(a.id); refreshAll(); } }} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

              </div>
          )}

      </div>
    </div>
  );
};
