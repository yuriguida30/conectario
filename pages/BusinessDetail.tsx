
import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, Clock, MapPin, Phone, Instagram, Globe, 
  MessageCircle, Share2, Loader2, Ticket, 
  Star, Heart, Utensils, Navigation, X
} from 'lucide-react';
import { BusinessProfile, AMENITIES_LABELS, Coupon, User, BusinessPlan } from '../types';
import { getBusinessById, getCoupons, getCurrentUser, toggleFavorite, incrementBusinessView, redeemCoupon, trackAction } from '../services/dataService';
import { CouponCard } from '../components/CouponCard';
import { CouponModal } from '../components/CouponModal';

export const BusinessDetail: React.FC<{ businessId: string; onNavigate: (page: string, params?: any) => void }> = ({ businessId, onNavigate }) => {
  const [business, setBusiness] = useState<BusinessProfile | undefined>(undefined);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMenuOverlay, setShowMenuOverlay] = useState(false);

  useEffect(() => {
    const refreshData = async () => {
        const busData = getBusinessById(businessId);
        setBusiness(busData);
        if (busData) {
            incrementBusinessView(businessId);
            // Verifica se a visita foi por pesquisa ou direta (Simulação simples por referrer)
            const isFromSearch = document.referrer.includes(window.location.hostname);
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

  const handleAction = (type: 'menu' | 'social' | 'map' | 'share' | 'phone') => {
      trackAction(businessId, type);
      if (type === 'menu') setShowMenuOverlay(true);
  };

  const handleToggleFavorite = () => {
    if (!currentUser) return alert("Faça login para favoritar.");
    toggleFavorite('business', businessId);
    setIsFav(!isFav);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-ocean-500" size={40}/></div>;
  if (!business) return <div className="p-10 text-center">Empresa não encontrada.</div>;

  return (
    <div className={`bg-white min-h-screen pb-32 ${showMenuOverlay ? 'overflow-hidden' : ''}`}>
        <div className="relative h-[35vh] w-full bg-slate-900">
            <img src={business.coverImage} className="w-full h-full object-cover opacity-80" alt={business.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
            <div className="absolute top-10 left-0 w-full px-4 flex justify-between z-20">
                <button onClick={() => window.history.back()} className="bg-white/20 text-white p-3 rounded-2xl backdrop-blur-xl"><ArrowLeft size={24} /></button>
                <button onClick={handleToggleFavorite} className={`p-3 rounded-2xl backdrop-blur-xl ${isFav ? 'bg-red-500 text-white' : 'bg-white/20 text-white'}`}><Heart className={isFav ? 'fill-white' : ''} size={24} /></button>
            </div>
            <div className="absolute bottom-6 left-6 z-10">
                <span className="bg-ocean-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase mb-2 inline-block tracking-wider">{business.category}</span>
                <h1 className="text-4xl font-black text-ocean-950 mb-1">{business.name}</h1>
                <p className="text-sm text-slate-500 font-bold flex items-center gap-1"><MapPin size={14} className="text-ocean-500"/> {business.address}</p>
            </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">
            <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-[2.5rem] border border-slate-100">
                <button onClick={() => { handleAction('phone'); window.open(`tel:${business.phone}`); }} className="flex flex-col items-center gap-2"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-ocean-600 shadow-sm"><Phone size={24}/></div><span className="text-[9px] font-black uppercase text-slate-400">Ligar</span></button>
                <button onClick={() => { handleAction('map'); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`); }} className="flex flex-col items-center gap-2"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-ocean-600 shadow-sm"><Navigation size={24}/></div><span className="text-[9px] font-black uppercase text-slate-400">Rota</span></button>
                {business.whatsapp && <button onClick={() => { handleAction('social'); window.open(`https://wa.me/${business.whatsapp}`); }} className="flex flex-col items-center gap-2"><div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-sm"><MessageCircle size={24}/></div><span className="text-[9px] font-black uppercase text-slate-400">Zap</span></button>}
                <button onClick={() => handleAction('menu')} className="flex flex-col items-center gap-2"><div className="w-12 h-12 bg-ocean-600 rounded-2xl flex items-center justify-center text-white shadow-sm"><Utensils size={24}/></div><span className="text-[9px] font-black uppercase text-ocean-600">Menu</span></button>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-black text-ocean-950">Sobre o Local</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{business.description}</p>
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
                                    <div><h4 className="font-bold text-sm">{item.name}</h4><p className="text-xs text-slate-400">{item.description}</p></div>
                                    <span className="font-black text-green-600">R$ {item.price.toFixed(2)}</span>
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
