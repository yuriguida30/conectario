import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, User, Share2, Clock } from 'lucide-react';
import { BlogPost } from '../types';
import { getBlogPostById } from '../services/dataService';

interface BlogDetailProps {
  postId: string;
  onNavigate: (page: string) => void;
}

export const BlogDetail: React.FC<BlogDetailProps> = ({ postId, onNavigate }) => {
  const [post, setPost] = useState<BlogPost | undefined>(undefined);

  useEffect(() => {
    const data = getBlogPostById(postId);
    setPost(data);
  }, [postId]);

  if (!post) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <p className="text-slate-400">Carregando notícia...</p>
          </div>
      );
  }

  return (
    <div className="bg-white min-h-screen pb-24">
        {/* Hero Header */}
        <div className="relative h-72 md:h-[50vh] w-full">
            <img src={post.imageUrl} className="w-full h-full object-cover" alt={post.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <button 
                onClick={() => onNavigate('blog')}
                className="absolute top-4 left-4 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-2 rounded-full transition-colors"
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
                        <User size={16} className="text-gold-500" />
                        <span>Por <strong>{post.author}</strong></span>
                    </div>
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
            <p className="text-xl text-slate-600 leading-relaxed font-medium mb-8 border-l-4 border-gold-500 pl-4">
                {post.excerpt}
            </p>

            <div className="prose prose-lg prose-slate max-w-none text-slate-800 leading-8">
                {/* Simulating rich text content since our mock is simple text */}
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
                <button className="flex items-center gap-2 bg-ocean-50 text-ocean-600 px-4 py-2 rounded-full font-bold hover:bg-ocean-100 transition-colors">
                    <Share2 size={18} /> Compartilhar
                </button>
            </div>
        </div>
    </div>
  );
};