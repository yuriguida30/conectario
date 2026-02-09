
import React, { useState, useEffect } from 'react';
import { User, Coupon, BusinessProfile, MenuItem, BusinessPlan, MenuSection } from '../types';
import { getCoupons, saveCoupon, deleteCoupon, getBusinesses, saveBusiness } from '../services/dataService';
import { 
  Plus, Trash2, Edit, X, Ticket, Store, LayoutDashboard, 
  Loader2, Star, Eye, MessageCircle, 
  Settings, Camera, MapPin, Instagram, 
  Globe, Utensils, Image as ImageIcon,
  ChevronLeft, AlertCircle, Save, List as ListIcon, Calendar, Percent,
  Phone
} from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';

export const AdminDashboard: React.FC<{ currentUser: User; onNavigate: (page: string, params?: any) => void; onLogout: () => void }> = ({ currentUser, onNavigate, onLogout }) => {
  const [view, setView] = useState<'HOME' | 'COUPONS' | 'PROFILE' | 'GALLERY' | 'MENU' | 'CREATE_COUPON'>('HOME');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [myBusiness, setMyBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New Coupon Form State
  const [couponForm, setCouponForm] = useState<Partial<Coupon>>({
      title: '',
      description: '',
      originalPrice: 0,
      discountedPrice: 0,
      discountPercentage: 0,
      category: currentUser.category || 'Geral',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      code: '',
      rules: ['Válido para consumo no local', 'Apresente este código ao atendente'],
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'
  });

  useEffect(() => {
    refreshData();
  }, [currentUser]);

  const refreshData = async () => {
    setLoading(true);
    try {
        const allCoupons = await getCoupons();
        const myCoupons = allCoupons.filter(c => c.companyId === currentUser.id);
        setCoupons(myCoupons);

        const businesses = getBusinesses();
        const biz = businesses.find(b => b.id === currentUser.id) || 
                    businesses.find(b => b.name === currentUser.companyName);
        
        if (biz) {
            setMyBusiness({ ...biz, menu: biz.menu || [] });
        } else {
            setMyBusiness({
                id: currentUser.id,
                name: currentUser.companyName || currentUser.name,
                category: currentUser.category || 'Geral',
                description: '',
                coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
                gallery: [],
                address: '',
                phone: currentUser.phone || '',
                amenities: [],
                openingHours: {},
                rating: 5,
                menu: []
            });
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
      alert("Alterações salvas com sucesso!");
    } catch (err) {
      alert("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!myBusiness) return;
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
          alert("Cupom criado com sucesso!");
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

  if (loading && view === 'HOME') return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-ocean-600" size={40} /></div>;

  return (
    <div className="pb-32 pt-10 px-4 max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-ocean-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-ocean-600/20">
                  <Store size={32} />
              </div>
              <div>
                  <h1 className="text-2xl font-black text-ocean-950">{currentUser.companyName || currentUser.name}</h1>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Painel Administrativo</p>
              </div>
          </div>
          <div className="flex gap-3">
              <button onClick={() => onNavigate('business-detail', { businessId: currentUser.id })} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-colors"><Eye size={18} /> Ver Página</button>
              <button onClick={onLogout} className="px-6 py-3 bg-red-50 text-red-500 rounded-2xl font-bold text-xs hover:bg-red-100 transition-colors">Sair</button>
          </div>
      </div>

      {view !== 'HOME' && (
          <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-black text-sm uppercase tracking-widest"><ChevronLeft size={20} /> Voltar ao Início</button>
      )}

      {/* HOME VIEW */}
      {view === 'HOME' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button onClick={() => setView('CREATE_COUPON')} className="bg-ocean-600 text-white p-8 rounded-[2rem] shadow-xl flex flex-col items-center justify-center gap-3 transform hover:scale-105 transition-all"><Plus size={32} /><span className="text-xs font-black uppercase tracking-widest text-center">Criar Novo Cupom</span></button>
              <button onClick={() => setView('COUPONS')} className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center gap-3 hover:border-ocean-300 transition-all"><Ticket size={32} className="text-ocean-600" /><span className="text-xs font-black uppercase text-ocean-950">Meus Cupons ({coupons.length})</span></button>
              <button onClick={() => setView('PROFILE')} className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center gap-3 hover:border-ocean-300 transition-all"><Settings size={32} className="text-ocean-600" /><span className="text-xs font-black uppercase text-ocean-950">Editar Perfil</span></button>
              <button onClick={() => setView('MENU')} className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center gap-3 hover:border-ocean-300 transition-all"><Utensils size={32} className="text-ocean-600" /><span className="text-xs font-black uppercase text-ocean-950">Cardápio Digital</span></button>
          </div>
      )}

      {/* CREATE COUPON VIEW */}
      {view === 'CREATE_COUPON' && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-ocean-50 text-ocean-600 rounded-2xl"><Ticket size={24}/></div>
                  <h2 className="text-2xl font-black text-ocean-950">Novo Cupom de Desconto</h2>
              </div>
              
              <form onSubmit={handleCreateCoupon} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Título da Oferta</label>
                              <input 
                                required
                                placeholder="Ex: 20% OFF em todo o site"
                                className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-ocean-500 outline-none"
                                value={couponForm.title}
                                onChange={e => setCouponForm({...couponForm, title: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Descrição Curta</label>
                              <textarea 
                                required
                                rows={3}
                                placeholder="Descreva brevemente o benefício para atrair clientes..."
                                className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-ocean-500 outline-none"
                                value={couponForm.description}
                                onChange={e => setCouponForm({...couponForm, description: e.target.value})}
                              />
                          </div>
                      </div>
                      
                      <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Preço Original</label>
                                  <input 
                                    type="number"
                                    required
                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm font-black focus:ring-2 focus:ring-ocean-500 outline-none"
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
                                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Preço com Desconto</label>
                                  <input 
                                    type="number"
                                    required
                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm font-black text-green-600 focus:ring-2 focus:ring-ocean-500 outline-none"
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
                          <div className="bg-ocean-50 p-4 rounded-2xl flex items-center justify-between">
                              <span className="text-xs font-black text-ocean-900 uppercase">Economia Gerada</span>
                              <div className="flex items-center gap-2">
                                  <span className="text-2xl font-black text-ocean-600">{couponForm.discountPercentage}%</span>
                                  <Percent size={20} className="text-ocean-400" />
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Código do Cupom</label>
                                  <input 
                                    required
                                    placeholder="EX: RIO20"
                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm font-black uppercase focus:ring-2 focus:ring-ocean-500 outline-none"
                                    value={couponForm.code}
                                    onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Validade</label>
                                  <input 
                                    type="date"
                                    required
                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-ocean-500 outline-none"
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
                    className="w-full bg-ocean-600 text-white font-black py-5 rounded-3xl shadow-xl flex items-center justify-center gap-3 hover:bg-ocean-700 transition-all"
                  >
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />} CRIAR E PUBLICAR CUPOM
                  </button>
              </form>
          </div>
      )}

      {/* LIST COUPONS VIEW */}
      {view === 'COUPONS' && (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-ocean-950">Meus Cupons Ativos</h2>
                  <button onClick={() => setView('CREATE_COUPON')} className="bg-ocean-100 text-ocean-700 px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2"><Plus size={16}/> Novo Cupom</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {coupons.map(coupon => (
                      <div key={coupon.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex gap-6 items-center shadow-sm">
                          <img src={coupon.imageUrl} className="w-24 h-24 rounded-3xl object-cover bg-slate-100" />
                          <div className="flex-1">
                              <h3 className="font-bold text-ocean-950 leading-tight mb-1">{coupon.title}</h3>
                              <p className="text-xs text-slate-400 mb-3 line-clamp-1">{coupon.description}</p>
                              <div className="flex items-center gap-4">
                                  <span className="text-xs font-black text-green-600">R$ {coupon.discountedPrice}</span>
                                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{coupon.code}</span>
                              </div>
                          </div>
                          <button onClick={async () => { if(confirm("Deseja desativar este cupom?")) { await deleteCoupon(coupon.id); refreshData(); } }} className="text-red-300 hover:text-red-500 transition-colors p-2"><Trash2 size={20}/></button>
                      </div>
                  ))}
                  {coupons.length === 0 && (
                      <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
                          <p className="text-slate-400 font-bold mb-4">Você ainda não criou nenhum cupom.</p>
                          <button onClick={() => setView('CREATE_COUPON')} className="text-ocean-600 font-black uppercase text-xs">Criar meu primeiro cupom</button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* PROFILE EDITOR */}
      {view === 'PROFILE' && myBusiness && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in slide-in-from-right-4">
              <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-ocean-50 text-ocean-600 rounded-2xl"><Settings size={24}/></div>
                  <h2 className="text-2xl font-black text-ocean-950">Editar Perfil Comercial</h2>
              </div>

              <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <ImageUpload 
                            label="Foto de Capa" 
                            currentImage={myBusiness.coverImage} 
                            onImageSelect={img => setMyBusiness({...myBusiness, coverImage: img})} 
                        />
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Nome Fantasia</label>
                            <input 
                                className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-ocean-500" 
                                value={myBusiness.name} 
                                onChange={e => setMyBusiness({...myBusiness, name: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Descrição do Negócio</label>
                            <textarea 
                                rows={4}
                                className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-ocean-500" 
                                value={myBusiness.description} 
                                onChange={e => setMyBusiness({...myBusiness, description: e.target.value})} 
                            />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Endereço Completo</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input 
                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-ocean-500" 
                                    value={myBusiness.address} 
                                    onChange={e => setMyBusiness({...myBusiness, address: e.target.value})} 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Telefone / WhatsApp</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input 
                                        className="w-full bg-slate-50 border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-ocean-500" 
                                        value={myBusiness.phone} 
                                        onChange={e => setMyBusiness({...myBusiness, phone: e.target.value, whatsapp: e.target.value})} 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Instagram (@usuario)</label>
                                <div className="relative">
                                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input 
                                        className="w-full bg-slate-50 border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-ocean-500" 
                                        value={myBusiness.instagram || ''} 
                                        onChange={e => setMyBusiness({...myBusiness, instagram: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Site Oficial</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input 
                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-ocean-500" 
                                    value={myBusiness.website || ''} 
                                    onChange={e => setMyBusiness({...myBusiness, website: e.target.value})} 
                                />
                            </div>
                        </div>
                      </div>
                  </div>

                  <button 
                    onClick={handleSaveBusiness} 
                    disabled={isSaving}
                    className="w-full bg-ocean-600 text-white font-black py-5 rounded-3xl shadow-xl flex items-center justify-center gap-3 hover:bg-ocean-700 transition-all"
                  >
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />} SALVAR ALTERAÇÕES DO PERFIL
                  </button>
              </div>
          </div>
      )}

      {/* MENU EDITOR - REUSE EXISTING BUT IMPROVE UI */}
      {view === 'MENU' && myBusiness && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in slide-in-from-right-4">
              <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-ocean-50 text-ocean-600 rounded-2xl"><Utensils size={24}/></div>
                      <h2 className="text-2xl font-black text-ocean-950">Cardápio Digital</h2>
                  </div>
                  <button onClick={() => { const m = [...(myBusiness.menu||[])]; m.push({ title: 'Nova Categoria', items: [] }); setMyBusiness({...myBusiness, menu: m}); }} className="bg-ocean-100 text-ocean-700 px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2"><Plus size={16}/> Nova Categoria</button>
              </div>

              <div className="space-y-8">
                  {myBusiness.menu?.map((section, sIdx) => (
                      <div key={sIdx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                          <div className="flex gap-4 mb-4">
                              <input 
                                  className="flex-1 bg-white border-slate-200 rounded-xl px-4 py-2 font-black text-ocean-950 outline-none" 
                                  value={section.title} 
                                  onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].title = e.target.value; setMyBusiness({...myBusiness, menu: m}); }} 
                                  placeholder="Ex: Bebidas, Hambúrgueres..."
                              />
                              <button onClick={() => { if(confirm("Remover categoria inteira?")){ const m = [...(myBusiness.menu||[])]; m.splice(sIdx, 1); setMyBusiness({...myBusiness, menu: m}); } }} className="text-red-300 hover:text-red-500"><Trash2 size={20}/></button>
                          </div>
                          <div className="space-y-3 pl-4 border-l-2 border-ocean-200">
                              {section.items.map((item, iIdx) => (
                                  <div key={item.id} className="bg-white p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center border border-slate-100">
                                      <input className="flex-1 text-sm font-bold bg-slate-50 rounded-xl p-3 outline-none" placeholder="Nome do prato" value={item.name} onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].items[iIdx].name = e.target.value; setMyBusiness({...myBusiness, menu: m}); }} />
                                      <input className="w-full md:w-32 text-sm font-black text-green-600 bg-slate-50 rounded-xl p-3 text-right outline-none" type="number" step="0.01" value={item.price} onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].items[iIdx].price = Number(e.target.value); setMyBusiness({...myBusiness, menu: m}); }} />
                                      <button onClick={() => { const m = [...(myBusiness.menu||[])]; m[sIdx].items.splice(iIdx, 1); setMyBusiness({...myBusiness, menu: m}); }} className="p-2 text-slate-300 hover:text-red-500"><X size={16}/></button>
                                  </div>
                              ))}
                              <button onClick={() => { const m = [...(myBusiness.menu||[])]; m[sIdx].items.push({ id: Math.random().toString(36).substring(2,7), name: '', price: 0 }); setMyBusiness({...myBusiness, menu: m}); }} className="w-full py-3 border border-dashed border-slate-300 text-slate-400 text-[10px] font-black rounded-2xl hover:text-ocean-600 hover:border-ocean-300 uppercase tracking-widest">+ Adicionar Item</button>
                          </div>
                      </div>
                  ))}
              </div>

              <button 
                onClick={handleSaveBusiness} 
                disabled={isSaving}
                className="w-full mt-8 bg-ocean-600 text-white font-black py-5 rounded-3xl shadow-xl flex items-center justify-center gap-3 hover:bg-ocean-700 transition-all"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />} SALVAR CARDÁPIO DIGITAL
              </button>
          </div>
      )}
    </div>
  );
};
