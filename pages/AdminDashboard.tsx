
import React, { useState, useEffect } from 'react';
import { User, Coupon, BusinessProfile, MenuItem, BusinessPlan } from '../types';
import { getCoupons, saveCoupon, deleteCoupon, getBusinesses, saveBusiness } from '../services/dataService';
import { 
  Plus, Trash2, Edit, X, Ticket, Store, LayoutDashboard, 
  Loader2, Star, Eye, MessageCircle, 
  Settings, Camera, MapPin, Instagram, 
  Globe, Utensils, Image as ImageIcon,
  ChevronLeft, AlertCircle, Share2, Save
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
        // 1. Busca todos os cupons e filtra
        const allCoupons = await getCoupons();
        
        // Filtro inteligente: por ID ou por Nome (caso o ID tenha mudado)
        const myCoupons = allCoupons.filter(c => 
            c.companyId === currentUser.id || 
            (currentUser.companyName && c.companyName === currentUser.companyName)
        );
        setCoupons(myCoupons);

        // 2. Busca o perfil da empresa
        const biz = getBusinesses().find(b => b.id === currentUser.id) || 
                    getBusinesses().find(b => b.name === currentUser.companyName);
        
        if (biz) {
            setMyBusiness(biz);
        } else {
            console.warn("Perfil de empresa não encontrado para:", currentUser.id);
        }
    } catch (err) {
        console.error("Erro ao carregar dados do admin:", err);
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
    } catch (err) {
        alert("Erro ao salvar cupom.");
    } finally {
        setLoading(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!myBusiness) return;
    setLoading(true);
    try {
      await saveBusiness(myBusiness);
      alert("Alterações salvas com sucesso!");
      await refreshData();
    } catch (err) {
      alert("Erro ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  };

  const addMenuSection = () => {
    if (!myBusiness) return;
    const newMenu = [...(myBusiness.menu || [])];
    newMenu.push({ title: 'Nova Seção', items: [] });
    setMyBusiness({ ...myBusiness, menu: newMenu });
  };

  const addMenuItem = (sIdx: number) => {
    if (!myBusiness) return;
    const newMenu = [...(myBusiness.menu || [])];
    newMenu[sIdx].items.push({
      id: Math.random().toString(36).substring(2, 7),
      name: '',
      price: 0
    });
    setMyBusiness({ ...myBusiness, menu: newMenu });
  };

  if (loading && view === 'HOME') {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-ocean-600 mb-4" size={40} />
            <p className="text-slate-500 font-bold">Carregando seu painel...</p>
        </div>
      );
  }

  return (
    <div className="pb-32 pt-10 px-4 max-w-6xl mx-auto space-y-8">
      
      {/* CABEÇALHO FIXO DO PAINEL */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-ocean-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-ocean-600/20">
                  <Store size={32} />
              </div>
              <div>
                  <h1 className="text-2xl font-black text-ocean-950">{currentUser.companyName || currentUser.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-white bg-ocean-400 px-2 py-0.5 rounded-full uppercase tracking-widest">Parceiro Premium</span>
                      <span className="text-xs text-slate-400 font-medium">{currentUser.email}</span>
                  </div>
              </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => onNavigate('business-detail', { businessId: currentUser.id })}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-colors"
              >
                  <Eye size={18} /> Ver Página
              </button>
              <button onClick={onLogout} className="px-6 py-3 bg-red-50 text-red-500 rounded-2xl font-bold text-xs hover:bg-red-100 transition-colors">Sair</button>
          </div>
      </div>

      {/* NAVEGAÇÃO INTERNA / VOLTAR */}
      {view !== 'HOME' && (
          <button 
            onClick={() => setView('HOME')}
            className="flex items-center gap-2 text-ocean-600 font-black text-sm group hover:underline"
          >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
              VOLTAR AO INÍCIO DO PAINEL
          </button>
      )}

      {/* CONTEÚDO DINÂMICO */}
      {view === 'HOME' ? (
          <div className="space-y-8 animate-in fade-in">
              {/* Cards de Métricas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visitas</p>
                      <h3 className="text-3xl font-black text-ocean-950">{myBusiness?.views || 0}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resgates</p>
                      <h3 className="text-3xl font-black text-green-600">{coupons.reduce((a,c) => a + (c.currentRedemptions || 0), 0)}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cupons</p>
                      <h3 className="text-3xl font-black text-ocean-950">{coupons.length}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nota</p>
                      <div className="flex items-center gap-2"><h3 className="text-3xl font-black text-ocean-950">{myBusiness?.rating || '5.0'}</h3><Star size={20} className="text-gold-500 fill-gold-500" /></div>
                  </div>
              </div>

              {/* Botões de Ação */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <button 
                    onClick={() => { setCurrentCoupon({}); setIsEditingCoupon(true); }}
                    className="bg-ocean-600 text-white p-8 rounded-[2rem] shadow-xl flex flex-col items-center justify-center gap-3 group hover:bg-ocean-700 transition-all hover:scale-105"
                  >
                      <Plus size={32} />
                      <span className="text-xs font-black uppercase tracking-widest">Novo Cupom</span>
                  </button>

                  <button onClick={() => setView('COUPONS')} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:border-ocean-300 transition-all">
                      <Ticket size={32} className="text-ocean-600" />
                      <span className="text-xs font-black text-ocean-950 uppercase tracking-widest">Meus Cupons</span>
                  </button>

                  <button onClick={() => setView('PROFILE')} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:border-ocean-300 transition-all">
                      <Settings size={32} className="text-ocean-600" />
                      <span className="text-xs font-black text-ocean-950 uppercase tracking-widest">Perfil</span>
                  </button>

                  <button onClick={() => setView('GALLERY')} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:border-ocean-300 transition-all">
                      <Camera size={32} className="text-ocean-600" />
                      <span className="text-xs font-black text-ocean-950 uppercase tracking-widest">Galeria</span>
                  </button>

                  <button onClick={() => setView('MENU')} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:border-ocean-300 transition-all">
                      <Utensils size={32} className="text-ocean-600" />
                      <span className="text-xs font-black text-ocean-950 uppercase tracking-widest">Cardápio</span>
                  </button>
              </div>

              {!myBusiness && (
                  <div className="bg-orange-50 border border-orange-200 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm">
                          <AlertCircle size={32} />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                          <h3 className="font-bold text-ocean-950 text-lg">Perfil Incompleto</h3>
                          <p className="text-slate-600 text-sm">Sua empresa ainda não tem as informações básicas configuradas. Complete seu perfil para aparecer no guia!</p>
                      </div>
                      <button onClick={() => setView('PROFILE')} className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/20">Configurar Agora</button>
                  </div>
              )}
          </div>
      ) : view === 'COUPONS' ? (
          <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-black text-ocean-950">Meus Cupons Ativos</h2>
                  <button onClick={() => { setCurrentCoupon({}); setIsEditingCoupon(true); }} className="bg-ocean-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-ocean-600/20"><Plus size={16}/> Novo Cupom</button>
              </div>

              {coupons.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {coupons.map(coupon => (
                          <div key={coupon.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex gap-5 items-center group transition-all hover:shadow-md">
                              <img src={coupon.imageUrl} className="w-24 h-24 rounded-2xl object-cover shrink-0" />
                              <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-ocean-950 truncate text-lg">{coupon.title}</h4>
                                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">CÓDIGO: {coupon.code}</p>
                                  <div className="flex items-center gap-4 mt-3">
                                      <div className="flex flex-col">
                                          <span className="text-[10px] text-slate-400 font-bold uppercase">Resgates</span>
                                          <span className="text-sm font-black text-ocean-600">{coupon.currentRedemptions || 0}</span>
                                      </div>
                                      <div className="flex gap-2 ml-auto">
                                          <button onClick={() => { setCurrentCoupon(coupon); setIsEditingCoupon(true); }} className="p-3 bg-slate-50 text-slate-400 hover:text-ocean-600 rounded-xl transition-colors"><Edit size={18}/></button>
                                          <button onClick={() => { if(confirm('Excluir este cupom?')) deleteCoupon(coupon.id).then(refreshData); }} className="p-3 bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-colors"><Trash2 size={18}/></button>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                          <Ticket size={40} />
                      </div>
                      <h3 className="font-bold text-ocean-950">Nenhum cupom criado ainda</h3>
                      <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">Crie ofertas para atrair mais clientes para o seu estabelecimento.</p>
                      <button onClick={() => { setCurrentCoupon({}); setIsEditingCoupon(true); }} className="mt-6 bg-ocean-600 text-white px-8 py-3 rounded-2xl font-bold">CRIAR MEU PRIMEIRO CUPOM</button>
                  </div>
              )}
          </div>
      ) : view === 'PROFILE' ? (
          <div className="space-y-6 animate-in slide-in-from-left-4">
              <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
                  <h2 className="text-2xl font-black text-ocean-950">Perfil da Empresa</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                          <ImageUpload 
                            label="Foto de Capa (Principal)" 
                            currentImage={myBusiness?.coverImage} 
                            onImageSelect={url => setMyBusiness(prev => prev ? {...prev, coverImage: url} : null)} 
                          />
                          
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Descrição do Negócio</label>
                              <textarea 
                                className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm h-32 focus:ring-2 focus:ring-ocean-500 outline-none"
                                value={myBusiness?.description || ''}
                                onChange={e => setMyBusiness(prev => prev ? {...prev, description: e.target.value} : null)}
                                placeholder="Conte um pouco sobre o que vocês oferecem..."
                              />
                          </div>
                      </div>

                      <div className="space-y-6">
                          <div className="grid grid-cols-1 gap-4">
                              <div>
                                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">WhatsApp Comercial</label>
                                  <div className="relative">
                                      <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                                      <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border-slate-200 rounded-2xl text-sm font-bold" value={myBusiness?.whatsapp || ''} onChange={e => setMyBusiness(prev => prev ? {...prev, whatsapp: e.target.value} : null)} />
                                  </div>
                              </div>
                              <div>
                                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Instagram</label>
                                  <div className="relative">
                                      <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" size={18} />
                                      <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border-slate-200 rounded-2xl text-sm font-bold" placeholder="@usuario" value={myBusiness?.instagram || ''} onChange={e => setMyBusiness(prev => prev ? {...prev, instagram: e.target.value} : null)} />
                                  </div>
                              </div>
                              <div>
                                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Endereço Completo</label>
                                  <div className="relative">
                                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-ocean-500" size={18} />
                                      <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border-slate-200 rounded-2xl text-sm font-bold" value={myBusiness?.address || ''} onChange={e => setMyBusiness(prev => prev ? {...prev, address: e.target.value} : null)} />
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  <button 
                    onClick={handleSaveBusiness}
                    className="w-full bg-ocean-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-ocean-600/20 text-lg hover:bg-ocean-700 transition-all flex items-center justify-center gap-3"
                  >
                      {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />} SALVAR INFORMAÇÕES DO PERFIL
                  </button>
              </div>
          </div>
      ) : view === 'GALLERY' ? (
          <div className="space-y-6 animate-in slide-in-from-left-4">
              <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <h2 className="text-2xl font-black text-ocean-950 mb-8">Galeria de Fotos</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(myBusiness?.gallery || []).map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-3xl overflow-hidden group border border-slate-100">
                              <img src={img} className="w-full h-full object-cover" />
                              <button onClick={() => { const g = [...(myBusiness?.gallery || [])]; g.splice(i, 1); setMyBusiness(p => p ? {...p, gallery: g} : null); }} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X size={16}/>
                              </button>
                          </div>
                      ))}
                      <div className="aspect-square">
                          <ImageUpload allowMultiple onBatchSelect={urls => setMyBusiness(p => p ? {...p, gallery: [...(p.gallery || []), ...urls]} : null)} label="" className="h-full" />
                      </div>
                  </div>
                  <button onClick={handleSaveBusiness} className="w-full mt-10 bg-ocean-600 text-white font-black py-5 rounded-3xl shadow-xl">SALVAR GALERIA</button>
              </div>
          </div>
      ) : null}

      {/* MODAL DE CRIAÇÃO DE CUPOM */}
      {isEditingCoupon && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 my-auto">
                  <div className="bg-ocean-950 p-6 text-white flex justify-between items-center">
                      <h3 className="font-black uppercase tracking-widest text-sm">{currentCoupon.id ? 'Editar Cupom' : 'Novo Cupom'}</h3>
                      <button onClick={() => setIsEditingCoupon(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X/></button>
                  </div>
                  <form onSubmit={handleSaveCoupon} className="p-8 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
                      <ImageUpload label="Imagem da Oferta" currentImage={currentCoupon.imageUrl} onImageSelect={url => setCurrentCoupon({...currentCoupon, imageUrl: url})} />
                      
                      <div>
                          <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Título da Oferta</label>
                          <input required className="w-full border-slate-200 rounded-2xl p-4 bg-slate-50 text-sm font-bold" value={currentCoupon.title || ''} onChange={e => setCurrentCoupon({...currentCoupon, title: e.target.value})} placeholder="Ex: 30% OFF em todo cardápio" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Preço Original (R$)</label>
                              <input type="number" step="0.01" className="w-full border-slate-200 rounded-2xl p-4 bg-slate-50 font-bold" value={currentCoupon.originalPrice || ''} onChange={e => setCurrentCoupon({...currentCoupon, originalPrice: Number(e.target.value)})} />
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Preço com Desconto (R$)</label>
                              <input type="number" step="0.01" className="w-full border-slate-200 rounded-2xl p-4 bg-slate-50 font-bold text-green-600" value={currentCoupon.discountedPrice || ''} onChange={e => setCurrentCoupon({...currentCoupon, discountedPrice: Number(e.target.value)})} />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Código Único</label>
                              <input required className="w-full border-slate-200 rounded-2xl p-4 bg-slate-50 font-black text-center text-lg uppercase" value={currentCoupon.code || ''} onChange={e => setCurrentCoupon({...currentCoupon, code: e.target.value.toUpperCase()})} />
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Máximo de Resgates</label>
                              <input type="number" className="w-full border-slate-200 rounded-2xl p-4 bg-slate-50 font-bold" value={currentCoupon.maxRedemptions || 100} onChange={e => setCurrentCoupon({...currentCoupon, maxRedemptions: Number(e.target.value)})} />
                          </div>
                      </div>

                      <button type="submit" className="w-full bg-ocean-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-ocean-600/20 mt-4 text-lg">
                          {loading ? <Loader2 className="animate-spin" /> : 'PUBLICAR CUPOM AGORA'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
