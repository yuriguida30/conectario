
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, MapPin, Phone, Instagram, Globe, Wifi, Car, Tv, Utensils, Accessibility, CheckCircle2, ChevronDown, ChevronUp, Ticket, Heart, ShoppingBag, BedDouble, Layers, Star, MessageCircle, Map, Share2, Camera, MessageSquare, Send } from 'lucide-react';
import { BusinessProfile, AMENITIES_LABELS, Coupon, User, Review } from '../types';
import { getBusinessById, getCoupons, getCurrentUser, redeemCoupon, toggleFavorite, addBusinessReview, fetchReviewsForBusiness } from '../services/dataService';
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
  
  // Review Fetch State
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Coupon Logic
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFav, setIsFav] = useState(false);
  
  // Review Logic
  const [userRating, setUserRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        const busData = getBusinessById(businessId);
        setBusiness(busData);
        
        // Fetch coupons for this business
        const allCoupons = await getCoupons();
        const businessCoupons = allCoupons.filter(c => c.companyId === businessId && c.active);
        setCoupons(businessCoupons);

        // Fetch Reviews (From Sub-collection now)
        const reviewsData = await fetchReviewsForBusiness(businessId);
        setReviews(reviewsData);

        const user = getCurrentUser();
        setCurrentUser(user);
        if (user && user.favorites?.businesses.includes(businessId)) {
            setIsFav(true);
        }
    };
    loadData();
    
    // Subscribe to changes
    const interval = setInterval(loadData, 5000); // Poll for open/close updates
    return () => clearInterval(interval);

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

  const handleShare = async () => {
      if (!business) return;
      
      const shareData = {
          title: business.name,
          text: `Confira ${business.name} no app Conecta Rio! As melhores ofertas e informações.`,
          url: window.location.href // Agora pega a URL real do browser (com ID)
      };

      if (navigator.share) {
          try {
              await navigator.share(shareData);
          } catch (err) {
              console.log('Erro ao compartilhar:', err);
          }
      } else {
          // Fallback para clipboard
          navigator.clipboard.writeText(window.location.href);
          alert('Link copiado para a área de transferência!');
      }
  };

  const handleBack = () => {
      // Se houver histórico, volta nativamente. Se não (abriu direto pelo link), vai pro Guia.
      if (window.history.length > 1) {
          window.history.back();
      } else {
          onNavigate('guide');
      }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!currentUser) {
          alert("Faça login para avaliar!");
          onNavigate('login');
          return;
      }
      if(userRating === 0) {
          alert("Por favor, selecione uma nota de 1 a 5 estrelas.");
          return;
      }

      setSubmittingReview(true);
      
      try {
          const updated = await addBusinessReview(businessId, currentUser, userRating, reviewComment);
          
          if(updated) {
              setBusiness(updated);
              const newReviews = await fetchReviewsForBusiness(businessId);
              setReviews(newReviews);
              
              setReviewComment('');
              setUserRating(0);
              alert("Avaliação enviada com sucesso!");
          }
      } catch (err) {
          console.error("Erro ao enviar avaliação:", err);
          alert("Houve um erro ao enviar sua avaliação. Tente novamente.");
      } finally {
          setSubmittingReview(false);
      }
  };

  const openMap = () => {
      if(business?.lat && business?.lng) {
          window.open(`https://www.google.com/maps/search/?api=1&query=${business.lat},${business.lng}`, '_blank');
      }
  };

  // Helper para imagem quebrada
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      e.currentTarget.src = 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=1200'; // Fallback elegante
      e.currentTarget.onerror = null; // Previne loop infinito
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

  // Gera o link do WhatsApp com mensagem personalizada
  const getWhatsAppLink = (phone: string, businessName: string) => {
      const cleanPhone = phone.replace(/\D/g, ''); // Remove tudo que não for número
      const message = encodeURIComponent(`Olá! Encontrei a ${businessName} no Guia Conecta Rio e gostaria de mais informações.`);
      return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  if (!business) return <div className="p-10 text-center flex items-center justify-center h-screen"><div className="animate-spin h-8 w-8 border-4 border-ocean-500 rounded-full border-t-transparent"></div></div>;

  const catalogLabel = getCatalogLabel(business.category);

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
        
        {/* NEW HEADER DESIGN (More App-Like) */}
        <div className="relative h-[45vh] md:h-[50vh] w-full overflow-hidden bg-slate-900">
            <img 
                src={business.coverImage || 'https://via.placeholder.com/1200x800'} 
                className="w-full h-full object-cover opacity-90" 
                alt={business.name}
                onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            
            {/* Top Nav */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 pt-safe">
                <button 
                    onClick={handleBack}
                    className="bg-white/20 text-white p-2 rounded-full backdrop-blur-md hover:bg-white/30 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex gap-2">
                    <button 
                        onClick={handleShare}
                        className="bg-white/20 text-white p-2 rounded-full backdrop-blur-md hover:bg-white/30 transition-colors"
                    >
                        <Share2 size={24} />
                    </button>
                    <button 
                        onClick={handleToggleFavorite}
                        className={`p-2 rounded-full backdrop-blur-md transition-colors ${isFav ? 'bg-white text-red-500' : 'bg-white/20 text-white hover:bg-white/30'}`}
                    >
                        <Heart className={isFav ? 'fill-red-500' : ''} size={24} />
                    </button>
                </div>
            </div>

            {/* Bottom Header Info */}
            <div className="absolute bottom-0 left-0 w-full p-6 pb-12 z-10">
                <div className="max-w-6xl mx-auto">
                    <span className="bg-ocean-500/90 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-3 inline-block shadow-lg">
                        {business.category}
                    </span>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 shadow-black drop-shadow-md leading-tight">{business.name}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm font-medium">
                        <div className="flex items-center gap-1">
                            <Star size={16} className="text-gold-500 fill-gold-500" />
                            <span className="font-bold text-white">{business.rating}</span>
                            <span className="opacity-70">({business.reviewCount} avaliações)</span>
                        </div>
                        {business.isOpenNow ? (
                            <span className="flex items-center gap-1.5 bg-green-500/20 px-2 py-0.5 rounded border border-green-500/50 text-green-300 font-bold">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Aberto
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/50 text-red-300 font-bold">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span> Fechado
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Content Body - Overlapping Card Style */}
        <div className="relative z-20 -mt-8 px-4 max-w-6xl mx-auto">
            
            {/* Action Bar (Scrollable) */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 mb-6">
                <div className="flex justify-between md:justify-start md:gap-8 items-center overflow-x-auto hide-scrollbar pb-2">
                    {business.phone && (
                        <a href={`tel:${business.phone}`} className="flex flex-col items-center gap-1 min-w-[70px] text-slate-600 hover:text-ocean-600 transition-colors">
                            <div className="w-10 h-10 bg-ocean-50 rounded-full flex items-center justify-center text-ocean-600"><Phone size={20}/></div>
                            <span className="text-xs font-bold">Ligar</span>
                        </a>
                    )}
                    {business.whatsapp && (
                        <a 
                            href={getWhatsAppLink(business.whatsapp, business.name)} 
                            target="_blank" 
                            className="flex flex-col items-center gap-1 min-w-[70px] text-slate-600 hover:text-green-600 transition-colors"
                        >
                            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600"><MessageCircle size={20}/></div>
                            <span className="text-xs font-bold">WhatsApp</span>
                        </a>
                    )}
                    {business.instagram && (
                        <a href={`https://instagram.com/${business.instagram.replace('@','')}`} target="_blank" className="flex flex-col items-center gap-1 min-w-[70px] text-slate-600 hover:text-pink-600 transition-colors">
                            <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-pink-600"><Instagram size={20}/></div>
                            <span className="text-xs font-bold">Insta</span>
                        </a>
                    )}
                    {business.website && (
                        <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" className="flex flex-col items-center gap-1 min-w-[70px] text-slate-600 hover:text-blue-600 transition-colors">
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Globe size={20}/></div>
                            <span className="text-xs font-bold">Site</span>
                        </a>
                    )}
                    {business.lat && (
                        <button onClick={openMap} className="flex flex-col items-center gap-1 min-w-[70px] text-slate-600 hover:text-orange-600 transition-colors">
                            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600"><Map size={20}/></div>
                            <span className="text-xs font-bold">Mapa</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Gallery Preview */}
            {business.gallery.length > 0 && (
                <div className="overflow-x-auto hide-scrollbar flex gap-3 pb-4 mb-2">
                        {business.gallery.map((img, idx) => (
                            <div key={idx} className="w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer hover:opacity-90 transition-opacity">
                                <img 
                                src={img} 
                                className="w-full h-full object-cover" 
                                onError={handleImageError}
                                />
                            </div>
                        ))}
                        <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 border border-slate-200 border-dashed">
                            <Camera size={24} />
                            <span className="text-xs font-bold mt-1">Ver todas</span>
                        </div>
                </div>
            )}

            {/* ACTIVE COUPONS */}
            {coupons.length > 0 && (
                <div className="bg-gradient-to-br from-ocean-50 to-white rounded-2xl p-6 border border-ocean-100 shadow-sm animate-in slide-in-from-bottom-4 mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-ocean-100 p-2 rounded-lg text-ocean-600">
                            <Ticket size={20} />
                        </div>
                        <h3 className="font-bold text-ocean-900 text-lg">Cupons Disponíveis</h3>
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

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto hide-scrollbar mb-6">
                <button 
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'info' ? 'border-ocean-600 text-ocean-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`} 
                    onClick={() => setActiveTab('info')}
                >
                    Sobre
                </button>
                {(business.menu && business.menu.length > 0) && (
                    <button 
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'catalog' ? 'border-ocean-600 text-ocean-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`} 
                        onClick={() => setActiveTab('catalog')}
                    >
                        {getCatalogIcon(business.category)} {catalogLabel}
                    </button>
                )}
                <button 
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'reviews' ? 'border-ocean-600 text-ocean-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`} 
                    onClick={() => setActiveTab('reviews')}
                >
                    <MessageSquare size={18} /> Avaliações ({business.reviewCount || 0})
                </button>
            </div>

            {/* TAB CONTENT: SOBRE */}
            {activeTab === 'info' && (
                <div className="grid md:grid-cols-3 gap-6 animate-in fade-in">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-ocean-950 mb-3 text-lg">Sobre o Local</h3>
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{business.description}</p>
                        </div>

                        {business.amenities.length > 0 && (
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
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
                        )}
                    </div>

                    {/* Right Column (Moved inside Info Tab) */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm md:sticky md:top-24">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="text-ocean-500" size={20} />
                                <h3 className="font-bold text-ocean-950">Horários</h3>
                            </div>
                            
                            <div className="space-y-2 mb-6">
                                {Object.entries(business.openingHours).map(([day, hours]) => {
                                    const isToday = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][new Date().getDay()] === day;
                                    return (
                                        <div key={day} className={`flex justify-between text-sm border-b border-slate-50 last:border-0 pb-2 last:pb-0 ${isToday ? 'bg-ocean-50 p-2 rounded-lg -mx-2 font-bold' : ''}`}>
                                            <span className={isToday ? 'text-ocean-700' : 'text-slate-500'}>{day}</span>
                                            <span className={isToday ? 'text-ocean-900' : 'text-slate-900 font-medium'}>{hours}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="text-ocean-500" size={20} />
                                <h3 className="font-bold text-ocean-950">Endereço</h3>
                            </div>
                            <p className="text-slate-600 text-sm mb-6 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{business.address}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: CATALOG */}
            {activeTab === 'catalog' && business.menu && (
                <div className="space-y-8 animate-in slide-in-from-right-10 max-w-4xl mx-auto">
                    {business.menu.map((section, idx) => (
                        <div key={idx}>
                            <div className="flex items-center gap-3 mb-4 sticky top-16 z-10 bg-slate-50 py-2">
                                <h3 className="text-xl font-bold text-ocean-900">{section.title}</h3>
                                <div className="h-px bg-slate-200 flex-1"></div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                {section.items.map((item, i) => (
                                    <div key={i} className="bg-white p-3 rounded-2xl border border-slate-100 flex gap-4 shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                                            {item.imageUrl ? (
                                                <img 
                                                    src={item.imageUrl} 
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                    alt={item.name}
                                                    onError={handleImageError} 
                                                />
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
                                                    {item.price > 0 ? `R$ ${item.price.toFixed(2)}` : 'Consulte'}
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

            {/* TAB CONTENT: REVIEWS */}
            {activeTab === 'reviews' && (
                <div className="space-y-6 animate-in slide-in-from-right-10 max-w-4xl mx-auto">
                    {/* Review Form */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-ocean-950 mb-4 text-lg">Escreva sua avaliação</h3>
                        <form onSubmit={handleSubmitReview}>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sua Nota</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button 
                                            type="button"
                                            key={star}
                                            onClick={() => setUserRating(star)}
                                            className={`transition-transform hover:scale-110 p-1 ${star <= userRating ? 'text-gold-500' : 'text-slate-200'}`}
                                        >
                                            <Star size={32} fill={star <= userRating ? "currentColor" : "none"} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-4 relative">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Comentário (Opcional)</label>
                                <textarea 
                                    className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-ocean-500 outline-none resize-none bg-slate-50"
                                    rows={4}
                                    maxLength={450}
                                    placeholder="Conte como foi sua experiência..."
                                    value={reviewComment}
                                    onChange={e => setReviewComment(e.target.value)}
                                />
                                <div className="absolute bottom-3 right-3 text-xs text-slate-400 pointer-events-none">
                                    {reviewComment.length}/450
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={submittingReview}
                                className="bg-ocean-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-ocean-700 transition-colors flex items-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {submittingReview ? 'Enviando...' : <><Send size={18}/> Publicar Avaliação</>}
                            </button>
                        </form>
                    </div>

                    {/* Review List */}
                    <div className="space-y-4">
                        {reviews && reviews.length > 0 ? (
                            reviews.map((review) => (
                                <div key={review.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex gap-4">
                                    <div className="shrink-0">
                                        {review.userAvatar ? (
                                            <img src={review.userAvatar} className="w-12 h-12 rounded-full object-cover border border-slate-200" alt={review.userName} />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-ocean-100 flex items-center justify-center text-ocean-600 font-bold text-lg">
                                                {review.userName.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-ocean-950 text-sm">{review.userName}</h4>
                                                <div className="flex text-gold-500 mt-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-gold-500" : "text-slate-200"} />
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400">{new Date(review.date).toLocaleDateString()}</span>
                                        </div>
                                        {review.comment && (
                                            <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg rounded-tl-none">
                                                {review.comment}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                                <MessageSquare size={40} className="text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">Nenhuma avaliação ainda.</p>
                                <p className="text-xs text-slate-400">Seja o primeiro a avaliar!</p>
                            </div>
                        )}
                    </div>
                </div>
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
