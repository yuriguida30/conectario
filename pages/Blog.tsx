
import React, { useState, useEffect } from 'react';
import { BlogPost, User } from '../types';
import { getBlogPosts, getAllUsers } from '../services/dataService';
import { Calendar, ChevronRight } from 'lucide-react';

interface BlogProps {
  onNavigate?: (page: string, params?: any) => void;
}

export const Blog: React.FC<BlogProps> = ({ onNavigate }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState('Todos');

  useEffect(() => {
    setPosts(getBlogPosts());
    setUsers(getAllUsers());
  }, []);

  const handlePostClick = (postId: string) => {
      if (onNavigate) {
          onNavigate('blog-detail', { postId });
      }
  };

  const categories = ['Todos', 'Roteiro', 'Dica', 'Notícia'];
  const displayPosts = filter === 'Todos' ? posts : posts.filter(p => p.category === filter);

  // Helper to find author
  const getAuthor = (authorId?: string) => {
      return users.find(u => u.id === authorId);
  }

  return (
    <div className="pb-24 pt-4 min-h-screen bg-slate-50">
        <div className="px-4 mb-6 max-w-7xl mx-auto w-full">
            <h1 className="text-2xl font-bold text-ocean-950 mb-1">Dicas & Roteiros</h1>
            <p className="text-sm text-slate-500">Descubra o melhor de Arraial com nossa curadoria.</p>
        </div>

        {/* Categories */}
        <div className="flex gap-2 px-4 overflow-x-auto hide-scrollbar mb-6 max-w-7xl mx-auto w-full">
            {categories.map(cat => (
                <button 
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filter === cat ? 'bg-ocean-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* Featured Post (First one) */}
        {filter === 'Todos' && posts.length > 0 && (
            <div className="px-4 mb-8 max-w-7xl mx-auto w-full">
                <div 
                    onClick={() => handlePostClick(posts[0].id)}
                    className="relative h-64 md:h-[400px] rounded-2xl overflow-hidden shadow-lg group cursor-pointer transition-all hover:shadow-2xl"
                >
                    <img src={posts[0].imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white md:bottom-10 md:left-10 md:max-w-2xl">
                        <span className="bg-gold-500 text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block uppercase">{posts[0].category}</span>
                        <h2 className="text-xl md:text-4xl font-bold leading-tight mb-2 group-hover:text-gold-400 transition-colors">{posts[0].title}</h2>
                        <p className="hidden md:block text-white/90 mb-4">{posts[0].excerpt}</p>
                        
                        <div className="flex items-center gap-3 text-xs opacity-90 mt-2">
                            {(() => {
                                const author = getAuthor(posts[0].authorId);
                                return (
                                    <div className="flex items-center gap-2">
                                        {author?.avatarUrl ? (
                                            <img src={author.avatarUrl} className="w-6 h-6 rounded-full border border-white/50 object-cover" alt={posts[0].author}/>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px]">{posts[0].author.charAt(0)}</div>
                                        )}
                                        <span className="font-bold">{posts[0].author}</span>
                                    </div>
                                );
                            })()}
                            <span className="flex items-center gap-1"><Calendar size={12}/> {posts[0].date}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Grid List */}
        <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {displayPosts.slice(filter === 'Todos' ? 1 : 0).map(post => {
                const author = getAuthor(post.authorId);
                return (
                    <div 
                        key={post.id} 
                        onClick={() => handlePostClick(post.id)}
                        className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-lg transition-all cursor-pointer h-full group"
                    >
                        <div className="h-48 w-full relative shrink-0 overflow-hidden">
                            <img src={post.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <span className="absolute top-2 left-2 bg-white/90 text-ocean-900 text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm uppercase">{post.category}</span>
                        </div>
                        <div className="p-4 flex flex-col justify-between flex-1">
                            <div>
                                <h3 className="font-bold text-ocean-950 mb-2 leading-tight text-lg group-hover:text-ocean-600 transition-colors">{post.title}</h3>
                                <p className="text-slate-500 text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                            </div>
                            <div className="flex justify-between items-center mt-2 border-t border-slate-50 pt-3">
                                <div className="flex items-center gap-2">
                                    {author?.avatarUrl ? (
                                        <img src={author.avatarUrl} className="w-6 h-6 rounded-full object-cover border border-slate-100" alt={post.author}/>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-ocean-100 text-ocean-600 flex items-center justify-center text-[10px] font-bold">
                                            {post.author.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-ocean-900 leading-none">{post.author}</span>
                                        <span className="text-[9px] text-slate-400">{post.date}</span>
                                    </div>
                                </div>
                                <button className="text-ocean-600 text-xs font-bold flex items-center gap-1 group-hover:underline">Ler mais <ChevronRight size={14} /></button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
