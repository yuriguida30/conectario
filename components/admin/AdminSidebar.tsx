
import React from 'react';
import { 
  Plus, Ticket, Store, Star, 
  Settings, BarChart3, Users,
  Utensils, MapPin, Layers, Zap,
  PenTool, ShoppingBag
} from 'lucide-react';
import { User, UserRole } from '../../types';

interface AdminSidebarProps {
  view: string;
  setView: (view: any) => void;
  currentUser: User;
  onNavigate: (page: string, params?: any) => void;
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  view, setView, currentUser, onNavigate, onLogout 
}) => {
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

  return (
    <div className="flex flex-wrap gap-3">
      <button 
        onClick={() => setView('HOME')} 
        className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'HOME' ? 'bg-ocean-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-ocean-600 shadow-sm'}`}
      >
        <BarChart3 size={18} /> DASHBOARD
      </button>
      
      <button 
        onClick={() => setView('COUPONS')} 
        className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'COUPONS' ? 'bg-ocean-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-ocean-600 shadow-sm'}`}
      >
        <Ticket size={18} /> MEUS CUPONS
      </button>

      {isSuperAdmin ? (
        <>
          <button 
            onClick={() => setView('BUSINESSES')} 
            className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'BUSINESSES' ? 'bg-ocean-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-ocean-600 shadow-sm'}`}
          >
            <Store size={18} /> EMPRESAS
          </button>
          <button 
            onClick={() => setView('REQUESTS')} 
            className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'REQUESTS' ? 'bg-ocean-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-ocean-600 shadow-sm'}`}
          >
            <Layers size={18} /> SOLICITAÇÕES
          </button>
          <button 
            onClick={() => setView('USERS')} 
            className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'USERS' ? 'bg-ocean-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-ocean-600 shadow-sm'}`}
          >
            <Users size={18} /> USUÁRIOS
          </button>
          <button 
            onClick={() => setView('LOCATIONS')} 
            className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'LOCATIONS' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-emerald-600 shadow-sm'}`}
          >
            <MapPin size={18} /> LOCAIS
          </button>
        </>
      ) : (
        <>
          <button 
            onClick={() => setView('MENU')} 
            className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'MENU' ? 'bg-ocean-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-ocean-600 shadow-sm'}`}
          >
            <Utensils size={18} /> CARDÁPIO
          </button>
          <button 
            onClick={() => onNavigate('pricing-plans')} 
            className="bg-gradient-to-tr from-gold-500 to-gold-400 text-white px-6 py-4 rounded-2xl font-black text-xs shadow-lg shadow-gold-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Star size={18} /> MEU PLANO
          </button>
          <button 
            onClick={() => setView(view === 'PROFILE' ? 'HOME' : 'PROFILE')} 
            className={`px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${view === 'PROFILE' ? 'bg-slate-200 text-slate-700' : 'bg-white border border-slate-100 text-ocean-600 shadow-sm'}`}
          >
            <Settings size={18} /> {view === 'PROFILE' ? 'VOLTAR' : 'CONFIGURAR PERFIL'}
          </button>
          <button onClick={() => setView('CREATE_COUPON')} className="bg-ocean-600 text-white px-6 py-4 rounded-2xl font-black text-xs shadow-lg shadow-ocean-600/20 active:scale-95 transition-all">
            + NOVO CUPOM
          </button>
        </>
      )}
      <button onClick={onLogout} className="px-6 py-4 bg-red-50 text-red-500 rounded-2xl font-black text-xs">SAIR</button>
    </div>
  );
};
