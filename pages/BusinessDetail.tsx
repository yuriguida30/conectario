import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, MapPin, Phone, Instagram, Globe, Wifi, Car, Tv, Utensils, Accessibility, CheckCircle2, ChevronDown, ChevronUp, Ticket, Heart, ShoppingBag, BedDouble, Layers, Star } from 'lucide-react';
import { BusinessProfile, AMENITIES_LABELS, Coupon, User } from '../types';
import { getBusinessById, getCoupons, getCurrentUser, redeemCoupon, toggleFavorite, rateBusiness } from '../services/dataService';
import { CouponCard } from '../components/CouponCard';
import { CouponModal } from '../components/CouponModal';

interface BusinessDetailProps {
  businessId: string;
  onNavigate: (page: string) => void;
}

const AmenityIcon = ({ name }: { name: string }) => {
    switch(name) {
        case 'wifi': return <Wifi size={18} />;
        case 'parking': return <Car size={18} />;
        case 'tv': return <Tv size={18} />;
        case 'breakfast': return <Utensils size={18} />;
        case 'access': return <Accessibility size={18} />;
        default: return <CheckCircle2 size={18} />;
    }
}

export const BusinessDetail: React.FC<BusinessDetailProps> = ({ businessId, onNavigate }) => {
  const [business, setBusiness] = useState<BusinessProfile | undefined>(undefined);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'catalog'>('info');
  
  // Coupon Logic
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    const loadData = async () => {
        const busData = getBusinessById(businessId);
        setBusiness(busData);
        
        // Fetch coupons for this business
        const allCoupons = await getCoupons();
        const businessCoupons = allCoupons.filter(c => c.companyId === businessId && c.active);
        setCoupons(businessCoupons);

        const user = getCurrentUser();
        setCurrentUser(user);
        if (user && user.favorites?.businesses.includes(businessId)) {
            setIsFav(true);
        }
    };
    loadData();
  }, [businessId]);

  const handleRedeem = async (coupon: Coupon) => {
    if (!currentUser) {
      onNavigate('login');
      return;
    }
    await redeemCoupon(currentUser.id, coupon);
  };

  const handleToggleFavorite = () => {
      if (!currentUser) {
          alert("Você precisa estar logado.");
          return;
      }
      toggleFavorite('business', businessId);
      setIsFav(!isFav);
  };

  const handleRate = (rating: number) => {
      if(!currentUser) {
          alert("Faça login para avaliar!");
          return;
      }
      setUserRating(rating);
      const updated = rateBusiness(businessId, rating);
      if(updated) setBusiness(updated);
      alert("Obrigado pela sua avaliação!");
  };

  const getCatalogLabel = (cat: string) => {
      const c = cat.toLowerCase();
      if (c.includes('gastronomia') || c.includes('restaurante')) return 'Cardápio';
      if (c.includes('hospedagem') || c.includes('hotel')) return 'Acomodações';
      if (c.includes('comércio') || c.includes('loja')) return 'Produtos';
      return 'Serviços & Preços';
  };

  const getCatalogIcon = (cat: string) => {
      const c = cat.toLowerCase();
      if (c.includes('gastronomia')) return <Utensils size={18} />;
      if (c.includes('hospedagem')) return <BedDouble size={18} />;
      if (c.includes('comércio')) return <ShoppingBag size={18} />;
      return <Layers size={18} />;
  }

  if (!business) return <div className="p-10 text-center">Carregando...</div>;

  const catalogLabel = getCatalogLabel(business.category);

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
        
        {/* Header / Gallery */}
        <div className="relative h-64 md:h-96 w-full overflow-hidden bg-slate-900 group">
            <button 
                onClick={() => onNavigate('guide')}
                className="absolute top-4 left-4 z-20 bg-black/40 text-white p-2 rounded-full backdrop-blur-sm hover:bg-black/60 transition-colors"
            >
                <ArrowLeft size={20} />
            </button>
            <div className="flex overflow-x-auto snap-x snap-mandatory h-full hide-scrollbar md:grid md:grid-cols-3 md:gap-1">
                {business.gallery.map((img, idx) => (
                    <img 
                        key={idx} 
                        src={img} 
                        className={`w-full h-full object-cover shrink-0 snap-center ${idx === 0 ? 'md:col-span-2' : ''} ${idx > 2 ? 'md:hidden' : ''}`} 
                        alt="" 
                    />
                ))}
            </div>
            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md">
                {business.gallery.length} fotos
            </div>
        </div>

        {/* Content Container */}
        <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-10">
            <div className="bg-white p-6 rounded-3xl shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-ocean-600 text-xs font-bold uppercase tracking-wide">{business.category}</span>
                        <span className="text-slate-300">•</span>
                        {business.isOpenNow ? (
                            <span className="text-green-600 text-xs font-bold">Aberto agora</span>
                        ) : (
                            <span className="text-red-500 text-xs font-bold">Fechado</span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl md:text-4xl font-bold text-ocean-950">{business.name}</h1>
                        <button 
                            onClick={handleToggleFavorite}
                            className="p-2 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                            <Heart className={`${isFav ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} size={24} />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                     <div className="bg-gold-500 text-white px-3 py-1.5 rounded-lg text-lg font-bold shadow-md flex flex-col items-center leading-none">
                        <span>{business.rating}</span>
                        <span className="text-[10px] font-normal opacity-80">★</span>
                    </div>
                    <span className="text-xs text-slate-400">{business.reviewCount || 0} avaliações</span>
                </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
                
                {/* Left Column: Info & Description */}
                <div className="md:col-span-2 space-y-6">
                    
                    {/* ACTIVE COUPONS SECTION - NEW */}
                    {coupons.length > 0 && (
                        <div className="bg-gradient-to-br from-ocean-50 to-white rounded-2xl p-6 border border-ocean-100 shadow-sm animate-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-ocean-100 p-2 rounded-lg text-ocean-600">
                                    <Ticket size={20} />
                                </div>
                                <h3 className="font-bold text-ocean-900 text-lg">Ofertas Exclusivas</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {coupons.map(coupon => (
                                    <div key={coupon.id} className="h-full">
                                        <CouponCard coupon={coupon} onGetCoupon={setSelectedCoupon} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                     <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                        <button className={`flex-1 md:flex-none md:px-8 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'info' ? 'bg-ocean-50 text-ocean-600' : 'text-slate-400'}`} onClick={() => setActiveTab('info')}>
                            Sobre
                        </button>
                        {(business.menu && business.menu.length > 0) && (
                            <button className={`flex-1 md:flex-none md:px-8 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'catalog' ? 'bg-ocean-50 text-ocean-600' : 'text-slate-400'}`} onClick={() => setActiveTab('catalog')}>
                                {getCatalogIcon(business.category)} {catalogLabel}
                            </button>
                        )}
                    </div>

                    {activeTab === 'info' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                                <h3 className="font-bold text-ocean-950 mb-3 text-lg">Descrição</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">{business.description}</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                                <h3 className="font-bold text-ocean-950 mb-4 text-lg">Comodidades</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {business.amenities.map(am => (
                                        <div key={am} className="flex items-center gap-2 text-slate-600 text-sm bg-slate-50 p-3 rounded-xl">
                                            <span className="text-ocean-500"><AmenityIcon name={am} /></span>
                                            <span>{AMENITIES_LABELS[am] || am}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Ratings Section */}
                            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                                <h3 className="font-bold text-ocean-950 mb-4 text-lg">Avalie este lugar</h3>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button 
                                            key={star}
                                            onClick={() => handleRate(star)}
                                            className={`transition-transform hover:scale-110 ${star <= userRating ? 'text-gold-500' : 'text-slate-200'}`}
                                        >
                                            <Star size={32} fill={star <= userRating ? "currentColor" : "none"} />
                                        </button>
                                    ))}
                                </div>
                                {userRating > 0 && <p className="text-sm text-green-600 mt-2 font-bold">Obrigado por avaliar!</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'catalog' && business.menu && (
                        <div className="space-y-8 animate-in slide-in-from-right-10">
                            {business.menu.map((section, idx) => (
                                <div key={idx}>
                                    <div className="flex items-center gap-3 mb-4 sticky top-20 z-10 bg-slate-50 py-2">
                                        <h3 className="text-xl font-bold text-ocean-900">{section.title}</h3>
                                        <div className="h-px bg-slate-200 flex-1"></div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {section.items.map((item, i) => (
                                            <div key={i} className="bg-white p-3 rounded-2xl border border-slate-100 flex gap-4 shadow-sm hover:shadow-md transition-shadow group">
                                                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={item.name} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <ShoppingBag size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <h4 className="font-bold text-ocean-950 text-sm line-clamp-1">{item.name}</h4>
                                                    {item.description && <p className="text-slate-500 text-xs mt-1 leading-snug line-clamp-2">{item.description}</p>}
                                                    <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between">
                                                        <span className="text-ocean-600 font-bold text-base">
                                                            {item.price > 0 ? `R$ ${item.price.toFixed(2)}` : 'Sob consulta'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Sticky Sidebar (Hours & Location) */}
                <div className="md:col-span-1 space-y-6">
                     <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm sticky top-24">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="text-ocean-500" size={20} />
                            <h3 className="font-bold text-ocean-950">Funcionamento</h3>
                        </div>
                        <div className="space-y-2 mb-6">
                            {Object.entries(business.openingHours).map(([day, hours]) => (
                                <div key={day} className="flex justify-between text-sm border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                                    <span className="text-slate-500">{day}</span>
                                    <span className="font-medium text-ocean-900">{hours}</span>
                                </div>
                            ))}
                        </div>

                         <div className="flex items-center gap-2 mb-2">
                            <MapPin className="text-ocean-500" size={20} />
                            <h3 className="font-bold text-ocean-950">Endereço</h3>
                        </div>
                        <p className="text-slate-600 text-sm mb-6 leading-relaxed">{business.address}</p>

                        <div className="flex flex-col gap-3">
                             <a href={`tel:${business.phone}`} className="w-full bg-slate-100 text-ocean-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                                <Phone size={18} /> Ligar Agora
                            </a>
                            {business.whatsapp && (
                                <a href={`https://wa.me/${business.whatsapp}`} className="w-full bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 shadow-lg shadow-green-500/20 transition-colors">
                                    WhatsApp
                                </a>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* Mobile Sticky Footer - Hidden on Desktop */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 pb-8 z-40 flex gap-3 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
            <a href={`tel:${business.phone}`} className="flex-1 bg-slate-100 text-ocean-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200">
                <Phone size={18} /> Ligar
            </a>
            {business.whatsapp && (
                <a href={`https://wa.me/${business.whatsapp}`} className="flex-1 bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 shadow-lg shadow-green-500/30">
                    WhatsApp
                </a>
            )}
        </div>

        {selectedCoupon && (
          <CouponModal 
            coupon={selectedCoupon} 
            onClose={() => setSelectedCoupon(null)} 
            onRedeem={handleRedeem}
            isRedeemed={false}
          />
        )}

    </div>
  );
};