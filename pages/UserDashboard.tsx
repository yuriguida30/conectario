
import React, { useState, useEffect } from 'react';
import { User, SavingsRecord, Coupon, BusinessProfile, UserRole } from '../types';
import { Tag, LogOut, ChevronRight, HelpCircle, Trophy, TrendingUp, Wallet, Star, Heart, Store, Ticket, Send, Camera, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
// Fix: Removed non-existent export 'sendSupportMessage' from dataService
import { getCoupons, getBusinesses, getBusinessById, updateUser } from '../services/dataService';
import { CouponCard } from '../components/CouponCard';
import { ImageUpload } from '../components/ImageUpload';

interface UserDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, onLogout, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'favorites'>('overview');
  const [favCoupons, setFavCoupons] = useState<Coupon[]>([]);
  const [favBusinesses, setFavBusinesses] = useState<BusinessProfile[]>([]);
  
  const [showSupport, setShowSupport] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');

  const [editAvatar, setEditAvatar] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  useEffect(() => {
      if (activeTab === 'favorites') {
          const loadFavs = async () => {
              const allCoupons = await getCoupons();
              const userFavCoupons = currentUser.favorites?.coupons || [];
              setFavCoupons(allCoupons.filter(c => userFavCoupons.includes(c.id)));

              const allBusinesses = getBusinesses();
              const userFavBiz = currentUser.favorites?.businesses || [];
              setFavBusinesses(allBusinesses.filter(b => userFavBiz.includes(b.id)));
          };
          loadFavs();
      }
  }, [activeTab, currentUser]);

  const history = currentUser.history || [];
  const savedAmount = currentUser.savedAmount || 0;

  const handleUpdateAvatar = async () => {
      if(!newAvatarUrl) return;
      setIsSavingAvatar(true);
      try {
          const updatedUser = { ...currentUser, avatarUrl: newAvatarUrl };
          await updateUser(updatedUser);
          window.dispatchEvent(new Event('dataUpdated'));
          setEditAvatar(false);
          setNewAvatarUrl('');
      } catch (error) {
          alert("Erro ao salvar a foto.");
      } finally {
          setIsSavingAvatar(false);
      }
  };

  return (
    <div className="pb-24 pt-8 md:pt-20 bg-slate-50 min-h-screen px-4 max-w-5xl mx-auto">
      
      {/* Header Profile */}
      <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={() => setEditAvatar(true)}>
                  <div className="w-16 h-16 rounded-full bg-white p-1 shadow-lg overflow-hidden border-2 border-ocean-100">
                      {currentUser.avatarUrl ? (
                          <img src={currentUser.avatarUrl} className="w-full h-full object-cover rounded-full" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center bg-ocean-50 text-ocean-500 rounded-full font-bold text-xl">
                              {currentUser.name[0]}
                          </div>
                      )}
                  </div>
              </div>
              <div>
                  <h1 className="text-ocean-950 text-xl font-bold">{currentUser.name}</h1>
                  <p className="text-slate-500 text-xs">{currentUser.email}</p>
              </div>
          </div>
          <button onClick={onLogout} className="bg-white p-2.5 rounded-xl text-slate-400 hover:text-red-500 shadow-sm border border-slate-100">
              <LogOut size={20} />
          </button>
      </div>

      {/* DASHBOARD ACCESS BUTTONS - ACESSO RÁPIDO */}
      {(currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.COMPANY) && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentUser.role === UserRole.SUPER_ADMIN && (
                  <button 
                    onClick={() => onNavigate('super-admin-dashboard')}
                    className="bg-ocean-950 text-white p-6 rounded-[2rem] flex items-center justify-between group hover:bg-black transition-all"
                  >
                      <div className="flex items-center gap-4">
                          <div className="bg-white/10 p-3 rounded-2xl"><ShieldCheck size={24} className="text-ocean-400" /></div>
                          <div className="text-left">
                              <p className="text-xs font-black text-ocean-400 uppercase">Área Master</p>
                              <h3 className="font-bold">Dashboard Super Admin</h3>
                          </div>
                      </div>
                      <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
              )}
              {currentUser.role === UserRole.COMPANY && (
                  <button 
                    onClick={() => onNavigate('admin-dashboard')}
                    className="bg-white border border-slate-100 p-6 rounded-[2rem] flex items-center justify-between group hover:border-ocean-300 transition-all shadow-sm"
                  >
                      <div className="flex items-center gap-4">
                          <div className="bg-ocean-100 p-3 rounded-2xl"><Zap size={24} className="text-ocean-600" /></div>
                          <div className="text-left">
                              <p className="text-xs font-black text-ocean-400 uppercase">Gestão da Empresa</p>
                              <h3 className="font-bold text-ocean-950">Dashboard do Parceiro</h3>
                          </div>
                      </div>
                      <ChevronRight className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>
              )}
          </div>
      )}

      {/* TABS & REST OF CONTENT */}
      <div className="flex p-1 bg-slate-200/50 rounded-xl mb-6">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-ocean-600' : 'text-slate-500'}`}>Visão Geral</button>
          <button onClick={() => setActiveTab('favorites')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'favorites' ? 'bg-white shadow-sm text-ocean-600' : 'text-slate-500'}`}><Heart size={14}/> Favoritos</button>
      </div>

      {activeTab === 'overview' && (
          <div className="animate-in fade-in space-y-8">
              <div className="bg-[#1e293b] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Passaporte de Economia</p>
                  <h2 className="text-5xl font-bold mb-2 tracking-tight">R$ {savedAmount.toFixed(2)}</h2>
                  <p className="text-sm text-slate-300">Total economizado na rede Conecta Rio.</p>
              </div>
          </div>
      )}
    </div>
  );
};
