
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Share2, Clock, Check, X, Instagram, Globe, Award } from 'lucide-react';
import { BlogPost, User } from '../types';
import { getBlogPostById, getAllUsers } from '../services/dataService';

interface BlogDetailProps {
  postId: string;
  onNavigate: (page: string) => void;
}

export const BlogDetail: React.FC<BlogDetailProps> = ({ postId, onNavigate }) => {
  const [post, setPost] = useState<BlogPost | undefined>(undefined);
  const [author, setAuthor] = useState<User | undefined>(undefined);
  const [showAuthorModal, setShowAuthorModal] = useState(false);

  useEffect(() => {
    const data = getBlogPostById(postId);
    setPost(data);
    if (data?.authorId) {
        const users = getAllUsers();
        const foundAuthor = users.find(u => u.id === data.authorId);
        setAuthor(foundAuthor);
    }
  }, [postId]);

  if (!post) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <p className="text-slate-400">Carregando notícia...</p>
          </div>
      );
  }

  const handleShare = async () => {
      const shareData = {
          title: post.title,
          text: post.excerpt,
          url: window.location.href
      };
      if (navigator.share) {
          try { await navigator.share(shareData); } catch (err) {}
      } else {
          navigator.clipboard.writeText(window.location.href);
          alert("Link copiado!");
      }
  };

  return (
    <div className="bg-white min-h-screen pb-24">
        {/* Hero Header */}
        <div className="relative h-72 md:h-[50vh] w-full">
            <img src={post.imageUrl} className="w-full h-full object-cover" alt={post.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <button 
                onClick={() => onNavigate('blog')}
                className="absolute top-4 left-4 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-2 rounded-full transition-colors z-20"
            >
                <ArrowLeft size={24} />
            </button>

            <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-4xl mx-auto">
                <span className="bg-gold-500 text-ocean-950 text-xs font-bold px-3 py-1 rounded mb-4 inline-block uppercase tracking-wider">
                    {post.category}
                </span>
                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 shadow-black drop-shadow-lg">
                    {post.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-6 text-white/90 text-sm">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gold-500" />
                        <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gold-500" />
                        <span>5 min de leitura</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Content Body */}
        <div className="max-w-3xl mx-auto px-6 py-12">
            
            {/* AUTHOR MINI PROFILE - NEW FEATURE */}
            {author && (
                <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="relative">
                        <img 
                            src={author.avatarUrl || 'https://via.placeholder.com/150'} 
                            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm cursor-pointer"
                            onClick={() => setShowAuthorModal(true)}
                        />
                        {author.isPrime && (
                            <div className="absolute -bottom-1 -right-1 bg-gold-500 text-white rounded-full p-0.5 border border-white">
                                <Check size={10} strokeWidth={4} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-ocean-900 text-sm">{author.name}</h4>
                            {author.profession && (
                                <span className="text-[10px] bg-ocean-100 text-ocean-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                    {author.profession}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{author.bio || `Criador de conteúdo no ${post.category}`}</p>
                        <button 
                            onClick={() => setShowAuthorModal(true)}
                            className="text-xs font-bold text-ocean-600 hover:underline mt-1"
                        >
                            Ver perfil completo
                        </button>
                    </div>
                </div>
            )}

            <p className="text-xl text-slate-600 leading-relaxed font-medium mb-8 border-l-4 border-gold-500 pl-4">
                {post.excerpt}
            </p>

            <div className="prose prose-lg prose-slate max-w-none text-slate-800 leading-8">
                <p>{post.content}</p>
                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <h3>O que esperar?</h3>
                <p>
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                    Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                <img 
                    src={`https://images.unsplash.com/photo-1544551763-46a42a4571d0?auto=format&fit=crop&q=80&w=1200`} 
                    className="w-full rounded-2xl my-8 shadow-lg"
                    alt="Detail"
                />
                <p>
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.
                </p>
            </div>

            {/* Share Footer */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Gostou? Compartilhe:</span>
                <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 bg-ocean-50 text-ocean-600 px-4 py-2 rounded-full font-bold hover:bg-ocean-100 transition-colors"
                >
                    <Share2 size={18} /> Compartilhar
                </button>
            </div>
        </div>

        {/* AUTHOR MODAL */}
        {showAuthorModal && author && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
                    
                    {/* Cover Gradient */}
                    <div className="h-24 bg-gradient-to-r from-ocean-500 to-ocean-700 relative">
                        <button 
                            onClick={() => setShowAuthorModal(false)}
                            className="absolute top-4 right-4 bg-black/20 text-white p-1.5 rounded-full hover:bg-black/40 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Avatar & Content */}
                    <div className="px-6 pb-8 relative">
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-md -mt-12 mb-4 overflow-hidden bg-white">
                            <img src={author.avatarUrl} className="w-full h-full object-cover" />
                        </div>
                        
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-ocean-950 flex items-center gap-2">
                                {author.name}
                                {author.isPrime && <Award size={20} className="text-gold-500" fill="currentColor" />}
                            </h2>
                            <p className="text-ocean-600 font-bold text-sm uppercase tracking-wide mb-3">{author.profession || 'Criador de Conteúdo'}</p>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                {author.bio || 'Este autor ainda não adicionou uma biografia.'}
                            </p>
                        </div>

                        {/* Social Links */}
                        <div className="flex gap-3">
                            {author.instagram && (
                                <a 
                                    href={`https://instagram.com/${author.instagram.replace('@','')}`} 
                                    target="_blank"
                                    className="flex items-center gap-2 bg-pink-50 text-pink-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-100 transition-colors flex-1 justify-center"
                                >
                                    <Instagram size={18} /> Instagram
                                </a>
                            )}
                            {author.website && (
                                <a 
                                    href={author.website.startsWith('http') ? author.website : `https://${author.website}`} 
                                    target="_blank"
                                    className="flex items-center gap-2 bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors flex-1 justify-center"
                                >
                                    <Globe size={18} /> Site
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
