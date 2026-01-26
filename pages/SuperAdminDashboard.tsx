
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
    saveBusiness,
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
    Check, X, Clock, Shield, Users, Settings, LayoutGrid, Map, Plus, Trash2, BookOpen, Edit, Save, Coffee, LogOut, User as UserIcon, Mail, Layers, Search, Star, MessageSquare, Palette, Lock, Unlock, Key, Building2, MapPin, Store, Crown, Filter
} from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';
import { LocationPicker } from '../components/LocationPicker';

interface SuperAdminDashboardProps {
  onNavigate: (page: string) => void;
  currentUser: User;
  onLogout: () => void;
}

type Tab = 'REQUESTS' | 'BUSINESSES' | 'USERS' | 'SETTINGS' | 'BLOG' | 'COLLECTIONS' | 'FEATURED' | 'SUPPORT' | 'BRANDING';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate, currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('REQUESTS');
  
  // Data States - Initialized with empty arrays to prevent undefined errors
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

  // Filter States for Businesses Tab
  const [businessFilter, setBusinessFilter] = useState<'ALL' | 'FEATURED'>('ALL');
  const [businessSearch, setBusinessSearch] = useState('');

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
    setRequests(getCompanyRequests() || []);
    setUsers(getAllUsers() || []);
    setCategories(getCategories() || []);
    setLocations(getLocations() || []);
    setAmenities(getAmenities() || []);
    setPosts(getBlogPosts() || []);
    setCollections(getCollections() || []);
    setAllBusinesses(getBusinesses() || []);
    setFeaturedConfig(getFeaturedConfig() || { title: '', subtitle: '', imageUrl: '', buttonText: '' });
    setSupportMessages(getSupportMessages() || []);
    setAppConfig(getAppConfig() || { appName: '', appNameHighlight: '' });
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

  const handleToggleFeaturedBusiness = (biz: BusinessProfile) => {
      const updated = { ...biz, isFeatured: !biz.isFeatured };
      saveBusiness(updated);
      setAllBusinesses(prev => prev.map(b => b.id === biz.id ? updated : b));
  };

  const handlePasswordReset = (e: React.FormEvent) => {
      e.preventDefault();
      if (!passwordResetModal || !passwordResetModal.pass) return;
      adminResetPassword(passwordResetModal.user.email, passwordResetModal.pass);
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

  // --- RENDERING PROTECTED FILTERS ---
  
  // CRITICAL FIX: Extremely defensive filtering to prevent toLowerCase crash
  const filteredBusinesses = (allBusinesses || []).filter(b => {
      const s = (businessSearch || '').toLowerCase();
      const matchesSearch = (b.name || '').toLowerCase().includes(s) || 
                            (b.category || '').toLowerCase().includes(s);
      const matchesFilter = businessFilter === 'ALL' || (businessFilter === 'FEATURED' && b.isFeatured);
      return matchesSearch && matchesFilter;
  });

  const pendingRequests = (requests || []).filter(r => r.status === 'PENDING');

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
                onClick={() => setActiveTab('BUSINESSES')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'BUSINESSES' ? 'bg-ocean-50 text-ocean-700' : 'text-slate-500 hover:bg-slate-50'}`}
             >
                 <Store size={18} /> Empresas
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
          
          {activeTab === 'REQUESTS' && (
              <div className="max-w-4xl">
                  <h1 className="text-2xl font-bold text-ocean-950 mb-6">Solicitações de Empresas</h1>
                  {pendingRequests.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
                          Nenhuma solicitação pendente no momento.
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {pendingRequests.map(req => (
                              <div key={req.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>
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
                                      <div className="flex flex-col gap-2 justify-center min-w-[140px]">
                                          <button onClick={() => handleApprove(req.id)} className="bg-green-100 hover:bg-green-200 text-green-700 text-sm font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                                              <Check size={16} /> Aprovar
                                          </button>
                                          <button onClick={() => handleReject(req.id)} className="bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                                              <X size={16} /> Rejeitar
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'BUSINESSES' && (
              <div className="max-w-5xl">
                  <div className="flex justify-between items-center mb-6">
                      <h1 className="text-2xl font-bold text-ocean-950">Gestão de Empresas & Destaques</h1>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
                          <div className="relative flex-1 w-full md:max-w-sm">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input 
                                type="text" 
                                placeholder="Buscar empresa..." 
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-ocean-500 outline-none"
                                value={businessSearch}
                                onChange={e => setBusinessSearch(e.target.value)}
                              />
                          </div>
                          <div className="flex gap-2 w-full md:w-auto">
                              <button 
                                onClick={() => setBusinessFilter('ALL')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${businessFilter === 'ALL' ? 'bg-ocean-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                              >
                                  Todas
                              </button>
                              <button 
                                onClick={() => setBusinessFilter('FEATURED')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${businessFilter === 'FEATURED' ? 'bg-gold-500 text-ocean-950' : 'bg-white border border-slate-200 text-slate-600'}`}
                              >
                                  <Crown size={16} fill="currentColor"/> Destaques
                              </button>
                          </div>
                      </div>

                      <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                              <tr>
                                  <th className="p-4 w-1/2">Empresa</th>
                                  <th className="p-4 hidden md:table-cell">Categoria</th>
                                  <th className="p-4 hidden md:table-cell">Reviews</th>
                                  <th className="p-4 text-center">Ação de Destaque</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                              {filteredBusinesses.map(biz => (
                                  <tr key={biz.id} className={`transition-colors ${biz.isFeatured ? 'bg-gold-50/50' : 'hover:bg-slate-50'}`}>
                                      <td className="p-4">
                                          <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                                  <img src={biz.coverImage} className="w-full h-full object-cover" />
                                              </div>
                                              <div>
                                                  <div className="font-bold text-ocean-900 flex items-center gap-2">
                                                      {biz.name}
                                                      {biz.isFeatured && <Crown size={14} className="text-gold-500 fill-gold-500"/>}
                                                  </div>
                                                  <div className="text-xs text-slate-500 truncate max-w-[200px]">{biz.address}</div>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="p-4 hidden md:table-cell">
                                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border border-slate-200">{biz.category}</span>
                                      </td>
                                      <td className="p-4 font-mono font-bold text-slate-700 hidden md:table-cell">
                                          {biz.reviewCount || 0}
                                      </td>
                                      <td className="p-4 text-center">
                                          <button 
                                            onClick={() => handleToggleFeaturedBusiness(biz)}
                                            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all w-full md:w-auto mx-auto ${
                                                biz.isFeatured 
                                                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                                                : 'bg-gold-100 text-gold-700 border border-gold-300 hover:bg-gold-200'
                                            }`}
                                          >
                                              <Crown size={14} fill={biz.isFeatured ? "none" : "currentColor"} />
                                              {biz.isFeatured ? "Remover Destaque" : "Tornar Destaque"}
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                      {filteredBusinesses.length === 0 && (
                          <div className="p-12 text-center text-slate-400 bg-slate-50">
                              <Search size={32} className="mx-auto mb-2 opacity-50"/>
                              <p>Nenhuma empresa encontrada com os filtros atuais.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {activeTab === 'BRANDING' && <div className="max-w-2xl"><h1 className="text-2xl font-bold text-ocean-950 mb-6">Identidade Visual & Marca</h1><div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg"><form onSubmit={handleSaveBranding} className="space-y-6"><div className="grid md:grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Principal</label><input className="w-full border rounded-lg p-3 font-bold text-lg" value={appConfig.appName} onChange={e => setAppConfig({...appConfig, appName: e.target.value})} placeholder="CONECTA" /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destaque (Cor)</label><input className="w-full border rounded-lg p-3 font-bold text-lg text-gold-500" value={appConfig.appNameHighlight} onChange={e => setAppConfig({...appConfig, appNameHighlight: e.target.value})} placeholder="RIO" /></div></div><div className="space-y-6"><ImageUpload label="Logo da Barra de Navegação (Pequeno)" currentImage={appConfig.logoUrl} onImageSelect={(base64) => setAppConfig({...appConfig, logoUrl: base64})} className="w-32" /><ImageUpload label="Logo de Login & Inscrição (Grande)" currentImage={appConfig.loginLogoUrl} onImageSelect={(base64) => setAppConfig({...appConfig, loginLogoUrl: base64})} className="w-48" /><ImageUpload label="Favicon (Ícone da Aba)" currentImage={appConfig.faviconUrl} onImageSelect={(base64) => setAppConfig({...appConfig, faviconUrl: base64})} className="w-16" /></div><button type="submit" className="w-full bg-ocean-600 text-white font-bold py-3 rounded-xl hover:bg-ocean-700 transition-colors shadow-lg">Salvar Identidade</button></form></div></div>}
          
          {activeTab === 'FEATURED' && <div className="max-w-2xl"><h1 className="text-2xl font-bold text-ocean-950 mb-6">Editar Destaque Premium (Home)</h1><div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg"><form onSubmit={handleSaveFeatured} className="space-y-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título Principal</label><input className="w-full border rounded-lg p-3" value={featuredConfig.title} onChange={e => setFeaturedConfig({...featuredConfig, title: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subtítulo / Descrição</label><textarea className="w-full border rounded-lg p-3" rows={3} value={featuredConfig.subtitle} onChange={e => setFeaturedConfig({...featuredConfig, subtitle: e.target.value})} /></div><div><ImageUpload label="Imagem de Fundo do Destaque" currentImage={featuredConfig.imageUrl} onImageSelect={(base64) => setFeaturedConfig({...featuredConfig, imageUrl: base64})} /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Texto do Botão</label><input className="w-full border rounded-lg p-3" value={featuredConfig.buttonText} onChange={e => setFeaturedConfig({...featuredConfig, buttonText: e.target.value})} /></div><button type="submit" className="w-full bg-ocean-600 text-white font-bold py-3 rounded-xl hover:bg-ocean-700 transition-colors">Salvar Alterações</button></form></div></div>}

          {activeTab === 'USERS' && (
              <div className="max-w-5xl">
                  <div className="flex justify-between items-center mb-6">
                      <h1 className="text-2xl font-bold text-ocean-950">Controle de Usuários</h1>
                      <button onClick={() => setShowNewCompany(true)} className="bg-ocean-600 hover:bg-ocean-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg"><Plus size={20} /> Nova Empresa</button>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                              <tr>
                                  <th className="p-4">Usuário</th>
                                  <th className="p-4">Tipo</th>
                                  <th className="p-4 text-right">Ações</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                              {(users || []).map(u => (
                                  <tr key={u.id} className={`transition-colors ${u.isBlocked ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                                      <td className="p-4">
                                          <div className="font-bold text-ocean-900 flex items-center gap-2">{(u.name || 'Sem Nome')}{u.isBlocked && <span className="bg-red-500 text-white text-[10px] px-2 rounded-full">BLOQUEADO</span>}</div>
                                          <div className="text-xs text-slate-500">{u.email}</div>
                                      </td>
                                      <td className="p-4">
                                          <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 text-purple-700' : u.role === UserRole.COMPANY ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                                      </td>
                                      <td className="p-4 text-right">
                                          <div className="flex justify-end gap-1">
                                              <button onClick={() => setPasswordResetModal({user: u, pass: ''})} className="text-slate-500 hover:bg-slate-100 p-2 rounded"><Key size={18} /></button>
                                              <button onClick={() => handleBlockToggle(u)} className={`${u.isBlocked ? 'text-red-600' : 'text-slate-500'} hover:bg-slate-100 p-2 rounded`}>{u.isBlocked ? <Lock size={18} /> : <Unlock size={18} />}</button>
                                              <button onClick={() => handleDeleteUser(u.id)} className="text-slate-400 hover:text-red-500 p-2 rounded"><Trash2 size={18} /></button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {activeTab === 'COLLECTIONS' && (
              <div className="max-w-6xl">
                  <div className="flex justify-between items-center mb-6">
                      <h1 className="text-2xl font-bold text-ocean-950">Coleções & Listas</h1>
                      <button onClick={() => setEditingCollection({ title: '', description: '', businessIds: [] })} className="bg-ocean-600 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg"><Plus size={20} /> Nova Coleção</button>
                  </div>
                  {editingCollection ? (
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl animate-in fade-in">
                          <form onSubmit={handleSaveCollection} className="space-y-6">
                              <div className="grid md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                      <div><label className="block text-xs font-bold uppercase mb-1">Título</label><input className="w-full border p-3 rounded-lg" value={editingCollection.title || ''} onChange={e => setEditingCollection({...editingCollection, title: e.target.value})} required /></div>
                                      <div><label className="block text-xs font-bold uppercase mb-1">Descrição</label><textarea className="w-full border p-3 rounded-lg" rows={3} value={editingCollection.description || ''} onChange={e => setEditingCollection({...editingCollection, description: e.target.value})} /></div>
                                      <div><ImageUpload label="Capa" currentImage={editingCollection.coverImage} onImageSelect={(base64) => setEditingCollection({...editingCollection, coverImage: base64})} /></div>
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                      <h4 className="font-bold text-sm mb-2">Empresas</h4>
                                      <div className="h-60 overflow-y-auto space-y-2 pr-2">
                                          {(allBusinesses || []).filter(b => (b.name || '').toLowerCase().includes((collectionSearch || '').toLowerCase())).map(biz => (
                                              <label key={biz.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-100 cursor-pointer">
                                                  <input type="checkbox" checked={editingCollection.businessIds?.includes(biz.id) || false} onChange={() => toggleBusinessInCollection(biz.id)} />
                                                  <span className="text-sm">{(biz.name || 'Sem Nome')}</span>
                                              </label>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setEditingCollection(null)} className="px-6 py-2 rounded-lg border">Cancelar</button><button type="submit" className="px-8 py-2 rounded-lg bg-ocean-600 text-white font-bold">Salvar</button></div>
                          </form>
                      </div>
                  ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(collections || []).map(col => (
                              <div key={col.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm p-4">
                                  <h3 className="font-bold text-ocean-900">{col.title}</h3>
                                  <div className="flex gap-2 mt-4"><button onClick={() => setEditingCollection(col)} className="text-ocean-600"><Edit size={16}/></button><button onClick={() => handleDeleteCollection(col.id)} className="text-red-400"><Trash2 size={16}/></button></div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'BLOG' && (
              <div className="max-w-6xl">
                  <div className="flex justify-between items-center mb-6">
                      <h1 className="text-2xl font-bold text-ocean-950">Blog</h1>
                      <button onClick={() => setEditingPost({ title: '', excerpt: '', content: '' })} className="bg-ocean-600 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2"><Plus size={20} /> Novo Post</button>
                  </div>
                  {editingPost ? (
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg animate-in fade-in">
                          <form onSubmit={handleSavePost} className="space-y-4">
                              <input className="w-full border p-3 rounded-lg" value={editingPost.title || ''} onChange={e => setEditingPost({...editingPost, title: e.target.value})} required placeholder="Título" />
                              <textarea className="w-full border p-3 rounded-lg" rows={3} value={editingPost.excerpt || ''} onChange={e => setEditingPost({...editingPost, excerpt: e.target.value})} required placeholder="Resumo" />
                              <div className="flex gap-3"><button type="button" onClick={() => setEditingPost(null)} className="px-6 py-2 rounded-lg border">Cancelar</button><button type="submit" className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold">Salvar</button></div>
                          </form>
                      </div>
                  ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(posts || []).map(post => (
                              <div key={post.id} className="bg-white rounded-xl border border-slate-100 p-4">
                                  <h3 className="font-bold text-ocean-950">{(post.title || 'Sem Título')}</h3>
                                  <div className="flex justify-end gap-2 mt-4"><button onClick={() => setEditingPost(post)} className="text-ocean-600"><Edit size={16}/></button><button onClick={() => handleDeletePost(post.id)} className="text-red-400"><Trash2 size={16}/></button></div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'SUPPORT' && <div className="max-w-4xl"><h1 className="text-2xl font-bold text-ocean-950 mb-6">Suporte</h1><div className="space-y-4">{(supportMessages || []).length === 0 ? (<div className="text-center py-10 text-slate-400">Vazio.</div>) : supportMessages.map(msg => (<div key={msg.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><h3 className="font-bold text-ocean-900">{msg.userName}</h3><p className="text-slate-700 text-sm bg-slate-50 p-4 rounded-xl">{msg.message}</p></div>))}</div></div>}

          {activeTab === 'SETTINGS' && (
              <div className="max-w-6xl grid md:grid-cols-2 gap-8 pb-12">
                  <div>
                      <h2 className="text-xl font-bold text-ocean-950 mb-4 flex items-center gap-2"><Map size={20} className="text-ocean-500" /> Bairros</h2>
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                          <input type="text" placeholder="Nome do Bairro..." className="w-full border rounded-lg px-4 py-2 mb-2" value={newLocName} onChange={e => setNewLocName(e.target.value)} />
                          <button onClick={handleAddLocation} className="bg-ocean-600 text-white px-4 py-2 rounded-lg w-full font-bold">Adicionar</button>
                          <div className="space-y-2 mt-4">{(locations || []).map(loc => (<div key={loc.id} className="flex justify-between bg-slate-50 p-2 rounded">{loc.name}<button onClick={() => { deleteLocation(loc.id); refreshAll(); }} className="text-red-500"><X size={16}/></button></div>))}</div>
                      </div>
                  </div>
                  <div>
                      <h2 className="text-xl font-bold text-ocean-950 mb-4 flex items-center gap-2"><LayoutGrid size={20} className="text-ocean-500" /> Categorias</h2>
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                          <input type="text" placeholder="Nova Categoria..." className="w-full border rounded-lg px-4 py-2 mb-2" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                          <button onClick={handleAddCategory} className="bg-ocean-600 text-white px-4 py-2 rounded-lg w-full font-bold">Adicionar</button>
                          <div className="space-y-2 mt-4">{(categories || []).map(cat => (<div key={cat.id} className="bg-slate-50 p-2 rounded flex justify-between">{cat.name}<button onClick={() => { deleteCategory(cat.id); refreshAll(); }} className="text-red-500"><X size={16}/></button></div>))}</div>
                      </div>
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};
