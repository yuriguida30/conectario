
import React, { useState, useEffect } from 'react';
import { User, Coupon, AppCategory, BusinessProfile, MenuSection, MenuItem } from '../types';
import { getCoupons, saveCoupon, deleteCoupon, getCategories, getBusinesses, saveBusiness } from '../services/dataService';
import { 
  Plus, Trash2, Edit, Save, X, Ticket, Store, LayoutDashboard, 
  Loader2, Star, Eye, ExternalLink, MessageCircle, BarChart3, 
  Settings, Camera, Clock, MapPin, Share2, Facebook, Instagram, 
  Phone, Globe, Utensils, List 
} from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';

interface AdminDashboardProps {
  currentUser: User;
  onNavigate: (page: string, params?: any) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onNavigate, onLogout }) => {
  const [view, setView] = useState<'HOME' | 'COUPONS' | 'PROFILE' | 'MENU'>('HOME');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [myBusiness, setMyBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditingCoupon, setIsEditingCoupon] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon>>({});

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    const allCoupons = await getCoupons();
    setCoupons(allCoupons.filter(c => c.companyId === currentUser.id));
    const biz = getBusinesses().find(b => b.id === currentUser.id);
    setMyBusiness(biz || null);
    setLoading(false);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const couponData: Coupon = {
      id: currentCoupon.id || `c_${Math.random().toString(36).substring(2, 9)}`,
      companyId: currentUser.id,
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
      currentRedemptions: 0
    };
    await saveCoupon(couponData);
    setIsEditingCoupon(false);
    refreshData();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (myBusiness) {
      await saveBusiness(myBusiness);
      alert("Perfil atualizado com sucesso!");
      setView('HOME');
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-ocean-600" /></div>;

  return (
    <div className="pb-24 pt-8 md:pt-20 px-4 max-w-6xl mx-auto">
      
      {/* HEADER DE BOAS VINDAS */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-ocean-100 rounded-2xl flex items-center justify-center text-ocean-600 shadow-inner">
                  <Store size={28} />
              </div>
              <div>
                  <h1 className="text-xl font-bold text-ocean-950">{currentUser.companyName}</h1>
                  <p className="text-xs text-slate-500 font-medium">Painel do Parceiro Conecta Rio</p>
              </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => onNavigate('business-detail', { businessId: currentUser.id })}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
              >
                  <Eye size={16} /> Ver Minha Loja
              </button>
              <button onClick={onLogout} className="px-4 py-2.5 bg-red-50 text-red-500 rounded-xl font-bold text-xs hover:bg-red-100">Sair</button>
          </div>
      </div>

      {/* VIEW PRINCIPAL: CENTRAL DE COMANDO */}
      {view === 'HOME' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              {/* STATUS CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visualizações</p>
                      <h3 className="text-2xl font-black text-ocean-950">{myBusiness?.views || 0}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cupons Ativos</p>
                      <h3 className="text-2xl font-black text-ocean-950">{coupons.filter(c=>c.active).length}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avaliação</p>
                      <div className="flex items-center gap-1">
                        <h3 className="text-2xl font-black text-ocean-950">{myBusiness?.rating || '5.0'}</h3>
                        <Star size={16} className="text-gold-500 fill-gold-500" />
                      </div>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Redenções</p>
                      <h3 className="text-2xl font-black text-ocean-950">
                        {coupons.reduce((acc, c) => acc + (c.currentRedemptions || 0), 0)}
                      </h3>
                  </div>
              </div>

              {/* GRADE DE AÇÕES RÁPIDAS - ACESSO TOTAL FACILITADO */}
              <div>
                  <h2 className="text-lg font-bold text-ocean-950 mb-4 px-2">Ações de Gestão</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      
                      <button 
                        onClick={() => { setCurrentCoupon({}); setIsEditingCoupon(true); }}
                        className="bg-ocean-600 text-white p-6 rounded-3xl shadow-lg shadow-ocean-600/20 flex flex-col items-center justify-center text-center group hover:bg-ocean-700 transition-all active:scale-95"
                      >
                          <Plus size={24} className="mb-2" />
                          <span className="text-xs font-bold leading-tight">Novo Cupom</span>
                      </button>

                      <button 
                        onClick={() => setView('COUPONS')}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-ocean-300 transition-all active:scale-95"
                      >
                          <Ticket size={24} className="mb-2 text-ocean-600" />
                          <span className="text-xs font-bold text-ocean-900 leading-tight">Gerenciar Ofertas</span>
                      </button>

                      <button 
                        onClick={() => setView('PROFILE')}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-ocean-300 transition-all active:scale-95"
                      >
                          <Settings size={24} className="mb-2 text-ocean-600" />
                          <span className="text-xs font-bold text-ocean-900 leading-tight">Dados & Redes</span>
                      </button>

                      <button 
                        onClick={() => setView('PROFILE')}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-ocean-300 transition-all active:scale-95"
                      >
                          <Camera size={24} className="mb-2 text-ocean-600" />
                          <span className="text-xs font-bold text-ocean-900 leading-tight">Fotos / Capa</span>
                      </button>

                      <button 
                        onClick={() => setView('PROFILE')}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-ocean-300 transition-all active:scale-95"
                      >
                          <Clock size={24} className="mb-2 text-ocean-600" />
                          <span className="text-xs font-bold text-ocean-900 leading-tight">Horários</span>
                      </button>

                      <button 
                        onClick={() => alert("Função de Edição de Cardápio em breve via painel dinâmico.")}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-ocean-300 transition-all active:scale-95"
                      >
                          <Utensils size={24} className="mb-2 text-ocean-600" />
                          <span className="text-xs font-bold text-ocean-900 leading-tight">Cardápio</span>
                      </button>
                  </div>
              </div>

              {/* LINKS ÚTEIS E SUPORTE */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><MessageCircle size={18}/> Central de Relacionamento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <a href={`https://wa.me/5521999999999`} target="_blank" className="bg-white/10 p-4 rounded-2xl flex items-center justify-between hover:bg-white/20 transition-all">
                          <div>
                              <p className="font-bold text-sm text-green-400">Suporte Técnico</p>
                              <p className="text-[10px] text-ocean-200">Falar com nosso time no WhatsApp</p>
                          </div>
                          <Phone size={18} />
                      </a>
                      <a href="#" className="bg-white/10 p-4 rounded-2xl flex items-center justify-between hover:bg-white/20 transition-all">
                          <div>
                              <p className="font-bold text-sm text-gold-400">Dicas de Vendas</p>
                              <p className="text-[10px] text-ocean-200">Como atrair mais clientes</p>
                          </div>
                          <ExternalLink size={18} />
                      </a>
                  </div>
              </div>
          </div>
      )}

      {/* VIEW DE EDIÇÃO DE PERFIL - ACESSO TOTAL A LINKS SOCIAIS */}
      {view === 'PROFILE' && myBusiness && (
          <div className="animate-in fade-in slide-in-from-left-4">
              <button 
                onClick={() => setView('HOME')}
                className="mb-6 flex items-center gap-2 text-ocean-600 font-bold text-sm hover:underline"
              >
                  <LayoutDashboard size={18}/> Voltar para a Central de Comando
              </button>

              <form onSubmit={handleSaveProfile} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-10">
                  
                  {/* FOTOS */}
                  <div className="space-y-4">
                      <h3 className="text-xl font-bold text-ocean-950 flex items-center gap-2"><Camera size={20}/> Identidade Visual</h3>
                      <ImageUpload label="Foto de Capa do Estabelecimento" currentImage={myBusiness.coverImage} onImageSelect={url => setMyBusiness({...myBusiness, coverImage: url})} />
                  </div>

                  {/* DADOS BÁSICOS */}
                  <div className="space-y-4">
                      <h3 className="text-xl font-bold text-ocean-950 flex items-center gap-2"><Store size={20}/> Dados Básicos</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><label className="text-xs font-bold text-slate-400 uppercase">Nome Fantasia</label><input className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold" value={myBusiness.name} onChange={e => setMyBusiness({...myBusiness, name: e.target.value})} /></div>
                          <div><label className="text-xs font-bold text-slate-400 uppercase">Categoria</label><input className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" value={myBusiness.category} readOnly /></div>
                          <div className="md:col-span-2">
                              <label className="text-xs font-bold text-slate-400 uppercase">Endereço Completo</label>
                              <div className="relative">
                                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                  <input className="w-full pl-10 border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" value={myBusiness.address} onChange={e => setMyBusiness({...myBusiness, address: e.target.value})} />
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* REDES SOCIAIS E CONTATO - O QUE HAVIA "SUMIDO" */}
                  <div className="space-y-4">
                      <h3 className="text-xl font-bold text-ocean-950 flex items-center gap-2"><Share2 size={20}/> Canais de Contato & Redes</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase">WhatsApp (Apenas números)</label>
                              <div className="relative">
                                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" size={18}/>
                                  <input className="w-full pl-10 border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" placeholder="Ex: 21999999999" value={myBusiness.whatsapp} onChange={e => setMyBusiness({...myBusiness, whatsapp: e.target.value})} />
                              </div>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase">Instagram (Usuário sem @)</label>
                              <div className="relative">
                                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500" size={18}/>
                                  <input className="w-full pl-10 border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" placeholder="Ex: seunegocio" value={myBusiness.instagram} onChange={e => setMyBusiness({...myBusiness, instagram: e.target.value})} />
                              </div>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase">Site Oficial (URL completa)</label>
                              <div className="relative">
                                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={18}/>
                                  <input className="w-full pl-10 border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" placeholder="Ex: https://seusite.com.br" value={myBusiness.website} onChange={e => setMyBusiness({...myBusiness, website: e.target.value})} />
                              </div>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase">Telefone Fixo</label>
                              <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                  <input className="w-full pl-10 border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" placeholder="Ex: 2122223333" value={myBusiness.phone} onChange={e => setMyBusiness({...myBusiness, phone: e.target.value})} />
                              </div>
                          </div>
                      </div>
                  </div>

                  <button type="submit" className="w-full bg-ocean-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-ocean-700 active:scale-95 transition-all text-lg">
                      SALVAR TODAS AS ALTERAÇÕES
                  </button>
              </form>
          </div>
      )}

      {/* VIEW DE CUPONS MANTIDA */}
      {view === 'COUPONS' && (
          <div className="animate-in fade-in slide-in-from-left-4">
              <button onClick={() => setView('HOME')} className="mb-6 flex items-center gap-2 text-ocean-600 font-bold text-sm hover:underline"><LayoutDashboard size={18}/> Voltar</button>
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-ocean-950 text-xl">Gestão de Ofertas</h3>
                  <button onClick={() => { setCurrentCoupon({}); setIsEditingCoupon(true); }} className="bg-ocean-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg">+ Novo Cupom</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coupons.map(c => (
                      <div key={c.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex gap-4 items-center shadow-sm">
                          <img src={c.imageUrl} className="w-20 h-20 rounded-2xl object-cover" />
                          <div className="flex-1">
                              <h4 className="font-bold text-ocean-950 text-sm">{c.title}</h4>
                              <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-1">CÓDIGO: {c.code}</p>
                          </div>
                          <div className="flex gap-1">
                              <button onClick={() => { setCurrentCoupon(c); setIsEditingCoupon(true); }} className="p-2 text-slate-400 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg"><Edit size={16}/></button>
                              <button onClick={() => { if(confirm('Excluir cupom?')) deleteCoupon(c.id).then(refreshData) }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* MODAL CRIAR CUPOM MANTIDO */}
      {isEditingCoupon && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="bg-ocean-900 p-6 text-white flex justify-between items-center">
                      <h3 className="font-bold text-lg">{currentCoupon.id ? 'Editar Cupom' : 'Novo Cupom'}</h3>
                      <button onClick={() => setIsEditingCoupon(false)}><X/></button>
                  </div>
                  <form onSubmit={handleSaveCoupon} className="p-8 space-y-4 max-h-[80vh] overflow-y-auto">
                      <ImageUpload label="Foto do Cupom" currentImage={currentCoupon.imageUrl} onImageSelect={url => setCurrentCoupon({...currentCoupon, imageUrl: url})} />
                      <div><label className="text-xs font-bold text-slate-400 uppercase">Título da Oferta</label><input required className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold" value={currentCoupon.title} onChange={e => setCurrentCoupon({...currentCoupon, title: e.target.value})} placeholder="Ex: Rodízio de Pizza 2x1" /></div>
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-xs font-bold text-slate-400 uppercase">Preço Original</label><input type="number" step="0.01" className="w-full border-slate-200 rounded-xl p-3 bg-slate-50" value={currentCoupon.originalPrice} onChange={e => setCurrentCoupon({...currentCoupon, originalPrice: Number(e.target.value)})} /></div>
                          <div><label className="text-xs font-bold text-slate-400 uppercase">Preço com Desconto</label><input type="number" step="0.01" className="w-full border-slate-200 rounded-xl p-3 bg-slate-50" value={currentCoupon.discountedPrice} onChange={e => setCurrentCoupon({...currentCoupon, discountedPrice: Number(e.target.value)})} /></div>
                      </div>
                      <div><label className="text-xs font-bold text-slate-400 uppercase">Código do Cupom</label><input required className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 font-mono text-center text-lg uppercase" value={currentCoupon.code} onChange={e => setCurrentCoupon({...currentCoupon, code: e.target.value.toUpperCase()})} placeholder="EX: CONECTA10" /></div>
                      <button type="submit" className="w-full bg-ocean-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-ocean-700 active:scale-95 transition-all">PUBLICAR CUPOM</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
