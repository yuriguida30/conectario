
import React, { useState, useEffect } from 'react';
import { User, PricingPlan, UserRole } from '../types';
import { getPricingPlans, updateUser } from '../services/dataService';
import { Check, ArrowRight, Star, Shield, Zap, Loader2, CreditCard, Lock, Calendar, Info, X, Gem, Compass } from 'lucide-react';
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
    const [showSuccess, setShowSuccess] = useState(false);

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
            setSelecting(null);
            setShowSuccess(true);
            
            setTimeout(() => {
                onNavigate('create-business');
            }, 3000);
        } catch (error: any) {
            console.error("Erro ao processar assinatura:", error);
            let message = "Erro ao processar assinatura.";
            
            try {
                const errData = JSON.parse(error.message);
                if (errData.error.includes('insufficient permissions')) {
                    message = "Erro de permissão no Firebase. Verifique as regras de segurança do Firestore.";
                }
            } catch (e) {
                // Not a JSON error or other issue
            }
            
            notify('error', message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-ocean-600" size={48} />
            </div>
        );
    }

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-ocean-950 flex items-center justify-center p-4">
                <div className="text-center space-y-8 animate-in zoom-in-95 duration-700">
                    <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
                        <Check size={56} strokeWidth={3} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-5xl font-black text-white tracking-tight">Assinatura Confirmada!</h2>
                        <p className="text-ocean-300 text-xl font-medium max-w-md mx-auto">
                            Seja bem-vindo ao Conecta Rio Empresas. Prepare-se para transformar seu negócio.
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-ocean-400 font-bold uppercase tracking-widest text-xs">
                        <Loader2 className="animate-spin" size={16} />
                        Redirecionando para o setup da empresa...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-24 pt-24 px-6">
            <div className="max-w-7xl mx-auto space-y-20">
                <div className="text-center space-y-6 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-ocean-100 text-ocean-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                        <Gem size={14} />
                        Planos de Crescimento
                    </div>
                    <h1 className="text-6xl font-black text-ocean-950 tracking-tight leading-[0.9]">Escolha o plano ideal para o seu negócio</h1>
                    <p className="text-slate-500 font-medium text-xl leading-relaxed">Impulsione sua visibilidade no Conecta Rio e alcance milhares de novos clientes todos os dias com ferramentas profissionais.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                    {plans.map((plan) => (
                        <div 
                            key={plan.id} 
                            className={`bg-white rounded-[3.5rem] p-12 border-2 transition-all flex flex-col relative ${plan.isFeatured ? 'border-ocean-500 shadow-2xl shadow-ocean-500/10 md:scale-105 z-10' : 'border-slate-100 shadow-xl hover:border-ocean-200'}`}
                        >
                            {plan.isFeatured && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-ocean-600 text-white px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    Recomendado
                                </div>
                            )}

                            <div className="space-y-4 mb-10">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-3xl font-black text-ocean-950">{plan.name}</h3>
                                    {plan.hasFreeTrial && (
                                        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                            Trial Disponível
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-ocean-950">R$ {plan.price}</span>
                                    <span className="text-slate-400 font-bold text-sm">/{plan.period === 'monthly' ? 'mês' : 'ano'}</span>
                                </div>
                                <p className="text-slate-400 text-sm font-medium">Ideal para {plan.name === 'Bronze' ? 'pequenos negócios' : plan.name === 'Prata' ? 'negócios em expansão' : 'grandes operações'}.</p>
                            </div>

                            <div className="flex-1 space-y-5 mb-12">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">O que está incluso:</p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 text-slate-600">
                                        <div className="w-6 h-6 rounded-full bg-ocean-50 flex items-center justify-center shrink-0">
                                            <Check size={14} className="text-ocean-600" />
                                        </div>
                                        <span className="text-sm font-bold">Até {plan.maxCoupons} cupons ativos</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-600">
                                        <div className="w-6 h-6 rounded-full bg-ocean-50 flex items-center justify-center shrink-0">
                                            <Check size={14} className="text-ocean-600" />
                                        </div>
                                        <span className="text-sm font-bold">Destaque nas pesquisas</span>
                                    </div>
                                    {plan.showGallery && (
                                        <div className="flex items-center gap-4 text-slate-600">
                                            <div className="w-6 h-6 rounded-full bg-ocean-50 flex items-center justify-center shrink-0">
                                                <Check size={14} className="text-ocean-600" />
                                            </div>
                                            <span className="text-sm font-bold">Galeria de fotos completa</span>
                                        </div>
                                    )}
                                    {plan.showMenu && (
                                        <div className="flex items-center gap-4 text-slate-600">
                                            <div className="w-6 h-6 rounded-full bg-ocean-50 flex items-center justify-center shrink-0">
                                                <Check size={14} className="text-ocean-600" />
                                            </div>
                                            <span className="text-sm font-bold">Cardápio digital interativo</span>
                                        </div>
                                    )}
                                    {plan.showSocialMedia && (
                                        <div className="flex items-center gap-4 text-slate-600">
                                            <div className="w-6 h-6 rounded-full bg-ocean-50 flex items-center justify-center shrink-0">
                                                <Check size={14} className="text-ocean-600" />
                                            </div>
                                            <span className="text-sm font-bold">Links de redes sociais</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button 
                                    onClick={() => handleSelectPlan(plan, false)}
                                    className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${plan.isFeatured ? 'bg-ocean-600 text-white shadow-2xl shadow-ocean-600/30 hover:bg-ocean-700' : 'bg-slate-100 text-ocean-950 hover:bg-slate-200'}`}
                                >
                                    <Zap size={18} />
                                    Assinar Agora
                                </button>
                                {plan.hasFreeTrial && (
                                    <button 
                                        onClick={() => handleSelectPlan(plan, true)}
                                        className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-emerald-600 hover:bg-emerald-50 border border-emerald-100"
                                    >
                                        Ou comece com 30 dias grátis
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-[3.5rem] p-16 shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-12 border border-slate-100">
                    <div className="space-y-4 max-w-xl">
                        <div className="w-16 h-16 bg-ocean-50 rounded-2xl flex items-center justify-center mb-2">
                            <Compass size={32} className="text-ocean-600" />
                        </div>
                        <h2 className="text-4xl font-black text-ocean-950 tracking-tight leading-none">Precisa de um plano personalizado?</h2>
                        <p className="text-slate-500 font-medium text-lg">Fale com nosso time comercial para soluções sob medida para grandes redes e franquias.</p>
                    </div>
                    <button className="bg-ocean-950 text-white px-12 py-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shrink-0 shadow-xl shadow-ocean-950/20">
                        Falar com Consultor
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-slate-200">
                    <div className="text-center space-y-2">
                        <div className="text-2xl font-black text-ocean-950">50k+</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuários Ativos</div>
                    </div>
                    <div className="text-center space-y-2">
                        <div className="text-2xl font-black text-ocean-950">1.2k+</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresas Parceiras</div>
                    </div>
                    <div className="text-center space-y-2">
                        <div className="text-2xl font-black text-ocean-950">15k+</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cupons Resgatados</div>
                    </div>
                    <div className="text-center space-y-2">
                        <div className="text-2xl font-black text-ocean-950">4.9/5</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avaliação Média</div>
                    </div>
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
