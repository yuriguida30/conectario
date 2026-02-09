
import React, { useState, useEffect } from 'react';
import { User, Coupon, BusinessProfile, BusinessPlan } from '../types';
import { getCoupons, saveCoupon, deleteCoupon, getBusinesses, saveBusiness, getBusinessStats } from '../services/dataService';
import { generateCouponDescription } from '../services/geminiService';
import { 
  Plus, Trash2, Edit, X, Ticket, Store, 
  Loader2, Star, Eye, MessageCircle, 
  Settings, Camera, MapPin, Instagram, 
  Globe, Utensils, Image as ImageIcon,
  ChevronLeft, AlertCircle, Save, Calendar, Percent,
  Phone, Users, TrendingUp, BarChart3, Clock, CheckCircle2, Cloud, Sparkles,
  ArrowUpRight, DollarSign, Target
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ImageUpload } from '../components/ImageUpload';

export const AdminDashboard: React.FC<{ currentUser: User; onNavigate: (page: string, params?: any) => void; onLogout: () => void }> = ({ currentUser, onNavigate, onLogout }) => {
  const [view, setView] = useState<'HOME' | 'COUPONS' | 'PROFILE' | 'MENU' | 'CREATE_COUPON'>('HOME');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [myBusiness, setMyBusiness] = useState<BusinessProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingIA, setIsGeneratingIA] = useState(false);

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
    window.addEventListener('dataUpdated', refreshData);
    return () => window.removeEventListener('dataUpdated', refreshData);
  }, [currentUser]);

  const refreshData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
        const allCoupons = await getCoupons();
        const myCoupons = allCoupons.filter(c => c.companyId === currentUser.id || (currentUser.companyName && c.companyName === currentUser.companyName));
        setCoupons(myCoupons);

        const businesses = getBusinesses();
        const biz = businesses.find(b => b.id === currentUser.id) || businesses.find(b => b.name === currentUser.companyName);
        if (biz) setMyBusiness(biz);

        const s = await getBusinessStats(currentUser.id);
        setStats(s);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!myBusiness) return;
    setIsSaving(true);
    try {
      await saveBusiness(myBusiness);
      alert("Perfil atualizado!");
      setView('HOME');
    } catch (err) {
      alert("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.title || !newCoupon.imageUrl) return alert("Preencha título e imagem!");
    setIsSaving(true);
    const couponToSave: Coupon = {
        ...newCoupon as Coupon,
        id: `c_${Date.now()}`,
        companyId: currentUser.id,
        companyName: myBusiness?.name || currentUser.companyName || 'Empresa',
        discountPercentage: Math.round(((newCoupon.originalPrice! - newCoupon.discountedPrice!) / newCoupon.originalPrice!) * 100),
        code: (newCoupon.title?.substring(0,3).toUpperCase() || 'OFF') + Math.floor(Math.random() * 999),
        currentRedemptions: 0,
        rating: 5,
        active: true
    };
    try {
        await saveCoupon(couponToSave);
        setView('HOME');
        refreshData();
    } catch (e) { alert("Erro ao criar cupom."); } finally { setIsSaving(false); }
  };

  if (loading && !stats) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-ocean-600 mb-4" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Gerando Insights Inteligentes...</p>
        </div>
      );
  }

  return (
    <div className="pb-32 pt-10 px-4 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER PREMIUM */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
              <div className="relative">
                  <div className="w-20 h-20 bg-ocean-600 text-white rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden">
                      {myBusiness?.coverImage ? <img src={myBusiness.coverImage} className="w-full h-full object-cover" /> : <Store size={40} />}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-4 border-white">
                      <CheckCircle2 size={16} />
                  </div>
              </div>
              <div>
                  <h1 className="text-3xl font-black text-ocean-950 tracking-tight">{myBusiness?.name || currentUser.companyName}</h1>
                  <p className="text-[10px] text-ocean-600 font-black uppercase tracking-widest mt-1">Status: Parceiro Premium</p>
              </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
              <button onClick={() => setView('CREATE_COUPON')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-ocean-600 text-white px-6 py-4 rounded-2xl font-black text-xs shadow-lg shadow-ocean-600/20 active:scale-95">
                <Plus size={18} /> CRIAR OFERTA
              </button>
              <button onClick={onLogout} className="px-6 py-4 bg-red-50 text-red-500 rounded-2xl font-black text-xs hover:bg-red-100 active:scale-95 transition-all">
                SAIR
              </button>
          </div>
      </div>

      {view === 'HOME' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* KPIs PRINCIPAIS */}
              <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-ocean-600 to-ocean-800 p-6 rounded-[2rem] text-white shadow-xl shadow-ocean-600/20">
                          <div className="flex justify-between items-start mb-4">
                              <div className="p-2 bg-white/20 rounded-lg"><TrendingUp size={20}/></div>
                              <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-1 rounded">Resgates</span>
                          </div>
                          <p className="text-3xl font-black">{stats?.totalRedemptions || 0}</p>
                          <p className="text-ocean-100 text-[10px] font-bold mt-1">Total acumulado</p>
                      </div>
                      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                              <div className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign size={20}/></div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Economia Gerada</span>
                          </div>
                          <p className="text-3xl font-black text-ocean-950">R$ {stats?.totalEconomyGenerated?.toFixed(2) || '0.00'}</p>
                          <p className="text-slate-400 text-[10px] font-bold mt-1">Valor real para clientes</p>
                      </div>
                      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                              <div className="p-2 bg-gold-50 text-gold-600 rounded-lg"><Eye size={20}/></div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visibilidade</span>
                          </div>
                          <p className="text-3xl font-black text-ocean-950">{stats?.views || 0}</p>
                          <p className="text-slate-400 text-[10px] font-bold mt-1">Visualizações de perfil</p>
                      </div>
                  </div>

                  {/* GRÁFICO INTELIGENTE */}
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                      <h3 className="text-lg font-black text-ocean-950 mb-6 flex items-center gap-2">
                          <BarChart3 className="text-ocean-600" size={20} /> Tendência de Resgates (Últimos 7 dias)
                      </h3>
                      <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats?.weeklyData}>
                                  <defs>
                                      <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold', fill: '#94a3b8'}} />
                                  <YAxis hide />
                                  <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                                  />
                                  <Area type="monotone" dataKey="resgates" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorRes)" />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>

              {/* AÇÕES RÁPIDAS E STATUS */}
              <div className="space-y-4">
                  <div className="bg-ocean-950 p-8 rounded-[2.5rem] text-white space-y-6">
                      <h4 className="text-sm font-black text-ocean-400 uppercase tracking-widest">Metas do Mês</h4>
                      <div className="space-y-4">
                          <div>
                              <div className="flex justify-between text-xs font-bold mb-2">
                                  <span>Uso de Cupons</span>
                                  <span>{Math.round((stats?.totalRedemptions / (stats?.activeCoupons * 100)) * 100) || 0}%</span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-ocean-500 rounded-full" style={{ width: `${Math.min(100, (stats?.totalRedemptions / 50) * 100)}%` }}></div>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setView('COUPONS')} className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl text-xs font-black transition-all">GERENCIAR INVENTÁRIO</button>
                  </div>

                  <button onClick={() => setView('PROFILE')} className="w-full bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-ocean-300 transition-all">
                    <div className="text-left">
                        <h3 className="text-lg font-black text-ocean-950 tracking-tight mb-1">Perfil da Loja</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Informações e Horários</p>
                    </div>
                    <div className="p-4 bg-ocean-50 text-ocean-600 rounded-2xl group-hover:scale-110 transition-transform"><Settings size={24} /></div>
                  </button>
              </div>
          </div>
      ) : (
          /* TELAS DE EDIÇÃO */
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6">
              <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase tracking-widest mb-8">
                <ChevronLeft size={16} /> Voltar ao Painel
              </button>

              {view === 'CREATE_COUPON' && (
                  <form onSubmit={handleCreateCoupon} className="space-y-8">
                      <h2 className="text-3xl font-black text-ocean-950 tracking-tight">Novo Cupom Estratégico</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <ImageUpload label="Foto da Oferta" currentImage={newCoupon.imageUrl} onImageSelect={img => setNewCoupon({...newCoupon, imageUrl: img})} />
                          <div className="space-y-4">
                              <input required className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm" placeholder="Título" value={newCoupon.title} onChange={e => setNewCoupon({...newCoupon, title: e.target.value})} />
                              <textarea className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm" rows={3} placeholder="Descrição" value={newCoupon.description} onChange={e => setNewCoupon({...newCoupon, description: e.target.value})} />
                              <div className="grid grid-cols-2 gap-4">
                                  <input type="number" step="0.01" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm" placeholder="Preço Real" value={newCoupon.originalPrice} onChange={e => setNewCoupon({...newCoupon, originalPrice: Number(e.target.value)})} />
                                  <input type="number" step="0.01" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm text-green-600" placeholder="Preço Oferta" value={newCoupon.discountedPrice} onChange={e => setNewCoupon({...newCoupon, discountedPrice: Number(e.target.value)})} />
                              </div>
                          </div>
                      </div>
                      <button type="submit" disabled={isSaving} className="w-full bg-ocean-600 text-white font-black py-6 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95">
                          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />} PUBLICAR AGORA
                      </button>
                  </form>
              )}

              {view === 'COUPONS' && (
                  <div className="space-y-8">
                      <h2 className="text-3xl font-black text-ocean-950 tracking-tight">Gestão de Inventário</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {coupons.map(coupon => (
                              <div key={coupon.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-ocean-200">
                                  <div className="flex items-center gap-4">
                                      <img src={coupon.imageUrl} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                                      <div>
                                          <h4 className="font-bold text-ocean-950">{coupon.title}</h4>
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{coupon.code}</p>
                                          <p className="text-xs font-black text-green-600">R$ {coupon.discountedPrice.toFixed(2)}</p>
                                      </div>
                                  </div>
                                  <button onClick={async () => { if(confirm("Remover?")) { await deleteCoupon(coupon.id); refreshData(); } }} className="p-4 text-red-200 hover:text-red-500">
                                      <Trash2 size={24}/>
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {view === 'PROFILE' && (
                  <div className="space-y-8">
                      <h2 className="text-3xl font-black text-ocean-950 tracking-tight">Dados da Loja</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <ImageUpload label="Capa" currentImage={myBusiness?.coverImage} onImageSelect={img => myBusiness && setMyBusiness({...myBusiness, coverImage: img})} />
                          <div className="space-y-4">
                              <input className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm" placeholder="Nome" value={myBusiness?.name} onChange={e => myBusiness && setMyBusiness({...myBusiness, name: e.target.value})} />
                              <textarea className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm" rows={4} placeholder="Bio" value={myBusiness?.description} onChange={e => myBusiness && setMyBusiness({...myBusiness, description: e.target.value})} />
                              <input className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm" placeholder="Endereço" value={myBusiness?.address} onChange={e => myBusiness && setMyBusiness({...myBusiness, address: e.target.value})} />
                          </div>
                      </div>
                      <button onClick={handleSaveBusiness} disabled={isSaving} className="w-full bg-ocean-600 text-white font-black py-6 rounded-2xl shadow-xl flex items-center justify-center gap-3">
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />} ATUALIZAR PERFIL
                      </button>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};
