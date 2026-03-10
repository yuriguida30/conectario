
import React, { useState, useEffect } from 'react';
import { User, SavingsRecord, Coupon, BusinessProfile, UserRole } from '../types';
import { Tag, LogOut, ChevronRight, HelpCircle, Trophy, TrendingUp, Wallet, Star, Heart, Store, Ticket, Send, Camera, Loader2, ShieldCheck, Zap, Bell, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
// Fix: Removed non-existent export 'sendSupportMessage' from dataService
import { getCoupons, getBusinesses, getBusinessById, updateUser, logout } from '../services/dataService';
import { CouponCard } from '../components/CouponCard';
import { ImageUpload } from '../components/ImageUpload';
import { X, AlertTriangle } from 'lucide-react';

interface CouponReceiptModalProps {
    record: SavingsRecord;
    onClose: () => void;
}

const CouponReceiptModal: React.FC<CouponReceiptModalProps> = ({ record, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                <div className="bg-ocean-600 p-8 text-white text-center relative">
                    <button onClick={onClose} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
                        <X size={20} />
                    </button>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ticket size={32} />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Comprovante</h2>
                    <p className="text-ocean-100 text-xs font-bold uppercase tracking-widest mt-1">Válido por 24h após resgate</p>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="text-center space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estabelecimento</p>
                        <h3 className="text-xl font-black text-ocean-950">{record.companyName || 'Empresa Parceira'}</h3>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center space-y-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Oferta Utilizada</p>
                            <p className="font-bold text-ocean-900">{record.couponTitle}</p>
                        </div>
                        <div className="pt-4 border-t border-slate-200">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Código de Validação</p>
                            <p className="text-3xl font-mono font-black text-ocean-600 tracking-[0.2em]">{record.code || '------'}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-bold">Data do Resgate:</span>
                            <span className="text-ocean-950 font-black">{new Date(record.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-bold">Economia Gerada:</span>
                            <span className="text-green-600 font-black">R$ {record.amount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                        <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                        <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                            <strong>Apresente este cupom no estabelecimento</strong> para garantir seu benefício. Este comprovante é de uso único e pessoal.
                        </p>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-full bg-ocean-950 text-white font-black py-4 rounded-2xl hover:bg-black transition-all shadow-lg shadow-ocean-950/20"
                    >
                        ENTENDI
                    </button>
                </div>
            </div>
        </div>
    );
};

interface UserDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, onLogout, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'favorites' | 'coupons'>('overview');
  const [favCoupons, setFavCoupons] = useState<Coupon[]>([]);
  const [favBusinesses, setFavBusinesses] = useState<BusinessProfile[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<SavingsRecord | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);
  
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
                  {currentUser.role === UserRole.COMPANY && currentUser.plan && (
                      <div className="mt-1 inline-flex items-center gap-1 bg-gold-50 text-gold-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-gold-100">
                          <Star size={10} /> Plano: {currentUser.plan}
                      </div>
                  )}
              </div>
          </div>
          <button onClick={onLogout} className="bg-white p-2.5 rounded-xl text-slate-400 hover:text-red-500 shadow-sm border border-slate-100">
              <LogOut size={20} />
          </button>
      </div>

      {/* DASHBOARD ACCESS BUTTONS - ACESSO RÁPIDO */}
      {(currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.COMPANY || currentUser.permissions?.canCreateBusiness) && (
          <div className="mb-8 flex flex-col gap-4">
              {currentUser.permissions?.canCreateBusiness && currentUser.role !== UserRole.COMPANY && (
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top duration-700 shadow-2xl shadow-orange-500/30 border-4 border-white/20">
                      <div className="flex items-center gap-6">
                          <div className="bg-white/20 p-4 rounded-3xl text-white backdrop-blur-md">
                              <Bell size={32} className="animate-bounce" />
                          </div>
                          <div className="text-white">
                              <h3 className="text-2xl font-black uppercase tracking-tight">Atenção Lojista!</h3>
                              <p className="text-sm font-bold opacity-90">Sua permissão foi aprovada. Agora você pode publicar sua empresa no nosso guia.</p>
                          </div>
                      </div>
                      <button 
                          onClick={() => onNavigate('create-business')}
                          className="bg-white text-orange-600 px-10 py-5 rounded-2xl font-black text-sm shadow-xl hover:bg-orange-50 transition-all whitespace-nowrap active:scale-95 flex items-center gap-2 group"
                      >
                          PUBLICAR MINHA EMPRESA
                          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentUser.role === UserRole.SUPER_ADMIN && (
                  <button 
                    onClick={() => onNavigate('admin-dashboard')}
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
              {currentUser.role === UserRole.COMPANY && (
                  <button 
                    onClick={() => onNavigate('pricing-plans')}
                    className="bg-gradient-to-tr from-gold-500 to-gold-400 text-white p-6 rounded-[2rem] flex items-center justify-between group hover:from-gold-600 hover:to-gold-500 transition-all shadow-md"
                  >
                      <div className="flex items-center gap-4">
                          <div className="bg-white/20 p-3 rounded-2xl"><Star size={24} className="text-white" /></div>
                          <div className="text-left">
                              <p className="text-xs font-black text-gold-100 uppercase">Evolua seu negócio</p>
                              <h3 className="font-bold">Ver Planos do Conecta Rio</h3>
                          </div>
                      </div>
                      <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
              )}
          </div>
        </div>
      )}

      {/* TABS & REST OF CONTENT */}
      {currentUser.role === UserRole.COMPANY ? (
          <div className="text-center py-10">
              <h2 className="text-xl font-bold text-ocean-950">Gerencie sua Empresa</h2>
              <p className="text-slate-500 mb-4">Acesse o painel de controle para gerenciar seus cupons e informações.</p>
              <button onClick={() => onNavigate('admin-dashboard')} className="bg-ocean-600 text-white px-6 py-3 rounded-xl font-bold">
                  Acessar Painel da Empresa
              </button>
          </div>
      ) : (
        <>
          <div className="flex p-1 bg-slate-200/50 rounded-xl mb-6">
              <button onClick={() => setActiveTab('overview')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-ocean-600' : 'text-slate-500'}`}>Visão Geral</button>
              <button onClick={() => setActiveTab('coupons')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'coupons' ? 'bg-white shadow-sm text-ocean-600' : 'text-slate-500'}`}><Ticket size={14}/> Meus Cupons</button>
              <button onClick={() => setActiveTab('favorites')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'favorites' ? 'bg-white shadow-sm text-ocean-600' : 'text-slate-500'}`}><Heart size={14}/> Favoritos</button>
          </div>

          {activeTab === 'overview' && (
              <div className="animate-in fade-in space-y-8">
                  <div className="bg-[#1e293b] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                      <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Passaporte de Economia</p>
                      <h2 className="text-5xl font-bold mb-2 tracking-tight">R$ {savedAmount.toFixed(2)}</h2>
                      <p className="text-sm text-slate-300">Total economizado na rede Conecta Rio.</p>
                  </div>

                  {/* Quick access to last coupons */}
                  {history.length > 0 && (
                      <div className="space-y-4">
                          <div className="flex justify-between items-center">
                              <h3 className="text-lg font-black text-ocean-950 uppercase tracking-tight">Últimos Resgates</h3>
                              <button onClick={() => setActiveTab('coupons')} className="text-ocean-600 text-xs font-black uppercase tracking-widest flex items-center gap-1">
                                  Ver Todos <ChevronRight size={14} />
                              </button>
                          </div>
                          <div className="space-y-3">
                              {[...history].reverse().slice(0, 3).map((record, idx) => (
                                  <div 
                                    key={idx} 
                                    onClick={() => setSelectedReceipt(record)}
                                    className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between hover:shadow-md transition-all cursor-pointer group"
                                  >
                                      <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 bg-ocean-50 rounded-xl flex items-center justify-center text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                                              <Ticket size={20} />
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-ocean-950 line-clamp-1">{record.couponTitle}</p>
                                              <p className="text-[10px] text-slate-400 font-bold uppercase">{record.companyName || 'Empresa Parceira'}</p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-sm font-black text-green-600">- R$ {record.amount.toFixed(2)}</p>
                                          <p className="text-[10px] text-slate-400">{new Date(record.date).toLocaleDateString('pt-BR')}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'coupons' && (
              <div className="animate-in fade-in space-y-6">
                  <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-ocean-950 uppercase tracking-tight">Meus Cupons</h3>
                      <div className="flex items-center gap-2 bg-ocean-50 px-3 py-1.5 rounded-full">
                          <Trophy size={14} className="text-ocean-600" />
                          <span className="text-[10px] font-black text-ocean-600 uppercase">{history.length} Resgates</span>
                      </div>
                  </div>

                  {history.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                          <Ticket size={48} className="mx-auto text-slate-200 mb-4" />
                          <p className="text-slate-400 font-bold">Você ainda não resgatou nenhum cupom.</p>
                          <button onClick={() => onNavigate('search')} className="mt-4 text-ocean-600 font-black text-xs uppercase tracking-widest">Explorar Ofertas</button>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {[...history].reverse().slice(0, showFullHistory ? undefined : 5).map((record, idx) => (
                              <div 
                                key={idx} 
                                onClick={() => setSelectedReceipt(record)}
                                className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                              >
                                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-ocean-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <div className="flex items-center gap-5">
                                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-ocean-50 group-hover:text-ocean-600 transition-colors">
                                          <Ticket size={28} />
                                      </div>
                                      <div>
                                          <h4 className="font-black text-ocean-950 group-hover:text-ocean-600 transition-colors">{record.couponTitle}</h4>
                                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{record.companyName || 'Empresa Parceira'}</p>
                                          <div className="flex items-center gap-3 mt-1">
                                              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold"><Clock size={12} /> Resgatado em {new Date(record.date).toLocaleDateString('pt-BR')}</span>
                                              {record.expiryDate && (
                                                  <span className="text-[10px] text-amber-600 flex items-center gap-1 font-bold"><Zap size={12} /> Expira em {new Date(record.expiryDate).toLocaleDateString('pt-BR')}</span>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                                  <div className="text-right hidden md:block">
                                      <p className="text-lg font-black text-green-600">Economia: R$ {record.amount.toFixed(2)}</p>
                                      <p className="text-[10px] font-black text-ocean-400 uppercase tracking-widest">Ver Comprovante</p>
                                  </div>
                                  <ChevronRight className="text-slate-300 group-hover:text-ocean-600 group-hover:translate-x-1 transition-all" />
                              </div>
                          ))}

                          {history.length > 5 && !showFullHistory && (
                              <button 
                                onClick={() => setShowFullHistory(true)}
                                className="w-full py-4 bg-white border border-slate-100 rounded-2xl text-ocean-600 font-black text-xs uppercase tracking-widest hover:bg-ocean-50 transition-colors"
                              >
                                Ver Histórico Completo ({history.length} cupons)
                              </button>
                          )}
                      </div>
                  )}
              </div>
          )}
          {activeTab === 'favorites' && (
              <div className="animate-in fade-in space-y-8">
                  <div className="space-y-4">
                      <h3 className="text-xl font-black text-ocean-950 uppercase tracking-tight">Cupons Favoritos</h3>
                      {favCoupons.length === 0 ? (
                          <div className="text-center py-10 bg-white rounded-3xl border border-slate-100">
                              <Heart size={32} className="mx-auto text-slate-200 mb-2" />
                              <p className="text-slate-400 text-sm">Nenhum cupom favoritado.</p>
                          </div>
                      ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {favCoupons.map(coupon => (
                                  <CouponCard key={coupon.id} coupon={coupon} onGetCoupon={() => {}} isRedeemed={false} />
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="space-y-4">
                      <h3 className="text-xl font-black text-ocean-950 uppercase tracking-tight">Empresas Favoritas</h3>
                      {favBusinesses.length === 0 ? (
                          <div className="text-center py-10 bg-white rounded-3xl border border-slate-100">
                              <Store size={32} className="mx-auto text-slate-200 mb-2" />
                              <p className="text-slate-400 text-sm">Nenhuma empresa favoritada.</p>
                          </div>
                      ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {favBusinesses.map(biz => (
                                  <div 
                                    key={biz.id} 
                                    onClick={() => onNavigate(`business/${biz.id}`)}
                                    className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
                                  >
                                      <img src={biz.coverImage} className="w-12 h-12 rounded-xl object-cover" />
                                      <div>
                                          <h4 className="font-bold text-ocean-950">{biz.name}</h4>
                                          <p className="text-xs text-slate-500">{biz.category}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          )}
        </>
      )}

      {/* MODALS */}
      {selectedReceipt && <CouponReceiptModal record={selectedReceipt} onClose={() => setSelectedReceipt(null)} />}

      {editAvatar && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                  <div className="p-8">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-2xl font-black text-ocean-950 uppercase tracking-tight">Alterar Foto</h3>
                          <button onClick={() => setEditAvatar(false)} className="text-slate-400 hover:text-ocean-600"><X size={24} /></button>
                      </div>
                      
                      <ImageUpload 
                          onImageSelect={(url: string) => setNewAvatarUrl(url)}
                          label="Escolha sua nova foto de perfil"
                      />

                      {newAvatarUrl && (
                          <div className="mt-6 flex justify-center">
                              <img src={newAvatarUrl} className="w-32 h-32 rounded-full object-cover border-4 border-ocean-100 shadow-xl" />
                          </div>
                      )}

                      <div className="mt-8 flex gap-3">
                          <button 
                              onClick={() => setEditAvatar(false)}
                              className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all"
                          >
                              CANCELAR
                          </button>
                          <button 
                              onClick={handleUpdateAvatar}
                              disabled={isSavingAvatar || !newAvatarUrl}
                              className="flex-1 py-4 bg-ocean-600 text-white font-black rounded-2xl hover:bg-ocean-700 transition-all shadow-lg shadow-ocean-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                              {isSavingAvatar ? <Loader2 className="animate-spin" size={20} /> : "SALVAR FOTO"}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showSupport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                  <div className="p-8">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-2xl font-black text-ocean-950 uppercase tracking-tight">Suporte</h3>
                          <button onClick={() => setShowSupport(false)} className="text-slate-400 hover:text-ocean-600"><X size={24} /></button>
                      </div>
                      
                      <p className="text-slate-500 text-sm mb-6">Precisa de ajuda? Envie uma mensagem para nossa equipe e responderemos o mais breve possível.</p>

                      <textarea 
                          value={supportMsg}
                          onChange={(e) => setSupportMsg(e.target.value)}
                          placeholder="Como podemos te ajudar hoje?"
                          className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/20 transition-all resize-none mb-6"
                      />

                      <button 
                          onClick={() => {
                              alert("Mensagem enviada com sucesso! Entraremos em contato em breve.");
                              setShowSupport(false);
                              setSupportMsg('');
                          }}
                          disabled={!supportMsg.trim()}
                          className="w-full py-4 bg-ocean-950 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg shadow-ocean-950/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                          <Send size={20} /> ENVIAR MENSAGEM
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
