
import React, { useState, useEffect } from 'react';
import { NavBar } from './components/NavBar';
import { Home } from './pages/Home';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { SearchPage } from './pages/Search';
import { BusinessGuide } from './pages/BusinessGuide';
import { BusinessDetail } from './pages/BusinessDetail';
import { Blog } from './pages/Blog';
import { BlogDetail } from './pages/BlogDetail';
import { Collections } from './pages/Collections';
import { CollectionDetail } from './pages/CollectionDetail';
import { Login } from './pages/Login';
import { MapPage } from './pages/MapPage';
import { SubscribePage } from './pages/Subscribe';
import { getCurrentUser, logout, getAppConfig, initFirebaseData } from './services/dataService';
import { User, UserRole } from './types';

// Função auxiliar para analisar a URL atual e determinar a página
const parseUrl = (): { page: string; params: any } => {
  const path = window.location.pathname;
  
  // Rotas Dinâmicas (com ID)
  const businessMatch = path.match(/^\/business\/([^/]+)/);
  if (businessMatch) return { page: 'business-detail', params: { businessId: businessMatch[1] } };

  const blogMatch = path.match(/^\/blog\/([^/]+)/);
  if (blogMatch) return { page: 'blog-detail', params: { postId: blogMatch[1] } };

  const colMatch = path.match(/^\/collection\/([^/]+)/);
  if (colMatch) return { page: 'collection-detail', params: { collectionId: colMatch[1] } };

  // Rotas Estáticas
  switch (path) {
    case '/guide': return { page: 'guide', params: null };
    case '/search': return { page: 'search', params: null };
    case '/blog': return { page: 'blog', params: null };
    case '/collections': return { page: 'collections', params: null };
    case '/map': return { page: 'map', params: null };
    case '/subscribe': return { page: 'subscribe', params: null };
    case '/login': return { page: 'login', params: null };
    case '/user-dashboard': return { page: 'user-dashboard', params: null };
    case '/admin-dashboard': return { page: 'admin-dashboard', params: null };
    case '/super-admin-dashboard': return { page: 'super-admin-dashboard', params: null };
    default: return { page: 'home', params: null };
  }
};

// Função para construir a URL baseada na página e params
const buildUrl = (page: string, params?: any): string => {
  switch (page) {
    case 'home': return '/';
    case 'guide': return '/guide';
    case 'search': return '/search';
    case 'blog': return '/blog';
    case 'collections': return '/collections';
    case 'map': return '/map';
    case 'subscribe': return '/subscribe';
    case 'login': return '/login';
    case 'user-dashboard': return '/user-dashboard';
    case 'admin-dashboard': return '/admin-dashboard';
    case 'super-admin-dashboard': return '/super-admin-dashboard';
    case 'business-detail': return `/business/${params?.businessId}`;
    case 'blog-detail': return `/blog/${params?.postId}`;
    case 'collection-detail': return `/collection/${params?.collectionId}`;
    default: return '/';
  }
};

