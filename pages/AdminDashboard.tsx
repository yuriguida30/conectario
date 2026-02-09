
import React, { useState, useEffect } from 'react';
import { User, Coupon, BusinessProfile, DEFAULT_AMENITIES, MenuSection, MenuItem } from '../types';
import { getCoupons, saveCoupon, deleteCoupon, getBusinesses, saveBusiness, getBusinessStats, getCategories } from '../services/dataService';
import { 
  Plus, Ticket, Store, Loader2, Star, Eye, 
  Settings, ChevronLeft, Save, Trash2,
  BarChart3, CheckCircle2, DollarSign, 
  TrendingUp, Share2, MousePointer2, PieChart as PieIcon,
  Navigation, Utensils, Instagram, Share, Globe, ShoppingCart, CalendarDays, Phone, MapPin, Check, Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { ImageUpload } from '../components/ImageUpload';
import { LocationPicker } from '../components/LocationPicker';

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export const AdminDashboard: React.FC<{ currentUser: User; onNavigate: (page: string, params?: any) => void; onLogout: () => void }> = ({ currentUser, onNavigate, onLogout }) => {
  const [view, setView] = useState<'HOME' | 'COUPONS' | 'PROFILE' | 'CREATE_COUPON' | 'MENU'>('HOME');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [myBusiness, setMyBusiness] = useState<BusinessProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const categories = getCategories();

  const [editBusiness, setEditBusiness] = useState<Partial<BusinessProfile>>({});

  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    title: '',
    description: '',
    originalPrice: 0,
    discountedPrice: 0,
    category: currentUser.category || 'Gastronomia',
    active: true,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    refreshData();
  }, [currentUser]);

  const refreshData = async () => {
    setLoading(true);
    const allCoupons = await getCoupons();
    setCoupons(allCoupons.filter(c => c.companyId === currentUser.id));
    const biz = getBusinesses().find(b => b.id === currentUser.id);
    if (biz) {
        setMyBusiness(biz);
        setEditBusiness(biz);
    }
    const s = await getBusinessStats(currentUser.id);
    setStats(s);
    setLoading(false);
  };

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

  // Funções de Gestão de Cardápio
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

  if (loading && !stats) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-ocean-600" size={48} /></div>;

  const renderName = () => {
      const name = myBusiness?.name || currentUser.companyName || currentUser.name;
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
                  <p className="text-[10px] text-ocean-600 font-black uppercase tracking-widest mt-1">Painel Administrativo Parceiro</p>
              </div>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
              <button 
                onClick={() => setView('MENU')} 
                className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'MENU' ? 'bg-ocean-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-ocean-600 shadow-sm'}`}
              >
                <Utensils size={18} /> CARDÁPIO
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
              <button onClick={onLogout} className="px-6 py-4 bg-red-50 text-red-500 rounded-2xl font-black text-xs">SAIR</button>
          </div>
      </div>

      {view === 'HOME' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* KPIs DE CONVERSÃO */}
              <div className="lg:col-span-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-ocean-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                          <MousePointer2 className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:scale-110 transition-transform" />
                          <p className="text-[10px] font-black text-ocean-400 uppercase tracking-widest mb-2">Total de Conversões</p>
                          <h3 className="text-4xl font-black">{stats.totalConversions}</h3>
                          <p className="text-ocean-200 text-[10px] font-bold mt-2">Leads Gerados pelo Guia</p>
                      </div>
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engajamento</p>
                             <Share2 size={16} className="text-ocean-500" />
                          </div>
                          <h3 className="text-4xl font-black text-ocean-950">{stats.shares}</h3>
                          <p className="text-slate-400 text-[10px] font-bold mt-2">Compartilhamentos</p>
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
                          <TrendingUp className="text-ocean-600" size={20} /> Fluxo de Conversões Diárias
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
                  {/* HEATMAP DE CLIQUES */}
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                      <h3 className="text-lg font-black text-ocean-950 mb-6 flex items-center gap-3">
                          <BarChart3 className="text-ocean-600" size={20} /> Comportamento
                      </h3>
                      <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={stats.actionHeatmap} layout="vertical">
                                  <XAxis type="number" hide />
                                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} width={90} />
                                  <Tooltip 
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                  />
                                  <Bar dataKey="cliques" fill="#0ea5e9" radius={[0, 10, 10, 0]} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      {/* LADO ESQUERDO: VISUAL E LOCALIZAÇÃO */}
                      <div className="space-y-8">
                          <ImageUpload 
                            label="Imagem de Capa (Ideal: 1200x600px)" 
                            currentImage={editBusiness.coverImage} 
                            onImageSelect={img => setEditBusiness({...editBusiness, coverImage: img})} 
                          />
                          
                          <div className="space-y-4">
                              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Localização Exata no Mapa</label>
                              <div className="h-72">
                                <LocationPicker 
                                    initialLat={editBusiness.lat} 
                                    initialLng={editBusiness.lng} 
                                    onLocationSelect={(lat, lng) => setEditBusiness({...editBusiness, lat, lng})} 
                                />
                              </div>
                              <input 
                                required 
                                className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold" 
                                placeholder="Endereço Completo para o GPS" 
                                value={editBusiness.address} 
                                onChange={e => setEditBusiness({...editBusiness, address: e.target.value})} 
                              />
                          </div>
                      </div>

                      {/* LADO DIREITO: TEXTOS E LINKS ESTRATÉGICOS */}
                      <div className="space-y-6">
                          <div>
                              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nome da Empresa</label>
                              <input required className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-lg" value={editBusiness.name} onChange={e => setEditBusiness({...editBusiness, name: e.target.value})} />
                          </div>

                          <div>
                              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Descrição / História da Empresa</label>
                              <textarea className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed" rows={4} value={editBusiness.description} onChange={e => setEditBusiness({...editBusiness, description: e.target.value})} />
                          </div>

                          {/* LINKS ESTRATÉGICOS (PEDIDO DO USUÁRIO) */}
                          <div className="space-y-4 pt-6 border-t border-slate-100">
                              <h3 className="font-black text-ocean-950 text-sm flex items-center gap-2">
                                <Globe size={18} className="text-ocean-600" /> Links de Conversão (Opcionais)
                              </h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Site Oficial</label>
                                      <div className="relative">
                                          <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ocean-500" />
                                          <input className="w-full bg-slate-50 pl-12 pr-4 py-4 rounded-xl border border-slate-100 text-sm font-bold" placeholder="https://seusite.com.br" value={editBusiness.website} onChange={e => setEditBusiness({...editBusiness, website: e.target.value})} />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Link de Delivery (iFood/App)</label>
                                      <div className="relative">
                                          <ShoppingCart size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
                                          <input className="w-full bg-slate-50 pl-12 pr-4 py-4 rounded-xl border border-slate-100 text-sm font-bold" placeholder="Link do seu delivery" value={editBusiness.deliveryUrl} onChange={e => setEditBusiness({...editBusiness, deliveryUrl: e.target.value})} />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Link de Reservas (GetIn/App)</label>
                                      <div className="relative">
                                          <CalendarDays size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
                                          <input className="w-full bg-slate-50 pl-12 pr-4 py-4 rounded-xl border border-slate-100 text-sm font-bold" placeholder="Link de agendamento" value={editBusiness.bookingUrl} onChange={e => setEditBusiness({...editBusiness, bookingUrl: e.target.value})} />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Perfil do Instagram</label>
                                      <div className="relative">
                                          <Instagram size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" />
                                          <input className="w-full bg-slate-50 pl-12 pr-4 py-4 rounded-xl border border-slate-100 text-sm font-bold" placeholder="@seuperfil" value={editBusiness.instagram} onChange={e => setEditBusiness({...editBusiness, instagram: e.target.value})} />
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* HORÁRIOS DE FUNCIONAMENTO */}
                          <div className="space-y-4 pt-6 border-t border-slate-100">
                             <h3 className="font-black text-ocean-950 text-sm flex items-center gap-2">
                                <Clock size={18} className="text-ocean-600" /> Horários de Funcionamento
                             </h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.keys(editBusiness.openingHours || {}).map(day => (
                                    <div key={day} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <span className="text-xs font-black text-slate-400 w-16 uppercase">{day}:</span>
                                        <input 
                                            className="bg-transparent text-xs font-bold text-ocean-950 focus:outline-none flex-1"
                                            value={editBusiness.openingHours?.[day]}
                                            onChange={e => {
                                                const newHours = { ...editBusiness.openingHours, [day]: e.target.value };
                                                setEditBusiness({ ...editBusiness, openingHours: newHours });
                                            }}
                                        />
                                    </div>
                                ))}
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
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6">
              <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase mb-8">
                <ChevronLeft size={16} /> Voltar ao Painel
              </button>
              <form onSubmit={async (e) => { e.preventDefault(); setIsSaving(true); await saveCoupon({...newCoupon, id: `c_${Date.now()}`, companyId: currentUser.id, companyName: renderName()} as Coupon); setView('HOME'); refreshData(); setIsSaving(false); }} className="space-y-8">
                  <h2 className="text-3xl font-black text-ocean-950">Lançar Nova Oferta</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <ImageUpload label="Foto da Oferta" onImageSelect={img => setNewCoupon({...newCoupon, imageUrl: img})} />
                      <div className="space-y-4">
                          <input required className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold" placeholder="Título" value={newCoupon.title} onChange={e => setNewCoupon({...newCoupon, title: e.target.value})} />
                          <textarea className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100" rows={3} placeholder="Descrição" value={newCoupon.description} onChange={e => setNewCoupon({...newCoupon, description: e.target.value})} />
                          <div className="grid grid-cols-2 gap-4">
                              <input type="number" className="w-full bg-slate-50 p-4 rounded-xl border" placeholder="Preço original" value={newCoupon.originalPrice} onChange={e => setNewCoupon({...newCoupon, originalPrice: Number(e.target.value)})} />
                              <input type="number" className="w-full bg-slate-50 p-4 rounded-xl border text-green-600 font-bold" placeholder="Preço com desconto" value={newCoupon.discountedPrice} onChange={e => setNewCoupon({...newCoupon, discountedPrice: Number(e.target.value)})} />
                          </div>
                      </div>
                  </div>
                  <button type="submit" disabled={isSaving} className="w-full bg-ocean-600 text-white font-black py-6 rounded-2xl shadow-xl flex items-center justify-center gap-3">
                      {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />} PUBLICAR NO GUIA
                  </button>
              </form>
          </div>
      )}
    </div>
  );
};
