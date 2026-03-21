import React, { useState, useEffect } from 'react';
import { User, Coupon, BusinessProfile, DEFAULT_AMENITIES, MenuSection, MenuItem, CompanyRequest, UserRole, PricingPlan, HomeHighlight, City, Neighborhood } from '../types';
import { getCoupons, saveCoupon, deleteCoupon, getBusinesses, getAllBusinesses, saveBusiness, getBusinessStats, getCategories, saveCategory, getCompanyRequests, approveCompanyRequest, rejectCompanyRequest, getAllUsers, toggleBusinessStatus, deleteBusinessPermanently, setManualPassword, resetUserPassword, createAdminPlace, updateClaimableStatus, getPricingPlans, savePricingPlan, deletePricingPlan, getAllHomeHighlights, saveHomeHighlight, deleteHomeHighlight, getCities, getNeighborhoods, saveCity, saveNeighborhood, deleteCity, deleteNeighborhood, updateBusinessPlan } from '../services/dataService';
import { 
  Plus, Ticket, Store, Loader2, Star, Eye, 
  Settings, ChevronLeft, Save, Trash2, X,
  BarChart3, CheckCircle2, DollarSign, 
  TrendingUp, Share2, MousePointer2, PieChart as PieIcon,
  Navigation, Utensils, Instagram, Share, Globe, ShoppingCart, CalendarDays, Phone, MapPin, Check, Clock, MessageCircle, Layers, Zap,
  Mail, User as UserIcon, ShieldAlert, ShieldCheck, UserX, Key, Lock, Layout, ShoppingBag, PenTool, Users
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { ImageUpload } from '../components/ImageUpload';
import { LocationPicker } from '../components/LocationPicker';
import { BusinessHoursEditor } from '../components/BusinessHoursEditor';

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export const AdminDashboard: React.FC<{ currentUser: User; onNavigate: (page: string, params?: any) => void; onLogout: () => void }> = ({ currentUser, onNavigate, onLogout }) => {
  const [view, setView] = useState<'HOME' | 'COUPONS' | 'PROFILE' | 'CREATE_COUPON' | 'MENU' | 'CATEGORIES' | 'REQUESTS' | 'BUSINESSES' | 'CREATE_PLACE' | 'PLANS' | 'HIGHLIGHTS' | 'LOCATIONS' | 'USERS' | 'REASSIGN_COUPONS'>('HOME');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [myBusiness, setMyBusiness] = useState<BusinessProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [newSubcategory, setNewSubcategory] = useState<{ [key: string]: string }>({});
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [highlights, setHighlights] = useState<HomeHighlight[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newJournalist, setNewJournalist] = useState({ name: '', email: '', password: '' });

  const [editBusiness, setEditBusiness] = useState<Partial<BusinessProfile>>({});
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    title: '',
    description: '',
    originalPrice: 0,
    discountedPrice: 0,
    category: currentUser.category || 'Gastronomia',
    active: true,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    rules: [],
    maxRedemptions: 100,
    limitPerUser: 1,
    companyId: currentUser.role === UserRole.COMPANY ? currentUser.id : '',
    companyName: currentUser.role === UserRole.COMPANY ? (myBusiness?.name || currentUser.companyName || currentUser.name) : ''
  });
  
  const [allBusinesses, setAllBusinesses] = useState<BusinessProfile[]>([]);
  
  useEffect(() => {
      setAllBusinesses(getAllBusinesses());
  }, []);


  const [newPlace, setNewPlace] = useState<Partial<BusinessProfile>>({
    name: '',
    description: '',
    category: 'Passeios',
    coverImage: '',
    address: '',
    canBeClaimed: true,
    openingHours: {},
    plan: ''
  });

  const [newPlan, setNewPlan] = useState<Partial<PricingPlan>>({
    name: '',
    price: 0,
    period: 'monthly',
    maxCoupons: 5,
    maxBusinesses: 1,
    isFeatured: false,
    showGallery: true,
    showMenu: true,
    showSocialMedia: true,
    showReviews: true,
    active: true
  });

  const refreshData = async () => {
    const allCoupons = await getCoupons();
    if (currentUser.role === UserRole.SUPER_ADMIN) {
        setCoupons(allCoupons);
    } else {
        setCoupons(allCoupons.filter(c => c.companyId === currentUser.id));
    }
    const biz = getAllBusinesses().find(b => b.id === currentUser.id);
    if (biz) {
        setMyBusiness(biz);
        setEditBusiness(prev => Object.keys(prev).length === 0 ? biz : prev);
        setNewCoupon(prev => ({
            ...prev,
            companyName: biz.name,
            companyId: biz.id
        }));
    }
    setAllBusinesses(getAllBusinesses());
    const s = await getBusinessStats(currentUser.id);
    setStats(s);
    setCategories(getCategories());
    setCities(getCities());
    setNeighborhoods(getNeighborhoods());
    
    if (currentUser.role === UserRole.SUPER_ADMIN) {
        const allRequests = getCompanyRequests();
        setRequests(allRequests.filter(r => r.status === 'PENDING'));
        setPlans(getPricingPlans());
        setHighlights(getAllHomeHighlights());
        setUsers(getAllUsers());
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener('dataUpdated', handleUpdate);
    return () => window.removeEventListener('dataUpdated', handleUpdate);
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myBusiness) return;
    setIsSaving(true);
    try {
        await saveBusiness({ ...myBusiness, ...editBusiness } as BusinessProfile);
        alert("Alterações salvas com sucesso!");
        setView('HOME');
        refreshData();
    } catch (error) {
        alert("Erro ao salvar alterações. Tente novamente.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleAddMenuSection = () => {
      const currentMenu = [...(editBusiness.menu || [])];
      currentMenu.push({ title: 'Nova Categoria', items: [] });
      setEditBusiness({ ...editBusiness, menu: currentMenu });
  };

  const handleAddMenuItem = (sectionIndex: number) => {
      const currentMenu = [...(editBusiness.menu || [])];
      currentMenu[sectionIndex].items.push({
          id: `item_${Date.now()}`,
          name: 'Novo Item',
          price: 0,
          description: ''
      });
      setEditBusiness({ ...editBusiness, menu: currentMenu });
  };

  const handleDeleteMenuItem = (sectionIndex: number, itemIndex: number) => {
      const currentMenu = [...(editBusiness.menu || [])];
      currentMenu[sectionIndex].items.splice(itemIndex, 1);
      setEditBusiness({ ...editBusiness, menu: currentMenu });
  };

  const handleAddSubcategory = async (categoryId: string) => {
    const subcategoryName = newSubcategory[categoryId]?.trim();
    if (!subcategoryName) return;

    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const updatedCategory = {
        ...category,
        subcategories: [...(category.subcategories || []), subcategoryName]
    };

    await saveCategory(updatedCategory);
    setNewSubcategory({ ...newSubcategory, [categoryId]: '' });
  };

  const handleDeleteSubcategory = async (categoryId: string, subcategoryName: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const updatedCategory = {
        ...category,
        subcategories: (category.subcategories || []).filter((s: string) => s !== subcategoryName)
    };

    await saveCategory(updatedCategory);
  };

  const handleApprove = async (requestId: string) => {
    await approveCompanyRequest(requestId);
    refreshData();
  };

  const handleReject = async (requestId: string) => {
    await rejectCompanyRequest(requestId);
    refreshData();
  };

  const handleCreatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        await createAdminPlace(newPlace);
        alert("Lugar cadastrado com sucesso no guia!");
        setView('BUSINESSES');
        setNewPlace({
            name: '',
            description: '',
            category: 'Passeios',
            coverImage: '',
            address: '',
            canBeClaimed: true,
            openingHours: {},
            plan: ''
        });
        refreshData();
    } catch (err) {
        alert("Erro ao cadastrar lugar.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        await savePricingPlan(newPlan);
        alert("Plano salvo com sucesso!");
        setNewPlan({
            name: '',
            price: 0,
            period: 'monthly',
            maxCoupons: 5,
            maxBusinesses: 1,
            isFeatured: false,
            showGallery: true,
            showMenu: true,
            showSocialMedia: true,
            showReviews: true,
            active: true
        });
        refreshData();
    } catch (err) {
        alert("Erro ao salvar plano.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (confirm("Deseja excluir este plano?")) {
        await deletePricingPlan(id);
        refreshData();
    }
  };

  if (loading && !stats) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-ocean-600" size={48} /></div>;

  const renderName = () => {
      const name = myBusiness?.name || (currentUser.companyName !== 'Minha Empresa' ? currentUser.companyName : null) || currentUser.name;
      return typeof name === 'string' ? name : 'Empresa';
  };

  return (
    <div className="pb-32 pt-10 px-4 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      
      {/* HEADER DE PERFORMANCE */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-ocean-600 rounded-3xl overflow-hidden shadow-xl">
                  {(editBusiness.coverImage || myBusiness?.coverImage) && <img src={editBusiness.coverImage || myBusiness?.coverImage} className="w-full h-full object-cover" />}
              </div>
              <div>
                  <h1 className="text-3xl font-black text-ocean-950 tracking-tight">
                      {renderName()}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-ocean-600 font-black uppercase tracking-widest">Painel Administrativo</p>
                      {currentUser.role === UserRole.COMPANY && currentUser.plan && (
                          <span className="bg-gold-50 text-gold-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-gold-100 flex items-center gap-1">
                              <Star size={10} /> {currentUser.plan}
                          </span>
                      )}
                  </div>
              </div>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
                {currentUser.role === UserRole.SUPER_ADMIN ? (
                    <>
                        <button 
                            onClick={() => setView('REQUESTS')}
                            className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 relative ${view === 'REQUESTS' ? 'bg-amber-500 text-white shadow-lg' : 'bg-white border border-slate-100 text-amber-600 shadow-sm'}`}>
                            <Layers size={18} /> SOLICITAÇÕES
                            {requests.length > 0 && (
                                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] border-2 border-white animate-bounce">
                                    {requests.length}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={() => setView('BUSINESSES')} 
                            className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'BUSINESSES' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-blue-600 shadow-sm'}`}>
                            <Store size={18} /> EMPRESAS
                        </button>
                        <button 
                            onClick={() => setView('CATEGORIES')} 
                            className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'CATEGORIES' ? 'bg-ocean-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-ocean-600 shadow-sm'}`}>
                            <Layers size={18} /> CATEGORIAS
                        </button>
                        <button 
                            onClick={() => setView('PLANS')} 
                            className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'PLANS' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-purple-600 shadow-sm'}`}>
                            <Zap size={18} /> PLANOS
                        </button>
                        <button 
                            onClick={() => setView('HIGHLIGHTS')} 
                            className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'HIGHLIGHTS' ? 'bg-pink-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-pink-600 shadow-sm'}`}>
                            <Layout size={18} /> DESTAQUES
                        </button>
                        <button 
                            onClick={() => setView('USERS')} 
                            className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'USERS' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-indigo-600 shadow-sm'}`}>
                            <Users size={18} /> USUÁRIOS
                        </button>
                        <button 
                            onClick={() => setView('LOCATIONS')} 
                            className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'LOCATIONS' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-emerald-600 shadow-sm'}`}>
                            <MapPin size={18} /> LOCAIS
                        </button>
                        <button 
                            onClick={async () => {
                                if (confirm("Deseja atualizar todas as empresas sem local para Rio de Janeiro / Sepetiba?")) {
                                    const { updateBusinessesWithLocation } = await import('../services/dataService');
                                    const res = await updateBusinessesWithLocation();
                                    if (res.success) {
                                        alert(`Atualização concluída! ${res.updatedCount} empresas atualizadas.`);
                                        refreshData();
                                    } else {
                                        alert("Erro ao atualizar empresas.");
                                    }
                                }
                            }}
                            className="px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 bg-slate-800 text-white shadow-lg hover:bg-slate-900">
                            <MapPin size={18} /> FIX LOCAIS
                        </button>
                    </>
                ) : (
                    <>
                        <button 
                            onClick={() => setView('MENU')} 
                            className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'MENU' ? 'bg-ocean-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-ocean-600 shadow-sm'}`}
                        >
                            <Utensils size={18} /> CARDÁPIO
                        </button>
                        <button 
                            onClick={() => onNavigate('pricing-plans')} 
                            className="bg-gradient-to-tr from-gold-500 to-gold-400 text-white px-6 py-4 rounded-2xl font-black text-xs shadow-lg shadow-gold-500/20 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Star size={18} /> MEU PLANO
                        </button>
                        <button 
                            onClick={() => setView(view === 'PROFILE' ? 'HOME' : 'PROFILE')} 
                            className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'PROFILE' ? 'bg-slate-200 text-slate-700' : 'bg-white border border-slate-100 text-ocean-600 shadow-sm'}`}
                        >
                            <Settings size={18} /> {view === 'PROFILE' ? 'VOLTAR' : 'CONFIGURAR PERFIL'}
                        </button>
                        <button onClick={() => setView('CREATE_COUPON')} className="bg-ocean-600 text-white px-6 py-4 rounded-2xl font-black text-xs shadow-lg shadow-ocean-600/20 active:scale-95 transition-all">
                            + NOVO CUPOM
                        </button>
                    </>
                )}
                <button onClick={onLogout} className="px-6 py-4 bg-red-50 text-red-500 rounded-2xl font-black text-xs">SAIR</button>
          </div>
      </div>

      {view === 'HOME' && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {currentUser.role === UserRole.SUPER_ADMIN ? (
                  <div className="lg:col-span-12 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div className="bg-amber-500 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group cursor-pointer" onClick={() => setView('REQUESTS')}>
                              <Layers className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform" />
                              <p className="text-[10px] font-black text-amber-100 uppercase tracking-widest mb-2">Reivindicações</p>
                              <h3 className="text-4xl font-black">{requests.filter(r => r.type === 'CLAIM').length}</h3>
                              <p className="text-amber-100 text-[10px] font-bold mt-2">Empresas Reivindicadas</p>
                          </div>
                          <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group cursor-pointer" onClick={() => setView('REQUESTS')}>
                              <Layers className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform" />
                              <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-2">Leads de Cadastro</p>
                              <h3 className="text-4xl font-black">{requests.filter(r => r.type === 'NEW_REGISTRATION').length}</h3>
                              <p className="text-blue-100 text-[10px] font-bold mt-2">Novos Parceiros</p>
                          </div>
                          <div className="bg-ocean-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group cursor-pointer" onClick={() => setView('CATEGORIES')}>
                              <Layers className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform" />
                              <p className="text-[10px] font-black text-ocean-100 uppercase tracking-widest mb-2">Total de Categorias</p>
                              <h3 className="text-4xl font-black">{categories.length}</h3>
                              <p className="text-ocean-100 text-[10px] font-bold mt-2">Gestão de Segmentos</p>
                          </div>
                          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all group" onClick={() => setView('BUSINESSES')}>
                              <div className="flex justify-between items-start mb-2">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresas Ativas</p>
                                 <Store size={16} className="text-ocean-500 group-hover:scale-110 transition-transform" />
                              </div>
                              <h3 className="text-4xl font-black text-ocean-950">{getAllBusinesses().length}</h3>
                              <p className="text-slate-400 text-[10px] font-bold mt-2">Gerenciar Lojistas</p>
                          </div>
                          <div className="bg-purple-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group cursor-pointer" onClick={() => setView('PLANS')}>
                              <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform" />
                              <p className="text-[10px] font-black text-purple-100 uppercase tracking-widest mb-2">Planos de Assinatura</p>
                              <h3 className="text-4xl font-black">{plans.length}</h3>
                              <p className="text-purple-100 text-[10px] font-bold mt-2">Configurar Planos</p>
                          </div>
                          <div className="bg-pink-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group cursor-pointer" onClick={() => setView('HIGHLIGHTS')}>
                              <Layout className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform" />
                              <p className="text-[10px] font-black text-pink-100 uppercase tracking-widest mb-2">Destaques Home</p>
                              <h3 className="text-4xl font-black">{highlights.length}</h3>
                              <p className="text-pink-100 text-[10px] font-bold mt-2">Gerenciar Banners</p>
                          </div>
                      </div>

                      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                          <h3 className="text-xl font-black text-ocean-950 mb-6">Bem-vindo, Super Admin</h3>
                          <p className="text-slate-500 leading-relaxed">
                              Este é o seu painel de controle mestre. Aqui você pode gerenciar as solicitações de novas empresas, 
                              ajustar as categorias do sistema e monitorar o crescimento da plataforma.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                              <button onClick={() => setView('REQUESTS')} className="bg-slate-50 hover:bg-amber-50 p-6 rounded-2xl border border-slate-100 transition-all text-left">
                                  <h4 className="font-bold text-amber-600 mb-1">Ver Solicitações</h4>
                                  <p className="text-xs text-slate-500">Aprove ou rejeite novos parceiros.</p>
                              </button>
                              <button onClick={() => setView('CATEGORIES')} className="bg-slate-50 hover:bg-ocean-50 p-6 rounded-2xl border border-slate-100 transition-all text-left">
                                  <h4 className="font-bold text-ocean-600 mb-1">Gerenciar Categorias</h4>
                                  <p className="text-xs text-slate-500">Adicione ou remova subcategorias.</p>
                              </button>
                              <button onClick={() => setView('PLANS')} className="bg-slate-50 hover:bg-purple-50 p-6 rounded-2xl border border-slate-100 transition-all text-left">
                                  <h4 className="font-bold text-purple-600 mb-1">Planos de Assinatura</h4>
                                  <p className="text-xs text-slate-500">Crie planos personalizados para parceiros.</p>
                              </button>
                              <button onClick={() => setView('HIGHLIGHTS')} className="bg-slate-50 hover:bg-pink-50 p-6 rounded-2xl border border-slate-100 transition-all text-left">
                                  <h4 className="font-bold text-pink-600 mb-1">Destaques da Home</h4>
                                  <p className="text-xs text-slate-500">Gerencie o carrossel de banners da home.</p>
                              </button>
                              <button onClick={() => setView('REASSIGN_COUPONS')} className="bg-slate-50 hover:bg-amber-50 p-6 rounded-2xl border border-slate-100 transition-all text-left">
                                  <h4 className="font-bold text-amber-600 mb-1">Reatribuir Cupons</h4>
                                  <p className="text-xs text-slate-500">Corrija a empresa responsável pelos cupons.</p>
                              </button>
                          </div>
                      </div>
                  </div>
              ) : (
                  <>
                      {/* KPIs DE CONVERSÃO */}
                      <div className="lg:col-span-8 space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="bg-ocean-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                                  <MousePointer2 className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:scale-110 transition-transform" />
                                  <p className="text-[10px] font-black text-ocean-400 uppercase tracking-widest mb-2">Total de Resgates</p>
                                  <h3 className="text-4xl font-black">{stats.totalConversions}</h3>
                                  <p className="text-ocean-200 text-[10px] font-bold mt-2">Leads Gerados pelo Guia</p>
                              </div>
                              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                  <div className="flex justify-between items-start mb-2">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compartilhamentos</p>
                                     <Share2 size={16} className="text-ocean-500" />
                                  </div>
                                  <h3 className="text-4xl font-black text-ocean-950">{stats.shares}</h3>
                                  <p className="text-slate-400 text-[10px] font-bold mt-2">Engajamento Social</p>
                              </div>
                              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                  <div className="flex justify-between items-start mb-2">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visitas Totais</p>
                                     <Eye size={16} className="text-ocean-500" />
                                  </div>
                                  <h3 className="text-4xl font-black text-ocean-950">{stats.views}</h3>
                                  <p className="text-slate-400 text-[10px] font-bold mt-2">Audiência da Página</p>
                              </div>
                          </div>

                          {/* GRÁFICO DE TENDÊNCIA DE CONVERSÃO */}
                          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                              <h3 className="text-lg font-black text-ocean-950 mb-8 flex items-center gap-3">
                                  <TrendingUp className="text-ocean-600" size={20} /> Fluxo de Resgates (Últimos 7 dias)
                              </h3>
                              <div className="h-72 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={stats.conversionTrend}>
                                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold', fill: '#94a3b8'}} />
                                          <YAxis hide />
                                          <Tooltip 
                                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ fontWeight: 'black', color: '#0f172a' }}
                                          />
                                          <Area type="monotone" dataKey="valor" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorRes)" />
                                          <defs>
                                              <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                                                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                                                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                              </linearGradient>
                                          </defs>
                                      </AreaChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>
                      </div>

                      {/* GRÁFICOS LATERAIS - ORIGEM E HEATMAP */}
                      <div className="lg:col-span-4 space-y-8">
                          {/* HEATMAP DE CLIQUES - AGORA COM DADOS REAIS DE BOTÕES */}
                          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                              <h3 className="text-lg font-black text-ocean-950 mb-6 flex items-center gap-3">
                                  <BarChart3 className="text-ocean-600" size={20} /> Comportamento (Botões)
                              </h3>
                              <div className="h-[400px] w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={stats.actionHeatmap} layout="vertical">
                                          <XAxis type="number" hide />
                                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} width={90} />
                                          <Tooltip 
                                            cursor={{fill: 'transparent'}}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                          />
                                          <Bar dataKey="cliques" radius={[0, 10, 10, 0]}>
                                              {stats.actionHeatmap.map((_: any, index: number) => (
                                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                              ))}
                                          </Bar>
                                      </BarChart>
                                  </ResponsiveContainer>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-4 text-center font-bold uppercase">Métricas em tempo real</p>
                          </div>

                          {/* ORIGEM DO TRÁFEGO */}
                          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                              <h3 className="text-lg font-black text-ocean-950 mb-6 flex items-center gap-3">
                                  <PieIcon className="text-ocean-600" size={20} /> Origem das Visitas
                              </h3>
                              <div className="h-64 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                          <Pie
                                            data={stats.trafficSource}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                            dataKey="value"
                                          >
                                            {stats.trafficSource.map((_: any, index: number) => (
                                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                          </Pie>
                                          <Tooltip />
                                          <Legend verticalAlign="bottom" align="center" iconType="circle" />
                                      </PieChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>
                      </div>
                  </>
              )}
          </div>
      )}
      {view === 'USERS' && (
          <div className="space-y-8">
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-black text-ocean-950 mb-4">Criar Novo Jornalista</h3>
                  <p className="text-sm text-slate-500 mb-6">Crie um novo usuário com acesso direto ao Painel do Jornalista.</p>
                  
                  <form 
                      onSubmit={async (e) => {
                          e.preventDefault();
                          if (!newJournalist.name || !newJournalist.email || !newJournalist.password) {
                              alert('Preencha todos os campos.');
                              return;
                          }
                          setIsSaving(true);
                          try {
                              const { createJournalistUser } = await import('../services/dataService');
                              await createJournalistUser(newJournalist.name, newJournalist.email, newJournalist.password);
                              alert('Jornalista criado com sucesso!');
                              setNewJournalist({ name: '', email: '', password: '' });
                              refreshData();
                          } catch (error: any) {
                              alert('Erro ao criar jornalista: ' + error.message);
                          } finally {
                              setIsSaving(false);
                          }
                      }}
                      className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
                  >
                      <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nome</label>
                          <input 
                              required 
                              className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-ocean-500" 
                              value={newJournalist.name} 
                              onChange={e => setNewJournalist({...newJournalist, name: e.target.value})} 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
                          <input 
                              required 
                              type="email"
                              className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-ocean-500" 
                              value={newJournalist.email} 
                              onChange={e => setNewJournalist({...newJournalist, email: e.target.value})} 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Senha</label>
                          <input 
                              required 
                              type="password"
                              className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-ocean-500" 
                              value={newJournalist.password} 
                              onChange={e => setNewJournalist({...newJournalist, password: e.target.value})} 
                          />
                      </div>
                      <button 
                          type="submit" 
                          disabled={isSaving}
                          className="bg-indigo-600 text-white p-3 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                          {isSaving ? 'Criando...' : 'Criar Jornalista'}
                      </button>
                  </form>
              </div>

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
                      {users.map(u => (
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
                                  <div className="flex flex-col gap-1">
                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase w-fit ${u.role === UserRole.SUPER_ADMIN ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                      {u.role}
                                    </span>
                                  </div>
                              </td>
                              <td className="px-6 py-5">
                                  <div className="flex justify-center items-center gap-2">
                                      {u.role !== UserRole.SUPER_ADMIN && u.role !== UserRole.JOURNALIST && (
                                          <button 
                                              onClick={async () => {
                                                  if (confirm(`Deseja transformar ${u.name} em Jornalista?`)) {
                                                      const { updateUser } = await import('../services/dataService');
                                                      await updateUser({ ...u, role: UserRole.JOURNALIST });
                                                      alert(`${u.name} agora é um Jornalista!`);
                                                      refreshData();
                                                  }
                                              }}
                                              className="p-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"
                                              title="Tornar Jornalista"
                                          >
                                              <PenTool size={18} />
                                          </button>
                                      )}
                                      {u.role === UserRole.JOURNALIST && (
                                          <button 
                                              onClick={async () => {
                                                  if (confirm(`Deseja remover o acesso de Jornalista de ${u.name}?`)) {
                                                      const { updateUser } = await import('../services/dataService');
                                                      await updateUser({ ...u, role: UserRole.CUSTOMER });
                                                      alert(`${u.name} agora é um Cliente comum.`);
                                                      refreshData();
                                                  }
                                              }}
                                              className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-indigo-100"
                                              title="Remover Acesso de Jornalista"
                                          >
                                              <PenTool size={18} />
                                          </button>
                                      )}
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
      )}

      {view === 'PROFILE' && (
          <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6 space-y-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase">
                    <ChevronLeft size={16} /> Voltar ao Painel
                  </button>
                  <button form="profile-form" type="submit" disabled={isSaving} className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg flex items-center gap-2 hover:bg-green-700 transition-all">
                      {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} SALVAR CONFIGURAÇÕES
                  </button>
              </div>

              <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-12">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                      {/* COLUNA ESQUERDA: VISUAL */}
                      <div className="lg:col-span-1 space-y-8">
                          <ImageUpload 
                            label="Imagem de Capa (Ideal: 1200x600px)" 
                            currentImage={editBusiness.coverImage} 
                            onImageSelect={img => setEditBusiness({...editBusiness, coverImage: img})} 
                          />

                          <div className="space-y-4">
                              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Galeria de Fotos</label>
                              <div className="grid grid-cols-2 gap-4">
                                  {editBusiness.gallery?.map((img, idx) => (
                                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm border border-slate-100">
                                          <img src={img} className="w-full h-full object-cover" />
                                          <button 
                                              type="button"
                                              onClick={() => {
                                                  const newGallery = [...(editBusiness.gallery || [])];
                                                  newGallery.splice(idx, 1);
                                                  setEditBusiness({...editBusiness, gallery: newGallery});
                                              }}
                                              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                          >
                                              <X size={12} />
                                          </button>
                                      </div>
                                  ))}
                                  <ImageUpload 
                                      allowMultiple 
                                      className="aspect-square"
                                      onBatchSelect={imgs => {
                                          setEditBusiness({
                                              ...editBusiness, 
                                              gallery: [...(editBusiness.gallery || []), ...imgs]
                                          });
                                      }} 
                                  />
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium">Adicione fotos do ambiente, produtos ou serviços para atrair mais clientes.</p>
                          </div>
                      </div>

                      {/* COLUNA CENTRAL: INFO BÁSICA & CONTATO */}
                      <div className="lg:col-span-2 space-y-10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="col-span-full">
                                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nome da Empresa</label>
                                  <input required className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-lg focus:ring-2 focus:ring-ocean-500 outline-none transition-all" value={editBusiness.name} onChange={e => setEditBusiness({...editBusiness, name: e.target.value})} />
                              </div>

                              <div>
                                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Categoria Principal</label>
                                  <select 
                                    className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none"
                                    value={editBusiness.category}
                                    onChange={e => setEditBusiness({...editBusiness, category: e.target.value})}
                                  >
                                      {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                  </select>
                              </div>

                              <div className="col-span-full pt-6 border-t border-slate-100">
                                  <div className="flex items-center gap-2 mb-4">
                                      <Lock size={18} className="text-ocean-600" />
                                      <h3 className="text-sm font-black text-ocean-950 uppercase tracking-widest">Segurança da Conta</h3>
                                  </div>
                                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-end gap-4">
                                      <div className="flex-1 w-full">
                                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Nova Senha de Acesso</label>
                                          <input 
                                            type="password"
                                            placeholder="Digite a nova senha"
                                            className="w-full bg-white p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                          />
                                      </div>
                                      <button 
                                        type="button"
                                        disabled={!newPassword || isChangingPassword}
                                        onClick={async () => {
                                            if (!confirm("Deseja alterar sua senha de acesso?")) return;
                                            setIsChangingPassword(true);
                                            try {
                                                await setManualPassword(currentUser.id, newPassword);
                                                alert("Senha alterada com sucesso! Use a nova senha no próximo login.");
                                                setNewPassword('');
                                            } catch (err) {
                                                alert("Erro ao alterar senha.");
                                            } finally {
                                                setIsChangingPassword(false);
                                            }
                                        }}
                                        className="bg-ocean-600 text-white px-6 py-4 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-ocean-600/20 hover:bg-ocean-700 transition-all disabled:opacity-50"
                                      >
                                          {isChangingPassword ? <Loader2 className="animate-spin" size={16} /> : "Atualizar Senha"}
                                      </button>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-bold mt-3 ml-1">
                                      * Esta senha será usada para o login manual. Você também pode solicitar um link de recuperação por e-mail na página de login.
                                  </p>
                              </div>

                              <div>
                                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Subcategoria (Opcional)</label>
                                  <select 
                                    className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none"
                                    value={editBusiness.subcategory}
                                    onChange={e => setEditBusiness({...editBusiness, subcategory: e.target.value})}
                                    disabled={!editBusiness.category || !categories.find(c => c.name === editBusiness.category)?.subcategories?.length}
                                  >
                                      <option value="">Selecione</option>
                                      {categories.find(c => c.name === editBusiness.category)?.subcategories.map((sub: string) => (
                                          <option key={sub} value={sub}>{sub}</option>
                                      ))}
                                  </select>
                              </div>

                              <div className="col-span-full">
                                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Descrição / História</label>
                                  <textarea className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed text-sm outline-none" rows={4} placeholder="Conte um pouco sobre o seu negócio..." value={editBusiness.description} onChange={e => setEditBusiness({...editBusiness, description: e.target.value})} />
                              </div>
                          </div>

                          <div className="pt-8 border-t border-slate-100">
                              <h3 className="font-black text-ocean-950 text-sm flex items-center gap-2 mb-6">
                                <Phone size={18} className="text-ocean-600" /> Contato & Redes Sociais
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Telefone Fixo</label>
                                      <input className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm font-bold" placeholder="(21) 0000-0000" value={editBusiness.phone} onChange={e => setEditBusiness({...editBusiness, phone: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">WhatsApp (Link Direto)</label>
                                      <div className="relative">
                                          <MessageCircle size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
                                          <input className="w-full bg-slate-50 pl-12 pr-4 py-4 rounded-xl border border-slate-100 text-sm font-bold" placeholder="21999999999" value={editBusiness.whatsapp} onChange={e => setEditBusiness({...editBusiness, whatsapp: e.target.value})} />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Instagram (Usuário)</label>
                                      <div className="relative">
                                          <Instagram size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" />
                                          <input className="w-full bg-slate-50 pl-12 pr-4 py-4 rounded-xl border border-slate-100 text-sm font-bold" placeholder="@suaempresa" value={editBusiness.instagram} onChange={e => setEditBusiness({...editBusiness, instagram: e.target.value})} />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Site Oficial</label>
                                      <div className="relative">
                                          <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ocean-500" />
                                          <input className="w-full bg-slate-50 pl-12 pr-4 py-4 rounded-xl border border-slate-100 text-sm font-bold" placeholder="https://seusite.com.br" value={editBusiness.website} onChange={e => setEditBusiness({...editBusiness, website: e.target.value})} />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Link de Delivery (iFood, etc)</label>
                                      <div className="relative">
                                          <ShoppingCart size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
                                          <input className="w-full bg-slate-50 pl-12 pr-4 py-4 rounded-xl border border-slate-100 text-sm font-bold" placeholder="Link do cardápio/delivery" value={editBusiness.deliveryUrl} onChange={e => setEditBusiness({...editBusiness, deliveryUrl: e.target.value})} />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Link de Reserva</label>
                                      <div className="relative">
                                          <CalendarDays size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
                                          <input className="w-full bg-slate-50 pl-12 pr-4 py-4 rounded-xl border border-slate-100 text-sm font-bold" placeholder="Link para agendamento" value={editBusiness.bookingUrl} onChange={e => setEditBusiness({...editBusiness, bookingUrl: e.target.value})} />
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div className="pt-8 border-t border-slate-100">
                              <h3 className="font-black text-ocean-950 text-sm flex items-center gap-2 mb-6">
                                <MapPin size={18} className="text-ocean-600" /> Localização & GPS
                              </h3>
                              <div className="space-y-4">
                                  <div className="h-80 rounded-3xl overflow-hidden border border-slate-100 shadow-inner">
                                    <LocationPicker 
                                        initialLat={editBusiness.lat} 
                                        initialLng={editBusiness.lng} 
                                        onLocationSelect={(lat, lng) => setEditBusiness({...editBusiness, lat, lng})} 
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <select 
                                          required
                                          className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none"
                                          value={editBusiness.cityId || ''}
                                          onChange={e => setEditBusiness({...editBusiness, cityId: e.target.value, neighborhoodId: ''})}
                                      >
                                          <option value="">Selecione a Cidade</option>
                                          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                      </select>
                                      <select 
                                          required
                                          className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none"
                                          value={editBusiness.neighborhoodId || ''}
                                          onChange={e => setEditBusiness({...editBusiness, neighborhoodId: e.target.value})}
                                          disabled={!editBusiness.cityId}
                                      >
                                          <option value="">Selecione o Bairro</option>
                                          {neighborhoods.filter(n => n.cityId === editBusiness.cityId).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                                      </select>
                                  </div>
                                  <input 
                                    required 
                                    className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm" 
                                    placeholder="Endereço Completo (Rua, Número, Bairro, Cidade)" 
                                    value={editBusiness.address} 
                                    onChange={e => setEditBusiness({...editBusiness, address: e.target.value})} 
                                  />
                              </div>
                          </div>

                          <div className="pt-8 border-t border-slate-100">
                              <h3 className="font-black text-ocean-950 text-sm flex items-center gap-2 mb-6">
                                <Clock size={18} className="text-ocean-600" /> Horário de Funcionamento
                              </h3>
                              <BusinessHoursEditor 
                                hours={editBusiness.openingHours || {}} 
                                onChange={newHours => setEditBusiness({ ...editBusiness, openingHours: newHours })} 
                              />
                          </div>

                          <div className="pt-8 border-t border-slate-100">
                              <h3 className="font-black text-ocean-950 text-sm flex items-center gap-2 mb-6">
                                <Check size={18} className="text-ocean-600" /> Comodidades & Diferenciais
                              </h3>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {DEFAULT_AMENITIES.map(am => {
                                      const isSelected = (editBusiness.amenities || []).includes(am.id);
                                      return (
                                          <button 
                                            key={am.id}
                                            type="button"
                                            onClick={() => {
                                                const current = [...(editBusiness.amenities || [])];
                                                const next = isSelected ? current.filter(x => x !== am.id) : [...current, am.id];
                                                setEditBusiness({...editBusiness, amenities: next});
                                            }}
                                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${isSelected ? 'bg-ocean-600 border-ocean-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                          >
                                              <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-300'}`} />
                                              <span className="text-xs font-bold">{am.label}</span>
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      </div>
                  </div>
              </form>
          </div>
      )}

      {view === 'MENU' && (
          <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6 space-y-8">
              <div className="flex justify-between items-center">
                  <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase">
                    <ChevronLeft size={16} /> Voltar
                  </button>
                  <button onClick={handleUpdateProfile} disabled={isSaving} className="bg-ocean-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2">
                      {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} SALVAR CARDÁPIO
                  </button>
              </div>

              <div className="space-y-10">
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-black text-ocean-950">Gestão de Cardápio</h2>
                    <button onClick={handleAddMenuSection} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2">
                        <Plus size={16} /> NOVA SEÇÃO
                    </button>
                  </div>

                  {editBusiness.menu?.map((section, sIdx) => (
                      <div key={sIdx} className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                          <div className="flex justify-between items-center">
                              <input 
                                className="bg-transparent text-xl font-black text-ocean-950 focus:outline-none border-b-2 border-transparent focus:border-ocean-300 w-full"
                                value={section.title}
                                onChange={e => {
                                    const newMenu = [...(editBusiness.menu || [])];
                                    newMenu[sIdx].title = e.target.value;
                                    setEditBusiness({ ...editBusiness, menu: newMenu });
                                }}
                              />
                              <button onClick={() => handleAddMenuItem(sIdx)} className="bg-ocean-100 text-ocean-600 p-2 rounded-lg ml-4">
                                  <Plus size={20} />
                              </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {section.items.map((item, iIdx) => (
                                  <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                                      <div className="flex-1 space-y-2">
                                          <div className="flex justify-between">
                                            <input 
                                                className="font-bold text-sm text-ocean-950 bg-transparent focus:outline-none w-full"
                                                value={item.name}
                                                onChange={e => {
                                                    const newMenu = [...(editBusiness.menu || [])];
                                                    newMenu[sIdx].items[iIdx].name = e.target.value;
                                                    setEditBusiness({ ...editBusiness, menu: newMenu });
                                                }}
                                            />
                                            <input 
                                                type="number"
                                                className="font-black text-green-600 bg-transparent focus:outline-none text-right w-20"
                                                value={item.price}
                                                onChange={e => {
                                                    const newMenu = [...(editBusiness.menu || [])];
                                                    newMenu[sIdx].items[iIdx].price = Number(e.target.value);
                                                    setEditBusiness({ ...editBusiness, menu: newMenu });
                                                }}
                                            />
                                          </div>
                                          <input 
                                            className="text-xs text-slate-400 bg-transparent focus:outline-none w-full"
                                            placeholder="Descrição curta..."
                                            value={item.description}
                                            onChange={e => {
                                                const newMenu = [...(editBusiness.menu || [])];
                                                newMenu[sIdx].items[iIdx].description = e.target.value;
                                                setEditBusiness({ ...editBusiness, menu: newMenu });
                                            }}
                                          />
                                      </div>
                                      <button onClick={() => handleDeleteMenuItem(sIdx, iIdx)} className="text-red-300 hover:text-red-500">
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {view === 'CREATE_COUPON' && (
          <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6 space-y-10">
              <div className="flex justify-between items-center">
                  <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase">
                    <ChevronLeft size={16} /> Voltar ao Painel
                  </button>
                  <h2 className="text-3xl font-black text-ocean-950 hidden md:block">Lançar Nova Oferta</h2>
              </div>

              <form onSubmit={async (e) => { 
                  e.preventDefault(); 
                  if (!newCoupon.imageUrl) return alert("Por favor, adicione uma imagem para a oferta.");
                  setIsSaving(true); 
                  const couponData = {
                      ...newCoupon, 
                      id: `c_${Date.now()}`, 
                      companyId: newCoupon.companyId || currentUser.id, 
                      companyName: newCoupon.companyName || renderName(),
                      companyLogo: myBusiness?.coverImage,
                      discountPercentage: Math.round(((newCoupon.originalPrice! - newCoupon.discountedPrice!) / newCoupon.originalPrice!) * 100),
                      code: `CR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                      active: true
                  } as Coupon;
                  await saveCoupon(couponData); 
                  setView('HOME'); 
                  refreshData(); 
                  setIsSaving(false); 
              }} className="space-y-12">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-8">
                          <ImageUpload label="Foto da Oferta (Chamativa)" onImageSelect={img => setNewCoupon({...newCoupon, imageUrl: img})} />
                          
                          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                              <h3 className="text-sm font-black text-ocean-950 uppercase tracking-widest flex items-center gap-2">
                                  <DollarSign size={18} className="text-green-600" /> Valores & Desconto
                              </h3>
                              <div className="grid grid-cols-2 gap-6">
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Preço Original</label>
                                      <div className="relative">
                                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                                          <input type="number" required className="w-full bg-white pl-12 pr-4 py-4 rounded-xl border border-slate-200 font-bold" placeholder="0.00" value={newCoupon.originalPrice} onChange={e => setNewCoupon({...newCoupon, originalPrice: Number(e.target.value)})} />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Preço com Desconto</label>
                                      <div className="relative">
                                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-green-600">R$</span>
                                          <input type="number" required className="w-full bg-white pl-12 pr-4 py-4 rounded-xl border border-green-200 text-green-600 font-black" placeholder="0.00" value={newCoupon.discountedPrice} onChange={e => setNewCoupon({...newCoupon, discountedPrice: Number(e.target.value)})} />
                                      </div>
                                  </div>
                              </div>
                              {newCoupon.originalPrice! > 0 && newCoupon.discountedPrice! > 0 && (
                                  <div className="bg-green-100 text-green-700 p-4 rounded-xl text-center font-black text-xs uppercase tracking-widest">
                                      Economia de {Math.round(((newCoupon.originalPrice! - newCoupon.discountedPrice!) / newCoupon.originalPrice!) * 100)}% para o cliente
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="space-y-8">
                          <div className="space-y-4">
                              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Informações da Oferta</label>
                              <input required className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 font-black text-lg focus:ring-2 focus:ring-ocean-500 outline-none" placeholder="Título da Oferta (Ex: 50% de Desconto no Rodízio)" value={newCoupon.title} onChange={e => setNewCoupon({...newCoupon, title: e.target.value})} />
                              <textarea required className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm leading-relaxed outline-none" rows={3} placeholder="Descreva o que está incluído nesta oferta..." value={newCoupon.description} onChange={e => setNewCoupon({...newCoupon, description: e.target.value})} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Data de Expiração</label>
                                  <input type="date" required className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm" value={newCoupon.expiryDate} onChange={e => setNewCoupon({...newCoupon, expiryDate: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Limite de Resgates</label>
                                  <input type="number" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm" value={newCoupon.maxRedemptions} onChange={e => setNewCoupon({...newCoupon, maxRedemptions: Number(e.target.value)})} />
                              </div>
                          </div>

                          <div className="space-y-4">
                              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Regras & Condições</label>
                              <textarea 
                                className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs leading-relaxed outline-none" 
                                rows={4} 
                                placeholder="Uma regra por linha. Ex:&#10;Válido apenas de segunda a quinta&#10;Não cumulativo com outras promoções&#10;Necessário reserva prévia" 
                                value={newCoupon.rules?.join('\n')} 
                                onChange={e => setNewCoupon({...newCoupon, rules: e.target.value.split('\n').filter(r => r.trim() !== '')})} 
                              />
                          </div>
                      </div>
                  </div>

                  <button type="submit" disabled={isSaving} className="w-full bg-ocean-600 text-white font-black py-8 rounded-[2rem] shadow-2xl shadow-ocean-600/30 flex items-center justify-center gap-4 text-xl hover:bg-ocean-700 active:scale-[0.98] transition-all">
                      {isSaving ? <Loader2 className="animate-spin" size={28} /> : <CheckCircle2 size={28} />} PUBLICAR OFERTA NO RIO
                  </button>
              </form>
          </div>
      )}

      {view === 'CATEGORIES' && (
        <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6 space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-ocean-950">Gerenciar Subcategorias</h2>
                <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase">
                    <ChevronLeft size={16} /> Voltar
                </button>
            </div>

            <div className="space-y-6">
                {categories.map(category => (
                    <div key={category.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h3 className="font-bold text-ocean-900 mb-4">{category.name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {(category.subcategories || []).map((sub: string) => (
                                <div key={sub} className="flex items-center justify-between bg-white p-2 rounded-lg text-xs font-bold text-slate-600 border">
                                    <span>{sub}</span>
                                    <button onClick={() => handleDeleteSubcategory(category.id, sub)} className="text-red-400 hover:text-red-600 p-1">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                                placeholder="Nova subcategoria..."
                                value={newSubcategory[category.id] || ''}
                                onChange={e => setNewSubcategory({ ...newSubcategory, [category.id]: e.target.value })}
                            />
                            <button onClick={() => handleAddSubcategory(category.id)} className="bg-ocean-500 text-white px-4 py-2 rounded-lg text-xs font-black">
                                Adicionar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {view === 'BUSINESSES' && (
        <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6 space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black text-ocean-950">Gestão de Empresas</h2>
                <button 
                    onClick={() => setView('CREATE_PLACE')}
                    className="bg-gold-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-gold-500/20 hover:bg-gold-600 transition-all flex items-center gap-2"
                >
                    <Plus size={16} /> CADASTRAR LUGAR
                </button>
            </div>
            <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase">
                <ChevronLeft size={16} /> Voltar
            </button>
          </div>

          <div className="space-y-4">
            {getAllBusinesses().length === 0 ? (
              <p className="text-slate-500 text-center py-10">Nenhuma empresa cadastrada.</p>
            ) : (
              getAllBusinesses().map(biz => {
                const owner = getAllUsers().find(u => u.id === biz.id);
                return (
                  <div key={biz.id} className={`p-6 rounded-[2rem] border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${biz.isBlocked ? 'bg-red-50 border-red-100 opacity-80' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 shrink-0">
                            {biz.coverImage && <img src={biz.coverImage} className="w-full h-full object-cover" />}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-lg text-ocean-950 flex items-center gap-2">
                                    {biz.name}
                                    {biz.deliveryUrl && (
                                        <span title="Delivery Disponível" className="bg-ocean-100 text-ocean-600 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                                            Tem Entrega
                                        </span>
                                    )}
                                </h3>
                                {biz.isBlocked && <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Inativa</span>}
                            </div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{biz.category}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                <p className="text-[10px] text-slate-400 flex items-center gap-1 font-bold"><Mail size={12} /> {owner?.email || 'Email não vinculado'}</p>
                                <p className="text-[10px] text-slate-400 flex items-center gap-1 font-bold"><Phone size={12} /> {biz.phone}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        <button 
                            onClick={async () => {
                                if (confirm(`Deseja ${biz.isBlocked ? 'ativar' : 'inativar'} esta empresa e seu usuário?`)) {
                                    await toggleBusinessStatus(biz.id, !biz.isBlocked);
                                    refreshData();
                                }
                            }}
                            className={`flex-1 md:flex-none px-4 py-3 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 transition-all ${biz.isBlocked ? 'bg-green-500 text-white' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
                        >
                            {biz.isBlocked ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                            {biz.isBlocked ? 'ATIVAR' : 'INATIVAR'}
                        </button>

                        <button 
                            onClick={async () => {
                                if (confirm(`Deseja ${biz.canBeClaimed ? 'desativar' : 'ativar'} a possibilidade de reivindicação para este lugar?`)) {
                                    await updateClaimableStatus(biz.id, !biz.canBeClaimed);
                                    refreshData();
                                }
                            }}
                            className={`flex-1 md:flex-none px-4 py-3 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 transition-all ${biz.canBeClaimed ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                        >
                            <CheckCircle2 size={16} />
                            {biz.canBeClaimed ? 'REIVINDICÁVEL' : 'NÃO REIVINDICÁVEL'}
                        </button>

                        <div className="flex-1 md:flex-none flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Plano:</span>
                            <select 
                                className="bg-transparent text-[10px] font-black text-ocean-600 outline-none cursor-pointer"
                                value={biz.plan || ''}
                                onChange={async (e) => {
                                    const newPlanId = e.target.value;
                                    if (confirm(`Deseja alterar o plano de "${biz.name}" para "${newPlanId}"?`)) {
                                        await updateBusinessPlan(biz.id, newPlanId);
                                        refreshData();
                                    }
                                }}
                            >
                                <option value="">Sem Plano</option>
                                {plans.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <button 
                            onClick={async () => {
                                const pass = prompt(`Definir nova senha manual para "${biz.name}":`);
                                if (pass) {
                                    await setManualPassword(biz.id, pass);
                                    alert("Senha manual definida com sucesso!");
                                }
                            }}
                            className="flex-1 md:flex-none bg-white border border-ocean-100 text-ocean-600 px-4 py-3 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 hover:bg-ocean-50 transition-all"
                        >
                            <Key size={16} /> SENHA
                        </button>
                        
                        <button 
                            onClick={async () => {
                                if (confirm("ATENÇÃO: Esta ação é permanente e excluirá a empresa, o usuário e todos os seus cupons. Deseja continuar?")) {
                                    await deleteBusinessPermanently(biz.id);
                                    refreshData();
                                }
                            }}
                            className="flex-1 md:flex-none bg-white border border-red-100 text-red-500 px-4 py-3 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
                        >
                            <UserX size={16} /> EXCLUIR
                        </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {view === 'REQUESTS' && (
        <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black text-ocean-950">Solicitações & Leads</h2>
            <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase">
                <ChevronLeft size={16} /> Voltar
            </button>
          </div>
          
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <Layers size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-bold">Nenhuma solicitação pendente no momento.</p>
              </div>
            ) : (
              requests.map(req => (
                <div key={req.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-all">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                        <h3 className="font-black text-xl text-ocean-950">{req.companyName}</h3>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${req.type === 'CLAIM' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                            {req.type === 'CLAIM' ? 'Reivindicação' : 'Novo Lead'}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                        <p className="text-sm text-slate-600 flex items-center gap-2"><UserIcon size={14} className="text-slate-400" /> {req.ownerName}</p>
                        <p className="text-sm text-slate-600 flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {req.email}</p>
                        <p className="text-sm text-slate-600 flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {req.phone}</p>
                        <p className="text-sm text-slate-600 flex items-center gap-2"><CalendarDays size={14} className="text-slate-400" /> {new Date(req.requestDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    {req.description && (
                        <p className="text-xs text-slate-400 mt-2 bg-white p-3 rounded-xl border border-slate-100 italic">&quot;{req.description}&quot;</p>
                    )}
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => handleApprove(req.id)} 
                        className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all"
                    >
                      <Check size={18} /> APROVAR
                    </button>
                    <button 
                        onClick={() => handleReject(req.id)} 
                        className="flex-1 md:flex-none bg-white border border-red-100 text-red-500 px-6 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
                    >
                      <X size={18} /> REJEITAR
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {view === 'REASSIGN_COUPONS' && (
        <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6 space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-ocean-950">Reatribuir Cupons</h2>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={async () => {
                            if (confirm('Deseja corrigir os nomes de todas as empresas nos cupons automaticamente? Isso buscará o nome real da empresa pelo ID associado.')) {
                                setIsSaving(true);
                                try {
                                    let count = 0;
                                    for (const coupon of coupons) {
                                        if (coupon.companyId) {
                                            const biz = allBusinesses.find(b => b.id === coupon.companyId);
                                            if (biz && biz.name !== coupon.companyName) {
                                                await saveCoupon({...coupon, companyName: biz.name});
                                                count++;
                                            }
                                        }
                                    }
                                    alert(`${count} cupons foram corrigidos com sucesso!`);
                                    refreshData();
                                } catch (err) {
                                    console.error(err);
                                    alert('Erro ao corrigir alguns cupons.');
                                } finally {
                                    setIsSaving(false);
                                }
                            }
                        }}
                        className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Corrigindo...' : 'Corrigir Nomes Automaticamente'}
                    </button>
                    <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase">
                        <ChevronLeft size={16} /> Voltar
                    </button>
                </div>
            </div>
            <div className="space-y-4">
                {coupons.length === 0 && <p className="text-center py-12 text-slate-400 font-bold">Nenhum cupom encontrado para reatribuição.</p>}
                {coupons.map(coupon => (
                    <div key={coupon.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <h4 className="font-black text-ocean-950">{coupon.title}</h4>
                            <p className={`text-xs font-bold ${coupon.companyName === 'Minha Empresa' ? 'text-red-500' : 'text-slate-500'}`}>
                                {coupon.companyName}
                                {coupon.companyName === 'Minha Empresa' && ' (Atenção: Nome genérico detectado!)'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atribuir a:</span>
                            <select 
                                className="bg-white p-3 rounded-xl border border-slate-200 font-bold text-sm min-w-[200px]"
                                value={coupon.companyId || ''}
                                onChange={async (e) => {
                                    const newCompanyId = e.target.value;
                                    if (!newCompanyId) return;
                                    const biz = allBusinesses.find(b => b.id === newCompanyId);
                                    if (confirm(`Deseja reatribuir este cupom para "${biz?.name}"?`)) {
                                        await saveCoupon({...coupon, companyId: newCompanyId, companyName: biz?.name || 'Empresa Desconhecida'});
                                        refreshData();
                                    }
                                }}
                            >
                                <option value="">Selecione a Empresa</option>
                                {allBusinesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {view === 'CREATE_PLACE' && (
        <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6 space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-ocean-950">Cadastrar Novo Lugar</h2>
                <button onClick={() => setView('BUSINESSES')} className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase">
                    <ChevronLeft size={16} /> Voltar
                </button>
            </div>

            <form onSubmit={handleCreatePlace} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nome do Lugar / Empresa</label>
                            <input 
                                required 
                                className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-lg outline-none" 
                                value={newPlace.name} 
                                onChange={e => setNewPlace({...newPlace, name: e.target.value})} 
                                placeholder="Ex: Praia de Sepetiba, Teatro Municipal..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Categoria</label>
                                <select 
                                    className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none"
                                    value={newPlace.category}
                                    onChange={e => setNewPlace({...newPlace, category: e.target.value})}
                                >
                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Plano Inicial</label>
                                <select 
                                    className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none"
                                    value={newPlace.plan || ''}
                                    onChange={e => {
                                        const planId = e.target.value;
                                        const plan = plans.find(p => p.id === planId);
                                        setNewPlace({
                                            ...newPlace, 
                                            plan: planId,
                                            isFeatured: plan ? plan.isFeatured : false
                                        });
                                    }}
                                >
                                    <option value="">Sem Plano</option>
                                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Permitir Reivindicação?</label>
                                <select 
                                    className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none"
                                    value={newPlace.canBeClaimed ? 'true' : 'false'}
                                    onChange={e => setNewPlace({...newPlace, canBeClaimed: e.target.value === 'true'})}
                                >
                                    <option value="true">Sim (Empresas podem pedir acesso)</option>
                                    <option value="false">Não (Lugar público / Admin apenas)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Descrição Curta</label>
                            <textarea 
                                required
                                rows={4}
                                className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none" 
                                value={newPlace.description} 
                                onChange={e => setNewPlace({...newPlace, description: e.target.value})}
                                placeholder="Descreva brevemente o local..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Endereço / Localização</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <select 
                                    required
                                    className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none"
                                    value={newPlace.cityId || ''}
                                    onChange={e => setNewPlace({...newPlace, cityId: e.target.value, neighborhoodId: ''})}
                                >
                                    <option value="">Selecione a Cidade</option>
                                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select 
                                    required
                                    className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none"
                                    value={newPlace.neighborhoodId || ''}
                                    onChange={e => setNewPlace({...newPlace, neighborhoodId: e.target.value})}
                                    disabled={!newPlace.cityId}
                                >
                                    <option value="">Selecione o Bairro</option>
                                    {neighborhoods.filter(n => n.cityId === newPlace.cityId).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                                </select>
                            </div>
                            <input 
                                required
                                className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none" 
                                value={newPlace.address} 
                                onChange={e => setNewPlace({...newPlace, address: e.target.value})}
                                placeholder="Rua, Número, Bairro..."
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <ImageUpload 
                            label="Foto de Capa"
                            currentImage={newPlace.coverImage}
                            onImageSelect={img => setNewPlace({...newPlace, coverImage: img})}
                        />

                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                            <h4 className="text-amber-700 font-black text-xs uppercase mb-2 flex items-center gap-2">
                                <ShieldAlert size={16} /> Nota para o Admin
                            </h4>
                            <p className="text-amber-600 text-[10px] font-bold leading-relaxed">
                                Você está cadastrando um lugar diretamente no guia. Se você marcar como &quot;Reivindicável&quot;, empresas que se identificarem como donas deste local poderão solicitar acesso através do botão &quot;Reivindicar Empresa&quot; na página de detalhes.
                            </p>
                        </div>
                    </div>
                </div>
                <button type="submit" className="w-full bg-ocean-600 hover:bg-ocean-700 text-white p-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-ocean-600/20">
                    CADASTRAR LUGAR
                </button>
            </form>
        </div>
      )}


      {view === 'PLANS' && (
        <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6 space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-ocean-950">Gerenciar Planos</h2>
                <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase">
                    <ChevronLeft size={16} /> Voltar
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 h-fit">
                    <h3 className="text-xl font-black text-ocean-950 mb-6">Criar Novo Plano</h3>
                    <form onSubmit={handleSavePlan} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome do Plano</label>
                            <input 
                                required 
                                className="w-full bg-white p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none" 
                                value={newPlan.name} 
                                onChange={e => setNewPlan({...newPlan, name: e.target.value})} 
                                placeholder="Ex: Plano Premium"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preço (R$)</label>
                                <input 
                                    type="number"
                                    required 
                                    className="w-full bg-white p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none" 
                                    value={newPlan.price} 
                                    onChange={e => setNewPlan({...newPlan, price: Number(e.target.value)})} 
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Período</label>
                                <select 
                                    className="w-full bg-white p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none"
                                    value={newPlan.period}
                                    onChange={e => setNewPlan({...newPlan, period: e.target.value as any})}
                                >
                                    <option value="monthly">Mensal</option>
                                    <option value="yearly">Anual</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recursos e Limites</h4>
                            
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-600">Max. Cupons</span>
                                <input 
                                    type="number"
                                    className="w-16 bg-slate-50 p-2 rounded-lg border border-slate-100 font-bold text-xs text-center"
                                    value={newPlan.maxCoupons}
                                    onChange={e => setNewPlan({...newPlan, maxCoupons: Number(e.target.value)})}
                                />
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded-lg border-slate-200 text-ocean-600 focus:ring-ocean-500"
                                    checked={newPlan.isFeatured}
                                    onChange={e => setNewPlan({...newPlan, isFeatured: e.target.checked})}
                                />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-ocean-600 transition-colors">Destaque nas Pesquisas</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded-lg border-slate-200 text-ocean-600 focus:ring-ocean-500"
                                    checked={newPlan.showGallery}
                                    onChange={e => setNewPlan({...newPlan, showGallery: e.target.checked})}
                                />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-ocean-600 transition-colors">Exibir Galeria</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded-lg border-slate-200 text-ocean-600 focus:ring-ocean-500"
                                    checked={newPlan.showMenu}
                                    onChange={e => setNewPlan({...newPlan, showMenu: e.target.checked})}
                                />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-ocean-600 transition-colors">Exibir Cardápio</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded-lg border-slate-200 text-ocean-600 focus:ring-ocean-500"
                                    checked={newPlan.showSocialMedia}
                                    onChange={e => setNewPlan({...newPlan, showSocialMedia: e.target.checked})}
                                />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-ocean-600 transition-colors">Exibir Redes Sociais</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded-lg border-slate-200 text-ocean-600 focus:ring-ocean-500"
                                    checked={newPlan.showReviews}
                                    onChange={e => setNewPlan({...newPlan, showReviews: e.target.checked})}
                                />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-ocean-600 transition-colors">Exibir Avaliações</span>
                            </label>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="w-full bg-ocean-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-ocean-600/20 hover:bg-ocean-700 transition-all flex justify-center items-center gap-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} SALVAR PLANO
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-black text-ocean-950">Planos Ativos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {plans.length === 0 ? (
                            <p className="text-slate-400 text-sm italic col-span-2">Nenhum plano cadastrado.</p>
                        ) : (
                            plans.map(plan => (
                                <div key={plan.id} className={`p-8 rounded-[2.5rem] border transition-all relative group ${plan.isFeatured ? 'bg-ocean-50 border-ocean-100' : 'bg-white border-slate-100'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-xl font-black text-ocean-950">{plan.name}</h4>
                                            <p className="text-ocean-600 font-bold">R$ {plan.price} <span className="text-[10px] text-slate-400">/{plan.period === 'monthly' ? 'mês' : 'ano'}</span></p>
                                        </div>
                                        <button 
                                            onClick={() => handleDeletePlan(plan.id)}
                                            className="w-10 h-10 bg-white text-red-500 rounded-xl flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                            <Check size={12} className="text-green-500" /> Max. {plan.maxCoupons} cupons
                                        </div>
                                        {plan.isFeatured && <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><Check size={12} className="text-green-500" /> Destaque nas buscas</div>}
                                        {plan.showGallery && <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><Check size={12} className="text-green-500" /> Galeria de fotos</div>}
                                        {plan.showMenu && <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><Check size={12} className="text-green-500" /> Cardápio digital</div>}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${plan.active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {plan.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                        {plan.isFeatured && (
                                            <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                                <Star size={8} fill="currentColor" /> Popular
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
      {view === 'HIGHLIGHTS' && currentUser.role === UserRole.SUPER_ADMIN && (
          <HighlightsManager 
            highlights={highlights} 
            onBack={() => setView('HOME')} 
            onRefresh={refreshData} 
          />
      )}
      {view === 'LOCATIONS' && currentUser.role === UserRole.SUPER_ADMIN && (
          <LocationsManager 
            cities={cities}
            neighborhoods={neighborhoods}
            onBack={() => setView('HOME')} 
            onRefresh={refreshData} 
          />
      )}
    </div>
  );
};

const HighlightsManager: React.FC<{ highlights: HomeHighlight[]; onBack: () => void; onRefresh: () => void }> = ({ highlights, onBack, onRefresh }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [editingHighlight, setEditingHighlight] = useState<Partial<HomeHighlight> | null>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingHighlight) return;
        setIsSaving(true);
        try {
            await saveHomeHighlight(editingHighlight);
            alert("Destaque salvo com sucesso!");
            setEditingHighlight(null);
            onRefresh();
        } catch (err) {
            alert("Erro ao salvar destaque.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Deseja excluir este destaque?")) {
            await deleteHomeHighlight(id);
            onRefresh();
        }
    };

    return (
        <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6 space-y-8">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase">
                    <ChevronLeft size={16} /> Voltar
                </button>
                <button 
                    onClick={() => setEditingHighlight({ title: '', description: '', imageUrl: '', buttonText: '', buttonLink: '', order: highlights.length, active: true })}
                    className="bg-ocean-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2"
                >
                    <Plus size={18} /> NOVO DESTAQUE
                </button>
            </div>

            <div className="space-y-6">
                <h2 className="text-3xl font-black text-ocean-950">Destaques da Home</h2>
                <p className="text-slate-500 text-sm">Gerencie até 4 destaques que aparecerão no carrossel da página inicial.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {highlights.map(h => (
                        <div key={h.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex gap-4 items-start">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-200 shrink-0">
                                <img src={h.imageUrl} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-black text-ocean-950 truncate">{h.title}</h4>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${h.active ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                                        {h.active ? 'ATIVO' : 'INATIVO'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{h.description}</p>
                                <div className="flex gap-2 mt-4">
                                    <button onClick={() => setEditingHighlight(h)} className="text-ocean-600 font-black text-[10px] uppercase hover:underline">Editar</button>
                                    <button onClick={() => handleDelete(h.id)} className="text-red-500 font-black text-[10px] uppercase hover:underline">Excluir</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {highlights.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                            Nenhum destaque cadastrado.
                        </div>
                    )}
                </div>
            </div>

            {editingHighlight && (
                <div className="fixed inset-0 bg-ocean-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-black text-ocean-950 uppercase tracking-tight">Configurar Destaque</h3>
                            <button onClick={() => setEditingHighlight(null)} className="text-slate-400 hover:text-ocean-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-full">
                                    <ImageUpload 
                                        label="Imagem de Fundo" 
                                        currentImage={editingHighlight.imageUrl} 
                                        onImageSelect={img => setEditingHighlight({...editingHighlight, imageUrl: img})} 
                                    />
                                </div>
                                <div className="col-span-full">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Título do Destaque</label>
                                    <input 
                                        required 
                                        className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-ocean-500" 
                                        value={editingHighlight.title} 
                                        onChange={e => setEditingHighlight({...editingHighlight, title: e.target.value})} 
                                    />
                                </div>
                                <div className="col-span-full">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Descrição</label>
                                    <textarea 
                                        required 
                                        className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm outline-none focus:ring-2 focus:ring-ocean-500" 
                                        rows={3}
                                        value={editingHighlight.description} 
                                        onChange={e => setEditingHighlight({...editingHighlight, description: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Texto do Botão</label>
                                    <input 
                                        required 
                                        className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-ocean-500" 
                                        value={editingHighlight.buttonText} 
                                        onChange={e => setEditingHighlight({...editingHighlight, buttonText: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Link do Botão</label>
                                    <input 
                                        required 
                                        className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-ocean-500" 
                                        placeholder="Ex: /guia ou https://..."
                                        value={editingHighlight.buttonLink} 
                                        onChange={e => setEditingHighlight({...editingHighlight, buttonLink: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Ordem</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-ocean-500" 
                                        value={editingHighlight.order} 
                                        onChange={e => setEditingHighlight({...editingHighlight, order: parseInt(e.target.value)})} 
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-6">
                                    <button 
                                        type="button"
                                        onClick={() => setEditingHighlight({...editingHighlight, active: !editingHighlight.active})}
                                        className={`w-12 h-6 rounded-full transition-all relative ${editingHighlight.active ? 'bg-ocean-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingHighlight.active ? 'left-7' : 'left-1'}`} />
                                    </button>
                                    <span className="text-xs font-black text-ocean-950 uppercase">Destaque Ativo</span>
                                </div>
                            </div>
                            <div className="pt-6 flex gap-4">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingHighlight(null)}
                                    className="flex-1 px-6 py-4 rounded-2xl font-black text-xs text-slate-500 bg-slate-100"
                                >
                                    CANCELAR
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="flex-[2] px-6 py-4 rounded-2xl font-black text-xs text-white bg-ocean-600 shadow-lg shadow-ocean-600/20 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} SALVAR DESTAQUE
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const LocationsManager: React.FC<{ cities: City[]; neighborhoods: Neighborhood[]; onBack: () => void; onRefresh: () => void }> = ({ cities, neighborhoods, onBack, onRefresh }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [editingCity, setEditingCity] = useState<Partial<City> | null>(null);
    const [editingNeighborhood, setEditingNeighborhood] = useState<Partial<Neighborhood> | null>(null);

    const handleSaveCity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCity) return;
        setIsSaving(true);
        try {
            await saveCity(editingCity as City);
            alert("Cidade salva com sucesso!");
            setEditingCity(null);
            onRefresh();
        } catch (err) {
            alert("Erro ao salvar cidade.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveNeighborhood = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingNeighborhood) return;
        setIsSaving(true);
        try {
            await saveNeighborhood(editingNeighborhood as Neighborhood);
            alert("Bairro salvo com sucesso!");
            setEditingNeighborhood(null);
            onRefresh();
        } catch (err) {
            alert("Erro ao salvar bairro.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCity = async (id: string) => {
        if (confirm("Deseja excluir esta cidade?")) {
            await deleteCity(id);
            onRefresh();
        }
    };

    const handleDeleteNeighborhood = async (id: string) => {
        if (confirm("Deseja excluir este bairro?")) {
            await deleteNeighborhood(id);
            onRefresh();
        }
    };

    return (
        <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6 space-y-8">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase">
                    <ChevronLeft size={16} /> Voltar
                </button>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setEditingCity({ name: '', active: true })}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2"
                    >
                        <Plus size={18} /> NOVA CIDADE
                    </button>
                    <button 
                        onClick={() => setEditingNeighborhood({ name: '', cityId: '', active: true })}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2"
                    >
                        <Plus size={18} /> NOVO BAIRRO
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-3xl font-black text-ocean-950">Locais</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xl font-black text-ocean-950 mb-4">Cidades</h3>
                        <div className="space-y-4">
                            {cities.map(c => (
                                <div key={c.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                    <span className="font-bold">{c.name}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingCity(c)} className="text-ocean-600 font-black text-[10px] uppercase hover:underline">Editar</button>
                                        <button onClick={() => handleDeleteCity(c.id)} className="text-red-500 font-black text-[10px] uppercase hover:underline">Excluir</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-ocean-950 mb-4">Bairros</h3>
                        <div className="space-y-4">
                            {neighborhoods.map(n => (
                                <div key={n.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                    <span className="font-bold">{n.name} <span className="text-slate-400 text-xs">({cities.find(c => c.id === n.cityId)?.name})</span></span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingNeighborhood(n)} className="text-ocean-600 font-black text-[10px] uppercase hover:underline">Editar</button>
                                        <button onClick={() => handleDeleteNeighborhood(n.id)} className="text-red-500 font-black text-[10px] uppercase hover:underline">Excluir</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals for editing city/neighborhood */}
            {editingCity && (
                <div className="fixed inset-0 bg-ocean-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6">
                        <h3 className="text-xl font-black text-ocean-950">Configurar Cidade</h3>
                        <form onSubmit={handleSaveCity} className="space-y-4">
                            <input required className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm" placeholder="Nome da Cidade" value={editingCity.name} onChange={e => setEditingCity({...editingCity, name: e.target.value})} />
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setEditingCity(null)} className="flex-1 px-6 py-4 rounded-2xl font-black text-xs text-slate-500 bg-slate-100">CANCELAR</button>
                                <button type="submit" disabled={isSaving} className="flex-1 px-6 py-4 rounded-2xl font-black text-xs text-white bg-emerald-600">SALVAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {editingNeighborhood && (
                <div className="fixed inset-0 bg-ocean-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6">
                        <h3 className="text-xl font-black text-ocean-950">Configurar Bairro</h3>
                        <form onSubmit={handleSaveNeighborhood} className="space-y-4">
                            <input required className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm" placeholder="Nome do Bairro" value={editingNeighborhood.name} onChange={e => setEditingNeighborhood({...editingNeighborhood, name: e.target.value})} />
                            <select required className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm" value={editingNeighborhood.cityId} onChange={e => setEditingNeighborhood({...editingNeighborhood, cityId: e.target.value})}>
                                <option value="">Selecione a Cidade</option>
                                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <div className="h-48 rounded-xl overflow-hidden border border-slate-100 shadow-inner">
                                <LocationPicker 
                                    initialLat={editingNeighborhood.lat} 
                                    initialLng={editingNeighborhood.lng} 
                                    onLocationSelect={(lat, lng) => setEditingNeighborhood({...editingNeighborhood, lat, lng})} 
                                />
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setEditingNeighborhood(null)} className="flex-1 px-6 py-4 rounded-2xl font-black text-xs text-slate-500 bg-slate-100">CANCELAR</button>
                                <button type="submit" disabled={isSaving} className="flex-1 px-6 py-4 rounded-2xl font-black text-xs text-white bg-emerald-600">SALVAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
