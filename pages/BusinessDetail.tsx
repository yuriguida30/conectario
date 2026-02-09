
import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, Clock, MapPin, Phone, Instagram, Globe, 
  MessageCircle, Share2, Loader2, Ticket, 
  Star, Heart, Utensils, Info, 
  CheckCircle2, Camera, Navigation, ShieldCheck, Lock,
  ChevronRight, X, List as ListIcon, Search
} from 'lucide-react';
import { BusinessProfile, AMENITIES_LABELS, Coupon, User, BusinessPlan, MenuSection } from '../types';
import { getBusinessById, getCoupons, getCurrentUser, toggleFavorite, incrementBusinessView, redeemCoupon, createCompanyRequest } from '../services/dataService';
import { CouponCard } from '../components/CouponCard';
import { CouponModal } from '../components/CouponModal';

export const BusinessDetail: React.FC<{ businessId: string; onNavigate: (page: string, params?: any) => void }> = ({ businessId, onNavigate }) => {
  const [business, setBusiness] = useState<BusinessProfile | undefined>(undefined);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  
  // Menu Overlay State
  const [showMenuOverlay, setShowMenuOverlay] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
        const busData = getBusinessById(businessId);
        setBusiness(busData);
        if (busData) {
            incrementBusinessView(businessId);
            const allCoupons = await getCoupons();
            setCoupons(allCoupons.filter(c => c.companyId === businessId && c.active));
            const user = getCurrentUser();
            setCurrentUser(user);
            if (user && user.favorites?.businesses.includes(businessId)) setIsFav(true);
            
            // Set first category as active by default
            if (busData.menu && busData.menu.length > 0) {
                setActiveCategory(busData.menu[0].title);
            }
        }
        setLoading(false);
    };
    loadData();
  }, [businessId]);

  const handleClaim = async () => {
      if(!currentUser) return onNavigate('login');
      setIsClaiming(true);
      await createCompanyRequest({
          companyName: business?.name,
          ownerName: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone || '',
          status: 'PENDING',
          type: 'CLAIM',
          businessId: businessId
      });
      alert("Solicitação enviada!");
      setIsClaiming(false);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return alert("Faça login para favoritar.");
    toggleFavorite('business', businessId);
    setIsFav(!isFav);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-ocean-500" size={40}/></div>;
  if (!business) return <div className="p-10 text-center">Empresa não encontrada.</div>;

  const isPremium = business.plan === BusinessPlan.PREMIUM;

  return (
    <div className={`bg-white min-h-screen pb-32 ${showMenuOverlay ? 'overflow-hidden h-screen' : ''}`}>
        
        {/* HERO SECTION */}
        <div className="relative h-[40vh] w-full overflow-hidden bg-slate-900">
            <img src={business.coverImage} className="w-full h-full object-cover opacity-90" alt={business.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
            
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 pt-10 md:pt-6">
                <button onClick={() => window.history.back()} className="bg-white/20 text-white p-3 rounded-2xl backdrop-blur-xl border border-white/30"><ArrowLeft size={24} /></button>
                <div className="flex gap-2">
                    <button onClick={handleToggleFavorite} className={`p-3 rounded-2xl backdrop-blur-xl border border-white/30 ${isFav ? 'bg-red-500 text-white' : 'bg-white/20 text-white'}`}><Heart className={isFav ? 'fill-white' : ''} size={24} /></button>
                </div>
            </div>

            <div className="absolute bottom-6 left-0 w-full px-6 z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="bg-ocean-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">{business.category}</span>
                        {business.isOpenNow ? <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">ABERTO AGORA</span> : <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">FECHADO</span>}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-ocean-950 mb-1 leading-tight">{business.name}</h1>
                    <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin size={14} className="text-ocean-500" />
                        <span className="text-sm font-bold">{business.address}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* FLOATING MENU BUTTON - DESTAQUE */}
        {isPremium && business.menu && business.menu.length > 0 && (
            <div className="fixed bottom-24 right-6 z-50 animate-bounce">
                <button 
                    onClick={() => setShowMenuOverlay(true)}
                    className="bg-ocean-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-black text-sm tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-ocean-600/30 ring-4 ring-white"
                >
                    <Utensils size={20} /> VER CARDÁPIO
                </button>
            </div>
        )}

        {/* CONTENT */}
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
            
            {/* ACTION BAR */}
            <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-[2.5rem] border border-slate-100">
                <button onClick={() => window.open(`tel:${business.phone}`)} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-ocean-600 shadow-sm"><Phone size={24}/></div>
                    <span className="text-[9px] font-black uppercase text-slate-400">Ligar</span>
                </button>
                <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`)} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-ocean-600 shadow-sm"><Navigation size={24}/></div>
                    <span className="text-[9px] font-black uppercase text-slate-400">Rota</span>
                </button>
                {isPremium && business.whatsapp ? (
                    <a href={`https://wa.me/${business.whatsapp}`} target="_blank" className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-sm"><MessageCircle size={24}/></div>
                        <span className="text-[9px] font-black uppercase text-slate-400">WhatsApp</span>
                    </a>
                ) : (
                    <div className="opacity-20 flex flex-col items-center gap-2 grayscale"><div className="w-12 h-12 bg-slate-200 rounded-2xl flex items-center justify-center"><Lock size={20}/></div><span className="text-[9px] font-black uppercase text-slate-400">Social</span></div>
                )}
                <button onClick={() => setShowMenuOverlay(true)} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-ocean-600 rounded-2xl flex items-center justify-center text-white shadow-sm"><Utensils size={24}/></div>
                    <span className="text-[9px] font-black uppercase text-ocean-600">Cardápio</span>
                </button>
            </div>

            {/* DESCRIÇÃO E INFO */}
            <div className="space-y-4">
                <h3 className="text-xl font-black text-ocean-950">Sobre o Local</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{business.description}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                    {business.amenities.map(am => (
                        <span key={am} className="bg-slate-50 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 border border-slate-100 flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-green-500" /> {AMENITIES_LABELS[am] || am}
                        </span>
                    ))}
                </div>
            </div>

            {/* HORÁRIOS */}
            <div className="bg-ocean-950 p-8 rounded-[2.5rem] text-white">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-white/10 p-2 rounded-xl"><Clock size={20}/></div>
                    <h3 className="text-xl font-black">Horários de Funcionamento</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                    {Object.entries(business.openingHours).map(([days, hours]) => (
                        <div key={days} className="flex justify-between items-center text-xs py-2 border-b border-white/5">
                            <span className="text-ocean-300 font-bold">{days}</span>
                            <span className="font-black">{hours}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* CUPONS */}
            {coupons.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-ocean-950 flex items-center gap-2"><Ticket size={24} className="text-ocean-600" /> Ofertas Exclusivas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {coupons.map(coupon => (
                            <CouponCard key={coupon.id} coupon={coupon} onGetCoupon={setSelectedCoupon} />
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* MENU OVERLAY - O CARDÁPIO QUE SOBREPÕE TUDO */}
        {showMenuOverlay && isPremium && business.menu && (
            <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-bottom duration-500 flex flex-col h-screen overflow-hidden">
                {/* Header Menu */}
                <div className="sticky top-0 bg-white z-20 border-b border-slate-100 px-6 pt-12 pb-6 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-black text-ocean-400 uppercase tracking-widest mb-1">Cardápio Oficial</p>
                            <h2 className="text-2xl font-black text-ocean-950">{business.name}</h2>
                        </div>
                        <button onClick={() => setShowMenuOverlay(false)} className="w-12 h-12 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Categorias Tabs */}
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-6 px-6">
                        {business.menu.map((section) => (
                            <button 
                                key={section.title}
                                onClick={() => setActiveCategory(section.title)}
                                className={`shrink-0 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${activeCategory === section.title ? 'bg-ocean-600 text-white shadow-xl shadow-ocean-600/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                            >
                                {section.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Itens do Cardápio */}
                <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 custom-scrollbar">
                    {business.menu.filter(s => s.title === activeCategory || !activeCategory).map((section) => (
                        <div key={section.title} className="space-y-4">
                            <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-2">
                                <div className="h-px bg-slate-100 flex-1"></div>
                                {section.title}
                                <div className="h-px bg-slate-100 flex-1"></div>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {section.items.map((item) => (
                                    <div key={item.id} className="bg-white border border-slate-50 p-5 rounded-[2rem] flex gap-5 items-center group hover:border-ocean-100 hover:shadow-xl hover:shadow-ocean-600/5 transition-all">
                                        <div className="w-20 h-20 shrink-0 bg-slate-50 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-100">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                                            ) : (
                                                <Utensils size={24} className="text-slate-200" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="font-bold text-ocean-950 text-sm md:text-base leading-tight">{item.name}</h4>
                                                <span className="font-black text-green-600 text-sm whitespace-nowrap bg-green-50 px-2 py-1 rounded-lg">R$ {item.price.toFixed(2)}</span>
                                            </div>
                                            {item.description && (
                                                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed font-medium">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    {/* Placeholder no final */}
                    <div className="py-12 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest opacity-50">
                        Obrigado pela preferência
                    </div>
                </div>

                {/* Footer do Overlay */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-500">Total de {business.menu.reduce((acc, s) => acc + s.items.length, 0)} itens</p>
                    <button onClick={() => setShowMenuOverlay(false)} className="bg-ocean-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">FECHAR</button>
                </div>
            </div>
        )}

        {selectedCoupon && (
            <CouponModal coupon={selectedCoupon} onClose={() => setSelectedCoupon(null)} onRedeem={(c) => redeemCoupon(currentUser?.id || '', c)} isRedeemed={false} />
        )}
    </div>
  );
};
