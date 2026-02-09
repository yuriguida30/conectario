
import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, Clock, MapPin, Phone, Instagram, Globe, 
  MessageCircle, Share2, Loader2, Ticket, 
  Star, Heart, Utensils, Info, 
  CheckCircle2, Camera, Navigation, ShieldCheck, Lock
} from 'lucide-react';
import { BusinessProfile, AMENITIES_LABELS, Coupon, User, BusinessPlan } from '../types';
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
        }
        setLoading(false);
    };
    loadData();
  }, [businessId]);

  const handleClaim = async () => {
      if(!currentUser) return onNavigate('login');
      setIsClaiming(true);
      // Cria uma requisição do tipo CLAIM
      await createCompanyRequest({
          companyName: business?.name,
          ownerName: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone || '',
          status: 'PENDING',
          type: 'CLAIM',
          businessId: businessId
      });
      alert("Solicitação de reivindicação enviada! Nossa equipe entrará em contato.");
      setIsClaiming(false);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return alert("Faça login para favoritar.");
    toggleFavorite('business', businessId);
    setIsFav(!isFav);
  };

  const handleShare = () => {
    if (navigator.share) {
        navigator.share({ title: business?.name, url: window.location.href });
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copiado!");
    }
  };

  if (loading) return <div className="p-10 text-center flex items-center justify-center h-screen"><Loader2 className="animate-spin text-ocean-500" size={40}/></div>;
  if (!business) return <div className="p-10 text-center">Empresa não encontrada.</div>;

  const isPremium = business.plan === BusinessPlan.PREMIUM;

  return (
    <div className="bg-white min-h-screen pb-32">
        {/* HERO SECTION */}
        <div className="relative h-[45vh] w-full overflow-hidden bg-slate-900">
            <img src={business.coverImage} className="w-full h-full object-cover opacity-90" alt={business.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
            
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 pt-10 md:pt-6">
                <button onClick={() => window.history.back()} className="bg-white/20 text-white p-3 rounded-2xl backdrop-blur-xl hover:bg-white/40 transition-all border border-white/30"><ArrowLeft size={24} /></button>
                <div className="flex gap-2">
                    <button onClick={handleShare} className="bg-white/20 text-white p-3 rounded-2xl backdrop-blur-xl hover:bg-white/40 transition-all border border-white/30"><Share2 size={24} /></button>
                    <button onClick={handleToggleFavorite} className={`p-3 rounded-2xl backdrop-blur-xl transition-all border border-white/30 ${isFav ? 'bg-red-500 text-white' : 'bg-white/20 text-white'}`}><Heart className={isFav ? 'fill-white' : ''} size={24} /></button>
                </div>
            </div>

            <div className="absolute bottom-6 left-0 w-full px-6 z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="bg-ocean-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg">
                            {business.category}
                        </span>
                        {business.isOpenNow ? (
                            <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg">ABERTO</span>
                        ) : (
                            <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg">FECHADO</span>
                        )}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-ocean-950 mb-1 leading-tight">{business.name}</h1>
                    <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin size={14} className="text-ocean-500" />
                        <span className="text-sm font-bold">{business.address}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* CLAIM BANNER - DISCRETO */}
        {!business.isClaimed && (
            <div className="bg-gold-50 border-b border-gold-100 py-3 px-6 text-center">
                <button 
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="text-xs font-bold text-gold-700 flex items-center justify-center gap-2 mx-auto hover:underline"
                >
                    <ShieldCheck size={14} /> {isClaiming ? 'Enviando...' : 'É o dono deste estabelecimento? Reivindique aqui'}
                </button>
            </div>
        )}

        {/* ACTION BAR */}
        <div className="px-6 -mt-4 relative z-20 max-w-6xl mx-auto">
            <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-ocean-900/10 border border-white p-4 flex justify-around items-center">
                <button 
                  onClick={() => window.open(`tel:${business.phone}`)}
                  className="flex flex-col items-center gap-2 group"
                >
                    <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                        <Phone size={28} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Ligar</span>
                </button>

                <button 
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`)}
                  className="flex flex-col items-center gap-2 group"
                >
                    <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg shadow-slate-900/30 group-hover:scale-110 transition-transform">
                        <Navigation size={28} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Como Chegar</span>
                </button>

                {/* BOTÕES PREMIUM BLOQUEADOS NO FREE */}
                {isPremium ? (
                    <>
                        {business.whatsapp && (
                            <a href={`https://wa.me/${business.whatsapp}`} target="_blank" className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                                    <MessageCircle size={28} />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">WhatsApp</span>
                            </a>
                        )}
                        {business.instagram && (
                            <a href={`https://instagram.com/${business.instagram.replace('@','')}`} target="_blank" className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform">
                                    <Instagram size={28} />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Instagram</span>
                            </a>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 opacity-30 grayscale cursor-not-allowed">
                        <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
                            <Lock size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Social</span>
                    </div>
                )}
            </div>
        </div>

        {/* CONTENT SECTIONS */}
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
            
            {/* GALERIA - APENAS PREMIUM */}
            {isPremium && business.gallery && business.gallery.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-2xl font-black text-ocean-950 flex items-center gap-2">
                        <Camera size={24} className="text-ocean-600" /> Galeria do Local
                    </h3>
                    <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x -mx-6 px-6">
                        {business.gallery.map((img, i) => (
                            <div key={i} className="shrink-0 w-72 h-48 rounded-[2rem] overflow-hidden snap-center shadow-md">
                                <img src={img} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CARDÁPIO - APENAS PREMIUM */}
            {isPremium && business.menu && business.menu.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-ocean-950 flex items-center gap-2">
                        <Utensils size={24} className="text-ocean-600" /> Cardápio & Preços
                    </h3>
                    <div className="space-y-10">
                        {business.menu.map((section, sIdx) => (
                            <div key={sIdx} className="space-y-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">
                                    {section.title}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {section.items.map((item) => (
                                        <div key={item.id} className="bg-slate-50 p-4 rounded-3xl flex gap-4 items-center group hover:bg-ocean-50 transition-colors">
                                            {item.imageUrl && (
                                                <img src={item.imageUrl} className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-sm" />
                                            )}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-bold text-ocean-950 leading-tight">{item.name}</p>
                                                    <span className="font-black text-green-600 whitespace-nowrap ml-2">R$ {item.price.toFixed(2)}</span>
                                                </div>
                                                {item.description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* INFO & HORÁRIOS - DISPONÍVEL PARA TODOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-8 rounded-[2.5rem]">
                    <h3 className="text-xl font-black text-ocean-950 mb-6 flex items-center gap-2">
                        <Info size={20} className="text-ocean-600"/> Informações
                    </h3>
                    <p className="text-slate-600 leading-relaxed mb-6">{business.description}</p>
                    <div className="flex flex-wrap gap-2">
                        {business.amenities.map(am => (
                            <span key={am} className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 border border-slate-100 shadow-sm flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-green-500" /> {AMENITIES_LABELS[am] || am}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="bg-ocean-950 p-8 rounded-[2.5rem] text-white">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-ocean-100">
                        <Clock size={20} /> Horários
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(business.openingHours).map(([days, hours]) => (
                            <div key={days} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                <span className="text-ocean-300 font-bold">{days}</span>
                                <span className="font-black">{hours}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CUPONS */}
            {coupons.length > 0 && (
                <div className="pt-10">
                    <h3 className="text-2xl font-black text-ocean-950 mb-8 flex items-center gap-2">
                        <Ticket size={24} className="text-ocean-600" /> Cupons Disponíveis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {coupons.map(coupon => (
                            <CouponCard key={coupon.id} coupon={coupon} onGetCoupon={setSelectedCoupon} />
                        ))}
                    </div>
                </div>
            )}
        </div>

        {selectedCoupon && (
            <CouponModal 
                coupon={selectedCoupon} 
                onClose={() => setSelectedCoupon(null)} 
                onRedeem={(c) => redeemCoupon(currentUser?.id || '', c)} 
                isRedeemed={false} 
            />
        )}
    </div>
  );
};
