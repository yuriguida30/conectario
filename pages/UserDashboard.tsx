
import React, { useState, useEffect } from 'react';
import { User, SavingsRecord, Coupon, BusinessProfile } from '../types';
import { Tag, LogOut, ChevronRight, HelpCircle, Trophy, TrendingUp, Wallet, Star, Heart, Store, Ticket, Send, Camera, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getCoupons, getBusinesses, getBusinessById, sendSupportMessage, updateUser } from '../services/dataService';
import { CouponCard } from '../components/CouponCard';
import { ImageUpload } from '../components/ImageUpload';

interface UserDashboardProps {
  currentUser: User;
  onLogout: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'favorites'>('overview');
  const [favCoupons, setFavCoupons] = useState<Coupon[]>([]);
  const [favBusinesses, setFavBusinesses] = useState<BusinessProfile[]>([]);
  
  // Support Form State
  const [showSupport, setShowSupport] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');

  // Profile Edit State
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

  // Prepare Chart Data
  const chartData = history.length > 0 ? history.slice(-5).map((h, i) => ({
      name: new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      amount: h.amount
  })) : [
      { name: 'Jan', amount: 0 }, { name: 'Fev', amount: 0 }, { name: 'Mar', amount: 0 }
  ];

  const handleSendSupport = (e: React.FormEvent) => {
      e.preventDefault();
      sendSupportMessage({
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          message: supportMsg
      });
      alert("Mensagem enviada! Nossa equipe responderá em breve.");
      setSupportMsg('');
      setShowSupport(false);
  };

  const handleUpdateAvatar = async () => {
      if(!newAvatarUrl) return;
      setIsSavingAvatar(true);
      
      try {
          const updatedUser = { ...currentUser, avatarUrl: newAvatarUrl };
          
          // 1. Salva no Banco de Dados e LocalStorage
          await updateUser(updatedUser);
          
          // 2. Dispara evento para o App.tsx atualizar o estado global (NavBar e Dashboard) sem reload
          window.dispatchEvent(new Event('dataUpdated'));
          
          setEditAvatar(false);
          setNewAvatarUrl('');
      } catch (error) {
          console.error("Erro ao atualizar avatar:", error);
          alert("Erro ao salvar a foto. Tente novamente.");
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
                          <div className="w-full h-full flex items-center justify-center bg-ocean-50 text-ocean-500 rounded-full">
                              <span className="text-2xl font-bold">{currentUser.name.charAt(0)}</span>
                          </div>
                      )}
                  </div>
                  <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white" size={20} />
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

