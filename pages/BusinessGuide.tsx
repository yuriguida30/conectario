import React, { useState, useEffect } from 'react';
import { Search, MapPin, Filter, Star, Clock, Check, Heart, Navigation, Loader2 } from 'lucide-react';
import { BusinessProfile, AppCategory, AppLocation, AppAmenity, User } from '../types';
import { getBusinesses, getCategories, getLocations, getAmenities, toggleFavorite, calculateDistance } from '../services/dataService';

interface BusinessGuideProps {
  currentUser: User | null;
  onNavigate: (page: string, params?: any) => void;
}

export const BusinessGuide: React.FC<BusinessGuideProps> = ({ currentUser, onNavigate }) => {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [filtered, setFiltered] = useState<BusinessProfile[]>([]);
  
  // Config Data
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [locations, setLocations] = useState<AppLocation[]>([]);
  const [amenities, setAmenities] = useState<AppAmenity[]>([]);

  // Filter States
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedLocation, setSelectedLocation] = useState('Todos');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [locating, setLocating] = useState(false);

  // Favorites state for immediate UI update
  const [favorites, setFavorites] = useState<string[]>(currentUser?.favorites?.businesses || []);

  const refreshData = () => {
    setBusinesses(getBusinesses());
    setCategories(getCategories());
    setLocations(getLocations());
    setAmenities(getAmenities());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('dataUpdated', refreshData);
    return () => window.removeEventListener('dataUpdated', refreshData);
  }, []);

  useEffect(() => {
    let result = businesses;

    // Filter by Query
    if (query) {
      result = result.filter(b => 
        b.name.toLowerCase().includes(query.toLowerCase()) || 
        b.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filter by Category
    if (selectedCategory !== 'Todos') {
      result = result.filter(b => b.category === selectedCategory);
    }

    // Filter by Location
    if (selectedLocation !== 'Todos') {
        result = result.filter(b => b.address.includes(selectedLocation) || b.locationId === selectedLocation);
    }

    // Filter by Open Now
    if (onlyOpen) {
      result = result.filter(b => b.isOpenNow);
    }

    // Filter by Amenities
    if (selectedAmenities.length > 0) {
        result = result.filter(b => {
            return selectedAmenities.every(sa => b.amenities.includes(sa));
        });
    }

    // Filter Nearby (using mocked or stored GPS)
    if (nearby) {
        const storedGps = sessionStorage.getItem('user_gps');
        if (storedGps) {
            const { lat, lng } = JSON.parse(storedGps);
            // Sort by distance and filter within 10km radius
            result = result
                .map(b => ({...b, distance: b.lat && b.lng ? calculateDistance(lat, lng, b.lat, b.lng) : 9999}))
                .filter(b => (b.distance || 0) < 10) 
                .sort((a, b) => (a.distance || 0) - (b.distance || 0));
        } else {
            // Wait for GPS activation via button if not stored
        }
    }

    setFiltered(result);
  }, [query, selectedCategory, selectedLocation, onlyOpen, selectedAmenities, nearby, businesses]);

  const toggleAmenity = (id: string) => {
      setSelectedAmenities(prev => 
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
  };

  const getAmenityLabel = (id: string) => {
      const a = amenities.find(x => x.id === id);
      return a ? a.label : id;
  }

  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!currentUser) {
          alert("Você precisa estar logado.");
          return;
      }
      
      toggleFavorite('business', id);
      
      setFavorites(prev => 
          prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
      );
  };

  const handleNearbyClick = () => {
      if (nearby) {
          setNearby(false);
          return;
      }

      const storedGps = sessionStorage.getItem('user_gps');
      if (storedGps) {
          setNearby(true);
      } else {
          setLocating(true);
          navigator.geolocation.getCurrentPosition(
              (pos) => {
                  sessionStorage.setItem('user_gps', JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
                  setLocating(false);
                  setNearby(true);
              },
              (err) => {
                  setLocating(false);
                  alert("Por favor, habilite o GPS para encontrar locais próximos.");
              }
          );
      }
  };

  return (
    <div className="pb-24 pt-4 min-h-screen bg-slate-50">
      
      {/* Header Search Engine Style */}
      <div className="px-4 mb-6 max-w-7xl mx-auto w-full">
          <h1 className="text-2xl font-bold text-ocean-950 mb-1">Guia Comercial</h1>
          <p className="text-sm text-slate-500 mb-4">Explore os melhores lugares de Arraial.</p>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              
              {/* Row 1: Text Search */}
              <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                      type="text" 
                      placeholder="O que você procura?"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-ocean-500 text-sm"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                  />
              </div>

              {/* Row 2: Dropdowns */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Categoria</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-ocean-500 text-sm text-slate-700"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                          <option value="Todos">Todas Categorias</option>
                          {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Local</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-ocean-500 text-sm text-slate-700"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                      >
                          <option value="Todos">Toda a Região</option>
                          {locations.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
                      </select>
                  </div>
              </div>

              {/* Row 3: Quick Toggles */}
              <div className="flex gap-2 mb-4">
                  <button 
                    onClick={handleNearbyClick}
                    disabled={locating}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 transition-colors ${nearby ? 'bg-ocean-100 border-ocean-200 text-ocean-700' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                      {locating ? <Loader2 className="animate-spin" size={14}/> : <Navigation size={14}/>} 
                      {locating ? 'Localizando...' : 'Perto de Mim'}
                  </button>
                  <button 
                    onClick={() => setOnlyOpen(!onlyOpen)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 transition-colors ${onlyOpen ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                      <Clock size={14}/> Aberto Agora
                  </button>
              </div>

              {/* Row 4: Amenities Filter */}
              <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 ml-1 uppercase flex justify-between">
                      <span>Filtrar por comodidades</span>
                      {selectedAmenities.length > 0 && (
                          <button onClick={() => setSelectedAmenities([])} className="text-ocean-600 hover:underline">Limpar</button>
                      )}
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {amenities.map(amenity => {
                          const isSelected = selectedAmenities.includes(amenity.id);
                          return (
                              <button
                                key={amenity.id}
                                onClick={() => toggleAmenity(amenity.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${
                                    isSelected 
                                    ? 'bg-ocean-100 border-ocean-200 text-ocean-700' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                  {isSelected && <Check size={12} />}
                                  {amenity.label}
                              </button>
                          );
                      })}
                  </div>
              </div>

          </div>
      </div>

      {/* Results List */}
      <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {filtered.map((business: any) => {
              const isFav = favorites.includes(business.id);
              const hasDistance = nearby && business.distance !== undefined && business.distance < 9999;
              
              return (
                  <div 
                    key={business.id} 
                    onClick={() => onNavigate('business-detail', { businessId: business.id })}
                    className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full group relative"
                  >
                      <div className="h-40 w-full relative shrink-0">
                          <img src={business.coverImage} className="w-full h-full object-cover" alt={business.name} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                          {business.isOpenNow ? (
                              <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded">ABERTO</span>
                          ) : (
                              <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">FECHADO</span>
                          )}
                          
                          <button 
                            onClick={(e) => handleToggleFavorite(e, business.id)}
                            className="absolute top-2 right-2 p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-colors z-20 group/heart"
                          >
                             <Heart size={16} className={`transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-white group-hover/heart:text-red-200'}`} />
                          </button>

                          {hasDistance && (
                              <span className="absolute bottom-2 right-2 bg-ocean-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1 shadow-md">
                                  <Navigation size={10} /> {business.distance.toFixed(1)} km
                              </span>
                          )}
                      </div>
                      <div className="p-4 flex flex-col justify-between flex-1">
                          <div>
                              <div className="flex justify-between items-start">
                                  <h3 className="text-lg font-bold text-ocean-900 line-clamp-1">{business.name}</h3>
                                  <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded">
                                      <Star size={12} className="text-gold-500 fill-gold-500" />
                                      <span className="text-xs font-bold text-slate-700">{business.rating}</span>
                                  </div>
                              </div>
                              <p className="text-slate-500 text-xs mb-2">{business.category}</p>
                              <p className="text-slate-600 text-sm line-clamp-2 min-h-[2.5rem]">{business.description}</p>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-400 overflow-hidden whitespace-nowrap">
                              {business.amenities.slice(0, 3).map((am: any) => (
                                  <span key={am} className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{getAmenityLabel(am)}</span>
                              ))}
                              {business.amenities.length > 3 && <span>+{business.amenities.length - 3}</span>}
                          </div>
                      </div>
                  </div>
              );
          })}
          {filtered.length === 0 && (
              <div className="col-span-full text-center py-10 text-slate-400">
                  <p>Nenhum local encontrado com os filtros selecionados.</p>
                  {nearby && <p className="text-xs mt-2">Tente aumentar o raio ou desativar o filtro "Perto de Mim".</p>}
              </div>
          )}
      </div>

    </div>
  );
};