export default function App() {
  const [page, setPage] = useState('home');
  const [pageParams, setPageParams] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // App Config Refresh Trigger
  const [configVersion, setConfigVersion] = useState(0);

  useEffect(() => {
    // 1. Inicializa Estado base da URL
    const { page: initialPage, params: initialParams } = parseUrl();
    setPage(initialPage);
    setPageParams(initialParams);

    // 2. Listener para o botão "Voltar" do navegador (popstate)
    const handlePopState = () => {
        const { page: newPage, params: newParams } = parseUrl();
        setPage(newPage);
        setPageParams(newParams);
        window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', handlePopState);

    // 3. Inicializa Dados e Usuário
    const u = getCurrentUser();
    setUser(u);
    initFirebaseData(); 
    
    updateBranding();

    window.addEventListener('appConfigUpdated', updateBranding);
    
    const handleDataUpdate = () => {
        setUser(getCurrentUser()); 
    };
    window.addEventListener('dataUpdated', handleDataUpdate);

    setLoading(false);

    return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('appConfigUpdated', updateBranding);
        window.removeEventListener('dataUpdated', handleDataUpdate);
    }
  }, []);

  const updateBranding = () => {
      const config = getAppConfig();
      document.title = `${config.appName} ${config.appNameHighlight}`;
      
      if (config.faviconUrl) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = config.faviconUrl;
      }
      setConfigVersion(v => v + 1);
  };

  // NAVEGAÇÃO CENTRAL: Atualiza o Histórico do Navegador
  const handleNavigate = (newPage: string, params?: any) => {
      // Se for a mesma página, não faz nada
      if (page === newPage && JSON.stringify(params) === JSON.stringify(pageParams)) return;

      const url = buildUrl(newPage, params);
      
      // Push State: Adiciona nova entrada no histórico (faz o botão voltar funcionar)
      window.history.pushState({}, '', url);
      
      setPage(newPage);
      if (params) setPageParams(params);
      
      window.scrollTo(0, 0);
  };

  const handleLoginSuccess = async () => {
    const u = getCurrentUser();
    setUser(u);
    
    if (u?.role === UserRole.COMPANY) {
      handleNavigate('admin-dashboard');
    } else if (u?.role === UserRole.SUPER_ADMIN) {
      handleNavigate('super-admin-dashboard');
    } else {
      // Se estava tentando acessar algo protegido, poderia voltar pra lá, mas por padrão vai pra Home
      handleNavigate('home');
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    handleNavigate('home');
  };

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin h-8 w-8 border-4 border-ocean-500 rounded-full border-t-transparent"></div></div>;
  }

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <Home currentUser={user} onNavigate={handleNavigate} />;
      case 'guide':
        return <BusinessGuide currentUser={user} onNavigate={handleNavigate} />;
      case 'business-detail':
        return <BusinessDetail businessId={pageParams?.businessId} onNavigate={handleNavigate} />;
      case 'search':
        return <SearchPage onNavigate={handleNavigate} />;
      case 'blog':
        return <Blog onNavigate={handleNavigate} />;
      case 'blog-detail':
        return <BlogDetail postId={pageParams?.postId} onNavigate={handleNavigate} />;
      case 'collections':
        return <Collections onNavigate={handleNavigate} />;
      case 'collection-detail':
        return <CollectionDetail collectionId={pageParams?.collectionId} onNavigate={handleNavigate} />;
      case 'user-dashboard':
        return user ? <UserDashboard currentUser={user} onLogout={handleLogout} /> : <Login onLogin={handleLoginSuccess} />;
      case 'admin-dashboard':
        return user && user.role === UserRole.COMPANY ? <AdminDashboard currentUser={user} onNavigate={handleNavigate} onLogout={handleLogout} /> : <Login onLogin={handleLoginSuccess} />;
      case 'super-admin-dashboard':
        return user && user.role === UserRole.SUPER_ADMIN ? <SuperAdminDashboard currentUser={user} onNavigate={handleNavigate} onLogout={handleLogout} /> : <Login onLogin={handleLoginSuccess} />;
      case 'create-coupon': 
        return user && user.role === UserRole.COMPANY ? <AdminDashboard currentUser={user} onNavigate={handleNavigate} onLogout={handleLogout} /> : <Login onLogin={handleLoginSuccess} />;
      case 'login':
        return <Login onLogin={handleLoginSuccess} />;
      case 'map': 
         return <MapPage />;
      case 'subscribe':
         return <SubscribePage />;
      default:
        return <Home currentUser={user} onNavigate={handleNavigate} />;
    }
  };

  if (page === 'login') return renderPage();

  return (
    <div className="min-h-screen font-sans text-ocean-950 bg-slate-50 selection:bg-ocean-200">
      {page !== 'business-detail' && page !== 'blog-detail' && page !== 'collection-detail' && page !== 'map' && (
          <NavBar 
            currentUser={user} 
            onNavigate={handleNavigate} 
            currentPage={page}
            onLogout={handleLogout} 
          />
      )}
      <main className={`animate-in fade-in duration-500 ${page !== 'business-detail' && page !== 'blog-detail' && page !== 'collection-detail' && page !== 'map' ? 'md:pt-16' : ''}`}>
        {renderPage()}
      </main>
    </div>
  );
}
