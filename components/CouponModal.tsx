import React, { useState } from 'react';
import { X, MapPin, Clock, FileText, Check, Copy } from 'lucide-react';
import { Coupon } from '../types';

interface CouponModalProps {
  coupon: Coupon;
  onClose: () => void;
  onRedeem: (coupon: Coupon) => void;
  isRedeemed: boolean;
}

export const CouponModal: React.FC<CouponModalProps> = ({ coupon, onClose, onRedeem, isRedeemed }) => {
  const [step, setStep] = useState<'details' | 'code'>(isRedeemed ? 'code' : 'details');

  const handleRedeemClick = () => {
    onRedeem(coupon);
    setStep('code');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in">
      <div className="bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl h-[90vh] md:h-auto flex flex-col">
        
        {/* Header Image */}
        <div className="relative h-56 shrink-0">
          <img src={coupon.imageUrl} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 backdrop-blur-sm">
            <X size={20} />
          </button>
          
          <div className="absolute bottom-4 left-4 text-white">
             <span className="bg-gold-500 text-ocean-950 text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block uppercase">
                {coupon.category}
             </span>
             <h2 className="text-2xl font-bold leading-tight">{coupon.companyName}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
           {step === 'details' ? (
             <>
               <h3 className="text-xl font-bold text-ocean-900 mb-2">{coupon.title}</h3>
               <p className="text-slate-600 text-sm mb-6 leading-relaxed">{coupon.description}</p>
               
               <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                      <div className="bg-ocean-50 p-2 rounded-lg text-ocean-500"><MapPin size={20} /></div>
                      <div>
                          <p className="font-bold text-ocean-900 text-sm">Onde usar</p>
                          <p className="text-slate-500 text-xs">{coupon.address || 'Endereço disponível no mapa'}</p>
                      </div>
                  </div>
                  <div className="flex items-start gap-3">
                      <div className="bg-ocean-50 p-2 rounded-lg text-ocean-500"><Clock size={20} /></div>
                      <div>
                          <p className="font-bold text-ocean-900 text-sm">Validade</p>
                          <p className="text-slate-500 text-xs">Até {new Date(coupon.expiryDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                  </div>
                  <div className="flex items-start gap-3">
                      <div className="bg-ocean-50 p-2 rounded-lg text-ocean-500"><FileText size={20} /></div>
                      <div>
                          <p className="font-bold text-ocean-900 text-sm">Regras</p>
                          <ul className="text-slate-500 text-xs list-disc pl-4 space-y-1 mt-1">
                             {coupon.rules ? coupon.rules.map((r, i) => <li key={i}>{r}</li>) : <li>Consumo no local</li>}
                          </ul>
                      </div>
                  </div>
               </div>

               <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center border border-slate-100">
                   <div>
                       <p className="text-slate-400 text-xs line-through">De R$ {coupon.originalPrice}</p>
                       <p className="text-green-600 font-bold text-2xl">R$ {coupon.discountedPrice}</p>
                   </div>
                   <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                       -{coupon.discountPercentage}% OFF
                   </div>
               </div>
             </>
           ) : (
             <div className="flex flex-col items-center justify-center h-full py-8 text-center animate-in slide-in-from-bottom-10">
                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                     <Check size={40} strokeWidth={3} />
                 </div>
                 <h3 className="text-2xl font-bold text-ocean-900 mb-2">Cupom Resgatado!</h3>
                 <p className="text-slate-500 text-sm mb-8">Apresente o código abaixo no estabelecimento.</p>
                 
                 <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-6 w-full mb-6 relative group cursor-pointer" onClick={() => navigator.clipboard.writeText(coupon.code)}>
                     <p className="text-3xl font-mono font-bold text-ocean-900 tracking-widest">{coupon.code}</p>
                     <p className="text-[10px] text-slate-400 mt-2 uppercase">Toque para copiar</p>
                     <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                        <Copy size={16}/>
                     </div>
                 </div>

                 <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-xs w-full text-left">
                     ⚠️ <strong>Importante:</strong> Só clique em "Validar" quando o atendente solicitar ou após o pagamento.
                 </div>
             </div>
           )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white">
            {step === 'details' ? (
                <button 
                    onClick={handleRedeemClick}
                    className="w-full bg-gradient-to-r from-ocean-500 to-ocean-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-ocean-500/20 active:scale-[0.98] transition-all"
                >
                    PEGAR CUPOM
                </button>
            ) : (
                <button 
                    onClick={() => {
                        // In a real app, this sends a confirmation to backend
                        onClose();
                    }}
                    className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-600/20 active:scale-[0.98] transition-all"
                >
                    VALIDAR & ECONOMIZAR
                </button>
            )}
        </div>

      </div>
    </div>
  );
};