import React, { useState } from 'react';
import { Star, Heart } from 'lucide-react';
import { Coupon, User } from '../types';
import { getCurrentUser, toggleFavorite } from '../services/dataService';

interface CouponCardProps {
  coupon: Coupon;
  onGetCoupon: (coupon: Coupon) => void;
  isRedeemed?: boolean;
}

export const CouponCard: React.FC<CouponCardProps> = ({ coupon, onGetCoupon, isRedeemed = false }) => {
  // Use local state for immediate feedback, synced with localStorage via service
  const user = getCurrentUser();
  const [isFav, setIsFav] = useState(user?.favorites?.coupons.includes(coupon.id) || false);

  const handleToggleFavorite = (e: React.MouseEvent) => {
      e.stopPropagation(); // Don't open modal
      if (!user) {
          alert("Você precisa estar logado.");
          return;
      }
      toggleFavorite('coupon', coupon.id);
      setIsFav(!isFav);
  };

  return (
    <div 
        onClick={() => onGetCoupon(coupon)}
        className="group relative bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 active:scale-[0.98] h-full flex flex-col"
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] md:aspect-video shrink-0 overflow-hidden bg-slate-100">
        <img 
          src={coupon.imageUrl} 
          alt={coupon.title} 
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
        
        {/* Favorite Button */}
        <button 
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-colors z-20 group/heart"
        >
            <Heart size={18} className={`transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-white group-hover/heart:text-red-200'}`} />
        </button>

        {/* Logo Overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
             <div className="w-9 h-9 rounded-xl bg-white p-0.5 shadow-lg overflow-hidden">
                 <img src={coupon.companyLogo || `https://ui-avatars.com/api/?name=${coupon.companyName.substring(0,2)}&background=000&color=fff`} className="w-full h-full object-cover rounded-lg" alt="logo" />
             </div>
             <div className="flex flex-col items-start">
                 <span className="text-[10px] text-white/90 font-medium leading-none mb-1">{coupon.category}</span>
                 <div className="flex items-center gap-1 bg-black/30 px-1.5 py-0.5 rounded-md backdrop-blur-md">
                     <Star size={10} className="text-gold-400 fill-gold-400" />
                     <span className="text-[10px] text-white font-bold">{coupon.rating?.toFixed(1) || '5.0'}</span>
                 </div>
             </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-white relative z-10">
          <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 truncate max-w-[80%]">{coupon.companyName}</span>
                {coupon.active && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
            </div>
            <h4 className="font-bold text-ocean-950 text-base leading-tight mb-2 line-clamp-2 group-hover:text-ocean-600 transition-colors">{coupon.title}</h4>
            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{coupon.description}</p>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
              <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 line-through">R$ {coupon.originalPrice.toFixed(2)}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-medium text-ocean-900">R$</span>
                    <span className="text-lg font-bold text-green-600">{coupon.discountedPrice.toFixed(2)}</span>
                  </div>
              </div>
              <span className="text-xs bg-green-50 text-green-700 font-bold px-2.5 py-1 rounded-lg border border-green-100 group-hover:bg-green-100 transition-colors">
                  -{coupon.discountPercentage}%
              </span>
          </div>
      </div>
    </div>
  );
};