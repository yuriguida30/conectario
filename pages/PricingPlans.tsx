
import React, { useState, useEffect } from 'react';
import { User, PricingPlan, UserRole } from '../types';
import { getPricingPlans, updateUser } from '../services/dataService';
import { Check, ArrowRight, Star, Shield, Zap, Loader2, CreditCard, Lock, Calendar, Info, X } from 'lucide-react';
import { useNotification } from '../components/NotificationSystem';

interface PricingPlansProps {
    currentUser: User | null;
    onNavigate: (page: string) => void;
}

const PaymentModal: React.FC<{ 
    plan: PricingPlan; 
    onClose: () => void; 
    onConfirm: () => void;
    isTrial?: boolean;
}> = ({ plan, onClose, onConfirm, isTrial }) => {
    const [loading, setLoading] = useState(false);
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            onConfirm();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-ocean-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                <div className="bg-ocean-600 p-8 text-white relative">
                    <button onClick={onClose} className="absolute top-6 right-6 hover:rotate-90 transition-transform">
                        <X size={24} />
                    </button>
                    <h2 className="text-3xl font-black mb-2">Finalizar Assinatura</h2>
                    <p className="text-ocean-100 font-medium">
                        {isTrial ? 'Ative seus 30 dias grátis agora' : `Plano ${plan.name} - R$ ${plan.price}/${plan.period === 'monthly' ? 'mês' : 'ano'}`}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="bg-ocean-50 rounded-2xl p-4 flex items-start gap-3 border border-ocean-100">
                        <Info size={20} className="text-ocean-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-ocean-800 font-medium leading-relaxed">
                            {isTrial 
                                ? 'Você não será cobrado hoje. Após os 30 dias, a assinatura será renovada automaticamente. Cancele a qualquer momento.'
                                : 'Sua assinatura será ativada imediatamente após a confirmação do pagamento.'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome no Cartão</label>
                            <div className="relative">
                                <input 
                                    required
                                    type="text" 
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    placeholder="JOÃO DA SILVA"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-ocean-500 outline-none transition-all uppercase"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Número do Cartão</label>
                            <div className="relative">
                                <input 
                                    required
                                    type="text" 
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))}
                                    maxLength={19}
                                    placeholder="0000 0000 0000 0000"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-ocean-500 outline-none transition-all"
                                />
                                <CreditCard size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Validade</label>
                                <div className="relative">
                                    <input 
                                        required
                                        type="text" 
                                        value={expiry}
                                        onChange={(e) => setExpiry(e.target.value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/'))}
                                        maxLength={5}
                                        placeholder="MM/AA"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-ocean-500 outline-none transition-all"
                                    />
                                    <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CVV</label>
                                <div className="relative">
                                    <input 
                                        required
                                        type="text" 
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                        maxLength={3}
                                        placeholder="123"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-ocean-500 outline-none transition-all"
                                    />
                                    <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-ocean-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-ocean-700 transition-all shadow-xl shadow-ocean-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Shield size={20} />}
                        {isTrial ? 'Ativar Período Grátis' : 'Confirmar Pagamento'}
                    </button>

                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider">
                        Pagamento 100% seguro e criptografado
                    </p>
                </form>
            </div>
        </div>
    );
};

