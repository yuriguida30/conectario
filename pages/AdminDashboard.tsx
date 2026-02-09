
import React, { useState, useEffect } from 'react';
import { User, Coupon, BusinessProfile, MenuItem, BusinessPlan, MenuSection, AMENITIES_LABELS } from '../types';
import { getCoupons, saveCoupon, deleteCoupon, getBusinesses, saveBusiness } from '../services/dataService';
import { 
  Plus, Trash2, Edit, X, Ticket, Store, LayoutDashboard, 
  Loader2, Star, Eye, MessageCircle, 
  Settings, Camera, MapPin, Instagram, 
  Globe, Utensils, Image as ImageIcon,
  ChevronLeft, AlertCircle, Save, List as ListIcon, Calendar, Percent,
  Phone, Users, TrendingUp, BarChart3, Clock, CheckCircle2
} from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';

export const AdminDashboard: React.FC<{ currentUser: User; onNavigate: (page: string, params?: any) => void; onLogout: () => void }> = ({ currentUser, onNavigate, onLogout }) => {
  const [view, setView] = useState<'HOME' | 'COUPONS' | 'PROFILE' | 'GALLERY' | 'MENU' | 'CREATE_COUPON'>('HOME');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [myBusiness, setMyBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form de Cupom
  const [couponForm, setCouponForm] = useState<Partial<Coupon>>({
      title: '',
      description: '',
      originalPrice: 0,
      discountedPrice: 0,
      discountPercentage: 0,
      category: currentUser.category || 'Gastronomia',
      expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      code: '',
      rules: ['Válido para consumo no local', 'Apresente este código ao atendente'],
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
      maxRedemptions: 100
  });

  useEffect(() => {
    refreshData();
    window.addEventListener('dataUpdated', refreshData);
    return () => window.removeEventListener('dataUpdated', refreshData);
  }, [currentUser]);

  const refreshData = async () => {
    if (!currentUser) return;
    
    try {
        const allCoupons = await getCoupons();
        // Garantindo que buscamos cupons tanto pelo ID do usuário quanto pelo nome da empresa se necessário
        const myCoupons = allCoupons.filter(c => 
          c.companyId === currentUser.id || 
          (currentUser.companyName && c.companyName === currentUser.companyName)
        );
        setCoupons(myCoupons);

        const businesses = getBusinesses();
        const biz = businesses.find(b => b.id === currentUser.id) || 
                    businesses.find(b => b.name === currentUser.companyName);
        
        if (biz) {
            setMyBusiness({ ...biz, menu: biz.menu || [] });
        } else {
            // Se não encontrar, criamos um esqueleto para o André poder preencher
            const placeholderBiz: BusinessProfile = {
                id: currentUser.id,
                name: currentUser.companyName || currentUser.name,
                category: currentUser.category || 'Gastronomia',
                description: '',
                coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
                gallery: [],
                address: '',
                phone: currentUser.phone || '',
                amenities: [],
                openingHours: { 'Seg-Sex': '09:00 - 18:00' },
                rating: 5,
                reviewCount: 0,
                views: 0,
                menu: []
            };
            setMyBusiness(placeholderBiz);
        }
    } catch (err) {
        console.error("Erro ao carregar admin:", err);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!myBusiness) return;
    setIsSaving(true);
    try {
      await saveBusiness(myBusiness);
      alert("Seu perfil foi atualizado com sucesso!");
      setView('HOME');
    } catch (err) {
      alert("Erro ao salvar perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!myBusiness) return;
      
      if (!couponForm.title || !couponForm.code) {
          alert("Título e Código são obrigatórios.");
          return;
      }

      setIsSaving(true);
      
      const newCoupon: Coupon = {
          ...couponForm as Coupon,
          id: `c_${Math.random().toString(36).substring(2, 9)}`,
          companyId: myBusiness.id,
          companyName: myBusiness.name,
          companyLogo: myBusiness.coverImage,
          active: true,
          currentRedemptions: 0,
          rating: 5.0,
          reviews: 0
      };

      try {
          await saveCoupon(newCoupon);
          alert("Novo cupom publicado!");
          setView('COUPONS');
          refreshData();
      } catch (err) {
          alert("Erro ao criar cupom.");
      } finally {
          setIsSaving(false);
      }
  };

  const calculateDiscount = (orig: number, disc: number) => {
      if (!orig || !disc) return 0;
      return Math.round(((orig - disc) / orig) * 100);
  };

  if (loading && view === 'HOME') {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <Loader2 className="animate-spin text-ocean-600" size={48} />
            <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Sincronizando seu Painel...</p>
        </div>
      );
  }

  const totalRedemptions = coupons.reduce((acc, c) => acc + (c.currentRedemptions || 0), 0);
  const activeCoupons = coupons.filter(c => c.active).length;

  return (
    <div className="pb-32 pt-10 px-4 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SUPERIOR */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
              <div className="relative">
                  <div className="w-20 h-20 bg-ocean-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-ocean-600/30 overflow-hidden">
                      {myBusiness?.coverImage ? (
                          <img src={myBusiness.coverImage} className="w-full h-full object-cover" />
                      ) : (
                          <Store size={40} />
                      )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-4 border-white">
                      <CheckCircle2 size={16} />
                  </div>
              </div>
              <div>
                  <h1 className="text-3xl font-black text-ocean-950 tracking-tight">{myBusiness?.name || currentUser.companyName}</h1>
                  <div className="flex items-center gap-4 mt-1">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{myBusiness?.category}</p>
                      <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                      <p className="text-[10px] text-ocean-600 font-black uppercase tracking-[0.2em]">Parceiro Conecta Rio</p>
                  </div>
              </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => onNavigate('business-detail', { businessId: myBusiness?.id })} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all active:scale-95"
              >
                <Eye size={18} /> VER PÁGINA
              </button>
              <button 
                onClick={onLogout} 
                className="flex-1 md:flex-none px-6 py-4 bg-red-50 text-red-500 rounded-2xl font-black text-xs hover:bg-red-100 transition-all active:scale-95"
              >
                SAIR
              </button>
          </div>
      </div>

      {/* STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
              <div className="bg-ocean-50 text-ocean-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><Eye size={20}/></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visualizações</span>
              <span className="text-2xl font-black text-ocean-950">{myBusiness?.views || 0}</span>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
              <div className="bg-green-50 text-green-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><Ticket size={20}/></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cupons Ativos</span>
              <span className="text-2xl font-black text-ocean-950">{activeCoupons}</span>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
              <div className="bg-purple-50 text-purple-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><Users size={20}/></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Resgates</span>
              <span className="text-2xl font-black text-ocean-950">{totalRedemptions}</span>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
              <div className="bg-gold-50 text-gold-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><Star size={20}/></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avaliação</span>
              <span className="text-2xl font-black text-ocean-950">{myBusiness?.rating?.toFixed(1) || '5.0'}</span>
          </div>
      </div>

      {view !== 'HOME' && (
          <button 
            onClick={() => setView('HOME')} 
            className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase tracking-widest py-2"
          >
            <ChevronLeft size={16} /> Voltar ao Dashboard
          </button>
      )}

      {/* HOME VIEW (MENU DE AÇÕES) */}
      {view === 'HOME' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <button 
                onClick={() => setView('CREATE_COUPON')} 
                className="bg-ocean-600 text-white p-10 rounded-[2.5rem] shadow-2xl shadow-ocean-600/20 flex flex-col items-center justify-center gap-4 group hover:-translate-y-2 transition-all duration-300"
              >
                <div className="p-4 bg-white/20 rounded-3xl group-hover:scale-110 transition-transform"><Plus size={40} strokeWidth={3} /></div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-center">Criar Novo Cupom</span>
              </button>

              <button 
                onClick={() => setView('COUPONS')} 
                className="bg-white p-10 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center gap-4 hover:border-ocean-300 transition-all shadow-sm group"
              >
                <div className="p-4 bg-ocean-50 text-ocean-600 rounded-3xl group-hover:scale-110 transition-transform"><Ticket size={40} /></div>
                <span className="text-xs font-black uppercase text-ocean-950 tracking-[0.2em]">Meus Cupons</span>
              </button>

              <button 
                onClick={() => setView('PROFILE')} 
                className="bg-white p-10 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center gap-4 hover:border-ocean-300 transition-all shadow-sm group"
              >
                <div className="p-4 bg-ocean-50 text-ocean-600 rounded-3xl group-hover:scale-110 transition-transform"><Settings size={40} /></div>
                <span className="text-xs font-black uppercase text-ocean-950 tracking-[0.2em]">Editar Perfil</span>
              </button>

              <button 
                onClick={() => setView('MENU')} 
                className="bg-white p-10 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center gap-4 hover:border-ocean-300 transition-all shadow-sm group"
              >
                <div className="p-4 bg-ocean-50 text-ocean-600 rounded-3xl group-hover:scale-110 transition-transform"><Utensils size={40} /></div>
                <span className="text-xs font-black uppercase text-ocean-950 tracking-[0.2em]">Cardápio Digital</span>
              </button>
          </div>
      )}

      {/* CREATE COUPON VIEW */}
      {view === 'CREATE_COUPON' && (
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6">
              <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-ocean-50 text-ocean-600 rounded-3xl"><Ticket size={32}/></div>
                  <div>
                    <h2 className="text-3xl font-black text-ocean-950 tracking-tight">Publicar Oferta</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Atraia mais clientes com descontos reais</p>
                  </div>
              </div>
              
              <form onSubmit={handleCreateCoupon} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                          <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Título Chamativo</label>
                              <input 
                                required
                                placeholder="Ex: 20% OFF em Doces Artesanais"
                                className="w-full bg-slate-50 border-slate-200 rounded-2xl p-5 text-sm font-bold focus:ring-4 focus:ring-ocean-500/10 focus:border-ocean-500 outline-none transition-all"
                                value={couponForm.title}
                                onChange={e => setCouponForm({...couponForm, title: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Descrição detalhada do benefício</label>
                              <textarea 
                                required
                                rows={4}
                                placeholder="Descreva exatamente o que o cliente ganha e por que ele deve resgatar agora..."
                                className="w-full bg-slate-50 border-slate-200 rounded-2xl p-5 text-sm focus:ring-4 focus:ring-ocean-500/10 focus:border-ocean-500 outline-none transition-all"
                                value={couponForm.description}
                                onChange={e => setCouponForm({...couponForm, description: e.target.value})}
                              />
                          </div>
                          <ImageUpload 
                            label="Imagem da Oferta (Impactante)" 
                            currentImage={couponForm.imageUrl} 
                            onImageSelect={img => setCouponForm({...couponForm, imageUrl: img})}
                          />
                      </div>
                      
                      <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Preço Normal (R$)</label>
                                  <input 
                                    type="number"
                                    required
                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl p-5 text-sm font-black focus:ring-4 focus:ring-ocean-500/10 outline-none transition-all"
                                    value={couponForm.originalPrice}
                                    onChange={e => {
                                        const val = Number(e.target.value);
                                        setCouponForm({
                                            ...couponForm, 
                                            originalPrice: val,
                                            discountPercentage: calculateDiscount(val, couponForm.discountedPrice || 0)
                                        });
                                    }}
                                  />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Preço Oferta (R$)</label>
                                  <input 
                                    type="number"
                                    required
                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl p-5 text-sm font-black text-green-600 focus:ring-4 focus:ring-ocean-500/10 outline-none transition-all"
                                    value={couponForm.discountedPrice}
                                    onChange={e => {
                                        const val = Number(e.target.value);
                                        setCouponForm({
                                            ...couponForm, 
                                            discountedPrice: val,
                                            discountPercentage: calculateDiscount(couponForm.originalPrice || 0, val)
                                        });
                                    }}
                                  />
                              </div>
                          </div>
                          <div className="bg-ocean-950 p-6 rounded-3xl flex items-center justify-between text-white shadow-xl">
                              <div>
                                  <p className="text-[10px] font-black text-ocean-400 uppercase tracking-widest">Economia Final</p>
                                  <span className="text-3xl font-black">{couponForm.discountPercentage}% OFF</span>
                              </div>
                              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><Percent size={24} className="text-ocean-400" /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Código Curto</label>
                                  <input 
                                    required
                                    placeholder="EX: DOCE20"
                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl p-5 text-sm font-black uppercase tracking-widest focus:ring-4 focus:ring-ocean-500/10 outline-none"
                                    value={couponForm.code}
                                    onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Expira em</label>
                                  <input 
                                    type="date"
                                    required
                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl p-5 text-sm font-bold focus:ring-4 focus:ring-ocean-500/10 outline-none"
                                    value={couponForm.expiryDate}
                                    onChange={e => setCouponForm({...couponForm, expiryDate: e.target.value})}
                                  />
                              </div>
                          </div>
                      </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="w-full bg-ocean-600 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-ocean-600/30 flex items-center justify-center gap-3 hover:bg-ocean-700 hover:scale-[1.01] transition-all active:scale-95"
                  >
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />} PUBLICAR OFERTA AGORA
                  </button>
              </form>
          </div>
      )}

      {/* LIST COUPONS VIEW */}
      {view === 'COUPONS' && (
          <div className="space-y-8 animate-in slide-in-from-right-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-ocean-950 tracking-tight">Suas Ofertas Ativas</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Acompanhe o desempenho de cada cupom</p>
                  </div>
                  <button onClick={() => setView('CREATE_COUPON')} className="bg-ocean-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-ocean-600/20 active:scale-95 transition-all"><Plus size={20}/> Novo Cupom</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {coupons.map(coupon => (
                      <div key={coupon.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 flex flex-col md:flex-row gap-8 items-center shadow-sm hover:shadow-xl transition-all group">
                          <div className="relative shrink-0">
                              <img src={coupon.imageUrl} className="w-32 h-32 rounded-[2.5rem] object-cover bg-slate-100 shadow-md group-hover:scale-105 transition-transform" />
                              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-sm">-{coupon.discountPercentage}%</div>
                          </div>
                          <div className="flex-1 space-y-2 text-center md:text-left">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                  <h3 className="font-black text-ocean-950 leading-tight text-lg">{coupon.title}</h3>
                                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{coupon.active ? 'Ativo' : 'Inativo'}</span>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{coupon.description}</p>
                              <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
                                  <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-slate-300 uppercase">Resgates</span>
                                      <span className="text-sm font-black text-ocean-600">{coupon.currentRedemptions || 0} de {coupon.maxRedemptions || '∞'}</span>
                                  </div>
                                  <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-slate-300 uppercase">Código</span>
                                      <span className="text-sm font-black text-ocean-950 tracking-widest">{coupon.code}</span>
                                  </div>
                              </div>
                          </div>
                          <button 
                            onClick={async () => { if(confirm("Deseja realmente remover esta oferta?")) { await deleteCoupon(coupon.id); refreshData(); } }} 
                            className="p-4 bg-red-50 text-red-300 hover:text-red-500 hover:bg-red-100 transition-all rounded-3xl active:scale-95"
                          >
                            <Trash2 size={24}/>
                          </button>
                      </div>
                  ))}
                  {coupons.length === 0 && (
                      <div className="col-span-full py-24 text-center border-4 border-dashed border-slate-200 rounded-[4rem] flex flex-col items-center gap-6">
                          <div className="bg-slate-100 p-8 rounded-full text-slate-300"><Ticket size={64}/></div>
                          <div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Nenhuma oferta publicada ainda.</p>
                            <p className="text-xs text-slate-300 mt-1">Comece agora para aparecer no aplicativo!</p>
                          </div>
                          <button onClick={() => setView('CREATE_COUPON')} className="text-ocean-600 font-black uppercase text-xs tracking-[0.3em] hover:scale-105 transition-all">Criar meu primeiro cupom</button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* PROFILE EDITOR */}
      {view === 'PROFILE' && myBusiness && (
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-right-6">
              <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-ocean-50 text-ocean-600 rounded-3xl"><Settings size={32}/></div>
                  <div>
                    <h2 className="text-3xl font-black text-ocean-950 tracking-tight">Perfil da Empresa</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Como os clientes verão sua marca no guia</p>
                  </div>
              </div>

              <div className="space-y-12">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <ImageUpload 
                            label="Foto de Capa (Obrigatório)" 
                            currentImage={myBusiness.coverImage} 
                            onImageSelect={img => setMyBusiness({...myBusiness, coverImage: img})} 
                        />
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Nome do Estabelecimento</label>
                            <input 
                                className="w-full bg-slate-50 border-slate-200 rounded-2xl p-5 text-sm font-bold outline-none focus:ring-4 focus:ring-ocean-500/10 focus:border-ocean-500 transition-all" 
                                value={myBusiness.name} 
                                onChange={e => setMyBusiness({...myBusiness, name: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Breve História ou Descrição</label>
                            <textarea 
                                rows={6}
                                placeholder="Conte um pouco sobre sua tradição, especialidades e ambiente..."
                                className="w-full bg-slate-50 border-slate-200 rounded-2xl p-5 text-sm outline-none focus:ring-4 focus:ring-ocean-500/10 focus:border-ocean-500 transition-all" 
                                value={myBusiness.description} 
                                onChange={e => setMyBusiness({...myBusiness, description: e.target.value})} 
                            />
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Localização Completa</label>
                            <div className="relative">
                                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                <input 
                                    placeholder="Rua, Número, Bairro, Cidade - UF"
                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl py-5 pl-14 pr-4 text-sm font-bold outline-none focus:ring-4 focus:ring-ocean-500/10 focus:border-ocean-500 transition-all" 
                                    value={myBusiness.address} 
                                    onChange={e => setMyBusiness({...myBusiness, address: e.target.value})} 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Contato Público (WhatsApp)</label>
                                <div className="relative">
                                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    <input 
                                        placeholder="Ex: 21999999999"
                                        className="w-full bg-slate-50 border-slate-200 rounded-2xl py-5 pl-14 pr-4 text-sm font-bold outline-none focus:ring-4 focus:ring-ocean-500/10" 
                                        value={myBusiness.phone} 
                                        onChange={e => setMyBusiness({...myBusiness, phone: e.target.value, whatsapp: e.target.value})} 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Instagram (@usuario)</label>
                                <div className="relative">
                                    <Instagram className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    <input 
                                        placeholder="@suaempresa"
                                        className="w-full bg-slate-50 border-slate-200 rounded-2xl py-5 pl-14 pr-4 text-sm font-bold outline-none focus:ring-4 focus:ring-ocean-500/10" 
                                        value={myBusiness.instagram || ''} 
                                        onChange={e => setMyBusiness({...myBusiness, instagram: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Comodidades Oferecidas</label>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.keys(AMENITIES_LABELS).map(key => (
                                    <label key={key} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${myBusiness.amenities?.includes(key) ? 'bg-ocean-50 border-ocean-200 text-ocean-700' : 'bg-white border-slate-100 text-slate-400'}`}>
                                        <input 
                                            type="checkbox" 
                                            className="hidden" 
                                            checked={myBusiness.amenities?.includes(key)} 
                                            onChange={() => {
                                                const ams = [...(myBusiness.amenities || [])];
                                                const idx = ams.indexOf(key);
                                                if (idx === -1) ams.push(key);
                                                else ams.splice(idx, 1);
                                                setMyBusiness({...myBusiness, amenities: ams});
                                            }}
                                        />
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${myBusiness.amenities?.includes(key) ? 'bg-ocean-600 border-ocean-600' : 'border-slate-200'}`}>
                                            {myBusiness.amenities?.includes(key) && <CheckCircle2 size={12} className="text-white" />}
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider">{AMENITIES_LABELS[key]}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                      </div>
                  </div>

                  <button 
                    onClick={handleSaveBusiness} 
                    disabled={isSaving}
                    className="w-full bg-ocean-600 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-ocean-600/30 flex items-center justify-center gap-4 hover:bg-ocean-700 hover:scale-[1.01] transition-all active:scale-95"
                  >
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save size={28} />} SALVAR PERFIL COMERCIAL
                  </button>
              </div>
          </div>
      )}

      {/* MENU EDITOR */}
      {view === 'MENU' && myBusiness && (
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-right-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                  <div className="flex items-center gap-4">
                      <div className="p-4 bg-ocean-50 text-ocean-600 rounded-3xl"><Utensils size={32}/></div>
                      <div>
                        <h2 className="text-3xl font-black text-ocean-950 tracking-tight">Cardápio Digital</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Produtos disponíveis para consulta rápida</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => { const m = [...(myBusiness.menu||[])]; m.push({ title: 'Nova Categoria', items: [] }); setMyBusiness({...myBusiness, menu: m}); }} 
                    className="bg-ocean-100 text-ocean-700 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-md active:scale-95 transition-all"
                  >
                    <Plus size={20}/> Nova Categoria
                  </button>
              </div>

              <div className="space-y-10">
                  {myBusiness.menu?.map((section, sIdx) => (
                      <div key={sIdx} className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 relative group/section">
                          <div className="flex gap-4 mb-6">
                              <input 
                                  className="flex-1 bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-ocean-950 outline-none focus:border-ocean-300 transition-all text-lg" 
                                  value={section.title} 
                                  onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].title = e.target.value; setMyBusiness({...myBusiness, menu: m}); }} 
                                  placeholder="Ex: Sobremesas, Cafés, Salgados..."
                              />
                              <button onClick={() => { if(confirm("Deseja remover esta categoria e todos os itens dela?")){ const m = [...(myBusiness.menu||[])]; m.splice(sIdx, 1); setMyBusiness({...myBusiness, menu: m}); } }} className="bg-red-50 text-red-300 hover:text-red-500 p-4 rounded-2xl transition-all active:scale-95"><Trash2 size={24}/></button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-4 border-ocean-200">
                              {section.items.map((item, iIdx) => (
                                  <div key={item.id} className="bg-white p-5 rounded-2xl flex flex-col gap-4 border border-slate-100 hover:border-ocean-200 transition-all shadow-sm">
                                      <div className="flex items-center gap-4">
                                          <input 
                                            className="flex-1 text-sm font-black bg-slate-50 rounded-xl p-4 outline-none focus:bg-white transition-all" 
                                            placeholder="Nome do produto" 
                                            value={item.name} 
                                            onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].items[iIdx].name = e.target.value; setMyBusiness({...myBusiness, menu: m}); }} 
                                          />
                                          <input 
                                            className="w-32 text-sm font-black text-green-600 bg-slate-50 rounded-xl p-4 text-right outline-none focus:bg-white transition-all" 
                                            type="number" 
                                            step="0.01" 
                                            value={item.price} 
                                            onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].items[iIdx].price = Number(e.target.value); setMyBusiness({...myBusiness, menu: m}); }} 
                                          />
                                          <button onClick={() => { const m = [...(myBusiness.menu||[])]; m[sIdx].items.splice(iIdx, 1); setMyBusiness({...myBusiness, menu: m}); }} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><X size={20}/></button>
                                      </div>
                                      <textarea 
                                        className="w-full text-xs bg-slate-50 rounded-xl p-3 outline-none focus:bg-white transition-all resize-none" 
                                        placeholder="Ingredientes ou descrição curta..." 
                                        rows={2}
                                        value={item.description || ''} 
                                        onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].items[iIdx].description = e.target.value; setMyBusiness({...myBusiness, menu: m}); }} 
                                      />
                                  </div>
                              ))}
                              <button 
                                onClick={() => { const m = [...(myBusiness.menu||[])]; m[sIdx].items.push({ id: Math.random().toString(36).substring(2,7), name: '', price: 0, description: '' }); setMyBusiness({...myBusiness, menu: m}); }} 
                                className="col-span-full py-6 border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black rounded-3xl hover:text-ocean-600 hover:border-ocean-300 hover:bg-white transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                              >
                                <Plus size={16}/> Adicionar Item à {section.title}
                              </button>
                          </div>
                      </div>
                  ))}
              </div>

              <button 
                onClick={handleSaveBusiness} 
                disabled={isSaving}
                className="w-full mt-12 bg-ocean-600 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-ocean-600/30 flex items-center justify-center gap-4 hover:bg-ocean-700 hover:scale-[1.01] transition-all active:scale-95"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={28} />} SALVAR CARDÁPIO DIGITAL
              </button>
          </div>
      )}
    </div>
  );
};
