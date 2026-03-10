
import React, { useState, useEffect } from 'react';
import { User, UserRole, BusinessProfile, BusinessPlan } from '../types';
import { getCategories, saveBusiness, updateUser, getCities, getNeighborhoods } from '../services/dataService';
import { Store, ArrowLeft, Loader2, CheckCircle2, Camera, MapPin, Phone, Info } from 'lucide-react';

interface CreateBusinessProps {
    currentUser: User;
    onNavigate: (page: string) => void;
}

export const CreateBusiness: React.FC<CreateBusinessProps> = ({ currentUser, onNavigate }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [, setTick] = useState(0);

    useEffect(() => {
        const handleUpdate = () => setTick(t => t + 1);
        window.addEventListener('dataUpdated', handleUpdate);
        return () => window.removeEventListener('dataUpdated', handleUpdate);
    }, []);

    const categories = getCategories();
    const cities = getCities();
    const neighborhoods = getNeighborhoods();

    const [formData, setFormData] = useState({
        name: '',
        category: 'Gastronomia',
        description: '',
        address: '',
        cityId: '',
        neighborhoodId: '',
        phone: currentUser.phone || '',
        coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return alert("Por favor, insira o nome da empresa.");
        
        setLoading(true);
        try {
            // 1. Criar perfil da empresa
            const newBiz: BusinessProfile = {
                id: currentUser.id,
                name: formData.name,
                category: formData.category,
                description: formData.description || 'Nova empresa cadastrada pelo parceiro.',
                coverImage: formData.coverImage,
                gallery: [],
                address: formData.address,
                cityId: formData.cityId,
                neighborhoodId: formData.neighborhoodId,
                phone: formData.phone,
                amenities: [],
                openingHours: {},
                rating: 5,
                views: 0,
                shares: 0,
                isClaimed: true,
                plan: BusinessPlan.FREE
            };
            await saveBusiness(newBiz);

            // 2. Atualizar usuário
            const updatedUser: User = {
                ...currentUser,
                role: UserRole.COMPANY,
                permissions: {
                    ...(currentUser.permissions || { canCreateCoupons: false, canManageBusiness: false }),
                    canCreateBusiness: false,
                    canManageBusiness: true,
                    canCreateCoupons: true
                }
            };
            await updateUser(updatedUser);

            setSuccess(true);
            setTimeout(() => {
                onNavigate('pricing-plans');
            }, 2000);
        } catch (error) {
            console.error("Erro ao criar empresa:", error);
            alert("Erro ao criar empresa. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-md animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-ocean-950 mb-4 tracking-tight">Parabéns!</h2>
                    <p className="text-slate-500 font-medium mb-8">Sua empresa foi criada com sucesso. Você está sendo redirecionado para o seu novo painel de controle...</p>
                    <Loader2 className="animate-spin text-ocean-600 mx-auto" size={32} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 pt-8 md:pt-20 px-4">
            <div className="max-w-2xl mx-auto">
                <button 
                    onClick={() => onNavigate('user-dashboard')}
                    className="flex items-center gap-2 text-slate-400 hover:text-ocean-600 font-bold mb-8 transition-colors"
                >
                    <ArrowLeft size={20} /> Voltar ao Início
                </button>

                <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="bg-ocean-950 p-10 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                                <Store size={32} className="text-ocean-400" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tight mb-2">Criar sua Empresa</h1>
                            <p className="text-ocean-300 font-medium">Preencha os dados básicos para começar a divulgar seus cupons.</p>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-ocean-400/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-8">
                        <div className="grid grid-cols-1 gap-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nome Fantasia da Empresa</label>
                                <div className="relative">
                                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    <input 
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 font-bold text-ocean-950 outline-none focus:ring-4 focus:ring-ocean-500/10 transition-all"
                                        placeholder="Ex: Restaurante do Yuri"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Categoria Principal</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-ocean-950 outline-none focus:ring-4 focus:ring-ocean-500/10 transition-all"
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    {categories.map((cat: any) => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Localização</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <select 
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-ocean-950 outline-none focus:ring-4 focus:ring-ocean-500/10 transition-all"
                                        value={formData.cityId}
                                        onChange={e => setFormData({...formData, cityId: e.target.value, neighborhoodId: ''})}
                                    >
                                        <option value="">Selecione a Cidade</option>
                                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <select 
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-ocean-950 outline-none focus:ring-4 focus:ring-ocean-500/10 transition-all"
                                        value={formData.neighborhoodId}
                                        onChange={e => setFormData({...formData, neighborhoodId: e.target.value})}
                                        disabled={!formData.cityId}
                                    >
                                        <option value="">Selecione o Bairro</option>
                                        {neighborhoods.filter(n => n.cityId === formData.cityId).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                                    </select>
                                </div>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    <input 
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 font-bold text-ocean-950 outline-none focus:ring-4 focus:ring-ocean-500/10 transition-all"
                                        placeholder="Rua, Número, Complemento"
                                        value={formData.address}
                                        onChange={e => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Telefone / WhatsApp</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 font-bold text-ocean-950 outline-none focus:ring-4 focus:ring-ocean-500/10 transition-all"
                                            placeholder="(21) 99999-9999"
                                            value={formData.phone}
                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Imagem de Capa (URL)</label>
                                    <div className="relative">
                                        <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 font-bold text-ocean-950 outline-none focus:ring-4 focus:ring-ocean-500/10 transition-all"
                                            placeholder="https://..."
                                            value={formData.coverImage}
                                            onChange={e => setFormData({...formData, coverImage: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Descrição Breve</label>
                                <div className="relative">
                                    <Info className="absolute left-4 top-4 text-slate-300" size={20} />
                                    <textarea 
                                        rows={4}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 font-bold text-ocean-950 outline-none focus:ring-4 focus:ring-ocean-500/10 transition-all resize-none"
                                        placeholder="Conte um pouco sobre o seu negócio..."
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-ocean-600 text-white font-black py-6 rounded-3xl shadow-2xl shadow-ocean-600/30 hover:bg-ocean-700 transition-all flex items-center justify-center gap-3 text-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                            FINALIZAR E CRIAR EMPRESA
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
