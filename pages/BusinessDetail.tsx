
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, MapPin, Phone, Instagram, Globe, Wifi, Car, Tv, Utensils, Accessibility, CheckCircle2, ChevronDown, ChevronUp, Ticket, Heart, ShoppingBag, BedDouble, Layers, Star, MessageCircle, Map, Share2, Camera, MessageSquare, Send, ShieldCheck, Mail, Info, Loader2, X } from 'lucide-react';
import { BusinessProfile, AMENITIES_LABELS, Coupon, User, Review } from '../types';
import { getBusinessById, getCoupons, getCurrentUser, redeemCoupon, toggleFavorite, addBusinessReview, fetchReviewsForBusiness, incrementBusinessView, incrementSocialClick, createClaimRequest } from '../services/dataService';
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
  const [activeTab, setActiveTab] = useState<'info' | 'catalog' | 'reviews'>('info');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFav, setIsFav] = useState(false);
  
  // Claim Logic
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimForm, setClaimForm] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    const loadData = async () => {
        const busData = getBusinessById(businessId);
        setBusiness(busData);
        if (busData) incrementBusinessView(businessId);
        const allCoupons = await getCoupons();
        setCoupons(allCoupons.filter(c => c.companyId === businessId && c.active));
        const reviewsData = await fetchReviewsForBusiness(businessId);
        setReviews(reviewsData);
        const user = getCurrentUser();
        setCurrentUser(user);
        if (user && user.favorites?.businesses.includes(businessId)) setIsFav(true);
    };
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [businessId]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!business) return;
      await createClaimRequest({
          businessId: business.id,
          businessName: business.name,
          requesterName: claimForm.name,
          requesterEmail: claimForm.email,
          requesterPhone: claimForm.phone
      });
      alert("Solicitação enviada! Nossa equipe entrará em contato para verificar a propriedade.");
      setShowClaimModal(false);
  };

  const handleToggleFavorite = () => {
    if (!currentUser) {
        alert("Faça login para favoritar.");
        return;
    }
    toggleFavorite('business', businessId);
    setIsFav(!isFav);
  };

  if (!business) return <div className="p-10 text-center flex items-center justify-center h-screen"><Loader2 className="animate-spin text-ocean-500"/></div>;

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
        {/* Banner e Header (Prevervados) */}
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
                </div>
            </div>
        </div>

        <div className="relative z-20 -mt-8 px-4 max-w-6xl mx-auto">
            
            {/* CLAIM BANNER PARA EMPRESAS NÃO REIVINDICADAS */}
            {!business.isClaimed && (
                <div className="bg-gradient-to-r from-gold-500 to-gold-600 rounded-2xl p-4 mb-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 border border-white/20">
                    <div className="flex items-center gap-3 text-ocean-950">
                        <div className="bg-white/20 p-2 rounded-xl"><ShieldCheck size={24}/></div>
                        <div>
                            <p className="font-bold text-sm">Este é o seu negócio?</p>
                            <p className="text-xs opacity-80">Reivindique o perfil para gerenciar cupons e informações.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowClaimModal(true)}
                        className="bg-white text-ocean-900 px-6 py-2 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all whitespace-nowrap"
                    >
                        REIVINDICAR AGORA
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 mb-6">
                <div className="flex justify-between md:justify-start md:gap-8 items-center overflow-x-auto hide-scrollbar pb-2">
                    {business.whatsapp && (
                        <a href={`https://wa.me/${business.whatsapp}`} target="_blank" className="flex flex-col items-center gap-1 min-w-[70px] text-slate-600">
                            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600"><MessageCircle size={20}/></div>
                            <span className="text-xs font-bold">WhatsApp</span>
                        </a>
                    )}
                    <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${business.lat},${business.lng}`)} className="flex flex-col items-center gap-1 min-w-[70px] text-slate-600">
                        <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600"><Map size={20}/></div>
                        <span className="text-xs font-bold">Local</span>
                    </button>
                </div>
            </div>

            {/* Restante do conteúdo (Sobre, Horários, etc) segue normal */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
                <h3 className="font-bold text-ocean-950 mb-3 text-lg">Sobre o Local</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{business.description}</p>
                
                {business.isImported && !business.isClaimed && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-start gap-2 text-blue-800 text-xs italic">
                        <Info size={16} className="shrink-0"/>
                        Dica: As informações acima foram baseadas nas melhores avaliações do Google Meu Negócio.
                    </div>
                )}
            </div>
        </div>

        {/* CLAIM MODAL */}
        {showClaimModal && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-ocean-950">Reivindicar Perfil</h2>
                        <button onClick={() => setShowClaimModal(false)}><X/></button>
                    </div>
                    <form onSubmit={handleClaimSubmit} className="space-y-4">
                        <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Seu Nome</label><input className="w-full border rounded-xl p-3 bg-slate-50" required value={claimForm.name} onChange={e => setClaimForm({...claimForm, name: e.target.value})}/></div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">WhatsApp de Contato</label><input className="w-full border rounded-xl p-3 bg-slate-50" required type="tel" value={claimForm.phone} onChange={e => setClaimForm({...claimForm, phone: e.target.value})}/></div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email Profissional</label><input className="w-full border rounded-xl p-3 bg-slate-50" required type="email" value={claimForm.email} onChange={e => setClaimForm({...claimForm, email: e.target.value})}/></div>
                        <p className="text-[10px] text-slate-400">Ao enviar, você confirma ser o proprietário ou representante legal deste estabelecimento. Nossa equipe entrará em contato para verificação.</p>
                        <button type="submit" className="w-full bg-ocean-600 text-white font-bold py-3.5 rounded-xl shadow-lg">ENVIAR SOLICITAÇÃO</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
