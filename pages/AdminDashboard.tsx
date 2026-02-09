
import React, { useState, useEffect } from 'react';
import { User, Coupon, BusinessProfile, MenuItem, BusinessPlan, MenuSection } from '../types';
import { getCoupons, saveCoupon, deleteCoupon, getBusinesses, saveBusiness } from '../services/dataService';
import { 
  Plus, Trash2, Edit, X, Ticket, Store, LayoutDashboard, 
  Loader2, Star, Eye, MessageCircle, 
  Settings, Camera, MapPin, Instagram, 
  Globe, Utensils, Image as ImageIcon,
  ChevronLeft, AlertCircle, Save, List as ListIcon
} from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';

export const AdminDashboard: React.FC<{ currentUser: User; onNavigate: (page: string, params?: any) => void; onLogout: () => void }> = ({ currentUser, onNavigate, onLogout }) => {
  const [view, setView] = useState<'HOME' | 'COUPONS' | 'PROFILE' | 'GALLERY' | 'MENU'>('HOME');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [myBusiness, setMyBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingCoupon, setIsEditingCoupon] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon>>({});

  useEffect(() => {
    refreshData();
  }, [currentUser]);

  const refreshData = async () => {
    setLoading(true);
    try {
        const allCoupons = await getCoupons();
        const myCoupons = allCoupons.filter(c => c.companyId === currentUser.id);
        setCoupons(myCoupons);

        const businesses = getBusinesses();
        const biz = businesses.find(b => b.id === currentUser.id) || 
                    businesses.find(b => b.name === currentUser.companyName);
        
        if (biz) {
            setMyBusiness({ ...biz, menu: biz.menu || [] });
        } else {
            setMyBusiness({
                id: currentUser.id,
                name: currentUser.companyName || currentUser.name,
                category: currentUser.category || 'Geral',
                description: '',
                coverImage: '',
                gallery: [],
                address: '',
                phone: currentUser.phone || '',
                amenities: [],
                openingHours: {},
                rating: 5,
                menu: []
            });
        }
    } catch (err) {
        console.error("Erro ao carregar admin:", err);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!myBusiness) return;
    setLoading(true);
    try {
      await saveBusiness(myBusiness);
      alert("Alterações salvas com sucesso!");
    } catch (err) {
      alert("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const addMenuSection = () => {
    if (!myBusiness) return;
    const newMenu = [...(myBusiness.menu || [])];
    newMenu.push({ title: 'Nova Categoria', items: [] });
    setMyBusiness({ ...myBusiness, menu: newMenu });
  };

  const addMenuItem = (sIdx: number) => {
    if (!myBusiness) return;
    const newMenu = [...(myBusiness.menu || [])];
    newMenu[sIdx].items.push({
      id: Math.random().toString(36).substring(2, 7),
      name: '',
      price: 0,
      description: ''
    });
    setMyBusiness({ ...myBusiness, menu: newMenu });
  };

  if (loading && view === 'HOME') return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-ocean-600" size={40} /></div>;

  return (
    <div className="pb-32 pt-10 px-4 max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-ocean-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Store size={32} />
              </div>
              <div>
                  <h1 className="text-2xl font-black text-ocean-950">{currentUser.companyName || currentUser.name}</h1>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Painel Administrativo</p>
              </div>
          </div>
          <div className="flex gap-3">
              <button onClick={() => onNavigate('business-detail', { businessId: currentUser.id })} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-bold text-xs"><Eye size={18} /> Ver Página</button>
              <button onClick={onLogout} className="px-6 py-3 bg-red-50 text-red-500 rounded-2xl font-bold text-xs">Sair</button>
          </div>
      </div>

      {view !== 'HOME' && (
          <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-ocean-600 font-black text-sm"><ChevronLeft size={20} /> VOLTAR AO INÍCIO</button>
      )}

      {/* HOME VIEW */}
      {view === 'HOME' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <button onClick={() => setView('MENU')} className="bg-ocean-600 text-white p-8 rounded-[2rem] shadow-xl flex flex-col items-center justify-center gap-3"><Utensils size={32} /><span className="text-xs font-black uppercase tracking-widest text-center">Configurar Cardápio</span></button>
              <button onClick={() => setView('COUPONS')} className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center gap-3"><Ticket size={32} className="text-ocean-600" /><span className="text-xs font-black uppercase text-ocean-950">Meus Cupons</span></button>
              <button onClick={() => setView('PROFILE')} className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center gap-3"><Settings size={32} className="text-ocean-600" /><span className="text-xs font-black uppercase text-ocean-950">Perfil</span></button>
              <button onClick={() => setView('GALLERY')} className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center gap-3"><Camera size={32} className="text-ocean-600" /><span className="text-xs font-black uppercase text-ocean-950">Galeria</span></button>
          </div>
      )}

      {/* MENU EDITOR */}
      {view === 'MENU' && myBusiness && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
                  <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-black text-ocean-950">Cardápio Digital</h2>
                      <button onClick={addMenuSection} className="bg-ocean-100 text-ocean-700 px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2"><Plus size={16}/> Nova Categoria</button>
                  </div>

                  <div className="space-y-8">
                      {myBusiness.menu?.map((section, sIdx) => (
                          <div key={sIdx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                              <div className="flex gap-4 mb-4">
                                  <input 
                                      className="flex-1 bg-white border-slate-200 rounded-xl px-4 py-2 font-black text-ocean-950" 
                                      value={section.title} 
                                      onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].title = e.target.value; setMyBusiness({...myBusiness, menu: m}); }} 
                                      placeholder="Ex: Bebidas, Hambúrgueres..."
                                  />
                                  <button onClick={() => { const m = [...(myBusiness.menu||[])]; m.splice(sIdx, 1); setMyBusiness({...myBusiness, menu: m}); }} className="text-red-400 hover:text-red-600"><Trash2 size={20}/></button>
                              </div>
                              <div className="space-y-3 pl-4 border-l-2 border-ocean-200">
                                  {section.items.map((item, iIdx) => (
                                      <div key={item.id} className="bg-white p-3 rounded-2xl flex flex-col md:flex-row gap-3 items-center border border-slate-100">
                                          <input className="flex-1 text-sm font-bold border-none bg-slate-50 rounded-lg p-2" placeholder="Nome do prato" value={item.name} onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].items[iIdx].name = e.target.value; setMyBusiness({...myBusiness, menu: m}); }} />
                                          <input className="w-full md:w-24 text-sm font-black text-green-600 border-none bg-slate-50 rounded-lg p-2 text-right" type="number" step="0.01" value={item.price} onChange={e => { const m = [...(myBusiness.menu||[])]; m[sIdx].items[iIdx].price = Number(e.target.value); setMyBusiness({...myBusiness, menu: m}); }} />
                                          <button onClick={() => { const m = [...(myBusiness.menu||[])]; m[sIdx].items.splice(iIdx, 1); setMyBusiness({...myBusiness, menu: m}); }} className="p-2 text-slate-300 hover:text-red-500"><X size={16}/></button>
                                      </div>
                                  ))}
                                  <button onClick={() => addMenuItem(sIdx)} className="w-full py-2 border border-dashed border-slate-300 text-slate-400 text-[10px] font-black rounded-xl hover:text-ocean-600 hover:border-ocean-300 uppercase tracking-widest">+ Adicionar Item</button>
                              </div>
                          </div>
                      ))}
                      {(!myBusiness.menu || myBusiness.menu.length === 0) && (
                          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem]"><p className="text-slate-400 font-bold">Nenhuma categoria criada.</p></div>
                      )}
                  </div>

                  <button onClick={handleSaveBusiness} className="w-full bg-ocean-600 text-white font-black py-5 rounded-3xl shadow-xl flex items-center justify-center gap-3">
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />} SALVAR CARDÁPIO DIGITAL
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};
