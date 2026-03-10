import React, { useState, useEffect } from 'react';
import { User, BlogPost } from '../types';
import { getBlogPosts, saveBlogPost, deleteBlogPost } from '../services/dataService';
import { Pencil, Trash2, Plus, Image as ImageIcon, Tag, Globe, Settings, FileText, CheckCircle, XCircle } from 'lucide-react';

interface JournalistDashboardProps {
  currentUser: User;
  onNavigate: (page: string, params?: any) => void;
  onLogout: () => void;
}

export function JournalistDashboard({ currentUser, onNavigate, onLogout }: JournalistDashboardProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({});
  const [activeTab, setActiveTab] = useState<'posts' | 'settings'>('posts');

  useEffect(() => {
    loadPosts();
  }, [currentUser]);

  const loadPosts = () => {
    const allPosts = getBlogPosts();
    // Filter posts by authorId if needed, or show all if they are editors
    const myPosts = allPosts.filter(p => p.authorId === currentUser.id);
    setPosts(myPosts);
  };

  const handleCreatePost = () => {
    setCurrentPost({
      title: '',
      excerpt: '',
      content: '',
      imageUrl: '',
      category: 'Dicas',
      author: currentUser.name,
      authorId: currentUser.id,
      date: new Date().toISOString().split('T')[0],
      tags: [],
      metaDescription: '',
      metaKeywords: '',
      status: 'draft'
    });
    setIsEditing(true);
  };

  const handleEditPost = (post: BlogPost) => {
    setCurrentPost({ ...post });
    setIsEditing(true);
  };

  const handleDeletePost = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta matéria?')) {
      deleteBlogPost(id);
      loadPosts();
    }
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPost.title || !currentPost.content) {
      alert('Título e conteúdo são obrigatórios.');
      return;
    }
    
    const postToSave: BlogPost = {
      id: currentPost.id || Date.now().toString(),
      title: currentPost.title || '',
      excerpt: currentPost.excerpt || '',
      content: currentPost.content || '',
      imageUrl: currentPost.imageUrl || '',
      category: currentPost.category || 'Dicas',
      date: currentPost.date || new Date().toISOString().split('T')[0],
      author: currentPost.author || currentUser.name,
      authorId: currentUser.id,
      tags: currentPost.tags || [],
      metaDescription: currentPost.metaDescription || '',
      metaKeywords: currentPost.metaKeywords || '',
      status: currentPost.status || 'draft'
    };

    saveBlogPost(postToSave);
    setIsEditing(false);
    loadPosts();
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsArray = e.target.value.split(',').map(t => t.trim()).filter(t => t !== '');
    setCurrentPost({ ...currentPost, tags: tagsArray });
  };

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentPost.id ? 'Editar Matéria' : 'Nova Matéria'}
            </h1>
            <div className="flex gap-4">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePost}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <input
                  type="text"
                  placeholder="Título da Matéria"
                  className="w-full text-3xl font-bold border-none focus:ring-0 p-0 mb-4 placeholder-gray-300"
                  value={currentPost.title || ''}
                  onChange={e => setCurrentPost({ ...currentPost, title: e.target.value })}
                />
                
                <textarea
                  placeholder="Escreva sua matéria aqui... (Suporta HTML básico)"
                  className="w-full h-96 border-none focus:ring-0 p-0 resize-none text-gray-700 leading-relaxed"
                  value={currentPost.content || ''}
                  onChange={e => setCurrentPost({ ...currentPost, content: e.target.value })}
                />
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-gray-500" />
                  SEO e Metadados
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resumo (Excerpt)</label>
                    <textarea
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      value={currentPost.excerpt || ''}
                      onChange={e => setCurrentPost({ ...currentPost, excerpt: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={currentPost.metaDescription || ''}
                      onChange={e => setCurrentPost({ ...currentPost, metaDescription: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave (separadas por vírgula)</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={currentPost.metaKeywords || ''}
                      onChange={e => setCurrentPost({ ...currentPost, metaKeywords: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Publicação</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={currentPost.status || 'draft'}
                      onChange={e => setCurrentPost({ ...currentPost, status: e.target.value as 'draft' | 'published' })}
                    >
                      <option value="draft">Rascunho</option>
                      <option value="published">Publicado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                    <input
                      type="date"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={currentPost.date || ''}
                      onChange={e => setCurrentPost({ ...currentPost, date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-gray-500" />
                  Imagem de Capa
                </h3>
                <input
                  type="text"
                  placeholder="URL da Imagem"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
                  value={currentPost.imageUrl || ''}
                  onChange={e => setCurrentPost({ ...currentPost, imageUrl: e.target.value })}
                />
                {currentPost.imageUrl && (
                  <img src={currentPost.imageUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-gray-500" />
                  Tags
                </h3>
                <input
                  type="text"
                  placeholder="Ex: gastronomia, rio, dicas"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={currentPost.tags?.join(', ') || ''}
                  onChange={handleTagsChange}
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentPost.tags?.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">Painel do Jornalista</h2>
          <p className="text-sm text-gray-500 mt-1">Olá, {currentUser.name}</p>
        </div>
        <nav className="mt-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-left ${activeTab === 'posts' ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FileText className="w-5 h-5" />
            Minhas Matérias
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-left ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Settings className="w-5 h-5" />
            Configurações
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === 'posts' ? 'Matérias' : 'Configurações'}
            </h1>
            {activeTab === 'posts' && (
              <button
                onClick={handleCreatePost}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Matéria
              </button>
            )}
          </div>

          {activeTab === 'posts' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {posts.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Nenhuma matéria encontrada</h3>
                  <p className="text-gray-500 mt-1">Comece a escrever sua primeira dica!</p>
                  <button
                    onClick={handleCreatePost}
                    className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Criar Matéria
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-4 font-medium text-gray-600">Título</th>
                      <th className="p-4 font-medium text-gray-600 hidden md:table-cell">Data</th>
                      <th className="p-4 font-medium text-gray-600">Status</th>
                      <th className="p-4 font-medium text-gray-600 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map(post => (
                      <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{post.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{post.excerpt}</div>
                        </td>
                        <td className="p-4 text-gray-600 hidden md:table-cell">
                          {new Date(post.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditPost(post)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Perfil do Jornalista</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome de Exibição</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50"
                    value={currentUser.name}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50"
                    value={currentUser.email}
                    readOnly
                  />
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Para alterar suas informações básicas, entre em contato com o administrador.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
