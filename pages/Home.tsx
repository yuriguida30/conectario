import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, ChevronRight, Gem, ArrowRight, Loader2, Utensils, Bed, Anchor, ShoppingBag, Star, Calendar, Map, Layers } from 'lucide-react';
import { Coupon, User, AppCategory, BusinessProfile, BlogPost, Collection, FeaturedConfig } from '../types';
import { CouponCard } from '../components/CouponCard';
import { CouponModal } from '../components/CouponModal';
import { getCoupons, redeemCoupon, getCategories, getBusinesses, getBlogPosts, getCollections, getFeaturedConfig, identifyNeighborhood } from '../services/dataService';

interface HomeProps {
  currentUser: User | null;
  onNavigate: (page: string, params?: any) => void;
}

export const Home: React.FC<HomeProps> = ({ currentUser, onNavigate }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [featured, setFeatured] = useState<FeaturedConfig | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);

  // GPS State
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationName, setLocationName] = useState("Arraial do Cabo");

  useEffect(() => {
    const fetch = async () => {
        const couponData = await getCoupons();
        const businessData = getBusinesses();
        const postData = getBlogPosts();
        const catData = getCategories();
        const colData = getCollections();
        const featData = getFeaturedConfig();
        
        setCoupons(couponData.filter(c => c.active));
        setBusinesses(businessData);
        setPosts(postData);
        setCategories(catData);
        setCollections(colData);
        setFeatured(featData);
        setLoading(false);
    };
    fetch();
    
    // Check if we already have location
    const storedGps = sessionStorage.getItem('user_gps');
    if (storedGps) {
        const { lat, lng } = JSON.parse(storedGps);
        const area = identifyNeighborhood(lat, lng);
        setLocationName(area);
    }
  }, []);

  const handleCardClick = (coupon: Coupon) => {
      setSelectedCoupon(coupon);
  };

  const handleRedeem = async (coupon: Coupon) => {
    if (!currentUser) {
      onNavigate('login');
      return;
    }
    await redeemCoupon(currentUser.id, coupon);
  };

  const currentSaved = currentUser?.savedAmount || 0;
  
  // Quick Access Icons Map
  const getCategoryIcon = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes('gastro') || n.includes('restaurante')) return <Utensils size={24} />;
      if (n.includes('hospedagem') || n.includes('hotel')) return <Bed size={24} />;
      if (n.includes('passeio') || n.includes('turismo')) return <Anchor size={24} />;
      if (n.includes('serviço') || n.includes('delivery')) return <ShoppingBag size={24} />;
      return <Map size={24} />;
  }

  const activateGPS = () => {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
          (pos) => {
              setGpsLoading(false);
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              
              const areaName = identifyNeighborhood(lat, lng);
              setLocationName(areaName);
              
              // Store in session storage if needed for other components
              sessionStorage.setItem('user_gps', JSON.stringify({ lat, lng }));
          },
          (err) => {
              setGpsLoading(false);
              alert("Não foi possível obter sua localização. Verifique as permissões do navegador.");
          }
      );
  }

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center pb-24">
              <Loader2 className="animate-spin text-ocean-500" size={32} />
          </div>
      );
  }

  return (
    <div className="pb-28 bg-slate-50 min-h-screen">
      
      {/* Top Header - Location */}
      <div className="sticky top-0 md:top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm transition-all duration-300">
         <div className="flex justify-between items-center px-4 py-3 max-w-7xl mx-auto w-full">
             <div 
                onClick={activateGPS}
                className="flex items-center gap-2 text-ocean-950 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors active:scale-95"
             >
                <div className={`bg-ocean-100 p-1.5 rounded-full text-ocean-600 ${gpsLoading ? 'animate-pulse' : ''}`}>
                    <MapPin size={16} />
                </div>
                <div>
                    <span className="text-[10px] text-slate-500 block leading-none">Você está em</span>
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-sm leading-none">{locationName}</span>
                        <ChevronDown size={12} className="text-slate-400" />
                    </div>
                </div>
             </div>
             <div className="w-8"></div> {/* Spacer since Bell is gone */}
         </div>
      </div>

      {/* Hero Section - Dynamic from Admin */}
      <div className="relative w-full h-auto mb-8">
          <div className="h-72 md:h-[400px] w-full relative">
            <img 
                src={featured?.imageUrl || "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1600"} 
                className="w-full h-full object-cover" 
                alt="Featured" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/90 via-ocean-900/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-7xl mx-auto w-full">
                <div className="animate-in slide-in-from-bottom-5 fade-in duration-700">
                    <span className="bg-gold-500 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-md mb-3 inline-block shadow-lg border border-white/20 backdrop-blur-md">
                        Destaque Premium
                    </span>
                    <h2 className="text-white text-2xl md:text-5xl font-bold mb-2 drop-shadow-xl tracking-tight leading-tight">{featured?.title || "Destaque"}</h2>
                    <p className="text-slate-100 text-xs md:text-lg mb-4 max-w-xl leading-relaxed opacity-90 line-clamp-2">
                        {featured?.subtitle || "Uma experiência incrível."}
                    </p>
                    <button className="bg-white text-ocean-900 font-bold px-6 py-2.5 rounded-full text-xs md:text-sm shadow-xl hover:bg-ocean-50 active:scale-95 transition-all flex items-center gap-2 w-fit">
                        {featured?.buttonText || "Ver Oferta"} <ArrowRight size={16} />
                    </button>
                </div>
            </div>
          </div>
      </div>

      <div className="px-4 max-w-7xl mx-auto -mt-6 relative z-10 space-y-10">
        
        {/* User Savings Card (Refined) */}
        {currentUser && (
            <div className="bg-gradient-to-br from-ocean-900 to-ocean-950 rounded-3xl p-6 shadow-2xl shadow-ocean-900/20 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-ocean-200 text-xs uppercase tracking-wider font-medium mb-1">Sua Carteira Inteligente</p>
                        <h3 className="text-3xl font-bold mb-1">R$ {currentSaved.toFixed(2)}</h3>
                        <p className="text-xs text-slate-300">economizados em experiências.</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center text-ocean-950 shadow-lg shadow-gold-500/20">
                        <Gem size={24} />
                    </div>
                </div>
            </div>
        )}

        {/* Quick Access (Categorias Principais) */}
        <div>
            <h3 className="text-ocean-950 font-bold mb-4 px-1 text-lg">O que procura hoje?</h3>
            <div className="flex justify-between md:justify-start md:gap-8 overflow-x-auto pb-4 px-1 hide-scrollbar">
                {categories.slice(0, 4).map(cat => (
                    <div key={cat.id} className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer group" onClick={() => onNavigate('search')}>
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-ocean-500 group-hover:bg-ocean-50 group-hover:text-ocean-600 group-hover:border-ocean-200 transition-all active:scale-95">
                            {getCategoryIcon(cat.name)}
                        </div>
                        <span className="text-xs font-medium text-slate-600 group-hover:text-ocean-800">{cat.name}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* COLLECTIONS (New Section) */}
        {collections.length > 0 && (
            <div>
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="text-ocean-950 text-xl font-bold tracking-tight">Coleções Especiais</h3>
                    <button 
                        className="text-sm font-semibold text-ocean-600 hover:text-ocean-800 flex items-center gap-1 active:scale-95 transition-transform"
                        onClick={() => onNavigate('collections')}
                    >
                        Ver todas <ChevronRight size={16} />
                    </button>
                </div>
                
                <div className="flex overflow-x-auto hide-scrollbar gap-4 -mx-4 px-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:mx-0 md:px-0">
                    {collections.slice(0, 3).map(col => (
                        <div 
                            key={col.id} 
                            onClick={() => onNavigate('collection-detail', { collectionId: col.id })}
                            className="w-80 md:w-full flex-shrink-0 h-48 relative rounded-2xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all active:scale-[0.98]"
                        >
                            <img src={col.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                            <div className="absolute bottom-0 left-0 p-4 w-full">
                                <h4 className="text-white text-lg font-bold mb-1 leading-tight">{col.title}</h4>
                                <div className="flex items-center gap-2 text-white/80 text-xs">
                                    <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded">{col.businessIds.length} lugares</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 1. SECTION: COUPONS (Destaques) */}
        <div>
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-ocean-950 text-xl font-bold tracking-tight">Melhores Ofertas</h3>
                <button 
                    className="text-sm font-semibold text-ocean-600 hover:text-ocean-800 flex items-center gap-1 active:scale-95 transition-transform"
                    onClick={() => onNavigate('search')}
                >
                    Ver todas <ChevronRight size={16} />
                </button>
            </div>
            
            {/* Horizontal Scroll */}
            {coupons.length > 0 ? (
                <div className="flex overflow-x-auto hide-scrollbar gap-5 -mx-4 px-4 pb-4 md:grid md:grid-cols-3 lg:grid-cols-4 md:mx-0 md:px-0 md:overflow-visible">
                    {coupons.slice(0, 4).map(coupon => (
                        <div key={coupon.id} className="w-72 flex-shrink-0 md:w-auto h-full">
                            <CouponCard coupon={coupon} onGetCoupon={handleCardClick} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400">
                    <p>Nenhuma oferta disponível no momento.</p>
                </div>
            )}
        </div>

        {/* 2. SECTION: GUIDE (Top Rated Businesses) */}
        {businesses.length > 0 && (
            <div>
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="text-ocean-950 text-xl font-bold tracking-tight">Lugares Incríveis</h3>
                    <button 
                        className="text-sm font-semibold text-ocean-600 hover:text-ocean-800 flex items-center gap-1 active:scale-95 transition-transform"
                        onClick={() => onNavigate('guide')}
                    >
                        Explorar Guia <ChevronRight size={16} />
                    </button>
                </div>

                <div className="flex overflow-x-auto hide-scrollbar gap-4 -mx-4 px-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:mx-0 md:px-0">
                    {businesses.slice(0, 3).map(biz => (
                        <div 
                            key={biz.id} 
                            onClick={() => onNavigate('business-detail', { businessId: biz.id })}
                            className="w-80 md:w-full flex-shrink-0 bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex gap-4 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all items-center"
                        >
                            <img src={biz.coverImage} className="w-20 h-20 rounded-lg object-cover bg-slate-100" />
                            <div className="flex-1 overflow-hidden">
                                <h4 className="font-bold text-ocean-950 truncate">{biz.name}</h4>
                                <p className="text-xs text-slate-500 mb-2 truncate">{biz.category}</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded">
                                        <Star size={10} className="text-gold-500 fill-gold-500" />
                                        <span className="text-xs font-bold text-slate-700">{biz.rating}</span>
                                    </div>
                                    {biz.isOpenNow && <span className="text-[10px] text-green-600 font-bold">Aberto</span>}
                                </div>
                            </div>
                            <div className="h-full flex items-center justify-center pr-2">
                                 <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                     <ChevronRight size={18}/>
                                 </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 3. SECTION: BLOG (Tips) */}
        {posts.length > 0 && (
            <div className="pb-4">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="text-ocean-950 text-xl font-bold tracking-tight">Dicas do Arraial</h3>
                    <button 
                        className="text-sm font-semibold text-ocean-600 hover:text-ocean-800 flex items-center gap-1 active:scale-95 transition-transform"
                        onClick={() => onNavigate('blog')}
                    >
                        Ler Blog <ChevronRight size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {posts.slice(0, 2).map(post => (
                        <div 
                            key={post.id}
                            onClick={() => onNavigate('blog-detail', { postId: post.id })}
                            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer group flex flex-row h-32 md:h-40 active:scale-[0.98] transition-all"
                        >
                            <div className="w-1/3 h-full relative overflow-hidden">
                                <img src={post.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            </div>
                            <div className="w-2/3 p-4 flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] font-bold text-ocean-600 uppercase tracking-wide mb-1 block">{post.category}</span>
                                    <h4 className="font-bold text-ocean-950 leading-tight line-clamp-2 group-hover:text-ocean-600 transition-colors">{post.title}</h4>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                                    <Calendar size={12} />
                                    <span>{post.date}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* CTA for Companies */}
        {!currentUser || currentUser.role === 'CUSTOMER' ? (
            <div className="bg-ocean-900 rounded-2xl p-6 md:p-10 text-center relative overflow-hidden my-6">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-2">Tem uma empresa em Arraial?</h3>
                    <p className="text-ocean-200 text-sm mb-6 max-w-md mx-auto">Cadastre-se gratuitamente, divulgue seus cupons e atraia mais turistas para o seu negócio.</p>
                    <button 
                        onClick={() => onNavigate('login')}
                        className="bg-gold-500 text-ocean-950 font-bold px-8 py-3 rounded-xl hover:bg-gold-400 transition-colors shadow-lg active:scale-95"
                    >
                        Quero Cadastrar Minha Empresa
                    </button>
                </div>
            </div>
        ) : null}

      </div>

      {/* Modal Integration */}
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