export const PricingPlans: React.FC<PricingPlansProps> = ({ currentUser, onNavigate }) => {
    const { notify } = useNotification();
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selecting, setSelecting] = useState<PricingPlan | null>(null);
    const [isTrialSelection, setIsTrialSelection] = useState(false);

    useEffect(() => {
        const loadPlans = async () => {
            const allPlans = getPricingPlans();
            setPlans(allPlans.filter(p => p.active));
            setLoading(false);
        };
        loadPlans();

        const handleUpdate = () => loadPlans();
        window.addEventListener('dataUpdated', handleUpdate);
        return () => window.removeEventListener('dataUpdated', handleUpdate);
    }, []);

    const handleSelectPlan = (plan: PricingPlan, isTrial: boolean = false) => {
        if (!currentUser) {
            onNavigate('login');
            return;
        }
        setSelecting(plan);
        setIsTrialSelection(isTrial);
    };

    const confirmPlan = async () => {
        if (!selecting || !currentUser) return;
        
        try {
            const updatedUser: User = {
                ...currentUser,
                role: UserRole.COMPANY,
                plan: selecting.name,
                maxCoupons: selecting.maxCoupons,
                permissions: {
                    ...(currentUser.permissions || {}),
                    canCreateBusiness: true,
                    canManageBusiness: true,
                    canCreateCoupons: true
                }
            };
            await updateUser(updatedUser);
            notify('success', isTrialSelection ? "Período grátis ativado com sucesso!" : `Plano ${selecting.name} assinado com sucesso!`);
            onNavigate('create-business');
        } catch (error) {
            notify('error', "Erro ao processar assinatura.");
        } finally {
            setSelecting(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-ocean-600" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 pt-20 px-4">
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <h1 className="text-5xl font-black text-ocean-950 tracking-tight">Escolha o plano ideal para o seu negócio</h1>
                    <p className="text-slate-500 font-medium text-lg">Impulsione sua visibilidade no Conecta Rio e alcance milhares de novos clientes todos os dias.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div 
                            key={plan.id} 
                            className={`bg-white rounded-[3rem] p-10 border-2 transition-all flex flex-col ${plan.isFeatured ? 'border-ocean-500 shadow-2xl shadow-ocean-500/10 scale-105 relative z-10' : 'border-slate-100 shadow-xl hover:border-ocean-200'}`}
                        >
                            {plan.isFeatured && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-ocean-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                    Mais Popular
                                </div>
                            )}

                            {plan.hasFreeTrial && (
                                <div className="mb-6 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
                                    <Star size={16} fill="currentColor" />
                                    <span className="text-xs font-black uppercase tracking-wider">30 Dias Grátis</span>
                                </div>
                            )}

                            <div className="space-y-2 mb-8">
                                <h3 className="text-2xl font-black text-ocean-950">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-ocean-950">R$ {plan.price}</span>
                                    <span className="text-slate-400 font-bold text-sm">/{plan.period === 'monthly' ? 'mês' : 'ano'}</span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4 mb-10">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <div className="w-6 h-6 rounded-full bg-ocean-50 flex items-center justify-center shrink-0">
                                        <Check size={14} className="text-ocean-600" />
                                    </div>
                                    <span className="text-sm font-bold">Até {plan.maxCoupons} cupons ativos</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <div className="w-6 h-6 rounded-full bg-ocean-50 flex items-center justify-center shrink-0">
                                        <Check size={14} className="text-ocean-600" />
                                    </div>
                                    <span className="text-sm font-bold">Destaque nas pesquisas</span>
                                </div>
                                {plan.showGallery && (
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <div className="w-6 h-6 rounded-full bg-ocean-50 flex items-center justify-center shrink-0">
                                            <Check size={14} className="text-ocean-600" />
                                        </div>
                                        <span className="text-sm font-bold">Galeria de fotos completa</span>
                                    </div>
                                )}
                                {plan.showMenu && (
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <div className="w-6 h-6 rounded-full bg-ocean-50 flex items-center justify-center shrink-0">
                                            <Check size={14} className="text-ocean-600" />
                                        </div>
                                        <span className="text-sm font-bold">Cardápio digital interativo</span>
                                    </div>
                                )}
                                {plan.showSocialMedia && (
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <div className="w-6 h-6 rounded-full bg-ocean-50 flex items-center justify-center shrink-0">
                                            <Check size={14} className="text-ocean-600" />
                                        </div>
                                        <span className="text-sm font-bold">Links de redes sociais</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                {plan.hasFreeTrial && (
                                    <button 
                                        onClick={() => handleSelectPlan(plan, true)}
                                        className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-700"
                                    >
                                        Ativar 30 Dias Grátis
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleSelectPlan(plan, false)}
                                    className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${plan.isFeatured && !plan.hasFreeTrial ? 'bg-ocean-600 text-white shadow-xl shadow-ocean-600/20 hover:bg-ocean-700' : 'bg-slate-100 text-ocean-950 hover:bg-slate-200'}`}
                                >
                                    <Zap size={20} />
                                    Assinar Agora
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-ocean-950 rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black tracking-tight">Precisa de um plano personalizado?</h2>
                        <p className="text-ocean-300 font-medium">Fale com nosso time comercial para soluções sob medida para grandes redes.</p>
                    </div>
                    <button className="bg-white text-ocean-950 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-ocean-50 transition-all shrink-0">
                        Falar com Consultor
                    </button>
                </div>
            </div>

            {selecting && (
                <PaymentModal 
                    plan={selecting} 
                    isTrial={isTrialSelection}
                    onClose={() => setSelecting(null)} 
                    onConfirm={confirmPlan} 
                />
            )}
        </div>
    );
};
