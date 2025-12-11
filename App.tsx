
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

export default function App() {
  const [page, setPage] = useState('home');
  const [pageParams, setPageParams] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // App Config Refresh Trigger
  const [configVersion, setConfigVersion] = useState(0);

  useEffect(() => {
    // Check for logged in user in local storage
    const u = getCurrentUser();
    setUser(u);
    initFirebaseData(); // Ensure mock data exists
    
    // Apply initial branding
    updateBranding();

    // Listen for config changes
    window.addEventListener('appConfigUpdated', updateBranding);
    
    // Listen for DATA changes (Critical for Favorites to update UI instantly)
    const handleDataUpdate = () => {
        setUser(getCurrentUser()); // Force refresh user from local storage
    };
    window.addEventListener('dataUpdated', handleDataUpdate);

    setLoading(false);

    return () => {
        window.removeEventListener('appConfigUpdated', updateBranding);
        window.removeEventListener('dataUpdated', handleDataUpdate);
    }
  }, []);

  const updateBranding = () => {
      const config = getAppConfig();
      document.title = `${config.appName} ${config.appNameHighlight}`;
      
      // Update Favicon if exists
      if (config.faviconUrl) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = config.faviconUrl;
      }
      setConfigVersion(v => v + 1); // Trigger re-render of components using config
  };

  const handleNavigate = (newPage: string, params?: any) => {
      setPage(newPage);
      if (params) setPageParams(params);
  };

  const handleLoginSuccess = async () => {
    const u = getCurrentUser();
    setUser(u);
    
    if (u?.role === UserRole.COMPANY) {
      handleNavigate('admin-dashboard');
    } else if (u?.role === UserRole.SUPER_ADMIN) {
      handleNavigate('super-admin-dashboard');
    } else {
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
