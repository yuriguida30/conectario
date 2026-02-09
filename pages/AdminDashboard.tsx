
import React, { useState, useEffect } from 'react';
import { User, Coupon, AppCategory, BusinessProfile, MenuSection, MenuItem } from '../types';
import { getCoupons, saveCoupon, deleteCoupon, getCategories, getBusinesses, saveBusiness } from '../services/dataService';
import { 
  Plus, Trash2, Edit, Save, X, Ticket, Store, LayoutDashboard, 
  Loader2, Star, Eye, ExternalLink, MessageCircle, BarChart3, 
  Settings, Camera, Clock, MapPin, Share2, Facebook, Instagram, 
  Phone, Globe, Utensils, List, ChevronRight, Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';

export const AdminDashboard: React.FC<{ currentUser: User; onNavigate: (page: string, params?: any) => void; onLogout: () => void }> = ({ currentUser, onNavigate, onLogout }) => {
  const [view, setView] = useState<'HOME' | 'COUPONS' | 'PROFILE' | 'GALLERY' | 'MENU'>('HOME');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [myBusiness, setMyBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [isEditingCoupon, setIsEditingCoupon] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon>>({});

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
        const allCoupons = await getCoupons();
        const biz = getBusinesses().find(b => b.id === currentUser.id);
        setMyBusiness(biz || null);

        // FILTRO ROBUSTO:
        // 1. Tenta pelo ID (correto)
        // 2. Fallback pelo Nome da Empresa (caso dados antigos estejam com nome no lugar de ID)
        const myCoupons = allCoupons.filter(c => 
            c.companyId === currentUser.id || 
            (currentUser.companyName && c.companyName === currentUser.companyName)
        );
        
        console.log(`📊 Admin: Carregados ${myCoupons.length} cupons para ${currentUser.companyName}`);
        setCoupons(myCoupons);
    } catch (err) {
        console.error("Erro ao carregar dados do admin:", err);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.id) return;

    const couponData: Coupon = {
      id: currentCoupon.id || `c_${Math.random().toString(36).substring(2, 9)}`,
      companyId: currentUser.id, // Vínculo essencial
      companyName: currentUser.companyName || 'Minha Empresa',
      title: currentCoupon.title || '',
      description: currentCoupon.description || '',
      originalPrice: Number(currentCoupon.originalPrice) || 0,
      discountedPrice: Number(currentCoupon.discountedPrice) || 0,
      discountPercentage: Math.round(((Number(currentCoupon.originalPrice) - Number(currentCoupon.discountedPrice)) / Number(currentCoupon.originalPrice)) * 100),
      imageUrl: currentCoupon.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      category: myBusiness?.category || 'Geral',
      expiryDate: currentCoupon.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      code: currentCoupon.code || 'DESC10',
      active: true,
      currentRedemptions: currentCoupon.currentRedemptions || 0,
      maxRedemptions: currentCoupon.maxRedemptions || 100
    };

    try {
        await saveCoupon(couponData);
        setIsEditingCoupon(false);
        refreshData();
    } catch (err) {
        alert("Erro ao salvar cupom. Verifique sua conexão.");
    }
  };

  const handleDeleteCoupon = async (id: string) => {
      if(confirm('Deseja realmente desativar este cupom? ele não aparecerá mais para os clientes.')) {
          await deleteCoupon(id);
          refreshData();
      }
  };

  // Added handleSaveBusiness helper to resolve compilation error
  const handleSaveBusiness = async () => {
    if (!myBusiness) return;
    try {
      await saveBusiness(myBusiness);
      alert("Informações da empresa salvas com sucesso!");
      refreshData();
    } catch (err) {
      alert("Erro ao salvar informações da empresa.");
    }
  };

  // Added addMenuSection helper to resolve compilation error
  const addMenuSection = () => {
    if (!myBusiness) return;
    const newMenu = [...(myBusiness.menu || [])];
    newMenu.push({ title: 'Nova Seção', items: [] });
    setMyBusiness({ ...myBusiness, menu: newMenu });
  };

  // Added addMenuItem helper to resolve compilation error
  const addMenuItem = (sectionIdx: number) => {
    if (!myBusiness) return;
    const newMenu = [...(myBusiness.menu || [])];
    const newItem: MenuItem = {
      id: `item_${Math.random().toString(36).substring(2, 9)}`,
      name: '',
      price: 0,
    };
    newMenu[sectionIdx].items.push(newItem);
    setMyBusiness({ ...myBusiness, menu: newMenu });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-ocean-600" size={40} /></div>;

  return (
    <div className="pb-24 pt-8 md:pt-20 px-4 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-ocean-100 rounded-2xl flex items-center justify-center text-ocean-600 shadow-inner">
                  <Store size={28} />
              </div>
              <div>
                  <h1 className="text-xl font-bold text-ocean-950">{currentUser.companyName || currentUser.name}</h1>
                  <p className="text-xs text-slate-500 font-medium">Painel de Controle do Parceiro</p>
              </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => onNavigate('business-detail', { businessId: currentUser.id })}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-200"
              >
                  <Eye size={16} /> Ver Minha Página
              </button>
              <button onClick={onLogout} className="px-4 py-2.5 bg-red-50 text-red-500 rounded-xl font-bold text-xs hover:bg-red-100">Sair</button>
          </div>
      </div>

      {/* VIEW PRINCIPAL */}
      {view === 'HOME' && (
          <div className="space-y-8 animate-in fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visitas</p>
                      <h3 className="text-2xl font-black text-ocean-950">{myBusiness?.views || 0}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avaliação</p>
                      <div className="flex items-center gap-1"><h3 className="text-2xl font-black text-ocean-950">{myBusiness?.rating || '5.0'}</h3><Star size={16} className="text-gold-500 fill-gold-500" /></div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cupons Ativos</p>
                      <h3 className="text-2xl font-black text-ocean-950">{coupons.filter(c => c.active).length}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Resgates</p>
                      <h3 className="text-2xl font-black text-ocean-950">{coupons.reduce((a,c)=>a+(c.currentRedemptions||0), 0)}</h3>
                  </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <button onClick={() => { setCurrentCoupon({}); setIsEditingCoupon(true); }} className="bg-ocean-600 text-white p-6 rounded-3xl shadow-lg flex flex-col items-center justify-center gap-2 group hover:bg-ocean-700 transition-all">
                      <Plus size={24} /><span className="text-xs font-bold">Criar Cupom</span>
                  </button>
                  <button onClick={() => setView('COUPONS')} className={`p-6 rounded-3xl border flex flex-col items-center justify-center gap-2 group transition-all ${coupons.length > 0 ? 'bg-white border-slate-100 hover:border-ocean-300' : 'bg-orange-50 border-orange-200'}`}>
                      <Ticket size={24} className="text-ocean-600" />
                      <span className="text-xs font-bold text-ocean-950">Meus Cupons ({coupons.length})</span>
                  </button>
                  <button onClick={() => setView('GALLERY')} className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-2 group hover:border-ocean-300">
                      <Camera size={24} className="text-ocean-600" /><span className="text-xs font-bold text-ocean-950">Minha Galeria</span>
                  </button>
                  <button onClick={() => setView('MENU')} className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-2 group hover:border-ocean-300">
                      <Utensils size={24} className="text-ocean-600" /><span className="text-xs font-bold text-ocean-950">Cardápio</span>
                  </button>
                  <button onClick={() => setView('PROFILE')} className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-2 group hover:border-ocean-300">
                      <Settings size={24} className="text-ocean-600" /><span className="text-xs font-bold text-ocean-950">Perfil & Redes</span>
                  </button>
              </div>

              {/* AVISO SE NÃO HOUVER CUPONS */}
              {coupons.length === 0 && (
                  <div className="bg-orange-50 border border-orange-100 p-8 rounded-[2rem] text-center flex flex-col items-center animate-in slide-in-from-bottom-4">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-orange-500 mb-4 shadow-sm">
                          <Ticket size={32} />
                      </div>
                      <h3 className="font-bold text-ocean-950 text-lg mb-2">Você ainda não tem cupons ativos</h3>
                      <p className="text-slate-500 text-sm max-w-sm mb-6">Crie seu primeiro cupom de desconto para atrair clientes e aumentar suas vendas no Conecta Rio!</p>
                      <button 
                        onClick={() => { setCurrentCoupon({}); setIsEditingCoupon(true); }}
                        className="bg-ocean-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-ocean-700 shadow-lg shadow-ocean-600/20"
                      >
                          <Plus size={20} /> CRIAR MEU PRIMEIRO CUPOM
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* VIEW MEUS CUPONS */}
      {view === 'COUPONS' && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="flex items-center justify-between">
                  <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-bold text-sm hover:underline"><LayoutDashboard size={18}/> Voltar</button>
                  <button onClick={() => { setCurrentCoupon({}); setIsEditingCoupon(true); }} className="bg-ocean-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><Plus size={16}/> Novo Cupom</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coupons.map(coupon => (
                      <div key={coupon.id} className={`bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-center group ${!coupon.active && 'opacity-60 grayscale'}`}>
                          <img src={coupon.imageUrl} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-ocean-950 truncate">{coupon.title}</h4>
                              <p className="text-[10px] text-slate-400 uppercase font-black">{coupon.code} • {coupon.currentRedemptions || 0} resgates</p>
                              <div className="flex gap-2 mt-3">
                                  <button onClick={() => { setCurrentCoupon(coupon); setIsEditingCoupon(true); }} className="p-2 bg-slate-50 text-slate-400 hover:text-ocean-600 rounded-lg"><Edit size={16}/></button>
                                  <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 bg-red-50 text-red-400 hover:text-red-600 rounded-lg"><Trash2 size={16}/></button>
                              </div>
                          </div>
                          {!coupon.active && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Inativo</span>}
                      </div>
                  ))}
                  {coupons.length === 0 && (
                      <div className="col-span-full py-10 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                          Nenhum cupom encontrado.
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* VIEW GALERIA */}
      {view === 'GALLERY' && myBusiness && (
          <div className="space-y-6 animate-in slide-in-from-left-4">
              <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-bold text-sm"><LayoutDashboard size={18}/> Voltar</button>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                  <h3 className="text-xl font-bold text-ocean-950">Galeria de Fotos do Local</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {myBusiness.gallery.map((img, i) => (
                          <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden">
                              <img src={img} className="w-full h-full object-cover" />
                              <button onClick={() => { const g = [...myBusiness.gallery]; g.splice(i, 1); setMyBusiness({...myBusiness, gallery: g}); }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X size={14}/>
                              </button>
                          </div>
                      ))}
                      <div className="aspect-square">
                        <ImageUpload allowMultiple onBatchSelect={urls => setMyBusiness({...myBusiness, gallery: [...myBusiness.gallery, ...urls]})} label="" className="h-full" />
                      </div>
                  </div>
                  <button onClick={handleSaveBusiness} className="w-full bg-ocean-600 text-white font-bold py-4 rounded-2xl shadow-lg">SALVAR GALERIA</button>
              </div>
          </div>
      )}

      {/* VIEW CARDÁPIO */}
      {view === 'MENU' && myBusiness && (
          <div className="space-y-6 animate-in slide-in-from-left-4">
              <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-bold text-sm"><LayoutDashboard size={18}/> Voltar</button>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
                  <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-ocean-950">Edição de Cardápio / Catálogo</h3>
                      <button onClick={addMenuSection} className="bg-ocean-100 text-ocean-700 px-4 py-2 rounded-xl text-xs font-bold">+ Nova Seção</button>
                  </div>

                  {(myBusiness.menu || []).map((section, sIdx) => (
                      <div key={sIdx} className="bg-slate-50 p-6 rounded-[2rem] space-y-4">
                          <div className="flex gap-4">
                              <input className="flex-1 bg-white border-none rounded-xl p-3 font-bold text-sm" value={section.title} onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].title = e.target.value; setMyBusiness({...myBusiness, menu: m}); }} />
                              <button onClick={() => { const m = [...(myBusiness.menu||[])]; m.splice(sIdx, 1); setMyBusiness({...myBusiness, menu: m}); }} className="text-red-500"><Trash2 size={18}/></button>
                          </div>

                          <div className="space-y-3">
                              {section.items.map((item, iIdx) => (
                                  <div key={item.id} className="bg-white p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
                                      <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-xl overflow-hidden relative">
                                          {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="m-auto text-slate-300" />}
                                          <ImageUpload onImageSelect={url => { const m = [...(myBusiness.menu||[])]; m[sIdx].items[iIdx].imageUrl = url; setMyBusiness({...myBusiness, menu: m}); }} label="" className="absolute inset-0 opacity-0" />
                                      </div>
                                      <input className="flex-1 text-sm font-bold border-none bg-slate-50 rounded-lg p-2" placeholder="Nome do item" value={item.name} onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].items[iIdx].name = e.target.value; setMyBusiness({...myBusiness, menu: m}); }} />
                                      <input className="w-24 text-sm font-black text-green-600 border-none bg-slate-50 rounded-lg p-2" type="number" step="0.01" value={item.price} onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].items[iIdx].price = Number(e.target.value); setMyBusiness({...myBusiness, menu: m}); }} />
                                      <button onClick={() => { const m = [...(myBusiness.menu||[])]; m[sIdx].items.splice(iIdx, 1); setMyBusiness({...myBusiness, menu: m}); }} className="text-slate-300 hover:text-red-500"><X size={16}/></button>
                                  </div>
                              ))}
                              <button onClick={() => addMenuItem(sIdx)} className="w-full py-2 border-2 border-dashed border-slate-200 text-slate-400 text-xs font-bold rounded-xl hover:border-ocean-300 hover:text-ocean-600">+ Add Item</button>
                          </div>
                      </div>
                  ))}
                  <button onClick={handleSaveBusiness} className="w-full bg-ocean-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl">SALVAR CARDÁPIO</button>
              </div>
          </div>
      )}

      {/* VIEW PERFIL */}
      {view === 'PROFILE' && myBusiness && (
          <div className="animate-in slide-in-from-left-4 space-y-6">
              <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-bold text-sm"><LayoutDashboard size={18}/> Voltar</button>
              <form onSubmit={e => { e.preventDefault(); handleSaveBusiness(); }} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
                  <ImageUpload label="Foto de Capa Principal" currentImage={myBusiness.coverImage} onImageSelect={url => setMyBusiness({...myBusiness, coverImage: url})} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-slate-400 uppercase">Canais de Contato</h4>
                        <div className="relative"><MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" size={18}/><input className="w-full pl-10 border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" placeholder="WhatsApp (Ex: 21999999999)" value={myBusiness.whatsapp || ''} onChange={e => setMyBusiness({...myBusiness, whatsapp: e.target.value})} /></div>
                        <div className="relative"><Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500" size={18}/><input className="w-full pl-10 border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" placeholder="Instagram (Ex: docria_karamelo)" value={myBusiness.instagram || ''} onChange={e => setMyBusiness({...myBusiness, instagram: e.target.value})} /></div>
                        <div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={18}/><input className="w-full pl-10 border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" placeholder="Site Oficial" value={myBusiness.website || ''} onChange={e => setMyBusiness({...myBusiness, website: e.target.value})} /></div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-slate-400 uppercase">Localização</h4>
                        <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input className="w-full pl-10 border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" value={myBusiness.address || ''} onChange={e => setMyBusiness({...myBusiness, address: e.target.value})} /></div>
                        <textarea className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm h-24" placeholder="Descrição do local..." value={myBusiness.description || ''} onChange={e => setMyBusiness({...myBusiness, description: e.target.value})} />
                      </div>
                  </div>
                  <button type="submit" className="w-full bg-ocean-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl">SALVAR PERFIL</button>
              </form>
          </div>
      )}

      {/* MODAL CUPOM */}
      {isEditingCoupon && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="bg-ocean-900 p-6 text-white flex justify-between items-center">
                      <h3 className="font-bold text-lg">{currentCoupon.id ? 'Editar Cupom' : 'Novo Cupom'}</h3>
                      <button onClick={() => setIsEditingCoupon(false)}><X/></button>
                  </div>
                  <form onSubmit={handleSaveCoupon} className="p-8 space-y-4 max-h-[80vh] overflow-y-auto">
                      <ImageUpload label="Foto da Oferta" currentImage={currentCoupon.imageUrl} onImageSelect={url => setCurrentCoupon({...currentCoupon, imageUrl: url})} />
                      <div>
                          <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase">Título da Oferta</label>
                          <input required className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold" value={currentCoupon.title || ''} onChange={e => setCurrentCoupon({...currentCoupon, title: e.target.value})} placeholder="Ex: Combo Família 20% OFF" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase">Preço Original</label>
                              <input type="number" step="0.01" className="w-full border-slate-200 rounded-xl p-3 bg-slate-50" placeholder="R$ 0,00" value={currentCoupon.originalPrice || ''} onChange={e => setCurrentCoupon({...currentCoupon, originalPrice: Number(e.target.value)})} />
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase">Com Desconto</label>
                              <input type="number" step="0.01" className="w-full border-slate-200 rounded-xl p-3 bg-slate-50" placeholder="R$ 0,00" value={currentCoupon.discountedPrice || ''} onChange={e => setCurrentCoupon({...currentCoupon, discountedPrice: Number(e.target.value)})} />
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase">Código do Cupom</label>
                          <input required className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 font-mono text-center text-lg uppercase font-bold" value={currentCoupon.code || ''} onChange={e => setCurrentCoupon({...currentCoupon, code: e.target.value.toUpperCase()})} placeholder="EX: DOCRIA20" />
                      </div>
                      <button type="submit" className="w-full bg-ocean-600 text-white font-bold py-4 rounded-2xl shadow-lg mt-4">PUBLICAR CUPOM</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
