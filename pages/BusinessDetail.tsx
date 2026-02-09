
import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, Clock, MapPin, Phone, Instagram, Globe, 
  MessageCircle, Map, Share2, Loader2, Ticket, 
  ExternalLink, ChevronRight, Star, Heart, Utensils, Info, 
  Wifi, Car, Tv, Accessibility, CheckCircle2 
} from 'lucide-react';
import { BusinessProfile, AMENITIES_LABELS, Coupon, User } from '../types';
import { getBusinessById, getCoupons, getCurrentUser, toggleFavorite, incrementBusinessView, redeemCoupon } from '../services/dataService';
import { CouponCard } from '../components/CouponCard';
import { CouponModal } from '../components/CouponModal';

export const BusinessDetail: React.FC<{ businessId: string; onNavigate: (page: string, params?: any) => void }> = ({ businessId, onNavigate }) => {
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

  return (
    <div className="bg-slate-50 min-h-screen pb-32">
        {/* HERO SECTION */}
        <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden bg-slate-900">
            <img src={business.coverImage} className="w-full h-full object-cover opacity-80" alt={business.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />
            
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 pt-10 md:pt-6">
                <button onClick={() => window.history.back()} className="bg-black/40 text-white p-3 rounded-2xl backdrop-blur-md hover:bg-black/60 transition-all"><ArrowLeft size={24} /></button>
                <div className="flex gap-2">
                    <button onClick={handleShare} className="bg-black/40 text-white p-3 rounded-2xl backdrop-blur-md hover:bg-black/60 transition-all"><Share2 size={24} /></button>
                    <button onClick={handleToggleFavorite} className={`p-3 rounded-2xl backdrop-blur-md transition-all ${isFav ? 'bg-red-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'}`}><Heart className={isFav ? 'fill-white' : ''} size={24} /></button>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-6 pb-12 z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="bg-ocean-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg">
                            {business.category}
                        </span>
                        {business.isOpenNow ? (
                            <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg">ABERTO AGORA</span>
                        ) : (
                            <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg">FECHADO</span>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-6xl font-black text-white mb-2 leading-tight drop-shadow-md">{business.name}</h1>
                    <div className="flex items-center gap-2 text-white/90">
                        <MapPin size={16} className="text-gold-500" />
                        <span className="text-sm font-bold">{business.address}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* CONTENT BOXES */}
        <div className="relative z-20 -mt-8 px-4 max-w-6xl mx-auto space-y-6">
            
            {/* ACTION BAR - ACESSO RÁPIDO AOS CONTATOS */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-2 grid grid-cols-4 md:grid-cols-4 gap-2">
                {business.whatsapp && (
                    <a href={`https://wa.me/${business.whatsapp}`} target="_blank" className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-[1.5rem] text-green-600 group hover:bg-green-600 hover:text-white transition-all">
                        <MessageCircle size={28} className="mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Zap</span>
                    </a>
                )}
                {business.instagram && (
                    <a href={`https://instagram.com/${business.instagram.replace('@','')}`} target="_blank" className="flex flex-col items-center justify-center p-4 bg-pink-50 rounded-[1.5rem] text-pink-600 group hover:bg-gradient-to-tr hover:from-purple-600 hover:to-pink-500 hover:text-white transition-all">
                        <Instagram size={28} className="mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Insta</span>
                    </a>
                )}
                {business.phone && (
                    <a href={`tel:${business.phone}`} className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-[1.5rem] text-blue-600 group hover:bg-blue-600 hover:text-white transition-all">
                        <Phone size={28} className="mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Ligar</span>
                    </a>
                )}
                <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`)} className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-[1.5rem] text-slate-600 group hover:bg-slate-900 hover:text-white transition-all">
                    <Map size={28} className="mb-1" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Mapa</span>
                </button>
            </div>

            {/* INFO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Lado Esquerdo: Sobre e Comodidades */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                        <h3 className="text-xl font-black text-ocean-950 mb-4 flex items-center gap-2">
                            <Info size={20} className="text-ocean-600"/> Sobre o Estabelecimento
                        </h3>
                        <p className="text-slate-600 text-base leading-relaxed mb-8">{business.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-8">
                            {business.amenities.map(am => (
                                <div key={am} className="flex items-center gap-3 text-slate-500 text-sm font-bold bg-slate-50 p-3 rounded-2xl">
                                    <CheckCircle2 size={18} className="text-green-500 shrink-0"/>
                                    <span>{AMENITIES_LABELS[am] || am}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SEÇÃO DE CARDÁPIO / SERVIÇOS */}
                    {business.menu && business.menu.length > 0 && (
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                            <h3 className="text-xl font-black text-ocean-950 mb-6 flex items-center gap-2">
                                <Utensils size={20} className="text-ocean-600"/> Cardápio & Serviços
                            </h3>
                            <div className="space-y-8">
                                {business.menu.map((section, idx) => (
                                    <div key={idx}>
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">{section.title}</h4>
                                        <div className="space-y-4">
                                            {section.items.map(item => (
                                                <div key={item.id} className="flex justify-between items-start group">
                                                    <div className="flex-1 pr-4">
                                                        <p className="font-bold text-ocean-900 group-hover:text-ocean-600 transition-colors">{item.name}</p>
                                                        {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
                                                    </div>
                                                    <span className="font-black text-ocean-950 bg-slate-50 px-3 py-1 rounded-lg">R$ {item.price.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Lado Direito: Horários e Mais Contato */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                        <h3 className="text-xl font-black text-ocean-950 mb-6 flex items-center gap-2">
                            <Clock size={20} className="text-ocean-600"/> Horários
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(business.openingHours).map(([days, hours]) => (
                                <div key={days} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-bold">{days}</span>
                                    <span className="text-ocean-950 font-black">{hours}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* REDES E LINKS */}
                    <div className="bg-ocean-950 rounded-[2rem] p-8 text-white shadow-xl">
                        <h3 className="text-lg font-bold mb-6">Links Oficiais</h3>
                        <div className="space-y-4">
                            {business.instagram && (
                                <a href={`https://instagram.com/${business.instagram.replace('@','')}`} className="flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Instagram size={20} className="text-pink-400" />
                                        <span className="text-sm font-bold">Instagram</span>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-400" />
                                </a>
                            )}
                            {business.website && (
                                <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} className="flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Globe size={20} className="text-blue-400" />
                                        <span className="text-sm font-bold">Site Oficial</span>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-400" />
                                </a>
                            )}
                            <a href={`tel:${business.phone}`} className="flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <Phone size={20} className="text-green-400" />
                                    <span className="text-sm font-bold">Telefone</span>
                                </div>
                                <ChevronRight size={16} className="text-slate-400" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* CUPONS */}
            {coupons.length > 0 && (
                <div className="pt-10">
                    <h3 className="font-black text-ocean-950 text-2xl mb-8 flex items-center gap-3">
                        <Ticket className="text-ocean-600" size={32} /> Cupons de Desconto
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
