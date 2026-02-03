
import React, { useState, useEffect } from 'react';
import { User, Coupon, AppCategory, BusinessProfile, AppAmenity } from '../types';
import { getCoupons, saveCoupon, deleteCoupon, getCategories, getBusinesses, saveBusiness, getAmenities } from '../services/dataService';
import { Plus, Trash2, Edit, Save, X, ImageIcon, Ticket, Store, LayoutDashboard, Loader2, Star, Eye } from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';

interface AdminDashboardProps {
  currentUser: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onNavigate, onLogout }) => {
  const [view, setView] = useState<'DASHBOARD' | 'COUPONS' | 'PROFILE'>('DASHBOARD');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [myBusiness, setMyBusiness] = useState<BusinessProfile | null>(null);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
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
    setCategories(getCategories());
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
          alert("Perfil atualizado!");
          refreshData();
      }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-ocean-600" /></div>;

  return (
    <div className="pb-24 pt-20 px-4 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div>
              <h1 className="text-2xl font-bold text-ocean-950">{currentUser.companyName}</h1>
              <p className="text-sm text-slate-500">Painel do Parceiro</p>
          </div>
          <button onClick={onLogout} className="text-red-500 font-bold text-sm px-4 py-2 hover:bg-red-50 rounded-xl transition-all">Sair</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar">
          <button onClick={() => setView('DASHBOARD')} className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${view === 'DASHBOARD' ? 'bg-ocean-600 text-white shadow-lg' : 'bg-white text-slate-500'}`}>
              <LayoutDashboard size={18}/> Dashboard
          </button>
          <button onClick={() => setView('COUPONS')} className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${view === 'COUPONS' ? 'bg-ocean-600 text-white shadow-lg' : 'bg-white text-slate-500'}`}>
              <Ticket size={18}/> Meus Cupons
          </button>
          <button onClick={() => setView('PROFILE')} className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${view === 'PROFILE' ? 'bg-ocean-600 text-white shadow-lg' : 'bg-white text-slate-500'}`}>
              <Store size={18}/> Perfil da Empresa
          </button>
      </div>

      {/* DASHBOARD VIEW */}
      {view === 'DASHBOARD' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total de Cupons</p>
                  <h2 className="text-4xl font-black text-ocean-950">{coupons.length}</h2>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Visualizações</p>
                  <h2 className="text-4xl font-black text-ocean-950">{myBusiness?.views || 0}</h2>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Avaliação Média</p>
                  <div className="flex items-center gap-2">
                    <h2 className="text-4xl font-black text-ocean-950">{myBusiness?.rating || '5.0'}</h2>
                    <Star className="text-gold-500 fill-gold-500" />
                  </div>
              </div>
          </div>
      )}

      {/* COUPONS VIEW */}
      {view === 'COUPONS' && (
          <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                  <h3 className="font-bold text-ocean-950 text-xl">Gestão de Cupons</h3>
                  <button onClick={() => { setCurrentCoupon({}); setIsEditingCoupon(true); }} className="bg-ocean-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-ocean-700">
                      <Plus size={18}/> Criar Novo Cupom
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coupons.map(c => (
                      <div key={c.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex gap-4 items-center group">
                          <img src={c.imageUrl} className="w-20 h-20 rounded-2xl object-cover" />
                          <div className="flex-1">
                              <h4 className="font-bold text-ocean-950">{c.title}</h4>
                              <p className="text-xs text-green-600 font-bold">R$ {c.discountedPrice.toFixed(2)} (-{c.discountPercentage}%)</p>
                              <p className="text-[10px] text-slate-400 uppercase font-black mt-1">CÓDIGO: {c.code}</p>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => { setCurrentCoupon(c); setIsEditingCoupon(true); }} className="p-2 text-slate-400 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg"><Edit size={18}/></button>
                              <button onClick={() => { if(confirm('Excluir cupom?')) deleteCoupon(c.id).then(refreshData) }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                          </div>
                      </div>
                  ))}
                  {coupons.length === 0 && <p className="text-center py-10 text-slate-400 col-span-2 italic">Nenhum cupom criado ainda.</p>}
              </div>
          </div>
      )}

      {/* PROFILE VIEW */}
      {view === 'PROFILE' && myBusiness && (
          <form onSubmit={handleSaveProfile} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ImageUpload label="Foto de Capa" currentImage={myBusiness.coverImage} onImageSelect={url => setMyBusiness({...myBusiness, coverImage: url})} />
                  <div className="space-y-4">
                      <div><label className="text-xs font-bold text-slate-400 uppercase">Nome Fantasia</label><input className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold" value={myBusiness.name} onChange={e => setMyBusiness({...myBusiness, name: e.target.value})} /></div>
                      <div><label className="text-xs font-bold text-slate-400 uppercase">Descrição</label><textarea className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" rows={4} value={myBusiness.description} onChange={e => setMyBusiness({...myBusiness, description: e.target.value})} /></div>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="text-xs font-bold text-slate-400 uppercase">WhatsApp</label><input className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" value={myBusiness.whatsapp} onChange={e => setMyBusiness({...myBusiness, whatsapp: e.target.value})} /></div>
                  <div><label className="text-xs font-bold text-slate-400 uppercase">Endereço</label><input className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" value={myBusiness.address} onChange={e => setMyBusiness({...myBusiness, address: e.target.value})} /></div>
                  <div><label className="text-xs font-bold text-slate-400 uppercase">Instagram</label><input className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm" value={myBusiness.instagram} onChange={e => setMyBusiness({...myBusiness, instagram: e.target.value})} /></div>
              </div>
              <button type="submit" className="w-full bg-ocean-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-ocean-700 transition-all flex items-center justify-center gap-2">
                  <Save size={20}/> SALVAR PERFIL
              </button>
          </form>
      )}

      {/* MODAL CRIAR CUPOM */}
      {isEditingCoupon && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="bg-ocean-900 p-6 text-white flex justify-between items-center">
                      <h3 className="font-bold text-lg">{currentCoupon.id ? 'Editar Cupom' : 'Novo Cupom'}</h3>
                      <button onClick={() => setIsEditingCoupon(false)}><X/></button>
                  </div>
                  <form onSubmit={handleSaveCoupon} className="p-8 space-y-4">
                      <ImageUpload label="Foto do Cupom" currentImage={currentCoupon.imageUrl} onImageSelect={url => setCurrentCoupon({...currentCoupon, imageUrl: url})} />
                      <div><label className="text-xs font-bold text-slate-400 uppercase">Título da Oferta</label><input required className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-bold" value={currentCoupon.title} onChange={e => setCurrentCoupon({...currentCoupon, title: e.target.value})} placeholder="Ex: Rodízio de Pizza 2x1" /></div>
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-xs font-bold text-slate-400 uppercase">Preço Original</label><input type="number" step="0.01" className="w-full border-slate-200 rounded-xl p-3 bg-slate-50" value={currentCoupon.originalPrice} onChange={e => setCurrentCoupon({...currentCoupon, originalPrice: Number(e.target.value)})} /></div>
                          <div><label className="text-xs font-bold text-slate-400 uppercase">Preço com Desconto</label><input type="number" step="0.01" className="w-full border-slate-200 rounded-xl p-3 bg-slate-50" value={currentCoupon.discountedPrice} onChange={e => setCurrentCoupon({...currentCoupon, discountedPrice: Number(e.target.value)})} /></div>
                      </div>
                      <div><label className="text-xs font-bold text-slate-400 uppercase">Código do Cupom</label><input required className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 font-mono text-center text-lg" value={currentCoupon.code} onChange={e => setCurrentCoupon({...currentCoupon, code: e.target.value.toUpperCase()})} placeholder="EX: CONECTA10" /></div>
                      <button type="submit" className="w-full bg-ocean-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-ocean-700">PUBLICAR CUPOM AGORA</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
