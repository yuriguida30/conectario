
import React, { useState, useEffect } from 'react';
import { UserRole, AppCategory, AppConfig } from '../types';
import { login, registerUser, createCompanyRequest, getCategories, getAppConfig } from '../services/dataService';
import { Building2, User, ChevronLeft, CheckCircle2, Loader2, Instagram, Globe, Phone, Mail, Lock, UserPlus, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER_USER' | 'REGISTER_COMPANY'>('LOGIN');
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register User State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [config, setConfig] = useState<AppConfig>(getAppConfig());
  
  // Company Reg Form State
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
      setConfig(getAppConfig());
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!email || !password) {
        setError('Preencha email e senha.');
        setLoading(false);
        return;
    }

    try {
        const user = await login(email, password);
        if (user) {
            onLogin();
        } else {
            setError('Login falhou. Verifique email e senha.');
        }
    } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
            setError('Email ou senha incorretos.');
        } else if (err.code === 'auth/too-many-requests') {
            setError('Muitas tentativas. Tente novamente mais tarde.');
        } else {
            setError('Erro ao conectar. Verifique sua internet.');
        }
    } finally {
        setLoading(false);
    }
  };

  const handleUserRegisterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      
      if(regPassword !== regConfirmPassword) {
          setError('As senhas não coincidem.');
          return;
      }
      if(regPassword.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres.');
          return;
      }

      setLoading(true);
      try {
          await registerUser(regName, regEmail, regPassword);
          onLogin(); 
      } catch (err: any) {
          setError(err.message || 'Erro ao criar conta.');
      } finally {
          setLoading(false);
      }
  };

  const handleCompanyRegisterSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createCompanyRequest(regForm);
      setRequestSent(true);
  };

  if (mode === 'REGISTER_COMPANY' && requestSent) {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50">
        
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-ocean-50 rounded-full mb-4 text-ocean-500 p-3 overflow-hidden">
            {config.loginLogoUrl || config.logoUrl ? (
                <img src={config.loginLogoUrl || config.logoUrl} className="w-full h-full object-contain" />
            ) : (
                <Building2 size={32} />
            )}
          </div>
          <h1 className="text-2xl font-bold text-ocean-950 tracking-tight">{config.appName.toUpperCase()} <span className="text-gold-500">{config.appNameHighlight.toUpperCase()}</span></h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
          <button 
            onClick={() => { setMode('LOGIN'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${mode === 'LOGIN' ? 'bg-white text-ocean-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LogIn size={16} /> Entrar
          </button>
          <button 
            onClick={() => { setMode('REGISTER_USER'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${mode === 'REGISTER_USER' ? 'bg-white text-ocean-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <UserPlus size={16} /> Criar Conta
          </button>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 text-xs p-4 rounded-xl mb-6 flex items-start gap-3 border border-red-100 animate-in fade-in zoom-in-95">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">{error}</p>
            </div>
        )}

        {/* --- LOGIN FORM --- */}
        {mode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in slide-in-from-left-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input 
                            type="email" 
                            required
                            placeholder="seu@email.com"
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-ocean-500 outline-none transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input 
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="••••••••"
                            className="w-full pl-11 pr-12 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-ocean-500 outline-none transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-ocean-600">
                            {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-ocean-600 hover:bg-ocean-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] mt-2 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "ENTRAR"}
                </button>

                <div className="pt-4 border-t border-slate-100 mt-4 text-center">
                    <button 
                        type="button"
                        onClick={() => setMode('REGISTER_COMPANY')}
                        className="text-slate-500 text-xs font-medium hover:text-ocean-600 transition-colors inline-flex items-center gap-1"
                    >
                        <Building2 size={14} /> Sou empresa e quero cadastrar meu negócio
                    </button>
                </div>
            </form>
        )}

        {/* --- REGISTER USER FORM --- */}
        {mode === 'REGISTER_USER' && (
            <form onSubmit={handleUserRegisterSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Nome Completo</label>
                    <div className="relative">
                        <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            required
                            placeholder="Ex: Maria Silva"
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-ocean-500 outline-none"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input 
                            type="email" 
                            required
                            placeholder="seu@email.com"
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-ocean-500 outline-none"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input 
                            type="password"
                            required
                            placeholder="Mínimo 6 caracteres"
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-ocean-500 outline-none"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Confirmar Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input 
                            type="password"
                            required
                            placeholder="Repita a senha"
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-ocean-500 outline-none"
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] mt-2 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "CRIAR CONTA GRÁTIS"}
                </button>
            </form>
        )}

        {mode === 'REGISTER_COMPANY' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
                <button onClick={() => setMode('LOGIN')} className="flex items-center text-slate-400 hover:text-ocean-600 mb-6 text-sm font-bold">
                    <ChevronLeft size={20} /> Voltar para Login
                </button>
                <h2 className="text-2xl font-bold text-ocean-950 mb-1">Cadastrar Empresa</h2>
                <p className="text-slate-500 text-xs mb-6 leading-relaxed">Solicite sua entrada. Nossa equipe analisará seus dados e retornará via WhatsApp ou E-mail.</p>
                <form onSubmit={handleCompanyRegisterSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <input placeholder="Nome da Empresa" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" value={regForm.companyName} onChange={e => setRegForm({...regForm, companyName: e.target.value})} />
                        <input placeholder="Responsável" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" value={regForm.ownerName} onChange={e => setRegForm({...regForm, ownerName: e.target.value})} />
                        <input type="email" placeholder="Email Comercial" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} />
                        <input type="tel" placeholder="WhatsApp (DDD)" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} />
                        <select className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500" value={regForm.category} onChange={e => setRegForm({...regForm, category: e.target.value})}>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <textarea placeholder="Fale um pouco sobre seu negócio..." rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" value={regForm.description} onChange={e => setRegForm({...regForm, description: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full bg-gold-500 text-ocean-950 font-bold py-4 rounded-xl shadow-lg hover:bg-gold-400 mt-2 transition-all">ENVIAR SOLICITAÇÃO</button>
                </form>
            </div>
        )}

      </div>
    </div>
  );
};