      {editAvatar && (
          <div className="mb-6 bg-white p-6 rounded-xl border border-slate-200 animate-in fade-in shadow-lg relative z-20">
              <h3 className="font-bold text-ocean-900 mb-4 flex items-center gap-2"><Camera size={18}/> Alterar Foto de Perfil</h3>
              
              <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div className="w-full max-w-[200px] mx-auto md:mx-0">
                    <div className="aspect-square rounded-full overflow-hidden border-4 border-ocean-50 shadow-inner">
                        <ImageUpload 
                            currentImage={newAvatarUrl || currentUser.avatarUrl} 
                            onImageSelect={(base64) => setNewAvatarUrl(base64)}
                            label="" 
                            className="h-full w-full [&_div]:rounded-none [&_div]:border-none [&_div]:aspect-square"
                        />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                      <p className="text-sm text-slate-500 mb-2">
                          Selecione uma foto da sua galeria. Ela será comprimida automaticamente para economizar dados.
                      </p>
                      <button 
                        onClick={handleUpdateAvatar} 
                        disabled={!newAvatarUrl || isSavingAvatar}
                        className="bg-ocean-600 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-ocean-700 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                          {isSavingAvatar ? <Loader2 className="animate-spin" size={18}/> : null}
                          {isSavingAvatar ? 'Salvando...' : 'Salvar Nova Foto'}
                      </button>
                      <button 
                        onClick={() => { setEditAvatar(false); setNewAvatarUrl(''); }} 
                        className="text-slate-500 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 w-full"
                        disabled={isSavingAvatar}
                      >
                          Cancelar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex p-1 bg-slate-200/50 rounded-xl mb-6">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-ocean-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
              Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'favorites' ? 'bg-white shadow-sm text-ocean-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
              <Heart size={14} className={activeTab === 'favorites' ? 'fill-ocean-600' : ''}/> Favoritos
          </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
          <div className="animate-in fade-in">
              
              {/* SAVINGS PASSPORT / VISA LOOK */}
              <div className="bg-[#1e293b] rounded-3xl p-6 text-white shadow-2xl mb-8 relative overflow-hidden border-t border-white/10">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-ocean-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-gold-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
                  <div className="absolute top-4 right-4 opacity-20">
                      <TrendingUp size={48} />
                  </div>

                  <div className="relative z-10">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Passaporte de Economia</p>
                      <h2 className="text-5xl font-bold mb-2 tracking-tight">R$ {savedAmount.toFixed(2)}</h2>
                      <p className="text-sm text-slate-300 mb-6">Total economizado em suas aventuras.</p>
                      
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md border border-white/5 flex items-center gap-4">
                          <div className="bg-green-500/20 p-2 rounded-full text-green-400">
                              <Trophy size={20} />
                          </div>
                          <div>
                              <p className="text-xs text-slate-300 font-medium">Impacto Real</p>
                              <p className="text-sm font-bold text-white">Isso paga um jantar completo para dois!</p>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                      <div className="flex items-center gap-2 mb-6">
                          <div className="bg-green-100 p-2 rounded-lg text-green-600">
                              <TrendingUp size={20} />
                          </div>
                          <h3 className="font-bold text-ocean-950">Histórico de Economia</h3>
                      </div>
                      
                      <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData}>
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                                  <Tooltip cursor={{fill: '#f1f5f9', radius: 4}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                  <Bar dataKey="amount" radius={[4, 4, 4, 4]}>
                                      {chartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#0ea5e9' : '#cbd5e1'} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                           <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-3">
                               <Tag size={20} />
                           </div>
                           <span className="text-3xl font-bold text-slate-800">{history.length}</span>
                           <span className="text-xs text-slate-500">Cupons Utilizados</span>
                       </div>
                       <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                           <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-3">
                               <Wallet size={20} />
                           </div>
                           <span className="text-3xl font-bold text-slate-800">
                               R$ {(history.length > 0 ? savedAmount / history.length : 0).toFixed(0)}
                           </span>
                           <span className="text-xs text-slate-500">Média por Cupom</span>
                       </div>
                       
                       <div className="col-span-2">
                           <div 
                                onClick={() => setShowSupport(!showSupport)}
                                className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                           >
                               <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                       <HelpCircle size={20} />
                                   </div>
                                   <div>
                                       <p className="font-bold text-slate-800 text-sm">Precisa de Ajuda?</p>
                                       <p className="text-xs text-slate-400">Fale com o suporte</p>
                                   </div>
                               </div>
                               <ChevronRight size={18} className="text-slate-400" />
                           </div>
                           
                           {showSupport && (
                               <form onSubmit={handleSendSupport} className="mt-4 bg-white p-4 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2">
                                   <textarea 
                                    className="w-full border rounded-xl p-3 text-sm mb-2" 
                                    rows={3} 
                                    placeholder="Descreva seu problema..."
                                    value={supportMsg}
                                    onChange={e => setSupportMsg(e.target.value)}
                                    required
                                   />
                                   <button type="submit" className="w-full bg-ocean-600 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                                       <Send size={16}/> Enviar Mensagem
                                   </button>
                               </form>
                           )}
                       </div>
                  </div>
              </div>

              <h3 className="font-bold text-ocean-950 text-lg mb-4 px-2">Últimas Atividades</h3>
              <div className="space-y-3">
                  {history.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
                          <Tag className="mx-auto mb-2 opacity-50" />
                          <p>Você ainda não usou nenhum cupom.</p>
                      </div>
                  ) : (
                      history.slice().reverse().map((record, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                      <Trophy size={18} />
                                  </div>
                                  <div>
                                      <p className="font-bold text-ocean-950 text-sm">{record.couponTitle}</p>
                                      <p className="text-xs text-slate-400">{new Date(record.date).toLocaleDateString()}</p>
                                  </div>
                              </div>
                              <span className="font-bold text-green-600 text-sm">+ R$ {record.amount.toFixed(2)}</span>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {/* FAVORITES TAB */}
      {activeTab === 'favorites' && (
          <div className="animate-in slide-in-from-right-4">
              
              {/* Coupons Section */}
              <div className="mb-10">
                  <div className="flex items-center gap-2 mb-4 px-2">
                      <Ticket size={20} className="text-ocean-500"/>
                      <h3 className="text-lg font-bold text-ocean-950">Cupons Salvos ({favCoupons.length})</h3>
                  </div>
                  {favCoupons.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {favCoupons.map(coupon => (
                              <div key={coupon.id} className="h-full">
                                  <CouponCard coupon={coupon} onGetCoupon={() => {}} />
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="bg-slate-100 rounded-xl p-8 text-center text-slate-400 border border-slate-200 border-dashed">
                          <Heart className="mx-auto mb-2 opacity-50" size={32} />
                          <p>Nenhum cupom favorito.</p>
                      </div>
                  )}
              </div>

              {/* Businesses Section */}
              <div>
                  <div className="flex items-center gap-2 mb-4 px-2">
                      <Store size={20} className="text-ocean-500"/>
                      <h3 className="text-lg font-bold text-ocean-950">Empresas Favoritas ({favBusinesses.length})</h3>
                  </div>
                  {favBusinesses.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {favBusinesses.map(biz => (
                              <div key={biz.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex gap-4">
                                  <img src={biz.coverImage} className="w-20 h-20 rounded-lg object-cover bg-slate-100" />
                                  <div>
                                      <h4 className="font-bold text-ocean-950">{biz.name}</h4>
                                      <p className="text-xs text-slate-500 mb-2">{biz.category}</p>
                                      <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded w-fit">
                                          <Star size={10} className="text-gold-500 fill-gold-500" />
                                          <span className="text-xs font-bold text-slate-700">{biz.rating}</span>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="bg-slate-100 rounded-xl p-8 text-center text-slate-400 border border-slate-200 border-dashed">
                          <Heart className="mx-auto mb-2 opacity-50" size={32} />
                          <p>Nenhuma empresa favorita.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};
