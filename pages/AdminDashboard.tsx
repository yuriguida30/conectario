
import React, { useState, useEffect } from 'react';
import { User, Coupon, BusinessProfile, MenuItem, BusinessPlan, MenuSection, AMENITIES_LABELS } from '../types';
import { getCoupons, saveCoupon, deleteCoupon, getBusinesses, saveBusiness } from '../services/dataService';
import { generateCouponDescription } from '../services/geminiService';
import { 
  Plus, Trash2, Edit, X, Ticket, Store, LayoutDashboard, 
  Loader2, Star, Eye, MessageCircle, 
  Settings, Camera, MapPin, Instagram, 
  Globe, Utensils, Image as ImageIcon,
  ChevronLeft, AlertCircle, Save, List as ListIcon, Calendar, Percent,
  Phone, Users, TrendingUp, BarChart3, Clock, CheckCircle2, Cloud, Sparkles
} from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';

export const AdminDashboard: React.FC<{ currentUser: User; onNavigate: (page: string, params?: any) => void; onLogout: () => void }> = ({ currentUser, onNavigate, onLogout }) => {
  const [view, setView] = useState<'HOME' | 'COUPONS' | 'PROFILE' | 'MENU' | 'CREATE_COUPON'>('HOME');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [myBusiness, setMyBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingIA, setIsGeneratingIA] = useState(false);

  // Estados para formulários
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
        const myCoupons = allCoupons.filter(c => 
          c.companyId === currentUser.id || (currentUser.companyName && c.companyName === currentUser.companyName)
        );
        setCoupons(myCoupons);

        const businesses = getBusinesses();
        const biz = businesses.find(b => b.id === currentUser.id) || 
                    businesses.find(b => b.name === currentUser.companyName);
        
        if (biz) {
            setMyBusiness({ ...biz, menu: biz.menu || [] });
        }
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
      alert("Perfil comercial atualizado!");
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
        alert("Cupom criado com sucesso!");
        setNewCoupon({ title: '', description: '', originalPrice: 0, discountedPrice: 0, category: 'Gastronomia', active: true });
        setView('COUPONS');
        refreshData();
    } catch (e) { alert("Erro ao criar cupom."); }
    finally { setIsSaving(false); }
  };

  const handleGenerateIA = async () => {
      if (!newCoupon.originalPrice || !newCoupon.discountedPrice) return alert("Insira os preços primeiro.");
      setIsGeneratingIA(true);
      const discount = Math.round(((newCoupon.originalPrice - newCoupon.discountedPrice) / newCoupon.originalPrice) * 100);
      const desc = await generateCouponDescription(myBusiness?.name || "nossa loja", myBusiness?.category || "serviços", discount);
      setNewCoupon({...newCoupon, description: desc});
      setIsGeneratingIA(false);
  };

  const addMenuSection = () => {
      if (!myBusiness) return;
      const newMenu = [...(myBusiness.menu || []), { title: 'Nova Categoria', items: [] }];
      setMyBusiness({...myBusiness, menu: newMenu});
  };

  const addMenuItem = (sectionIdx: number) => {
      if (!myBusiness || !myBusiness.menu) return;
      const newMenu = [...myBusiness.menu];
      newMenu[sectionIdx].items.push({ id: `m_${Date.now()}`, name: 'Novo Item', price: 0, description: '' });
      setMyBusiness({...myBusiness, menu: newMenu});
  };

  if (loading && view === 'HOME') {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <Loader2 className="animate-spin text-ocean-600" size={48} />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sincronizando...</p>
        </div>
      );
  }

  const totalRedemptions = coupons.reduce((acc, c) => acc + (c.currentRedemptions || 0), 0);

  return (
    <div className="pb-32 pt-10 px-4 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SUPERIOR */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-ocean-600 text-white rounded-3xl flex items-center justify-center shadow-xl overflow-hidden">
                  {myBusiness?.coverImage ? <img src={myBusiness.coverImage} className="w-full h-full object-cover" /> : <Store size={40} />}
              </div>
              <div>
                  <h1 className="text-3xl font-black text-ocean-950 tracking-tight">{myBusiness?.name || currentUser.companyName}</h1>
                  <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-ocean-600 font-black uppercase tracking-widest">Sincronizado com Nuvem</span>
                      <Cloud size={12} className="text-ocean-400" />
                  </div>
              </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
              <button onClick={() => onNavigate('business-detail', { businessId: myBusiness?.id })} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all">
                <Eye size={18} /> VER PÁGINA
              </button>
              <button onClick={onLogout} className="flex-1 md:flex-none px-6 py-4 bg-red-50 text-red-500 rounded-2xl font-black text-xs hover:bg-red-100 transition-all">
                SAIR
              </button>
          </div>
      </div>

      {view === 'HOME' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visitas</p>
                          <p className="text-2xl font-black text-ocean-950">{myBusiness?.views || 0}</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cupons</p>
                          <p className="text-2xl font-black text-ocean-950">{coupons.length}</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resgates</p>
                          <p className="text-2xl font-black text-ocean-950">{totalRedemptions}</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avaliação</p>
                          <p className="text-2xl font-black text-ocean-950">{myBusiness?.rating || '5.0'}</p>
                      </div>
                  </div>

                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                          <h2 className="text-xl font-black text-ocean-950 uppercase">Ofertas Ativas</h2>
                          <button onClick={() => setView('COUPONS')} className="text-ocean-600 font-black text-[10px] uppercase tracking-widest">Ver Todos</button>
                      </div>
                      <div className="space-y-4">
                          {coupons.map(coupon => (
                              <div key={coupon.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <div className="flex items-center gap-4">
                                      <img src={coupon.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                                      <h4 className="font-bold text-sm text-ocean-950">{coupon.title}</h4>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <span className="text-xs font-black text-green-600">-{coupon.discountPercentage}%</span>
                                      <button onClick={() => deleteCoupon(coupon.id)} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                                  </div>
                              </div>
                          ))}
                          {coupons.length === 0 && <p className="text-center py-10 text-slate-400 text-xs font-bold uppercase">Nenhum cupom ativo.</p>}
                      </div>
                  </div>
              </div>

              <div className="space-y-4">
                  <button onClick={() => setView('CREATE_COUPON')} className="w-full bg-ocean-600 text-white p-8 rounded-[2.5rem] shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all">
                    <div className="text-left">
                        <h3 className="text-lg font-black tracking-tight mb-1">Criar Oferta</h3>
                        <p className="text-[10px] text-ocean-100 font-bold uppercase opacity-70">Novo Cupom de Desconto</p>
                    </div>
                    <Plus size={24} />
                  </button>
                  <button onClick={() => setView('PROFILE')} className="w-full bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-between hover:border-ocean-300 transition-all">
                    <div className="text-left">
                        <h3 className="text-lg font-black text-ocean-950 tracking-tight mb-1">Configurar Perfil</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bio, Horários e Fotos</p>
                    </div>
                    <Settings size={24} className="text-ocean-600" />
                  </button>
                  <button onClick={() => setView('MENU')} className="w-full bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-between hover:border-ocean-300 transition-all">
                    <div className="text-left">
                        <h3 className="text-lg font-black text-ocean-950 tracking-tight mb-1">Cardápio Digital</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gerenciar Produtos e Preços</p>
                    </div>
                    <Utensils size={24} className="text-ocean-600" />
                  </button>
              </div>
          </div>
      ) : (
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6">
              <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase tracking-widest mb-8">
                <ChevronLeft size={16} /> Voltar ao Painel
              </button>

              {view === 'CREATE_COUPON' && (
                  <form onSubmit={handleCreateCoupon} className="space-y-8">
                      <h2 className="text-3xl font-black text-ocean-950">Nova Oferta</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <ImageUpload label="Imagem do Produto/Oferta" currentImage={newCoupon.imageUrl} onImageSelect={img => setNewCoupon({...newCoupon, imageUrl: img})} />
                          <div className="space-y-4">
                              <input className="w-full bg-slate-50 p-4 rounded-xl border-slate-100 font-bold" placeholder="Título da Oferta (ex: Combo de Doces)" value={newCoupon.title} onChange={e => setNewCoupon({...newCoupon, title: e.target.value})} />
                              <div className="flex gap-2">
                                  <textarea className="flex-1 bg-slate-50 p-4 rounded-xl border-slate-100 text-sm" placeholder="Descrição da oferta..." rows={3} value={newCoupon.description} onChange={e => setNewCoupon({...newCoupon, description: e.target.value})} />
                                  <button type="button" onClick={handleGenerateIA} disabled={isGeneratingIA} className="bg-ocean-100 text-ocean-600 p-4 rounded-xl hover:bg-ocean-200 transition-colors" title="Sugerir com IA">
                                      {isGeneratingIA ? <Loader2 className="animate-spin"/> : <Sparkles size={24}/>}
                                  </button>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                      <label className="text-[10px] font-black text-slate-400 uppercase px-1">Preço Original</label>
                                      <input type="number" className="w-full bg-slate-50 p-4 rounded-xl border-slate-100 font-bold" placeholder="De R$" value={newCoupon.originalPrice} onChange={e => setNewCoupon({...newCoupon, originalPrice: Number(e.target.value)})} />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[10px] font-black text-slate-400 uppercase px-1">Preço Com Desconto</label>
                                      <input type="number" className="w-full bg-slate-50 p-4 rounded-xl border-slate-100 font-bold text-green-600" placeholder="Por R$" value={newCoupon.discountedPrice} onChange={e => setNewCoupon({...newCoupon, discountedPrice: Number(e.target.value)})} />
                                  </div>
                              </div>
                          </div>
                      </div>
                      <button type="submit" disabled={isSaving} className="w-full bg-ocean-600 text-white font-black py-6 rounded-2xl shadow-xl flex items-center justify-center gap-3">
                          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />} CRIAR E PUBLICAR CUPOM
                      </button>
                  </form>
              )}

              {view === 'MENU' && myBusiness && (
                  <div className="space-y-10">
                      <div className="flex justify-between items-center">
                          <h2 className="text-3xl font-black text-ocean-950">Cardápio Digital</h2>
                          <button onClick={addMenuSection} className="bg-ocean-50 text-ocean-600 px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2">
                              <Plus size={16}/> NOVA CATEGORIA
                          </button>
                      </div>
                      
                      <div className="space-y-8">
                          {myBusiness.menu?.map((section, sIdx) => (
                              <div key={sIdx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                                  <div className="flex justify-between items-center">
                                      <input className="bg-transparent border-none font-black text-xl text-ocean-950 focus:ring-0 p-0" value={section.title} onChange={e => {
                                          const nm = [...myBusiness.menu!]; nm[sIdx].title = e.target.value; setMyBusiness({...myBusiness, menu: nm});
                                      }} />
                                      <button onClick={() => addMenuItem(sIdx)} className="text-ocean-600 font-bold text-xs uppercase flex items-center gap-1">
                                          <Plus size={14}/> ITEM
                                      </button>
                                  </div>
                                  <div className="space-y-3">
                                      {section.items.map((item, iIdx) => (
                                          <div key={item.id} className="bg-white p-4 rounded-2xl flex gap-4 items-center">
                                              <input className="flex-1 text-sm font-bold bg-transparent border-none focus:ring-0" placeholder="Nome do item" value={item.name} onChange={e => {
                                                  const nm = [...myBusiness.menu!]; nm[sIdx].items[iIdx].name = e.target.value; setMyBusiness({...myBusiness, menu: nm});
                                              }} />
                                              <input type="number" className="w-24 text-sm font-black text-green-600 bg-slate-50 rounded-lg border-none focus:ring-0" placeholder="Preço" value={item.price} onChange={e => {
                                                  const nm = [...myBusiness.menu!]; nm[sIdx].items[iIdx].price = Number(e.target.value); setMyBusiness({...myBusiness, menu: nm});
                                              }} />
                                              <button onClick={() => {
                                                  const nm = [...myBusiness.menu!]; nm[sIdx].items.splice(iIdx, 1); setMyBusiness({...myBusiness, menu: nm});
                                              }} className="text-red-300 hover:text-red-500"><X size={16}/></button>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                      <button onClick={handleSaveBusiness} disabled={isSaving} className="w-full bg-ocean-600 text-white font-black py-6 rounded-2xl shadow-xl flex items-center justify-center gap-3">
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />} SALVAR CARDÁPIO
                      </button>
                  </div>
              )}

              {view === 'PROFILE' && myBusiness && (
                  <div className="space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <ImageUpload label="Capa do Perfil" currentImage={myBusiness.coverImage} onImageSelect={img => setMyBusiness({...myBusiness, coverImage: img})} />
                          <div className="space-y-4">
                              <input className="w-full bg-slate-50 p-4 rounded-xl border-slate-100 font-bold" placeholder="Nome da Empresa" value={myBusiness.name} onChange={e => setMyBusiness({...myBusiness, name: e.target.value})} />
                              <textarea className="w-full bg-slate-50 p-4 rounded-xl border-slate-100 text-sm" rows={4} placeholder="Bio da empresa..." value={myBusiness.description} onChange={e => setMyBusiness({...myBusiness, description: e.target.value})} />
                              <input className="w-full bg-slate-50 p-4 rounded-xl border-slate-100 text-sm" placeholder="Endereço" value={myBusiness.address} onChange={e => setMyBusiness({...myBusiness, address: e.target.value})} />
                              <input className="w-full bg-slate-50 p-4 rounded-xl border-slate-100 text-sm" placeholder="Instagram" value={myBusiness.instagram} onChange={e => setMyBusiness({...myBusiness, instagram: e.target.value})} />
                          </div>
                      </div>
                      <button onClick={handleSaveBusiness} disabled={isSaving} className="w-full bg-ocean-600 text-white font-black py-6 rounded-2xl shadow-xl flex items-center justify-center gap-3">
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />} ATUALIZAR PERFIL
                      </button>
                  </div>
              )}

              {view === 'COUPONS' && (
                  <div className="space-y-8">
                      <h2 className="text-2xl font-black text-ocean-950">Histórico de Ofertas</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {coupons.map(coupon => (
                              <div key={coupon.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                      <img src={coupon.imageUrl} className="w-16 h-16 rounded-2xl object-cover" />
                                      <div>
                                          <h4 className="font-bold text-ocean-950">{coupon.title}</h4>
                                          <p className="text-[10px] font-black text-slate-400 uppercase">{coupon.code}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-300 uppercase">Resgates</p>
                                        <p className="text-xs font-black text-ocean-600">{coupon.currentRedemptions || 0}</p>
                                    </div>
                                    <button onClick={async () => { if(confirm("Remover?")){ await deleteCoupon(coupon.id); refreshData(); } }} className="p-3 text-red-300 hover:text-red-500"><Trash2 size={20}/></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};
