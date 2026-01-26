
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Clock, Check, Heart, Navigation, Loader2, Crown, Compass, Map as MapIcon, X, ChevronDown, ListFilter } from 'lucide-react';
import { BusinessProfile, AppCategory, AppLocation, AppAmenity, User } from '../types';
import { getBusinesses, getCategories, getLocations, getAmenities, toggleFavorite, calculateDistance } from '../services/dataService';

interface BusinessGuideProps {
  currentUser: User | null;
  onNavigate: (page: string, params?: any) => void;
}

const GuideSplash = () => (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center animate-in fade-in duration-200">
        <div className="relative mb-8 text-center">
            <div className="absolute inset-0 bg-ocean-200 rounded-full animate-ping opacity-20 duration-1000"></div>
            <div className="relative w-24 h-24 bg-white rounded-3xl shadow-xl border-4 border-ocean-50 flex items-center justify-center mx-auto">
                <Compass size={48} className="text-ocean-600 animate-[spin_4s_linear_infinite]" />
            </div>
            <h2 className="text-xl font-bold text-ocean-950 mt-6 animate-pulse">Explorando o Rio...</h2>
            <p className="text-slate-400 text-xs mt-2 font-medium">Sincronizando guia comercial</p>
        </div>
    </div>
);

export const BusinessGuide: React.FC<BusinessGuideProps> = ({ currentUser, onNavigate }) => {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [filtered, setFiltered] = useState<BusinessProfile[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [locations, setLocations] = useState<AppLocation[]>([]);
  const [amenities, setAmenities] = useState<AppAmenity[]>([]);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Todos'); 
  const [selectedLocation, setSelectedLocation] = useState('Todos');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [locating, setLocating] = useState(false);

  const [favorites, setFavorites] = useState<string[]>(currentUser?.favorites?.businesses || []);

  const syncData = () => {
    const biz = getBusinesses();
    setBusinesses(biz);
    setCategories(getCategories());
    setLocations(getLocations());
    setAmenities(getAmenities());
    setIsLoadingDB(false);
  };

  useEffect(() => {
    syncData();
    window.addEventListener('dataUpdated', syncData);
    const timer = setTimeout(() => setIsLoadingDB(false), 4000);
    return () => {
        window.removeEventListener('dataUpdated', syncData);
        clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let result = [...businesses];

    // FIX: Protective check for name/description to avoid toLowerCase crash
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(b => 
        (b.name || '').toLowerCase().includes(q) || 
        (b.description || '').toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'Todos') result = result.filter(b => b.category === selectedCategory);
    if (selectedSubCategory !== 'Todos') result = result.filter(b => b.subcategory === selectedSubCategory);
    if (selectedLocation !== 'Todos') result = result.filter(b => b.locationId === selectedLocation || (b.address || '').includes(selectedLocation));
    if (onlyOpen) result = result.filter(b => b.isOpenNow);
    
    if (selectedAmenities && selectedAmenities.length > 0) {
        result = result.filter(b => selectedAmenities.every(sa => (b.amenities || []).includes(sa)));
    }

    if (nearby) {
        const storedGps = sessionStorage.getItem('user_gps');
        if (storedGps) {
            const { lat, lng } = JSON.parse(storedGps);
            result = result
                .map(b => ({...b, distance: calculateDistance(lat, lng, b.lat || 0, b.lng || 0)}))
                .filter(b => (b.distance || 0) < 15) 
                .sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }
    } else {
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || (b.reviewCount || 0) - (a.reviewCount || 0));
    }

    setFiltered(result);
  }, [query, selectedCategory, selectedSubCategory, selectedLocation, onlyOpen, selectedAmenities, nearby, businesses]);

  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!currentUser) return alert("Faça login para favoritar.");
      toggleFavorite('business', id);
      setFavorites(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
  };

  const handleNearbyClick = () => {
      if (nearby) return setNearby(false);
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
          (pos) => {
              sessionStorage.setItem('user_gps', JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
              setLocating(false);
              setNearby(true);
          },
          () => { setLocating(false); alert("GPS não autorizado."); }
      );
  };

  if (isLoadingDB) return <GuideSplash />;

  const currentCategory = categories.find(c => c.name === selectedCategory);
  const currentSubcategories = currentCategory?.subcategories || [];

  return (
    <div className="pb-24 pt-4 min-h-screen bg-slate-50">
      <div className="px-4 mb-4 max-w-7xl mx-auto w-full">
          <h1 className="text-2xl font-bold text-ocean-950 mb-1">Guia Comercial</h1>
          <p className="text-sm text-slate-500 mb-4">Os melhores lugares do Rio na palma da sua mão.</p>
          
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
              <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                      type="text" placeholder="O que você procura?"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-ocean-500 text-sm"
                      value={query} onChange={(e) => setQuery(e.target.value)}
                  />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="relative">
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2.5 outline-none text-xs font-bold text-slate-600 appearance-none pr-6"
                        value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubCategory('Todos'); }}
                      >
                          <option value="Todos">Categorias</option>
                          {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>

                  <div className="relative">
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2.5 outline-none text-xs font-bold text-slate-600 appearance-none pr-6"
                        value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}
                      >
                          <option value="Todos">Bairros</option>
                          {locations.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>

                  <div className="relative">
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2.5 outline-none text-xs font-bold text-slate-600 appearance-none pr-6"
                        onChange={(e) => { if (e.target.value) { const id = e.target.value; setSelectedAmenities(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); e.target.value = ""; } }}
                      >
                          <option value="">Filtros +</option>
                          {amenities.map(am => <option key={am.id} value={am.id}>{am.label}</option>)}
                      </select>
                      <ListFilter className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
              </div>

              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 items-center">
                  <button onClick={handleNearbyClick} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 transition-colors ${nearby ? 'bg-ocean-100 border-ocean-200 text-ocean-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                      {locating ? <Loader2 className="animate-spin" size={12}/> : <Navigation size={12} className={nearby ? "fill-current" : ""}/>} Perto
                  </button>
                  <button onClick={() => setOnlyOpen(!onlyOpen)} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 transition-colors ${onlyOpen ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                      <Clock size={12}/> Aberto
                  </button>
                  {selectedAmenities.map(id => (
                      <button key={id} onClick={() => setSelectedAmenities(p => p.filter(x => x !== id))} className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ocean-600 text-white text-xs font-bold">
                          <Check size={12} /> {amenities.find(a => a.id === id)?.label || id} <X size={10} className="ml-1 opacity-60"/>
                      </button>
                  ))}
                  {currentSubcategories.map(sub => (
                      <button key={sub} onClick={() => setSelectedSubCategory(selectedSubCategory === sub ? 'Todos' : sub)} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${selectedSubCategory === sub ? 'bg-ocean-600 text-white' : 'bg-white text-slate-600'}`}>
                          {sub}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {filtered.map((business) => (
              <div key={business.id} onClick={() => onNavigate('business-detail', { businessId: business.id })} className={`bg-white rounded-xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full relative ${business.isFeatured ? 'ring-2 ring-gold-400' : 'border-slate-100'}`}>
                  {business.isFeatured && <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-gold-500 text-white text-[10px] font-bold px-3 py-1 rounded-full z-20 shadow-md">DESTAQUE</div>}
                  <div className="h-40 w-full relative">
                      <img src={business.coverImage} className="w-full h-full object-cover" alt={business.name} />
                      <button onClick={(e) => handleToggleFavorite(e, business.id)} className="absolute top-2 right-2 p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm z-20">
                         <Heart size={16} className={favorites.includes(business.id) ? 'fill-red-500 text-red-500' : 'text-white'} />
                      </button>
                      <span className={`absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold text-white ${business.isOpenNow ? 'bg-green-500' : 'bg-red-500'}`}>
                          {business.isOpenNow ? 'ABERTO' : 'FECHADO'}
                      </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-ocean-950 text-lg line-clamp-1">{business.name}</h3>
                          <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded">
                              <Star size={12} className="text-gold-500 fill-gold-500" />
                              <span className="text-xs font-bold">{business.rating}</span>
                          </div>
                      </div>
                      <p className="text-slate-400 text-xs font-medium mb-2">{business.category} • {business.locationId || 'Rio'}</p>
                      <p className="text-slate-600 text-sm line-clamp-2 mb-4">{(business.description || '').substring(0, 100)}...</p>
                      <div className="mt-auto pt-3 border-t border-slate-50 flex gap-2 overflow-hidden">
                          {(business.amenities || []).slice(0, 3).map(am => (
                              <span key={am} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md whitespace-nowrap">
                                  {amenities.find(a => a.id === am)?.label || am}
                              </span>
                          ))}
                      </div>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
