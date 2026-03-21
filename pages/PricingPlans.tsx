
import React, { useState, useEffect } from 'react';
import { User, PricingPlan } from '../types';
import { getPricingPlans, updateUser } from '../services/dataService';
import { Check, ArrowRight, Star, Shield, Zap, Loader2 } from 'lucide-react';
import { useNotification } from '../components/NotificationSystem';

interface PricingPlansProps {
    currentUser: User | null;
    onNavigate: (page: string) => void;
}

export const PricingPlans: React.FC<PricingPlansProps> = ({ currentUser, onNavigate }) => {
    const { notify } = useNotification();
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selecting, setSelecting] = useState<string | null>(null);

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

    const handleSelectPlan = async (plan: PricingPlan) => {
        if (!currentUser) {
            onNavigate('login');
            return;
        }
        setSelecting(plan.id);
        try {
            // In a real app, this would redirect to a payment gateway
            // For now, we'll just update the user's plan
            const updatedUser: User = {
                ...currentUser,
                plan: plan.name as any, // We should probably use plan.id or a better enum mapping
                maxCoupons: plan.maxCoupons
            };
            await updateUser(updatedUser);
            notify('success', `Plano ${plan.name} selecionado com sucesso!`);
            onNavigate('admin-dashboard');
        } catch (error) {
            notify('error', "Erro ao selecionar plano.");
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

                            <button 
                                onClick={() => handleSelectPlan(plan)}
                                disabled={selecting !== null}
                                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${plan.isFeatured ? 'bg-ocean-600 text-white shadow-xl shadow-ocean-600/20 hover:bg-ocean-700' : 'bg-slate-100 text-ocean-950 hover:bg-slate-200'}`}
                            >
                                {selecting === plan.id ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                                Começar Agora
                            </button>
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
        </div>
    );
};
