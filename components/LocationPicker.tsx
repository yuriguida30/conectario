import React, { useState, useRef } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

// Bounds of Arraial do Cabo (Must match MapPage logic)
const BOUNDS_NW = { lat: -22.92, lng: -42.06 };
const BOUNDS_SE = { lat: -22.98, lng: -42.00 };

export const LocationPicker: React.FC<LocationPickerProps> = ({ initialLat, initialLng, onLocationSelect }) => {
  const [marker, setMarker] = useState<{lat: number, lng: number} | null>(
      initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate percentages
      const xPercent = x / rect.width;
      const yPercent = y / rect.height;

      // Inverse projection: Map % back to Lat/Lng
      const latRange = BOUNDS_SE.lat - BOUNDS_NW.lat;
      const lngRange = BOUNDS_SE.lng - BOUNDS_NW.lng;

      const newLat = BOUNDS_NW.lat + (yPercent * latRange);
      const newLng = BOUNDS_NW.lng + (xPercent * lngRange);

      setMarker({ lat: newLat, lng: newLng });
      onLocationSelect(newLat, newLng);
  };

  const getPosition = (lat: number, lng: number) => {
      const latRange = BOUNDS_SE.lat - BOUNDS_NW.lat;
      const lngRange = BOUNDS_SE.lng - BOUNDS_NW.lng;

      const latPercent = ((lat - BOUNDS_NW.lat) / latRange) * 100;
      const lngPercent = ((lng - BOUNDS_NW.lng) / lngRange) * 100;

      return { top: `${Math.max(0, Math.min(100, latPercent))}%`, left: `${Math.max(0, Math.min(100, lngPercent))}%` };
  };

  return (
    <div className="w-full aspect-video bg-[#eef6f8] rounded-xl overflow-hidden relative cursor-crosshair border-2 border-slate-200 shadow-inner group" ref={containerRef} onClick={handleClick}>
        
        {/* Simplified Map Visualization */}
        <div className="absolute inset-0 pointer-events-none opacity-50">
            <div className="absolute top-0 left-0 w-full h-full bg-[#cbd5e1] opacity-30"></div>
            <div className="absolute top-[40%] right-0 w-[60%] h-[60%] bg-[#eef6f8] rounded-tl-[100px]"></div>
            <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-[#0ea5e9] opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }}></div>
        </div>

        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-xs text-slate-600 shadow-sm pointer-events-none z-10">
            <p className="font-bold flex items-center gap-1"><Navigation size={12}/> Definir Localização</p>
            <p>Clique no mapa onde fica sua empresa.</p>
        </div>

        {marker && (
            <div 
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-200"
                style={getPosition(marker.lat, marker.lng)}
            >
                <div className="relative">
                    <MapPin size={32} className="text-red-500 drop-shadow-lg fill-current" />
                    <div className="w-2 h-2 bg-black/20 rounded-full blur-sm absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1"></div>
                </div>
            </div>
        )}

        <div className="absolute inset-0 bg-ocean-500/0 group-hover:bg-ocean-500/5 transition-colors pointer-events-none"></div>
    </div>
  );
};