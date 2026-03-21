
import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, Clock, MapPin, Phone, Instagram, Globe, 
  MessageCircle, Share2, Loader2, Ticket, 
  Star, Heart, Utensils, Navigation, X, ShoppingCart, CalendarDays, Building2, ShoppingBag
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { BusinessProfile, AMENITIES_LABELS, Coupon, User, PricingPlan } from '../types';
import { getBusinessById, getCoupons, getCurrentUser, toggleFavorite, incrementBusinessView, redeemCoupon, trackAction, checkIfOpen, createCompanyRequest, getPricingPlans } from '../services/dataService';
import { CouponCard } from '../components/CouponCard';
import { CouponModal } from '../components/CouponModal';
import { useNotification } from '../components/NotificationSystem';

export const BusinessDetail: React.FC<{ businessId: string; onNavigate: (page: string, params?: any) => void }> = ({ businessId, onNavigate }) => {
  const { notify } = useNotification();
  const [business, setBusiness] = useState<BusinessProfile | undefined>(undefined);
  const [plan, setPlan] = useState<PricingPlan | undefined>(undefined);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMenuOverlay, setShowMenuOverlay] = useState(false);
  const [isOpen, setIsOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const refreshData = async () => {
        const busData = getBusinessById(businessId);
        setBusiness(busData);
        if (busData) {
            const allPlans = getPricingPlans();
            const busPlan = allPlans.find(p => p.name === busData.plan);
            setPlan(busPlan);

            incrementBusinessView(businessId);
            setIsOpen(checkIfOpen(busData.openingHours));
            const isFromSearch = document.referrer.includes('/search') || document.referrer.includes('?q=');
            trackAction(businessId, isFromSearch ? 'visit_search' : 'visit_direct');

            const allCoupons = await getCoupons();
            setCoupons(allCoupons.filter(c => c.companyId === businessId && c.active));
            const user = getCurrentUser();
            setCurrentUser(user);
            if (user && user.favorites?.businesses.includes(businessId)) setIsFav(true);
        }
        setLoading(false);
    };
    refreshData();
  }, [businessId]);

  const handleAction = (type: 'menu' | 'social' | 'map' | 'share' | 'phone' | 'website' | 'delivery' | 'booking') => {
      if (!business) return;
      trackAction(businessId, type as any);
      
      switch(type) {
          case 'menu': setShowMenuOverlay(true); break;
          case 'social': if(business.instagram) window.open(`https://instagram.com/${business.instagram.replace('@', '')}`, '_blank'); break;
          case 'phone': if(business.phone) window.open(`tel:${business.phone}`, '_self'); break;
          case 'website': if(business.website) window.open(business.website.startsWith('http') ? business.website : `https://${business.website}`, '_blank'); break;
          case 'delivery': if(business.deliveryUrl) window.open(business.deliveryUrl, '_blank'); break;
          case 'booking': if(business.bookingUrl) window.open(business.bookingUrl, '_blank'); break;
          case 'map': if(business.address) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`, '_blank'); break;
          case 'share': 
            if (navigator.share) {
                navigator.share({ title: business.name, url: window.location.href }).catch(() => {});
            } else {
                navigator.clipboard.writeText(window.location.href);
                notify('success', "Link copiado!");
            }
            break;
      }
  };

  const handleToggleFavorite = () => {
    if (!currentUser) return notify('warning', "Faça login para favoritar.");
    toggleFavorite('business', businessId);
    setIsFav(!isFav);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-ocean-500" size={40}/></div>;
  if (!business) return <div className="p-10 text-center">Empresa não encontrada.</div>;

  return (
    <div className={`bg-white min-h-screen pb-32 ${showMenuOverlay ? 'overflow-hidden' : ''}`}>
        <Helmet>
            <title>{business.name} | Guia Comercial</title>
            <meta name="description" content={business.description.substring(0, 150) + '...'} />
            <meta property="og:title" content={business.name} />
            <meta property="og:description" content={business.description.substring(0, 150) + '...'} />
            <meta property="og:image" content={business.coverImage} />
        </Helmet>
        <div className="relative h-[35vh] w-full bg-slate-900">
            <img src={business.coverImage} className="w-full h-full object-cover opacity-80" alt={business.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
            <div className="absolute top-10 left-0 w-full px-4 flex justify-between z-20">
                <button onClick={() => window.history.back()} className="bg-white/20 text-white p-3 rounded-2xl backdrop-blur-xl hover:bg-white/40 transition-all"><ArrowLeft size={24} /></button>
                <div className="flex gap-2">
                    <button onClick={() => handleAction('share')} className="bg-white/20 text-white p-3 rounded-2xl backdrop-blur-xl hover:bg-white/40 transition-all"><Share2 size={24} /></button>
                    <button onClick={handleToggleFavorite} className={`p-3 rounded-2xl backdrop-blur-xl transition-all ${isFav ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}><Heart className={isFav ? 'fill-white' : ''} size={24} /></button>
                </div>
            </div>
            <div className="absolute bottom-6 left-6 z-10">
                <span className="bg-ocean-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase mb-2 inline-block tracking-wider shadow-lg">{business.category}</span>
                <h1 className="text-4xl font-black text-ocean-950 mb-1 drop-shadow-sm flex items-center gap-3">
                    {business.name}
                    {business.deliveryUrl && (
                        <span title="Delivery Disponível" className="bg-ocean-50 text-ocean-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm">
                            Tem Entrega
                        </span>
                    )}
                </h1>
                <div className="flex items-center gap-4">
                    <p className="text-sm text-slate-500 font-bold flex items-center gap-1"><MapPin size={14} className="text-ocean-500"/> {business.address}</p>
                    {isOpen !== null && (
                        <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full ${isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                            {isOpen ? 'Aberto Agora' : 'Fechado'}
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">
            {/* RÉGUA DE BOTÕES DINÂMICA */}
            <div className="overflow-x-auto hide-scrollbar -mx-6 px-6">
                <div className="flex gap-4 min-w-max pb-2">
                    <button onClick={() => handleAction('phone')} className="flex flex-col items-center gap-2 group">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-ocean-600 shadow-md border border-slate-50 group-active:scale-95 transition-all"><Phone size={24}/></div>
                        <span className="text-[9px] font-black uppercase text-slate-400">Ligar</span>
                    </button>
                    
                    <button onClick={() => handleAction('map')} className="flex flex-col items-center gap-2 group">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-ocean-600 shadow-md border border-slate-50 group-active:scale-95 transition-all"><Navigation size={24}/></div>
                        <span className="text-[9px] font-black uppercase text-slate-400">Rota</span>
                    </button>

                    {business.instagram && (plan?.showSocialMedia !== false) && (
                        <button onClick={() => handleAction('social')} className="flex flex-col items-center gap-2 group">
                            <div className="w-14 h-14 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-active:scale-95 transition-all"><Instagram size={24}/></div>
                            <span className="text-[9px] font-black uppercase text-slate-400">Instagram</span>
                        </button>
                    )}

                    {business.website && (plan?.showSocialMedia !== false) && (
                        <button onClick={() => handleAction('website')} className="flex flex-col items-center gap-2 group">
                            <div className="w-14 h-14 bg-ocean-100 rounded-2xl flex items-center justify-center text-ocean-600 shadow-md border border-ocean-200 group-active:scale-95 transition-all"><Globe size={24}/></div>
                            <span className="text-[9px] font-black uppercase text-slate-400">Website</span>
                        </button>
                    )}

                    {business.deliveryUrl && (
                        <button onClick={() => handleAction('delivery')} className="flex flex-col items-center gap-2 group">
                            <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-active:scale-95 transition-all"><ShoppingCart size={24}/></div>
                            <span className="text-[9px] font-black uppercase text-red-500">Delivery</span>
                        </button>
                    )}

                    {business.bookingUrl && (
                        <button onClick={() => handleAction('booking')} className="flex flex-col items-center gap-2 group">
                            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-active:scale-95 transition-all"><CalendarDays size={24}/></div>
                            <span className="text-[9px] font-black uppercase text-orange-500">Reserva</span>
                        </button>
                    )}

                    {(plan?.showMenu !== false) && (
                        <button onClick={() => handleAction('menu')} className="flex flex-col items-center gap-2 group">
                            <div className="w-14 h-14 bg-ocean-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-active:scale-95 transition-all"><Utensils size={24}/></div>
                            <span className="text-[9px] font-black uppercase text-ocean-600 font-bold">Cardápio</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-black text-ocean-950">Sobre o Local</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{business.description}</p>
            </div>

            {!business.isClaimed && business.canBeClaimed !== false && (
                <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100 space-y-4">
                    <div className="flex items-center gap-3 text-amber-600">
                        <Building2 size={24} />
                        <h3 className="text-lg font-black uppercase tracking-tight">Esta é sua empresa?</h3>
                    </div>
                    <p className="text-sm text-amber-900/70 font-medium leading-relaxed">
                        Reivindique esta página para gerenciar informações, responder avaliações e criar cupons de desconto exclusivos para seus clientes.
                    </p>
                    <button 
                        onClick={() => {
                            if (!currentUser) return notify('warning', "Faça login para reivindicar esta empresa.");
                            const claimRequest = {
                                companyId: business.id,
                                companyName: business.name,
                                ownerName: currentUser.name,
                                email: currentUser.email,
                                phone: business.phone,
                                document: '', // Will be filled in admin or asked later
                                category: business.category,
                                description: `Reivindicação da empresa ${business.name}`
                            };
                            createCompanyRequest(claimRequest, 'CLAIM');
                            notify('success', "Sua solicitação de reivindicação foi enviada para análise!");
                        }}
                        className="bg-amber-500 text-white font-black px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all text-xs uppercase tracking-widest"
                    >
                        Reivindicar agora
                    </button>
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-xl font-black text-ocean-950 flex items-center gap-2"><Clock size={20} className="text-ocean-600"/> Horário de Funcionamento</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => {
                        const hours = business.openingHours[day] || 'Fechado';
                        const isToday = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][new Date().getDay()] === day;
                        return (
                            <div key={day} className={`p-3 rounded-xl transition-all ${isToday ? 'bg-white shadow-sm border border-ocean-100 ring-1 ring-ocean-500/20' : ''}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className={`font-black text-[10px] uppercase tracking-wider ${isToday ? 'text-ocean-600' : 'text-slate-400'}`}>{day}</p>
                                    {isToday && <span className="w-1.5 h-1.5 rounded-full bg-ocean-500 animate-pulse" />}
                                </div>
                                <p className={`text-sm font-bold ${isToday ? 'text-ocean-950' : 'text-slate-600'}`}>{hours}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* GALERIA DE FOTOS */}
            {business.gallery && business.gallery.length > 0 && (plan?.showGallery !== false) && (
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-ocean-950">Galeria de Fotos</h3>
                    <div className="overflow-x-auto hide-scrollbar -mx-6 px-6">
                        <div className="flex gap-4 pb-2">
                            {business.gallery.map((img, idx) => (
                                <div key={idx} className="w-72 h-48 flex-shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-100">
                                    <img src={img} className="w-full h-full object-cover" alt={`${business.name} gallery ${idx}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* COMODIDADES VISUAIS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {business.amenities?.map(am => (
                    <div key={am} className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-ocean-500" />
                        <span className="text-xs font-bold text-slate-600">{AMENITIES_LABELS[am] || am}</span>
                    </div>
                ))}
            </div>

            {coupons.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-ocean-950 flex items-center gap-2"><Ticket size={24} className="text-ocean-600" /> Ofertas Exclusivas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {coupons.map(coupon => <CouponCard key={coupon.id} coupon={coupon} onGetCoupon={setSelectedCoupon} />)}
                    </div>
                </div>
            )}
        </div>

        {showMenuOverlay && (
            <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-bottom flex flex-col">
                <div className="p-6 border-b flex justify-between items-center pt-12">
                    <h2 className="text-2xl font-black text-ocean-950">Cardápio Digital</h2>
                    <button onClick={() => setShowMenuOverlay(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center"><X size={24}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {business.menu?.map(section => (
                        <div key={section.title} className="space-y-4">
                            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">{section.title}</h3>
                            {section.items.map(item => (
                                <div key={item.id} className="bg-slate-50 p-5 rounded-2xl flex justify-between items-center">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm text-ocean-950">{item.name}</h4>
                                        <p className="text-xs text-slate-400">{item.description}</p>
                                    </div>
                                    <span className="font-black text-green-600 whitespace-nowrap ml-4">R$ {item.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                    {(!business.menu || business.menu.length === 0) && <p className="text-center py-20 text-slate-400">O cardápio será disponibilizado em breve.</p>}
                </div>
            </div>
        )}

        {selectedCoupon && <CouponModal coupon={selectedCoupon} onClose={() => setSelectedCoupon(null)} onRedeem={async (c) => { await redeemCoupon(currentUser?.id || '', c); }} isRedeemed={false} />}
    </div>
  );
};
