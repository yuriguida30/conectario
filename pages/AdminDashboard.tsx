
import React, { useState, useEffect } from 'react';
import { User, Coupon, BusinessProfile, MenuItem, BusinessPlan, MenuSection, AMENITIES_LABELS } from '../types';
import { getCoupons, saveCoupon, deleteCoupon, getBusinesses, saveBusiness } from '../services/dataService';
import { 
  Plus, Trash2, Edit, X, Ticket, Store, LayoutDashboard, 
  Loader2, Star, Eye, MessageCircle, 
  Settings, Camera, MapPin, Instagram, 
  Globe, Utensils, Image as ImageIcon,
  ChevronLeft, AlertCircle, Save, List as ListIcon, Calendar, Percent,
  Phone, Users, TrendingUp, BarChart3, Clock, CheckCircle2, Cloud
} from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';

export const AdminDashboard: React.FC<{ currentUser: User; onNavigate: (page: string, params?: any) => void; onLogout: () => void }> = ({ currentUser, onNavigate, onLogout }) => {
  const [view, setView] = useState<'HOME' | 'COUPONS' | 'PROFILE' | 'MENU' | 'CREATE_COUPON'>('HOME');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [myBusiness, setMyBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
        
        // FILTRO ROBUSTO: Por ID do dono OU Nome da Empresa
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
            // Placeholder resiliente
            setMyBusiness({
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
      alert("Perfil comercial atualizado!");
      setView('HOME');
    } catch (err) {
      alert("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && view === 'HOME') {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <div className="relative">
                <Loader2 className="animate-spin text-ocean-600" size={48} />
                <Cloud className="absolute inset-0 m-auto text-ocean-200" size={20} />
            </div>
            <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Sincronizando Banco de Dados...</p>
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
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-4 border-white shadow-lg">
                      <CheckCircle2 size={16} />
                  </div>
              </div>
              <div>
                  <h1 className="text-3xl font-black text-ocean-950 tracking-tight">{myBusiness?.name || currentUser.companyName}</h1>
                  <div className="flex items-center gap-4 mt-1">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{myBusiness?.category}</p>
                      <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                      <div className="flex items-center gap-1.5">
                          <Cloud size={12} className="text-ocean-400" />
                          <p className="text-[10px] text-ocean-600 font-black uppercase tracking-[0.2em]">Sincronizado</p>
                      </div>
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

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA: RESUMO E AÇÕES */}
          <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                      <div className="bg-ocean-50 text-ocean-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><Eye size={20}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visitas</span>
                      <span className="text-2xl font-black text-ocean-950">{myBusiness?.views || 0}</span>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                      <div className="bg-green-50 text-green-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><Ticket size={20}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cupons</span>
                      <span className="text-2xl font-black text-ocean-950">{activeCoupons}</span>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                      <div className="bg-purple-50 text-purple-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><Users size={20}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resgates</span>
                      <span className="text-2xl font-black text-ocean-950">{totalRedemptions}</span>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                      <div className="bg-gold-50 text-gold-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><Star size={20}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nota</span>
                      <span className="text-2xl font-black text-ocean-950">{myBusiness?.rating?.toFixed(1) || '5.0'}</span>
                  </div>
              </div>

              {/* LISTA DE CUPONS RÁPIDA */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-xl font-black text-ocean-950 uppercase tracking-tight">Gestão de Ofertas</h2>
                      <button onClick={() => setView('COUPONS')} className="text-ocean-600 font-black text-[10px] uppercase tracking-[0.2em] hover:underline">Ver Todos</button>
                  </div>
                  <div className="space-y-4">
                      {coupons.slice(0, 3).map(coupon => (
                          <div key={coupon.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-4">
                                  <img src={coupon.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                                  <div>
                                      <h4 className="font-bold text-sm text-ocean-950">{coupon.title}</h4>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{coupon.code}</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-6">
                                  <div className="text-right">
                                      <p className="text-[9px] font-black text-slate-300 uppercase">Resgates</p>
                                      <p className="text-xs font-black text-ocean-600">{coupon.currentRedemptions || 0}</p>
                                  </div>
                                  <span className={`w-2 h-2 rounded-full ${coupon.active ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_8px_rgba(34,197,94,0.4)]`}></span>
                              </div>
                          </div>
                      ))}
                      {coupons.length === 0 && <p className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum cupom ativo no banco de dados.</p>}
                  </div>
              </div>
          </div>

          {/* COLUNA DIREITA: MENU DE ACESSO */}
          <div className="space-y-4">
              <button 
                onClick={() => setView('CREATE_COUPON')} 
                className="w-full bg-ocean-600 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-ocean-600/20 flex items-center justify-between group hover:-translate-y-1 transition-all duration-300"
              >
                <div className="text-left">
                    <h3 className="text-lg font-black tracking-tight mb-1">Criar Oferta</h3>
                    <p className="text-[10px] text-ocean-100 font-bold uppercase tracking-widest opacity-70">Novo Cupom de Desconto</p>
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

      {/* VIEWS ADICIONAIS (CUPONS, PERFIL, ETC) - Mantendo a lógica anterior */}
      {view !== 'HOME' && (
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6">
              <button 
                onClick={() => setView('HOME')} 
                className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase tracking-widest mb-8"
              >
                <ChevronLeft size={16} /> Voltar ao Painel Principal
              </button>

              {view === 'PROFILE' && myBusiness && (
                  <div className="space-y-12">
                      <div className="flex items-center gap-4 mb-4">
                          <div className="p-4 bg-ocean-50 text-ocean-600 rounded-3xl"><Settings size={32}/></div>
                          <div>
                            <h2 className="text-3xl font-black text-ocean-950 tracking-tight">Identidade Visual</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Como os clientes verão sua marca</p>
                          </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <ImageUpload label="Capa do Perfil" currentImage={myBusiness.coverImage} onImageSelect={img => setMyBusiness({...myBusiness, coverImage: img})} />
                          <div className="space-y-4">
                              <input className="w-full bg-slate-50 p-4 rounded-xl border-slate-100 font-bold text-sm" placeholder="Nome da Empresa" value={myBusiness.name} onChange={e => setMyBusiness({...myBusiness, name: e.target.value})} />
                              <textarea className="w-full bg-slate-50 p-4 rounded-xl border-slate-100 text-sm" rows={4} placeholder="Descrição curta..." value={myBusiness.description} onChange={e => setMyBusiness({...myBusiness, description: e.target.value})} />
                              <input className="w-full bg-slate-50 p-4 rounded-xl border-slate-100 text-sm" placeholder="Endereço Completo" value={myBusiness.address} onChange={e => setMyBusiness({...myBusiness, address: e.target.value})} />
                          </div>
                      </div>
                      <button onClick={handleSaveBusiness} disabled={isSaving} className="w-full bg-ocean-600 text-white font-black py-6 rounded-2xl shadow-xl flex items-center justify-center gap-3">
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />} SALVAR PERFIL
                      </button>
                  </div>
              )}

              {view === 'COUPONS' && (
                  <div className="space-y-8">
                      <h2 className="text-2xl font-black text-ocean-950">Seus Cupons Publicados</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {coupons.map(coupon => (
                              <div key={coupon.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                      <img src={coupon.imageUrl} className="w-16 h-16 rounded-2xl object-cover" />
                                      <div>
                                          <h4 className="font-bold text-ocean-950">{coupon.title}</h4>
                                          <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{coupon.code}</p>
                                      </div>
                                  </div>
                                  <button onClick={async () => { if(confirm("Remover cupom?")){ await deleteCoupon(coupon.id); refreshData(); } }} className="p-3 text-red-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
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
