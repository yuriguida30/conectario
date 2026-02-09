
import React, { useState, useEffect } from 'react';
import { User, Coupon, BusinessProfile, MenuItem, BusinessPlan, MenuSection } from '../types';
import { getCoupons, saveCoupon, deleteCoupon, getBusinesses, saveBusiness } from '../services/dataService';
import { 
  Plus, Trash2, Edit, X, Ticket, Store, LayoutDashboard, 
  Loader2, Star, Eye, MessageCircle, 
  Settings, Camera, MapPin, Instagram, 
  Globe, Utensils, Image as ImageIcon,
  ChevronLeft, AlertCircle, Save, List as ListIcon
} from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';

export const AdminDashboard: React.FC<{ currentUser: User; onNavigate: (page: string, params?: any) => void; onLogout: () => void }> = ({ currentUser, onNavigate, onLogout }) => {
  const [view, setView] = useState<'HOME' | 'COUPONS' | 'PROFILE' | 'GALLERY' | 'MENU'>('HOME');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [myBusiness, setMyBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados de Edição
  const [isEditingCoupon, setIsEditingCoupon] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon>>({});

  useEffect(() => {
    refreshData();
  }, [currentUser]);

  const refreshData = async () => {
    setLoading(true);
    try {
        const allCoupons = await getCoupons();
        const myCoupons = allCoupons.filter(c => 
            c.companyId === currentUser.id || 
            (currentUser.companyName && c.companyName === currentUser.companyName)
        );
        setCoupons(myCoupons);

        const biz = getBusinesses().find(b => b.id === currentUser.id) || 
                    getBusinesses().find(b => b.name === currentUser.companyName);
        
        if (biz) {
            setMyBusiness({
                ...biz,
                menu: biz.menu || [] // Garante que o menu nunca seja undefined
            });
        }
    } catch (err) {
        console.error("Erro ao carregar dados:", err);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const couponData: Coupon = {
      id: currentCoupon.id || `c_${Math.random().toString(36).substring(2, 9)}`,
      companyId: currentUser.id,
      companyName: currentUser.companyName || currentUser.name,
      title: currentCoupon.title || '',
      description: currentCoupon.description || '',
      originalPrice: Number(currentCoupon.originalPrice) || 0,
      discountedPrice: Number(currentCoupon.discountedPrice) || 0,
      discountPercentage: Math.round(((Number(currentCoupon.originalPrice) - Number(currentCoupon.discountedPrice)) / Number(currentCoupon.originalPrice)) * 100),
      imageUrl: currentCoupon.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      category: myBusiness?.category || currentUser.category || 'Geral',
      expiryDate: currentCoupon.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      code: (currentCoupon.code || 'DESC10').toUpperCase(),
      active: true,
      currentRedemptions: currentCoupon.currentRedemptions || 0,
      maxRedemptions: currentCoupon.maxRedemptions || 100
    };

    try {
        await saveCoupon(couponData);
        setIsEditingCoupon(false);
        await refreshData();
    } catch (err) { alert("Erro ao salvar cupom."); } finally { setLoading(false); }
  };

  const handleSaveBusiness = async () => {
    if (!myBusiness) return;
    setLoading(true);
    try {
      await saveBusiness(myBusiness);
      alert("Informações atualizadas!");
      await refreshData();
    } catch (err) { alert("Erro ao salvar."); } finally { setLoading(false); }
  };

  const addMenuSection = () => {
    if (!myBusiness) return;
    const newMenu = [...(myBusiness.menu || [])];
    newMenu.push({ title: 'Nova Categoria (Ex: Bebidas)', items: [] });
    setMyBusiness({ ...myBusiness, menu: newMenu });
  };

  const addMenuItem = (sIdx: number) => {
    if (!myBusiness) return;
    const newMenu = [...(myBusiness.menu || [])];
    newMenu[sIdx].items.push({
      id: Math.random().toString(36).substring(2, 7),
      name: '',
      price: 0,
      description: ''
    });
    setMyBusiness({ ...myBusiness, menu: newMenu });
  };

  if (loading && view === 'HOME') return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-ocean-600" size={40}/></div>;

  return (
    <div className="pb-32 pt-10 px-4 max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-ocean-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Store size={32} />
              </div>
              <div>
                  <h1 className="text-2xl font-black text-ocean-950">{currentUser.companyName || currentUser.name}</h1>
                  <p className="text-xs text-slate-400 font-medium">Painel Administrativo Premium</p>
              </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
              <button onClick={() => onNavigate('business-detail', { businessId: currentUser.id })} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-colors"><Eye size={18} /> Ver Página</button>
              <button onClick={onLogout} className="px-6 py-3 bg-red-50 text-red-500 rounded-2xl font-bold text-xs hover:bg-red-100">Sair</button>
          </div>
      </div>

      {view !== 'HOME' && (
          <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-black text-sm group"><ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> VOLTAR AO INÍCIO</button>
      )}

      {/* DASHBOARD HOME */}
      {view === 'HOME' && (
          <div className="space-y-8 animate-in fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visitas</p><h3 className="text-3xl font-black text-ocean-950">{myBusiness?.views || 0}</h3></div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resgates</p><h3 className="text-3xl font-black text-green-600">{coupons.reduce((a,c) => a + (c.currentRedemptions || 0), 0)}</h3></div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cupons</p><h3 className="text-3xl font-black text-ocean-950">{coupons.length}</h3></div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nota</p><div className="flex items-center gap-2"><h3 className="text-3xl font-black text-ocean-950">{myBusiness?.rating || '5.0'}</h3><Star size={20} className="text-gold-500 fill-gold-500" /></div></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <button onClick={() => { setCurrentCoupon({}); setIsEditingCoupon(true); }} className="bg-ocean-600 text-white p-8 rounded-[2rem] shadow-xl flex flex-col items-center justify-center gap-3 hover:scale-105 transition-all"><Plus size={32} /><span className="text-xs font-black uppercase">Novo Cupom</span></button>
                  <button onClick={() => setView('COUPONS')} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:border-ocean-300 transition-all"><Ticket size={32} className="text-ocean-600" /><span className="text-xs font-black uppercase">Meus Cupons</span></button>
                  <button onClick={() => setView('PROFILE')} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:border-ocean-300 transition-all"><Settings size={32} className="text-ocean-600" /><span className="text-xs font-black uppercase">Perfil</span></button>
                  <button onClick={() => setView('GALLERY')} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:border-ocean-300 transition-all"><Camera size={32} className="text-ocean-600" /><span className="text-xs font-black uppercase">Galeria</span></button>
                  <button onClick={() => setView('MENU')} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:border-ocean-300 transition-all shadow-ocean-600/5"><Utensils size={32} className="text-ocean-600" /><span className="text-xs font-black uppercase">Cardápio</span></button>
              </div>
          </div>
      )}

      {/* VIEW CARDÁPIO */}
      {view === 'MENU' && myBusiness && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
                  <div className="flex justify-between items-center">
                      <div>
                          <h2 className="text-2xl font-black text-ocean-950">Seu Cardápio Digital</h2>
                          <p className="text-slate-500 text-sm">Organize seus produtos por categorias para facilitar a vida do cliente.</p>
                      </div>
                      <button onClick={addMenuSection} className="bg-ocean-100 text-ocean-700 px-6 py-3 rounded-2xl text-xs font-bold hover:bg-ocean-200 transition-colors flex items-center gap-2"><Plus size={16}/> Nova Categoria</button>
                  </div>

                  <div className="space-y-10">
                    {(myBusiness.menu || []).map((section, sIdx) => (
                        <div key={sIdx} className="bg-slate-50 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 relative group/section">
                            <div className="flex gap-4 mb-6">
                                <div className="bg-ocean-600 text-white p-3 rounded-2xl"><ListIcon size={20}/></div>
                                <input 
                                    className="flex-1 bg-transparent border-none text-xl font-black text-ocean-950 p-0 focus:ring-0" 
                                    value={section.title} 
                                    onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].title = e.target.value; setMyBusiness({...myBusiness, menu: m}); }} 
                                    placeholder="Ex: Entradas, Hambúrgueres, Bebidas..."
                                />
                                <button onClick={() => { if(confirm('Excluir esta categoria inteira?')) { const m = [...(myBusiness.menu||[])]; m.splice(sIdx, 1); setMyBusiness({...myBusiness, menu: m}); } }} className="text-red-400 hover:text-red-600"><Trash2 size={20}/></button>
                            </div>

                            <div className="space-y-3">
                                {section.items.map((item, iIdx) => (
                                    <div key={item.id} className="bg-white p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center shadow-sm border border-slate-100 hover:border-ocean-200 transition-all">
                                        <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-2xl overflow-hidden relative group/img">
                                            {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="m-auto text-slate-300 mt-5" />}
                                            <ImageUpload onImageSelect={url => { const m = [...(myBusiness.menu||[])]; m[sIdx].items[iIdx].imageUrl = url; setMyBusiness({...myBusiness, menu: m}); }} label="" className="absolute inset-0 opacity-0 cursor-pointer" />
                                        </div>
                                        <div className="flex-1 w-full space-y-2">
                                            <input className="w-full text-sm font-bold border-none bg-slate-50 rounded-xl p-3 focus:ring-1 focus:ring-ocean-300" placeholder="Nome do item (Ex: X-Bacon Especial)" value={item.name} onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].items[iIdx].name = e.target.value; setMyBusiness({...myBusiness, menu: m}); }} />
                                            <input className="w-full text-[10px] border-none bg-slate-50 rounded-xl p-3 focus:ring-1 focus:ring-ocean-300" placeholder="Descrição (Ex: Pão brioche, 160g carne, cheddar...)" value={item.description || ''} onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].items[iIdx].description = e.target.value; setMyBusiness({...myBusiness, menu: m}); }} />
                                        </div>
                                        <div className="w-full md:w-32 relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                                            <input className="w-full pl-8 pr-4 py-3 text-sm font-black text-green-600 border-none bg-slate-50 rounded-xl text-right" type="number" step="0.01" value={item.price} onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].items[iIdx].price = Number(e.target.value); setMyBusiness({...myBusiness, menu: m}); }} />
                                        </div>
                                        <button onClick={() => { const m = [...(myBusiness.menu||[])]; m[sIdx].items.splice(iIdx, 1); setMyBusiness({...myBusiness, menu: m}); }} className="p-2 text-slate-300 hover:text-red-500"><X size={18}/></button>
                                    </div>
                                ))}
                                <button onClick={() => addMenuItem(sIdx)} className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 text-xs font-black rounded-[1.5rem] hover:border-ocean-300 hover:text-ocean-600 transition-all flex items-center justify-center gap-2"><Plus size={16}/> ADICIONAR ITEM NA CATEGORIA</button>
                            </div>
                        </div>
                    ))}
                  </div>

                  <button onClick={handleSaveBusiness} className="w-full bg-ocean-600 text-white font-black py-6 rounded-3xl shadow-2xl shadow-ocean-600/30 text-lg hover:bg-ocean-700 transition-all flex items-center justify-center gap-3">
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />} SALVAR CARDÁPIO DIGITAL
                  </button>
              </div>
          </div>
      )}

      {/* VIEWS COUPONS, PROFILE, GALLERY continuam as mesmas... */}
      {view === 'COUPONS' && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-black text-ocean-950">Meus Cupons Ativos</h2>
                  <button onClick={() => { setCurrentCoupon({}); setIsEditingCoupon(true); }} className="bg-ocean-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"><Plus size={16}/> Novo Cupom</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coupons.map(coupon => (
                      <div key={coupon.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex gap-5 items-center group transition-all hover:shadow-md">
                          <img src={coupon.imageUrl} className="w-24 h-24 rounded-2xl object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-ocean-950 truncate text-lg">{coupon.title}</h4>
                              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">CÓDIGO: {coupon.code}</p>
                              <div className="flex items-center gap-4 mt-3">
                                  <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase">Resgates</span><span className="text-sm font-black text-ocean-600">{coupon.currentRedemptions || 0}</span></div>
                                  <div className="flex gap-2 ml-auto">
                                      <button onClick={() => { setCurrentCoupon(coupon); setIsEditingCoupon(true); }} className="p-3 bg-slate-50 text-slate-400 hover:text-ocean-600 rounded-xl transition-colors"><Edit size={18}/></button>
                                      <button onClick={() => { if(confirm('Excluir este cupom?')) deleteCoupon(coupon.id).then(refreshData); }} className="p-3 bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-colors"><Trash2 size={18}/></button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
                  {coupons.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">Crie sua primeira oferta agora!</div>}
              </div>
          </div>
      )}

      {/* MODAL CUPOM REUTILIZADO */}
      {isEditingCoupon && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="bg-ocean-950 p-6 text-white flex justify-between items-center"><h3 className="font-black uppercase tracking-widest text-xs">Novo Cupom</h3><button onClick={() => setIsEditingCoupon(false)}><X/></button></div>
                  <form onSubmit={handleSaveCoupon} className="p-8 space-y-5 max-h-[80vh] overflow-y-auto">
                      <ImageUpload label="Imagem da Oferta" currentImage={currentCoupon.imageUrl} onImageSelect={url => setCurrentCoupon({...currentCoupon, imageUrl: url})} />
                      <input required className="w-full border-slate-200 rounded-2xl p-4 bg-slate-50 text-sm font-bold" value={currentCoupon.title || ''} onChange={e => setCurrentCoupon({...currentCoupon, title: e.target.value})} placeholder="Título da Oferta" />
                      <div className="grid grid-cols-2 gap-4">
                          <input type="number" step="0.01" className="w-full border-slate-200 rounded-2xl p-4 bg-slate-50" placeholder="Preço Original" value={currentCoupon.originalPrice || ''} onChange={e => setCurrentCoupon({...currentCoupon, originalPrice: Number(e.target.value)})} />
                          <input type="number" step="0.01" className="w-full border-slate-200 rounded-2xl p-4 bg-slate-50 text-green-600 font-bold" placeholder="Com Desconto" value={currentCoupon.discountedPrice || ''} onChange={e => setCurrentCoupon({...currentCoupon, discountedPrice: Number(e.target.value)})} />
                      </div>
                      <input required className="w-full border-slate-200 rounded-2xl p-4 bg-slate-50 font-black text-center text-xl" value={currentCoupon.code || ''} onChange={e => setCurrentCoupon({...currentCoupon, code: e.target.value.toUpperCase()})} placeholder="CÓDIGO DO CUPOM" />
                      <button type="submit" className="w-full bg-ocean-600 text-white font-black py-5 rounded-3xl shadow-xl mt-4">PUBLICAR AGORA</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
