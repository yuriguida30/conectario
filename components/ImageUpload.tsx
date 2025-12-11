
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

  // Função para comprimir a imagem
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Redimensiona para no máximo 1000px de largura mantendo a proporção
          const MAX_WIDTH = 1000;
          const scaleSize = MAX_WIDTH / img.width;
          const width = (img.width > MAX_WIDTH) ? MAX_WIDTH : img.width;
          const height = (img.width > MAX_WIDTH) ? img.height * scaleSize : img.height;

          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Converte para JPEG com qualidade 70% para ficar leve
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Aumentamos o limite de verificação inicial, pois vamos comprimir depois
    if (file.size > 10 * 1024 * 1024) { // 10MB
        alert("A imagem é muito grande. Tente uma imagem menor que 10MB.");
        return;
    }

    setLoading(true);
    try {
        const compressedBase64 = await compressImage(file);
        onImageSelect(compressedBase64);
    } catch (error) {
        console.error("Erro ao processar imagem:", error);
        alert("Erro ao processar a imagem. Tente outra.");
    } finally {
        setLoading(false);
    }
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
                    <span className="text-xs font-medium">Otimizando foto...</span>
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
                <div className="flex flex-col items-center text-slate-400 group-hover:text-ocean-500 transition-colors px-4 text-center">
                    <ImageIcon size={32} className="mb-2" />
                    <span className="text-sm font-bold">Clique para enviar foto</span>
                    <span className="text-[10px] opacity-70 mt-1">Aceitamos qualquer tamanho (Otimizamos autom.)</span>
                </div>
            )}
        </div>
    </div>
  );
};
