
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
    // Escuta atualizações de dados globais
    window.addEventListener('dataUpdated', refreshData);
    return () => window.removeEventListener('dataUpdated', refreshData);
  }, [currentUser]);

  const refreshData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
        const allCoupons = await getCoupons();
        // Filtra cupons: por ID da empresa ou nome (para garantir resiliência dos Mocks)
        const myCoupons = allCoupons.filter(c => 
          c.companyId === currentUser.id || (currentUser.companyName && c.companyName === currentUser.companyName)
        );
        setCoupons(myCoupons);

        const businesses = getBusinesses();
        const biz = businesses.find(b => b.id === currentUser.id) || 
                    businesses.find(b => b.name === currentUser.companyName);
        
        if (biz) {
            setMyBusiness({ ...biz, menu: biz.menu || [] });
        } else {
            // Se não achar nada (muito improvável agora), cria um perfil base
            setMyBusiness({
                id: currentUser.id,
                name: currentUser.companyName || currentUser.name,
                category: currentUser.category || 'Gastronomia',
                description: '',
                coverImage: '',
                gallery: [],
                address: '',
                phone: currentUser.phone || '',
                amenities: [],
                openingHours: { 'Seg-Sex': '09:00 - 18:00' },
                rating: 5,
                reviewCount: 0,
                views: 0,
                menu: []
            });
        }
    } catch (err) {
        console.error("Erro ao carregar dashboard admin:", err);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!myBusiness) return;
    setIsSaving(true);
    try {
      await saveBusiness(myBusiness);
      alert("Perfil comercial atualizado com sucesso!");
      setView('HOME');
    } catch (err) {
      alert("Erro ao salvar os dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.title || !newCoupon.imageUrl) return alert("Por favor, preencha o título e selecione uma imagem!");
    
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
        alert("Cupom criado e publicado com sucesso!");
        setNewCoupon({ title: '', description: '', originalPrice: 0, discountedPrice: 0, category: 'Gastronomia', active: true });
        setView('HOME');
        refreshData();
    } catch (e) { 
        alert("Erro ao criar cupom."); 
    } finally { 
        setIsSaving(false); 
    }
  };

  const handleGenerateIA = async () => {
      if (!newCoupon.originalPrice || !newCoupon.discountedPrice) return alert("Insira os preços primeiro para a IA entender a oferta.");
      setIsGeneratingIA(true);
      try {
          const discount = Math.round(((newCoupon.originalPrice - newCoupon.discountedPrice) / newCoupon.originalPrice) * 100);
          const desc = await generateCouponDescription(myBusiness?.name || "nossa loja", myBusiness?.category || "serviços", discount);
          setNewCoupon({...newCoupon, description: desc});
      } catch (e) {}
      finally { setIsGeneratingIA(false); }
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
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sincronizando Banco de Dados...</p>
        </div>
      );
  }

  const totalRedemptions = coupons.reduce((acc, c) => acc + (c.currentRedemptions || 0), 0);
  const activeCouponsCount = coupons.filter(c => c.active).length;

  return (
    <div className="pb-32 pt-10 px-4 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SUPERIOR */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
              <div className="relative">
                  <div className="w-20 h-20 bg-ocean-600 text-white rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden">
                      {myBusiness?.coverImage ? <img src={myBusiness.coverImage} className="w-full h-full object-cover" /> : <Store size={40} />}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-4 border-white shadow-lg">
                      <CheckCircle2 size={16} />
                  </div>
              </div>
              <div>
                  <h1 className="text-3xl font-black text-ocean-950 tracking-tight">{myBusiness?.name || currentUser.companyName}</h1>
                  <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-ocean-600 font-black uppercase tracking-widest">Empresa Verificada</span>
                      <Cloud size={12} className="text-ocean-400" />
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

      {view === 'HOME' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* COLUNA ESQUERDA: ESTATÍSTICAS E LISTA */}
              <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visitas</p>
                          <p className="text-2xl font-black text-ocean-950">{myBusiness?.views || 0}</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cupons</p>
                          <p className="text-2xl font-black text-ocean-950">{activeCouponsCount}</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resgates</p>
                          <p className="text-2xl font-black text-ocean-950">{totalRedemptions}</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nota</p>
                          <p className="text-2xl font-black text-ocean-950">{myBusiness?.rating || '5.0'}</p>
                      </div>
                  </div>

                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                          <h2 className="text-xl font-black text-ocean-950 uppercase tracking-tight">Suas Ofertas Ativas</h2>
                          <button onClick={() => setView('COUPONS')} className="text-ocean-600 font-black text-[10px] uppercase tracking-widest hover:underline">Gerenciar Todos</button>
                      </div>
                      <div className="space-y-4">
                          {coupons.map(coupon => (
                              <div key={coupon.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <div className="flex items-center gap-4">
                                      <img src={coupon.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                                      <div>
                                          <h4 className="font-bold text-sm text-ocean-950">{coupon.title}</h4>
                                          <p className="text-[10px] font-black text-slate-400 uppercase">{coupon.code}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <div className="text-right">
                                          <p className="text-[9px] font-black text-slate-300 uppercase leading-none">Resgates</p>
                                          <p className="text-xs font-black text-ocean-600">{coupon.currentRedemptions || 0}</p>
                                      </div>
                                      <button 
                                        onClick={async () => { if(confirm("Deseja realmente remover este cupom?")) { await deleteCoupon(coupon.id); refreshData(); } }} 
                                        className="text-red-300 hover:text-red-500 transition-colors"
                                      >
                                        <Trash2 size={18}/>
                                      </button>
                                  </div>
                              </div>
                          ))}
                          {coupons.length === 0 && <p className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum cupom encontrado.</p>}
                      </div>
                  </div>
              </div>

              {/* COLUNA DIREITA: BOTÕES DE AÇÃO */}
              <div className="space-y-4">
                  <button 
                    onClick={() => setView('CREATE_COUPON')} 
                    className="w-full bg-ocean-600 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-ocean-600/20 flex items-center justify-between group hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="text-left">
                        <h3 className="text-lg font-black tracking-tight mb-1">Criar Oferta</h3>
                        <p className="text-[10px] text-ocean-100 font-bold uppercase opacity-70 tracking-widest">Novo Cupom de Desconto</p>
                    </div>
                    <div className="p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform"><Plus size={24} /></div>
                  </button>

                  <button 
                    onClick={() => setView('PROFILE')} 
                    className="w-full bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-ocean-300 transition-all"
                  >
                    <div className="text-left">
                        <h3 className="text-lg font-black text-ocean-950 tracking-tight mb-1">Configurar Perfil</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bio, Horários e Fotos</p>
                    </div>
                    <div className="p-4 bg-ocean-50 text-ocean-600 rounded-2xl group-hover:scale-110 transition-transform"><Settings size={24} /></div>
                  </button>

                  <button 
                    onClick={() => setView('MENU')} 
                    className="w-full bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-ocean-300 transition-all"
                  >
                    <div className="text-left">
                        <h3 className="text-lg font-black text-ocean-950 tracking-tight mb-1">Cardápio Digital</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gerenciar Produtos e Preços</p>
                    </div>
                    <div className="p-4 bg-ocean-50 text-ocean-600 rounded-2xl group-hover:scale-110 transition-transform"><Utensils size={24} /></div>
                  </button>
              </div>
          </div>
      ) : (
          /* TELAS DE EDIÇÃO (CREATE, PROFILE, MENU) */
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6 duration-300">
              <button 
                onClick={() => setView('HOME')} 
                className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase tracking-widest mb-8 hover:gap-3 transition-all"
              >
                <ChevronLeft size={16} /> Voltar ao Painel Principal
              </button>

              {view === 'CREATE_COUPON' && (
                  <form onSubmit={handleCreateCoupon} className="space-y-8">
                      <h2 className="text-3xl font-black text-ocean-950 tracking-tight">Lançar Nova Oferta</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <ImageUpload label="Imagem do Produto/Oferta" currentImage={newCoupon.imageUrl} onImageSelect={img => setNewCoupon({...newCoupon, imageUrl: img})} />
                          <div className="space-y-4">
                              <input required className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm" placeholder="Título da Oferta (ex: Combo de Doces)" value={newCoupon.title} onChange={e => setNewCoupon({...newCoupon, title: e.target.value})} />
                              <div className="flex gap-2">
                                  <textarea className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm" placeholder="Descrição da oferta (regras, o que inclui...)" rows={3} value={newCoupon.description} onChange={e => setNewCoupon({...newCoupon, description: e.target.value})} />
                                  <button type="button" onClick={handleGenerateIA} disabled={isGeneratingIA} className="bg-ocean-100 text-ocean-600 p-4 rounded-xl hover:bg-ocean-200 transition-colors" title="Sugerir Descrição com IA">
                                      {isGeneratingIA ? <Loader2 className="animate-spin"/> : <Sparkles size={24}/>}
                                  </button>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                      <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-widest">Preço Normal</label>
                                      <input type="number" step="0.01" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm" placeholder="R$ 0,00" value={newCoupon.originalPrice} onChange={e => setNewCoupon({...newCoupon, originalPrice: Number(e.target.value)})} />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-widest">Preço Com Desconto</label>
                                      <input type="number" step="0.01" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm text-green-600" placeholder="R$ 0,00" value={newCoupon.discountedPrice} onChange={e => setNewCoupon({...newCoupon, discountedPrice: Number(e.target.value)})} />
                                  </div>
                              </div>
                          </div>
                      </div>
                      <button type="submit" disabled={isSaving} className="w-full bg-ocean-600 text-white font-black py-6 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />} PUBLICAR OFERTA AGORA
                      </button>
                  </form>
              )}

              {view === 'MENU' && myBusiness && (
                  <div className="space-y-10">
                      <div className="flex justify-between items-center">
                          <h2 className="text-3xl font-black text-ocean-950 tracking-tight">Editor de Cardápio Digital</h2>
                          <button onClick={addMenuSection} className="bg-ocean-50 text-ocean-600 px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:bg-ocean-100">
                              <Plus size={16}/> ADICIONAR SEÇÃO
                          </button>
                      </div>
                      
                      <div className="space-y-8">
                          {myBusiness.menu?.map((section, sIdx) => (
                              <div key={sIdx} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                                  <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                                      <input className="bg-transparent border-none font-black text-xl text-ocean-950 focus:ring-0 p-0 w-1/2" placeholder="Título da Seção (ex: Bebidas)" value={section.title} onChange={e => {
                                          const nm = [...myBusiness.menu!]; nm[sIdx].title = e.target.value; setMyBusiness({...myBusiness, menu: nm});
                                      }} />
                                      <button onClick={() => addMenuItem(sIdx)} className="text-ocean-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 hover:underline">
                                          <Plus size={14}/> NOVO ITEM
                                      </button>
                                  </div>
                                  <div className="space-y-4">
                                      {section.items.map((item, iIdx) => (
                                          <div key={item.id} className="bg-white p-4 rounded-2xl flex gap-4 items-center shadow-sm">
                                              <input className="flex-1 text-sm font-bold bg-transparent border-none focus:ring-0" placeholder="Nome do item..." value={item.name} onChange={e => {
                                                  const nm = [...myBusiness.menu!]; nm[sIdx].items[iIdx].name = e.target.value; setMyBusiness({...myBusiness, menu: nm});
                                              }} />
                                              <div className="flex items-center gap-1 bg-slate-50 px-3 py-2 rounded-xl">
                                                <span className="text-[10px] font-bold text-slate-400">R$</span>
                                                <input type="number" step="0.01" className="w-20 text-sm font-black text-green-600 bg-transparent border-none focus:ring-0 p-0" placeholder="0,00" value={item.price} onChange={e => {
                                                    const nm = [...myBusiness.menu!]; nm[sIdx].items[iIdx].price = Number(e.target.value); setMyBusiness({...myBusiness, menu: nm});
                                                }} />
                                              </div>
                                              <button onClick={() => {
                                                  const nm = [...myBusiness.menu!]; nm[sIdx].items.splice(iIdx, 1); setMyBusiness({...myBusiness, menu: nm});
                                              }} className="p-2 text-red-200 hover:text-red-500 transition-colors"><X size={18}/></button>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                      <button onClick={handleSaveBusiness} disabled={isSaving} className="w-full bg-ocean-600 text-white font-black py-6 rounded-2xl shadow-xl flex items-center justify-center gap-3">
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />} SALVAR CARDÁPIO ATUALIZADO
                      </button>
                  </div>
              )}

              {view === 'PROFILE' && myBusiness && (
                  <div className="space-y-12">
                      <h2 className="text-3xl font-black text-ocean-950 tracking-tight">Configurações do Perfil</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <ImageUpload label="Foto de Capa do Perfil" currentImage={myBusiness.coverImage} onImageSelect={img => setMyBusiness({...myBusiness, coverImage: img})} />
                          <div className="space-y-4">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-widest">Nome Fantasia</label>
                                  <input className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-sm" placeholder="Nome da sua empresa" value={myBusiness.name} onChange={e => setMyBusiness({...myBusiness, name: e.target.value})} />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-widest">Sua Biografia / Descrição</label>
                                  <textarea className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm" rows={4} placeholder="Conte um pouco sobre seu negócio para os clientes..." value={myBusiness.description} onChange={e => setMyBusiness({...myBusiness, description: e.target.value})} />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-widest">Endereço Completo</label>
                                  <input className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm" placeholder="Rua, Número, Bairro, Rio de Janeiro" value={myBusiness.address} onChange={e => setMyBusiness({...myBusiness, address: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-widest">Instagram</label>
                                    <input className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm" placeholder="@seuinstagram" value={myBusiness.instagram} onChange={e => setMyBusiness({...myBusiness, instagram: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-widest">Telefone/Zap</label>
                                    <input className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm" placeholder="(21) 99999-9999" value={myBusiness.phone} onChange={e => setMyBusiness({...myBusiness, phone: e.target.value})} />
                                </div>
                              </div>
                          </div>
                      </div>
                      <button onClick={handleSaveBusiness} disabled={isSaving} className="w-full bg-ocean-600 text-white font-black py-6 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />} SALVAR ALTERAÇÕES NO PERFIL
                      </button>
                  </div>
              )}

              {view === 'COUPONS' && (
                  <div className="space-y-8">
                      <div className="flex justify-between items-center">
                          <h2 className="text-3xl font-black text-ocean-950 tracking-tight">Gestão de Ofertas</h2>
                          <button onClick={() => setView('CREATE_COUPON')} className="bg-ocean-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2">
                             <Plus size={16}/> NOVA OFERTA
                          </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {coupons.map(coupon => (
                              <div key={coupon.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-ocean-200 transition-all">
                                  <div className="flex items-center gap-4">
                                      <img src={coupon.imageUrl} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                                      <div>
                                          <h4 className="font-bold text-ocean-950">{coupon.title}</h4>
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{coupon.code}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                              <span className="text-xs font-black text-green-600">R$ {coupon.discountedPrice.toFixed(2)}</span>
                                              <span className="text-[10px] text-slate-300 font-bold uppercase">{coupon.currentRedemptions || 0} resgates</span>
                                          </div>
                                      </div>
                                  </div>
                                  <button onClick={async () => { if(confirm("Deseja realmente remover?")) { await deleteCoupon(coupon.id); refreshData(); } }} className="p-4 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                      <Trash2 size={24}/>
                                  </button>
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
