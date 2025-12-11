import React, { useState, useEffect } from 'react';
import { UserRole, AppCategory, AppConfig } from '../types';
import { login, createCompanyRequest, getCategories, getAppConfig } from '../services/dataService';
import { Building2, User, ChevronLeft, CheckCircle2, Loader2, Instagram, Globe, Phone } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER_COMPANY'>('LOGIN');
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [config, setConfig] = useState<AppConfig>(getAppConfig());
  
  // Registration Form State
  const [regForm, setRegForm] = useState({
      companyName: '',
      ownerName: '',
      email: '',
      phone: '',
      whatsapp: '',
      instagram: '',
      website: '',
      document: '',
      category: 'Gastronomia',
      description: ''
  });
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
      setCategories(getCategories());
      // Re-fetch config in case it changed
      setConfig(getAppConfig());
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!email) {
        setLoading(false);
        return;
    }

    try {
        const user = await login(email, role);
        if (user) {
            onLogin();
        } else {
            setError('Login falhou. Verifique suas credenciais.');
        }
    } catch (err) {
        setError('Erro ao conectar.');
    } finally {
        setLoading(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createCompanyRequest(regForm);
      setRequestSent(true);
  };

  if (mode === 'REGISTER_COMPANY') {
      if (requestSent) {
          return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-ocean-950 mb-2">Solicitação Enviada!</h2>
                    <p className="text-slate-600 mb-8">Nossa equipe analisará seu cadastro. Em breve entraremos em contato para finalizar sua ativação.</p>
                    <button 
                        onClick={() => { setMode('LOGIN'); setRequestSent(false); }}
                        className="w-full bg-ocean-100 text-ocean-700 font-bold py-3 rounded-xl hover:bg-ocean-200"
                    >
                        Voltar para Login
                    </button>
                </div>
            </div>
          );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12">
            <div className="w-full max-w-xl bg-white p-6 md:p-8 rounded-3xl shadow-xl">
                <button onClick={() => setMode('LOGIN')} className="flex items-center text-slate-400 hover:text-ocean-600 mb-6">
                    <ChevronLeft size={20} /> Voltar
                </button>
                
                <h2 className="text-2xl font-bold text-ocean-950 mb-1">Cadastrar Empresa</h2>
                <p className="text-slate-500 text-sm mb-6">Preencha os dados para solicitar sua entrada no {config.appName} {config.appNameHighlight}.</p>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h3 className="text-xs font-bold text-ocean-900 uppercase mb-3">Dados Principais</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nome da Empresa</label>
                                <input required className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-ocean-500" 
                                    value={regForm.companyName} onChange={e => setRegForm({...regForm, companyName: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Responsável</label>
                                    <input required className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-ocean-500" 
                                        value={regForm.ownerName} onChange={e => setRegForm({...regForm, ownerName: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">CNPJ/CPF</label>
                                    <input required className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-ocean-500" 
                                        value={regForm.document} onChange={e => setRegForm({...regForm, document: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email de Acesso</label>
                                <input type="email" required className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-ocean-500" 
                                    value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h3 className="text-xs font-bold text-ocean-900 uppercase mb-3">Contato & Redes</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Telefone</label>
                                <input type="tel" required className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-ocean-500" 
                                    value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">WhatsApp</label>
                                <input type="tel" className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-ocean-500" 
                                    placeholder="(22) 9..."
                                    value={regForm.whatsapp} onChange={e => setRegForm({...regForm, whatsapp: e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Instagram</label>
                                <div className="relative">
                                    <Instagram className="absolute left-3 top-3.5 text-slate-400" size={16}/>
                                    <input className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-ocean-500" 
                                        placeholder="@seu.perfil"
                                        value={regForm.instagram} onChange={e => setRegForm({...regForm, instagram: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Site</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3.5 text-slate-400" size={16}/>
                                    <input className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-ocean-500" 
                                        placeholder="www..."
                                        value={regForm.website} onChange={e => setRegForm({...regForm, website: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h3 className="text-xs font-bold text-ocean-900 uppercase mb-3">Detalhes</h3>
                        <div className="space-y-4">
                             <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Categoria</label>
                                <select className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-ocean-500"
                                     value={regForm.category} onChange={e => setRegForm({...regForm, category: e.target.value})}>
                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Sobre a empresa</label>
                                <textarea rows={3} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-ocean-500" placeholder="Breve descrição do que você oferece..."
                                    value={regForm.description} onChange={e => setRegForm({...regForm, description: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-gold-500 text-ocean-950 font-bold py-4 rounded-xl shadow-lg hover:bg-gold-400 mt-2">
                        ENVIAR SOLICITAÇÃO
                    </button>
                </form>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-ocean-50 rounded-full mb-6 text-ocean-500 p-4 overflow-hidden">
            {config.loginLogoUrl || config.logoUrl ? (
                <img src={config.loginLogoUrl || config.logoUrl} className="w-full h-full object-contain" />
            ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-gold-500">
                    <path d="M12 2v2" />
                    <path d="M12 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                    <path d="M2 10h20" />
                    <path d="M12 10v12" />
                    <path d="M12 22c-5 0-6-7-6-12" />
                    <path d="M12 22c5 0 6-7 6-12" />
                </svg>
            )}
          </div>
          <h1 className="text-3xl font-bold text-ocean-950 tracking-tight">{config.appName.toUpperCase()} <span className="text-gold-500">{config.appNameHighlight.toUpperCase()}</span></h1>
          <p className="text-slate-500 mt-2 text-sm">O clube de vantagens mais exclusivo da região.</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
          <button 
            onClick={() => { setRole(UserRole.CUSTOMER); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${role === UserRole.CUSTOMER ? 'bg-white text-ocean-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <User size={18} /> Cliente
          </button>
          <button 
            onClick={() => { setRole(UserRole.COMPANY); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${role === UserRole.COMPANY || role === UserRole.SUPER_ADMIN ? 'bg-white text-ocean-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Building2 size={18} /> Empresa
          </button>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">Email de Acesso</label>
            <input 
              type="email" 
              required
              placeholder={role === UserRole.CUSTOMER ? "seu@email.com" : "contato@empresa.com"}
              className="w-full px-4 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all placeholder:text-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-ocean-500 to-ocean-600 hover:to-ocean-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-ocean-500/20 transition-all active:scale-[0.98] mt-4 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "ENTRAR AGORA"}
          </button>

          {role === UserRole.COMPANY && (
              <button 
                type="button"
                onClick={() => setMode('REGISTER_COMPANY')}
                className="w-full text-ocean-600 font-bold text-sm hover:underline"
              >
                  Quero cadastrar minha empresa
              </button>
          )}

          <p className="text-xs text-center text-slate-400 mt-8">
             Obs: A senha padrão da demonstração é 'password123'
          </p>
        </form>
      </div>
    </div>
  );
};
