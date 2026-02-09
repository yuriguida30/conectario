
import React, { useEffect, useState } from 'react';
// Added Ticket to the lucide-react imports
import { ArrowLeft, Clock, MapPin, Phone, Instagram, Globe, Wifi, Car, Tv, Utensils, Accessibility, CheckCircle2, Heart, Star, MessageCircle, Map, Share2, Loader2, Info, Ticket } from 'lucide-react';
import { BusinessProfile, AMENITIES_LABELS, Coupon, User, Review } from '../types';
// Added redeemCoupon to the dataService imports
import { getBusinessById, getCoupons, getCurrentUser, toggleFavorite, fetchReviewsForBusiness, incrementBusinessView, redeemCoupon } from '../services/dataService';
import { CouponCard } from '../components/CouponCard';
import { CouponModal } from '../components/CouponModal';

export const BusinessDetail: React.FC<{ businessId: string; onNavigate: (page: string) => void }> = ({ businessId, onNavigate }) => {
  const [business, setBusiness] = useState<BusinessProfile | undefined>(undefined);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const handleToggleFavorite = () => {
    if (!currentUser) return alert("Faça login para favoritar.");
    toggleFavorite('business', businessId);
    setIsFav(!isFav);
  };

  if (loading) return <div className="p-10 text-center flex items-center justify-center h-screen"><Loader2 className="animate-spin text-ocean-500"/></div>;
  if (!business) return <div className="p-10 text-center">Empresa não encontrada.</div>;

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
        <div className="relative h-[45vh] md:h-[50vh] w-full overflow-hidden bg-slate-900">
            <img src={business.coverImage} className="w-full h-full object-cover opacity-90" alt={business.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 pt-safe">
                <button onClick={() => window.history.back()} className="bg-white/20 text-white p-2 rounded-full backdrop-blur-md"><ArrowLeft size={24} /></button>
                <button onClick={handleToggleFavorite} className={`p-2 rounded-full backdrop-blur-md ${isFav ? 'bg-white text-red-500' : 'bg-white/20 text-white'}`}><Heart className={isFav ? 'fill-red-500' : ''} size={24} /></button>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-6 pb-12 z-10">
                <div className="max-w-6xl mx-auto">
                    <span className="bg-ocean-500/90 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-bold uppercase mb-3 inline-block">
                        {business.category}
                    </span>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">{business.name}</h1>
                    <div className="flex items-center gap-2 text-white">
                        <MapPin size={16} className="text-gold-500" />
                        <span className="text-sm font-medium">{business.address}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="relative z-20 -mt-8 px-4 max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-black text-ocean-900">{business.rating}</p>
                            <div className="flex text-gold-500"><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/></div>
                        </div>
                        <div className="h-10 w-px bg-slate-100"></div>
                        <div>
                            <p className="text-sm font-bold text-ocean-950">Aberto Agora</p>
                            <p className="text-xs text-slate-500">{business.openingHours['Seg-Dom'] || 'Confira horários'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         {business.whatsapp && (
                            <a href={`https://wa.me/${business.whatsapp}`} target="_blank" className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors">
                                <MessageCircle size={24}/>
                            </a>
                         )}
                         <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`)} className="p-3 bg-ocean-50 text-ocean-600 rounded-xl hover:bg-ocean-100">
                             <Map size={24}/>
                         </button>
                    </div>
                </div>

                <div className="border-t border-slate-50 pt-6">
                    <h3 className="font-bold text-ocean-950 mb-3 text-lg">Sobre o Local</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">{business.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {business.amenities.map(am => (
                            <div key={am} className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                                <CheckCircle2 size={16} className="text-ocean-500"/>
                                <span>{AMENITIES_LABELS[am] || am}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {coupons.length > 0 && (
                <div className="mb-10">
                    <h3 className="font-bold text-ocean-950 text-xl mb-6 px-1 flex items-center gap-2">
                        <Ticket className="text-ocean-600" /> Cupons Disponíveis
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
