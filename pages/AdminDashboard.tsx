
import React, { useState, useEffect } from 'react';
import { User, Coupon, AppCategory, BusinessProfile, AppAmenity, MenuItem, MenuSection, AppLocation } from '../types';
import { getCoupons, saveCoupon, deleteCoupon, getCategories, getBusinesses, saveBusiness, getAmenities, getLocations } from '../services/dataService';
import { generateCouponDescription, suggestCouponIdea } from '../services/geminiService';
import { Plus, Trash2, Wand2, Loader2, Sparkles, QrCode, Store, Edit, Save, X, LogOut, AlertCircle, Building2, Image as ImageIcon, Clock, Utensils, Instagram, Globe, Phone, Camera, ShoppingBag, BedDouble, Layers, MapPin, Copy, AlertTriangle } from 'lucide-react';
import { LocationPicker } from '../components/LocationPicker';
import { ImageUpload } from '../components/ImageUpload';

interface AdminDashboardProps {
  currentUser: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

type EditorTab = 'BASIC' | 'MEDIA' | 'HOURS' | 'MENU' | 'LOCATION';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onNavigate, onLogout }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [amenities, setAmenities] = useState<AppAmenity[]>([]);
  const [locations, setLocations] = useState<AppLocation[]>([]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [validationCode, setValidationCode] = useState('');

  // Business Profile Editing
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>('BASIC');
  const [myBusiness, setMyBusiness] = useState<BusinessProfile | null>(null);
  const [isFirstSetup, setIsFirstSetup] = useState(false);

  // Hour Editor State
  const [tempStart, setTempStart] = useState('09:00');
  const [tempEnd, setTempEnd] = useState('18:00');
  
  // Coupon Form State
  const [formData, setFormData] = useState<Partial<Coupon>>({
    companyName: currentUser.companyName,
    companyId: currentUser.id,
    category: 'Gastronomia',
    active: true,
    discountPercentage: 0,
    imageUrl: `https://picsum.photos/400/300?random=${Date.now()}`
  });

  const canCreateCoupons = currentUser.permissions?.canCreateCoupons ?? true;
  const canManageBusiness = currentUser.permissions?.canManageBusiness ?? true;
  const maxCoupons = currentUser.maxCoupons ?? 10;
  const activeCouponCount = coupons.length; 
  const reachedLimit = activeCouponCount >= maxCoupons;

  const refreshAll = async () => {
    setLoadingData(true);
    const allCoupons = await getCoupons();
    setCoupons(allCoupons.filter(c => c.companyId === currentUser.id));
    
    setCategories(getCategories());
    setAmenities(getAmenities());
    setLocations(getLocations());
    
    const allBiz = getBusinesses();
    const mine = allBiz.find(b => b.id === currentUser.id) || null;
    setMyBusiness(mine);
    
    setLoadingData(false);
  };

  useEffect(() => {
    refreshAll();
    window.addEventListener('dataUpdated', refreshAll);
    return () => window.removeEventListener('dataUpdated', refreshAll);
  }, [currentUser.id]);


  const handleValidate = (e: React.FormEvent) => {
      e.preventDefault();
      if (validationCode.length > 5) {
          alert(`Cupom ${validationCode} validado com sucesso!`);
          setValidationCode('');
      } else {
          alert("Código inválido.");
      }
  };

  const handleStartBusinessSetup = () => {
      setMyBusiness({
          id: currentUser.id,
          name: currentUser.companyName || currentUser.name,
          category: currentUser.category || 'Gastronomia',
          description: '',
          address: '',
          phone: currentUser.phone || '',
          whatsapp: currentUser.phone || '',
          coverImage: 'https://via.placeholder.com/800x600',
          gallery: [],
          amenities: [],
          openingHours: {
              'Segunda': '09:00 - 18:00',
              'Terça': '09:00 - 18:00',
              'Quarta': '09:00 - 18:00',
              'Quinta': '09:00 - 18:00',
              'Sexta': '09:00 - 18:00',
              'Sábado': '09:00 - 14:00',
              'Domingo': 'Fechado'
          },
          menu: [],
          rating: 5.0,
          lat: -22.9691,
          lng: -42.0232
      });
      setIsFirstSetup(true);
      setShowEditProfile(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
      e.preventDefault();
      if (myBusiness) {
          if (!myBusiness.lat || !myBusiness.lng) {
              alert("Por favor, defina a localização no mapa na aba 'Mapa & GPS'.");
              setEditorTab('LOCATION');
              return;
          }
          saveBusiness(myBusiness);
          setShowEditProfile(false);
          setIsFirstSetup(false);
          alert('Perfil atualizado com sucesso!');
      }
  };

  const addMenuSection = () => {
      if(!myBusiness) return;
      const newSection: MenuSection = { title: 'Nova Seção', items: [] };
      setMyBusiness({ ...myBusiness, menu: [...(myBusiness.menu || []), newSection] });
  };

  const updateSectionTitle = (index: number, title: string) => {
      if(!myBusiness || !myBusiness.menu) return;
      const newMenu = [...myBusiness.menu];
      newMenu[index].title = title;
      setMyBusiness({ ...myBusiness, menu: newMenu });
  };

  const removeSection = (index: number) => {
      if(!myBusiness || !myBusiness.menu) return;
      if(!confirm('Remover seção?')) return;
      const newMenu = [...myBusiness.menu];
      newMenu.splice(index, 1);
      setMyBusiness({ ...myBusiness, menu: newMenu });
  };

  const addMenuItem = (sectionIndex: number) => {
      if(!myBusiness || !myBusiness.menu) return;
      const newMenu = [...myBusiness.menu];
      newMenu[sectionIndex].items.push({ name: 'Novo Item', price: 0 });
      setMyBusiness({ ...myBusiness, menu: newMenu });
  };

  const updateMenuItem = (sectionIndex: number, itemIndex: number, field: keyof MenuItem, value: any) => {
      if(!myBusiness || !myBusiness.menu) return;
      const newMenu = [...myBusiness.menu];
      newMenu[sectionIndex].items[itemIndex] = { ...newMenu[sectionIndex].items[itemIndex], [field]: value };
      setMyBusiness({ ...myBusiness, menu: newMenu });
  };

  const removeMenuItem = (sectionIndex: number, itemIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      if(!myBusiness || !myBusiness.menu) return;
      const newMenu = JSON.parse(JSON.stringify(myBusiness.menu));
      newMenu[sectionIndex].items.splice(itemIndex, 1);
      setMyBusiness({ ...myBusiness, menu: newMenu });
  };

  // Improved Logic: Accepts batch of images
  const addGalleryImages = (newImages: string[]) => {
      if(!myBusiness) return;
      
      const currentCount = myBusiness.gallery.length;
      const availableSlots = 7 - currentCount;
      
      if (availableSlots <= 0) {
          alert("Limite de 7 fotos atingido. Remova algumas para adicionar novas.");
          return;
      }

      let imagesToAdd = newImages;
      if (newImages.length > availableSlots) {
          alert(`Você selecionou ${newImages.length} fotos, mas só há espaço para ${availableSlots}. Adicionando as primeiras ${availableSlots}.`);
          imagesToAdd = newImages.slice(0, availableSlots);
      }

      setMyBusiness(prev => {
          if (!prev) return null;
          return {
              ...prev,
              gallery: [...prev.gallery, ...imagesToAdd]
          };
      });
  };
  
  const removeGalleryImage = (index: number) => {
      setMyBusiness(prev => {
          if (!prev) return null;
          const newGallery = [...(prev.gallery || [])];
          newGallery.splice(index, 1);
          return { ...prev, gallery: newGallery };
      });
  };

  // --- IMPROVED HOURS HELPER ---
  const updateHours = (day: string, value: string) => {
      if(!myBusiness) return;
      setMyBusiness({ 
          ...myBusiness, 
          openingHours: { ...myBusiness.openingHours, [day]: value } 
      });
  };

  const applyHoursToAll = () => {
      if (!myBusiness) return;
      const newHours = { ...myBusiness.openingHours };
      const commonDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
      commonDays.forEach(d => {
          newHours[d] = `${tempStart} - ${tempEnd}`;
      });
      setMyBusiness({ ...myBusiness, openingHours: newHours });
      alert(`Horário ${tempStart} - ${tempEnd} aplicado de Seg a Sex!`);
  };

  const toggleDayClosed = (day: string) => {
      if (!myBusiness) return;
      const current = myBusiness.openingHours[day];
      const newVal = current === 'Fechado' ? '09:00 - 18:00' : 'Fechado';
      updateHours(day, newVal);
  };

  const toggleAmenity = (id: string) => {
      if (!myBusiness) return;
      const current = myBusiness.amenities || [];
      const newAmenities = current.includes(id) 
        ? current.filter(x => x !== id) : [...current, id];
      setMyBusiness({ ...myBusiness, amenities: newAmenities });
  };

  const handleLocationSelect = (lat: number, lng: number) => {
      if (!myBusiness) return;
      setMyBusiness({ ...myBusiness, lat, lng });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.originalPrice || !formData.discountedPrice) return;
    const newCoupon: Coupon = {
      id: Date.now().toString(),
      companyId: currentUser.id,
      companyName: currentUser.companyName || 'Minha Empresa',
      title: formData.title,
      description: formData.description || '',
      originalPrice: Number(formData.originalPrice),
      discountedPrice: Number(formData.discountedPrice),
      discountPercentage: Math.round(((Number(formData.originalPrice) - Number(formData.discountedPrice)) / Number(formData.originalPrice)) * 100),
      imageUrl: formData.imageUrl || 'https://picsum.photos/400/300',
      category: formData.category as any,
      expiryDate: formData.expiryDate || '2024-12-31',
      code: (formData.title.substring(0,3) + Math.floor(Math.random()*1000)).toUpperCase(),
      active: true,
      address: myBusiness?.address || 'Endereço da Empresa', 
      rules: ['Consumo no local']
    };
    await saveCoupon(newCoupon);
    setIsCreating(false);
    setFormData({ companyName: currentUser.companyName, companyId: currentUser.id, category: 'Gastronomia', active: true, imageUrl: `https://picsum.photos/400/300?random=${Date.now()}` });
  };

  const handleDelete = async (id: string) => {
      if(window.confirm('Tem certeza que deseja excluir este cupom?')) {
          await deleteCoupon(id);
      }
  };

  const handleGenerateDescription = async () => {
      if (!formData.title || !formData.category) {
          alert("Preencha o título e categoria primeiro!");
          return;
      }
      setLoadingAI(true);
      const desc = await generateCouponDescription(formData.title, formData.category, currentUser.companyName || 'Empresa');
      setFormData(prev => ({ ...prev, description: desc }));
      setLoadingAI(false);
  };

  const handleSuggestIdea = async () => {
      setLoadingAI(true);
      const idea = await suggestCouponIdea(formData.category || 'Gastronomia');
      setFormData(prev => ({ 
          ...prev, 
          title: idea.title,
          description: idea.description 
      }));
      setLoadingAI(false);
  }

  const getCatalogConfig = () => {
      if(!myBusiness) return { label: 'Cardápio', icon: <Utensils size={16}/>, itemLabel: 'Prato', sectionLabel: 'Categoria' };
      const cat = myBusiness.category.toLowerCase();
      
      if(cat.includes('comércio') || cat.includes('loja')) {
          return { label: 'Produtos', icon: <ShoppingBag size={16}/>, itemLabel: 'Produto', sectionLabel: 'Coleção/Tipo' };
      }
      if(cat.includes('hospedagem') || cat.includes('hotel')) {
          return { label: 'Acomodações', icon: <BedDouble size={16}/>, itemLabel: 'Quarto/Suíte', sectionLabel: 'Categoria' };
      }
      if(cat.includes('gastronomia') || cat.includes('restaurante')) {
          return { label: 'Cardápio', icon: <Utensils size={16}/>, itemLabel: 'Prato', sectionLabel: 'Seção' };
      }
      return { label: 'Catálogo', icon: <Layers size={16}/>, itemLabel: 'Item', sectionLabel: 'Grupo' };
  }

  const catalogConfig = getCatalogConfig();

  const renderProfileEditor = () => {
      if(!myBusiness) return null;
      return (
          <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto p-0 md:p-6 animate-in fade-in">
              <div className="max-w-5xl mx-auto bg-white md:rounded-3xl shadow-2xl overflow-hidden min-h-screen md:min-h-[auto] flex flex-col">
                  
                  <div className="bg-ocean-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                          <Store className="text-gold-500" /> 
                          <div>
                              <h2 className="text-xl font-bold leading-none">{isFirstSetup ? 'Criar Perfil' : 'Gerenciar Empresa'}</h2>
                              <p className="text-xs text-ocean-200 mt-1">Edite informações, {catalogConfig.label.toLowerCase()} e fotos</p>
                          </div>
                      </div>
                      <button onClick={() => setShowEditProfile(false)} className="hover:bg-white/10 p-2 rounded-full"><X/></button>
                  </div>

                  <div className="flex border-b border-slate-100 bg-slate-50 px-6 gap-1 overflow-x-auto">
                      <button onClick={() => setEditorTab('BASIC')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${editorTab === 'BASIC' ? 'border-ocean-600 text-ocean-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                          <Building2 size={16}/> Dados Básicos
                      </button>
                      <button onClick={() => setEditorTab('LOCATION')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${editorTab === 'LOCATION' ? 'border-ocean-600 text-ocean-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                          <MapPin size={16}/> Mapa & GPS
                      </button>
                      <button onClick={() => setEditorTab('MEDIA')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${editorTab === 'MEDIA' ? 'border-ocean-600 text-ocean-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                          <ImageIcon size={16}/> Mídia & Fotos
                      </button>
                      <button onClick={() => setEditorTab('HOURS')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${editorTab === 'HOURS' ? 'border-ocean-600 text-ocean-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                          <Clock size={16}/> Horários
                      </button>
                      <button onClick={() => setEditorTab('MENU')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${editorTab === 'MENU' ? 'border-ocean-600 text-ocean-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                          {catalogConfig.icon} {catalogConfig.label}
                      </button>
                  </div>

                  <form onSubmit={handleSaveProfile} className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1 bg-slate-50/50">
                      
                      {editorTab === 'BASIC' && (
                          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                               <div className="grid md:grid-cols-2 gap-6">
                                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                      <h3 className="text-xs font-bold text-ocean-900 uppercase mb-2">Informações Principais</h3>
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Empresa</label>
                                          <input type="text" className="w-full border rounded-lg p-2.5 bg-slate-50" value={myBusiness.name} onChange={e => setMyBusiness({...myBusiness!, name: e.target.value})} />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                                          <select 
                                            className="w-full border rounded-lg p-2.5 bg-slate-50" 
                                            value={myBusiness.category} 
                                            onChange={e => setMyBusiness({...myBusiness!, category: e.target.value})}
                                          >
                                              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                          </select>
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Localidade / Bairro</label>
                                          <select 
                                            className="w-full border rounded-lg p-2.5 bg-slate-50" 
                                            value={myBusiness.locationId || ''} 
                                            onChange={e => setMyBusiness({...myBusiness!, locationId: e.target.value})}
                                          >
                                              <option value="">Selecione...</option>
                                              {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                                          </select>
                                      </div>
                                      <div>
                                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                                           <textarea className="w-full border rounded-lg p-2.5 bg-slate-50" rows={4} value={myBusiness.description} onChange={e => setMyBusiness({...myBusiness!, description: e.target.value})} />
                                      </div>
                                  </div>

                                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                      <h3 className="text-xs font-bold text-ocean-900 uppercase mb-2">Contato</h3>
                                      <div className="grid grid-cols-2 gap-3">
                                          <div>
                                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Phone size={12}/> Telefone</label>
                                              <input type="text" className="w-full border rounded-lg p-2.5 bg-slate-50" value={myBusiness.phone} onChange={e => setMyBusiness({...myBusiness!, phone: e.target.value})} />
                                          </div>
                                          <div>
                                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Phone size={12}/> WhatsApp</label>
                                              <input type="text" className="w-full border rounded-lg p-2.5 bg-slate-50" value={myBusiness.whatsapp || ''} onChange={e => setMyBusiness({...myBusiness!, whatsapp: e.target.value})} placeholder="Apenas números" />
                                          </div>
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Instagram size={12}/> Instagram</label>
                                          <input type="text" className="w-full border rounded-lg p-2.5 bg-slate-50" value={myBusiness.instagram || ''} onChange={e => setMyBusiness({...myBusiness!, instagram: e.target.value})} placeholder="@seu.perfil" />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Globe size={12}/> Site</label>
                                          <input type="text" className="w-full border rounded-lg p-2.5 bg-slate-50" value={myBusiness.website || ''} onChange={e => setMyBusiness({...myBusiness!, website: e.target.value})} placeholder="www.seusite.com.br" />
                                      </div>
                                  </div>
                               </div>

                               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Comodidades</label>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                      {amenities.map(am => (
                                          <label key={am.id} className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-lg border border-slate-100 hover:border-ocean-200">
                                              <input 
                                                type="checkbox" 
                                                className="rounded text-ocean-600 focus:ring-ocean-500 w-4 h-4"
                                                checked={myBusiness!.amenities?.includes(am.id) || false}
                                                onChange={() => toggleAmenity(am.id)}
                                              />
                                              <span className="text-sm text-slate-700">{am.label}</span>
                                          </label>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      )}

                      {editorTab === 'LOCATION' && (
                          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                  <div className="flex justify-between items-start mb-4">
                                      <div>
                                          <h3 className="text-xs font-bold text-ocean-900 uppercase flex items-center gap-2"><MapPin size={14}/> Localização Exata</h3>
                                          <p className="text-xs text-slate-500 mt-1">Clique no mapa abaixo para marcar onde sua empresa fica.</p>
                                      </div>
                                      {myBusiness.lat && myBusiness.lng && (
                                          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold">
                                              GPS Definido
                                          </div>
                                      )}
                                  </div>
                                  
                                  <div className="grid md:grid-cols-3 gap-6">
                                      <div className="md:col-span-2">
                                          <LocationPicker 
                                              initialLat={myBusiness.lat} 
                                              initialLng={myBusiness.lng} 
                                              onLocationSelect={handleLocationSelect} 
                                          />
                                      </div>
                                      <div className="space-y-4">
                                          <div>
                                               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Endereço por Extenso</label>
                                               <textarea className="w-full border rounded-lg p-2.5 bg-slate-50 text-sm" rows={4} value={myBusiness.address} onChange={e => setMyBusiness({...myBusiness!, address: e.target.value})} placeholder="Rua, Número, Bairro..." />
                                          </div>
                                          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-100">
                                              <strong>Lat:</strong> {myBusiness.lat?.toFixed(5) || 'Não definida'} <br/>
                                              <strong>Lng:</strong> {myBusiness.lng?.toFixed(5) || 'Não definida'}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {editorTab === 'MEDIA' && (
                          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                  <h3 className="text-xs font-bold text-ocean-900 uppercase mb-4 flex items-center gap-2"><Camera size={14}/> Foto de Destaque</h3>
                                  <div className="grid md:grid-cols-2 gap-6">
                                      <ImageUpload 
                                          currentImage={myBusiness.coverImage} 
                                          onImageSelect={(base64) => setMyBusiness({...myBusiness!, coverImage: base64})}
                                          label="Upload da Capa (16:9)"
                                      />
                                      <div>
                                          <p className="text-xs text-slate-400 mt-6">A foto de destaque é a primeira coisa que os clientes veem. Formato horizontal (16:9) funciona melhor.</p>
                                      </div>
                                  </div>
                              </div>

                              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                  <div className="flex justify-between items-center mb-4">
                                      <h3 className="text-xs font-bold text-ocean-900 uppercase flex items-center gap-2"><ImageIcon size={14}/> Galeria de Fotos</h3>
                                      <span className="text-xs font-bold bg-ocean-50 text-ocean-600 px-2 py-1 rounded-full">{myBusiness.gallery.length}/7 fotos</span>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {myBusiness.gallery.map((img, idx) => (
                                          <div key={idx} className="relative group">
                                              <div className="w-full aspect-square rounded-xl overflow-hidden border border-slate-200">
                                                  <img src={img} className="w-full h-full object-cover" />
                                              </div>
                                              <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <Trash2 size={12}/>
                                              </button>
                                          </div>
                                      ))}
                                      
                                      {/* Add Button - only shows if less than 7 images */}
                                      {myBusiness.gallery.length < 7 && (
                                          <div className="aspect-square">
                                              <ImageUpload 
                                                  onBatchSelect={addGalleryImages}
                                                  allowMultiple={true}
                                                  label={myBusiness.gallery.length === 0 ? "Adicionar Fotos" : "Mais Fotos"}
                                                  className="h-full"
                                              />
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                      )}

                      {editorTab === 'HOURS' && (
                          <div className="animate-in slide-in-from-right-4 duration-300">
                              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-4xl mx-auto">
                                  <div className="flex justify-between items-center mb-6">
                                      <h3 className="text-xs font-bold text-ocean-900 uppercase flex items-center gap-2"><Clock size={14}/> Horário de Funcionamento</h3>
                                  </div>

                                  <div className="mb-6 p-4 bg-ocean-50 rounded-xl flex flex-col md:flex-row gap-4 items-end border border-ocean-100">
                                      <div className="flex-1">
                                          <label className="block text-xs font-bold text-slate-500 mb-1">Abertura Padrão</label>
                                          <input type="time" value={tempStart} onChange={e => setTempStart(e.target.value)} className="border p-2 rounded-lg w-full text-sm" />
                                      </div>
                                      <div className="flex-1">
                                          <label className="block text-xs font-bold text-slate-500 mb-1">Fechamento Padrão</label>
                                          <input type="time" value={tempEnd} onChange={e => setTempEnd(e.target.value)} className="border p-2 rounded-lg w-full text-sm" />
                                      </div>
                                      <button type="button" onClick={applyHoursToAll} className="bg-ocean-600 text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-md hover:bg-ocean-700">
                                          <Copy size={16}/> Aplicar de Seg a Sex
                                      </button>
                                  </div>

                                  <div className="space-y-4">
                                      {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo', 'Feriados'].map(day => {
                                          const currentVal = myBusiness.openingHours[day] || 'Fechado';
                                          const isClosed = currentVal === 'Fechado';
                                          const parts = !isClosed ? currentVal.split(' - ') : [tempStart, tempEnd];
                                          
                                          return (
                                              <div key={day} className="flex flex-col md:flex-row items-center gap-4 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                                                  <span className="text-sm font-bold text-slate-700 w-24">{day}</span>
                                                  
                                                  <div className="flex-1 flex gap-2 items-center w-full">
                                                      <div className={`flex-1 flex gap-2 transition-opacity ${isClosed ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                                          <input 
                                                            type="time" 
                                                            className="border rounded-lg p-2 text-sm w-full"
                                                            value={parts[0]}
                                                            onChange={(e) => updateHours(day, `${e.target.value} - ${parts[1]}`)}
                                                          />
                                                          <span className="self-center text-slate-400">-</span>
                                                          <input 
                                                            type="time" 
                                                            className="border rounded-lg p-2 text-sm w-full"
                                                            value={parts[1]}
                                                            onChange={(e) => updateHours(day, `${parts[0]} - ${e.target.value}`)}
                                                          />
                                                      </div>
                                                      <button 
                                                          type="button" 
                                                          onClick={() => toggleDayClosed(day)}
                                                          className={`px-4 py-2 rounded-lg text-xs font-bold w-32 transition-colors ${isClosed ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                                                      >
                                                          {isClosed ? 'FECHADO' : 'ABERTO'}
                                                      </button>
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          </div>
                      )}

                      {editorTab === 'MENU' && (
                          <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
                              <div className="flex justify-between items-center">
                                  <h3 className="text-lg font-bold text-ocean-950">Seu {catalogConfig.label} Digital</h3>
                                  <button type="button" onClick={addMenuSection} className="bg-ocean-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-ocean-700 flex items-center gap-2">
                                      <Plus size={16}/> Nova Seção
                                  </button>
                              </div>

                              {myBusiness.menu?.map((section, sIdx) => (
                                  <div key={sIdx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                      <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-4">
                                          <input 
                                            type="text" 
                                            className="flex-1 bg-transparent font-bold text-ocean-900 text-lg outline-none placeholder:text-slate-400"
                                            value={section.title}
                                            onChange={e => updateSectionTitle(sIdx, e.target.value)}
                                            placeholder={`Nome da ${catalogConfig.sectionLabel}`}
                                          />
                                          <button type="button" onClick={() => removeSection(sIdx)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                                      </div>
                                      
                                      <div className="p-4 space-y-4">
                                          {section.items.map((item, iIdx) => (
                                              <div key={iIdx} className="flex gap-4 items-start p-3 rounded-xl border border-slate-100 hover:border-ocean-100 transition-colors bg-white">
                                                  <div className="w-20 h-20 shrink-0">
                                                      <ImageUpload 
                                                          currentImage={item.imageUrl}
                                                          onImageSelect={(val) => updateMenuItem(sIdx, iIdx, 'imageUrl', val)}
                                                          className="h-full"
                                                          label=""
                                                      />
                                                  </div>
                                                  <div className="flex-1 space-y-2">
                                                      <div className="flex gap-2">
                                                          <input 
                                                            type="text" 
                                                            className="flex-1 border border-slate-200 rounded p-1.5 text-sm font-bold"
                                                            value={item.name}
                                                            onChange={e => updateMenuItem(sIdx, iIdx, 'name', e.target.value)}
                                                            placeholder={`Nome`}
                                                          />
                                                          <input 
                                                            type="number" 
                                                            className="w-24 border border-slate-200 rounded p-1.5 text-sm font-bold text-right"
                                                            value={item.price || ''}
                                                            onChange={e => updateMenuItem(sIdx, iIdx, 'price', parseFloat(e.target.value))}
                                                            placeholder="R$ 0,00"
                                                          />
                                                      </div>
                                                      <input 
                                                            type="text" 
                                                            className="w-full border border-slate-200 rounded p-1.5 text-xs text-slate-600"
                                                            value={item.description || ''}
                                                            onChange={e => updateMenuItem(sIdx, iIdx, 'description', e.target.value)}
                                                            placeholder="Descrição..."
                                                      />
                                                  </div>
                                                  <button type="button" onClick={(e) => removeMenuItem(sIdx, iIdx, e)} className="text-slate-300 hover:text-red-400"><X size={16}/></button>
                                              </div>
                                          ))}
                                          <button type="button" onClick={() => addMenuItem(sIdx)} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-bold hover:border-ocean-300 hover:text-ocean-600 transition-colors">
                                              + Adicionar {catalogConfig.itemLabel}
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                      
                  </form>

                  <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
                      <button type="button" onClick={() => setShowEditProfile(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
                      <button type="button" onClick={handleSaveProfile} className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg flex items-center gap-2">
                          <Save size={20}/> Salvar Tudo
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // ... (keep existing render logic for dashboard)
  // Reusing existing return logic structure...
  return (
    <div className="pb-24 pt-8 md:pt-24 px-4 max-w-7xl mx-auto">
      {/* ... Header and Action Bar ... */}
      <div className="flex justify-between items-center mb-8">
          <div>
             <h1 className="text-2xl font-bold text-slate-900">{currentUser.companyName}</h1>
             <p className="text-slate-500 text-sm">Painel da Empresa</p>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-red-500 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors font-medium text-sm"
          >
              <LogOut size={16} /> Sair
          </button>
      </div>

       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Meus Cupons 
            <span className={`text-xs px-2 py-0.5 rounded-full ${reachedLimit ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                {activeCouponCount} / {maxCoupons}
            </span>
        </h2>
        
        <div className="flex gap-2 w-full md:w-auto">
            {canManageBusiness && (
                <button 
                  onClick={() => { 
                      if (myBusiness) {
                          setShowEditProfile(true); 
                          setEditorTab('BASIC'); 
                      } else {
                          handleStartBusinessSetup();
                      }
                  }}
                  className={`border px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors flex-1 md:flex-none justify-center ${myBusiness ? 'bg-white text-ocean-600 border-ocean-100 hover:bg-ocean-50' : 'bg-ocean-600 text-white border-ocean-600 hover:bg-ocean-700 animate-pulse'}`}
                >
                  {myBusiness ? <Edit size={18} /> : <Store size={18} />}
                  <span>{myBusiness ? 'Gerenciar Perfil' : 'Criar Página da Empresa'}</span>
                </button>
            )}
            
            {canCreateCoupons ? (
                <button 
                  onClick={() => setIsCreating(true)}
                  disabled={reachedLimit}
                  className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-md transition-all flex-1 md:flex-none justify-center ${
                      reachedLimit 
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                      : 'bg-ocean-500 hover:bg-ocean-600 text-white shadow-ocean-500/20'
                  }`}
                >
                  <Plus size={20} />
                  <span>Novo Cupom</span>
                </button>
            ) : (
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                    <AlertCircle size={16} /> Criação de cupons desativada
                </div>
            )}
        </div>
      </div>

      {!myBusiness && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 shrink-0" size={24} />
              <div>
                  <h4 className="font-bold text-yellow-800">Sua empresa ainda não está visível!</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                      Você precisa criar o perfil da sua empresa para que ela apareça no Guia e para que seus cupons mostrem sua logo e endereço corretamente.
                      Clique em <strong>Criar Página da Empresa</strong> acima.
                  </p>
              </div>
          </div>
      )}

      {loadingData ? (
          <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-ocean-500" />
          </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map(coupon => (
          <div key={coupon.id} className="relative group">
            <div className="opacity-100 group-hover:opacity-95 transition-opacity pointer-events-none">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                    <div className="h-32 bg-slate-200 relative">
                        <img src={coupon.imageUrl} className="w-full h-full object-cover" alt="" />
                        <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-ocean-600">
                            {coupon.active ? 'Ativo' : 'Inativo'}
                        </div>
                    </div>
                    <div className="p-4">
                        <h4 className="font-bold text-slate-800">{coupon.title}</h4>
                        <div className="flex justify-between items-center mt-2">
                             <span className="text-green-600 font-bold">R$ {coupon.discountedPrice}</span>
                             <span className="text-xs text-slate-400">{new Date(coupon.expiryDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center pointer-events-auto">
                             <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">{coupon.code}</span>
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(coupon.id); }}
                                className="text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                             >
                                <Trash2 size={18} />
                             </button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        ))}
        {coupons.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500 mb-4">Você ainda não tem cupons ativos.</p>
                {canCreateCoupons && (
                    <button 
                      onClick={() => setIsCreating(true)}
                      className="text-ocean-600 font-bold hover:underline"
                    >
                        Criar primeiro cupom
                    </button>
                )}
            </div>
        )}
      </div>
      )}
      
      {showEditProfile && renderProfileEditor()}

      {isCreating && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm overflow-y-auto p-4 md:p-8 animate-in fade-in">
           <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-8 relative">
              <button onClick={() => setIsCreating(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X/></button>
              <h2 className="text-2xl font-bold mb-6 text-ocean-950">Criar Novo Cupom</h2>
              <form onSubmit={handleCreate} className="space-y-6">
                 {/* ... (Existing Coupon Form Logic, minimal changes needed here) ... */}
                 {/* ... Just wrapping it nicely ... */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Categoria</label>
                        <select className="w-full border rounded-lg p-3 bg-slate-50" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Localidade</label>
                          <select className="w-full border rounded-lg p-3 bg-slate-50" onChange={() => {}}>
                              <option value="">Usar endereço da empresa</option>
                              {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                          </select>
                      </div>
                  </div>
                  <ImageUpload currentImage={formData.imageUrl} onImageSelect={(b) => setFormData({...formData, imageUrl: b})} label="Imagem da Oferta" />
                  <div>
                      <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Título</label>
                      <input required type="text" className="w-full border rounded-lg p-3" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-bold text-slate-500 uppercase">Descrição</label>
                        <button type="button" onClick={handleGenerateDescription} disabled={loadingAI || !formData.title} className="text-xs text-ocean-600 font-bold flex items-center gap-1">
                            {loadingAI ? <Loader2 className="animate-spin" size={12}/> : <Wand2 size={12}/>} Melhorar com IA
                        </button>
                    </div>
                    <textarea required rows={3} className="w-full border rounded-lg p-3" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Preço Original</label>
                      <input required type="number" step="0.01" className="w-full border rounded-lg p-3" value={formData.originalPrice || ''} onChange={e => setFormData({...formData, originalPrice: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Preço Promocional</label>
                      <input required type="number" step="0.01" className="w-full border rounded-lg p-3" value={formData.discountedPrice || ''} onChange={e => setFormData({...formData, discountedPrice: parseFloat(e.target.value)})} />
                    </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Validade</label>
                      <input required type="date" className="w-full border rounded-lg p-3" value={formData.expiryDate || ''} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
                      <button type="submit" className="flex-1 bg-ocean-600 text-white font-bold py-3 rounded-xl hover:bg-ocean-700 shadow-lg">Publicar Oferta</button>
                  </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};
