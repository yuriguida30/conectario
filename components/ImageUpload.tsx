import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  currentImage?: string;
  onImageSelect: (base64: string) => void;
  label?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ currentImage, onImageSelect, label = "Upload de Imagem", className = "" }) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (Limit to 1MB for local storage sanity)
    if (file.size > 1024 * 1024) {
        alert("A imagem deve ser menor que 1MB para esta demonstração.");
        return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        onImageSelect(result);
        setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      onImageSelect('');
      if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className={`w-full ${className}`}>
        {label && <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{label}</label>}
        
        <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative w-full aspect-video md:aspect-[2/1] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${currentImage ? 'border-transparent' : 'border-slate-300 hover:border-ocean-400 bg-slate-50 hover:bg-ocean-50'}`}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
            />

            {loading ? (
                <div className="flex flex-col items-center text-ocean-500">
                    <Loader2 className="animate-spin mb-2" size={24} />
                    <span className="text-xs font-medium">Processando...</span>
                </div>
            ) : currentImage ? (
                <>
                    <img src={currentImage} alt="Uploaded" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-sm font-bold flex items-center gap-2"><Upload size={16}/> Trocar Imagem</p>
                    </div>
                    <button 
                        onClick={handleRemove}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md z-10"
                        title="Remover"
                    >
                        <X size={14} />
                    </button>
                </>
            ) : (
                <div className="flex flex-col items-center text-slate-400 group-hover:text-ocean-500 transition-colors">
                    <ImageIcon size={32} className="mb-2" />
                    <span className="text-sm font-bold">Clique para enviar foto</span>
                    <span className="text-[10px] opacity-70 mt-1">Dispositivo ou Câmera (Max 1MB)</span>
                </div>
            )}
        </div>
    </div>
  );
};
