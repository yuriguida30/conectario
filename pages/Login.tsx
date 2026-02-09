
import React, { useState, useEffect } from 'react';
import { UserRole, AppCategory, AppConfig } from '../types';
import { login, registerUser, createCompanyRequest, getCategories, getAppConfig } from '../services/dataService';
import { Building2, User, ChevronLeft, CheckCircle2, Loader2, Instagram, Globe, Phone, Mail, Lock, UserPlus, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER_USER' | 'REGISTER_COMPANY'>('LOGIN');
  
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
            setError('Login falhou. Verifique se sua empresa já foi aprovada ou se o email está correto.');
        }
    } catch (err: any) {
        console.error(err);
        setError('Erro ao conectar. Tente novamente.');
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
      setLoading(true);
      try {
          await registerUser(regName, regEmail, regPassword);
          onLogin(); 
      } catch (err: any) {
          setError('Erro ao criar conta.');
      } finally {
          setLoading(false);
      }
  };

  const handleCompanyRegisterSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setTimeout(() => {
          createCompanyRequest(regForm);
          setRequestSent(true);
          setLoading(false);
      }, 1000);
  };

  if (mode === 'REGISTER_COMPANY' && requestSent) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl text-center animate-in zoom-in-95">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600">
                    <CheckCircle2 size={48} />
                </div>
                <h2 className="text-2xl font-bold text-ocean-950 mb-3">Solicitação Enviada!</h2>
                <p className="text-slate-600 mb-10 leading-relaxed">Agora nosso administrador vai analisar seu cadastro. Assim que for aprovado, você poderá logar com seu email e a senha padrão <strong>123456</strong>.</p>
                <button 
                    onClick={() => { setMode('LOGIN'); setRequestSent(false); }}
                    className="w-full bg-ocean-600 text-white font-bold py-4 rounded-2xl hover:bg-ocean-700 shadow-lg shadow-ocean-600/20 transition-all"
                >
                    Voltar para Login
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50">
        
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-ocean-50 rounded-3xl mb-4 text-ocean-600 p-4 overflow-hidden shadow-inner">
            {config.loginLogoUrl || config.logoUrl ? (
                <img src={config.loginLogoUrl || config.logoUrl} className="w-full h-full object-contain" />
            ) : (
                <Building2 size={36} />
            )}
          </div>
          <h1 className="text-3xl font-bold text-ocean-950 tracking-tight">{config.appName.toUpperCase()} <span className="text-gold-500">{config.appNameHighlight.toUpperCase()}</span></h1>
          <p className="text-slate-400 text-sm mt-1">Conectando você ao melhor do Rio</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
          <button 
            onClick={() => { setMode('LOGIN'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${mode === 'LOGIN' ? 'bg-white text-ocean-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LogIn size={18} /> Entrar
          </button>
          <button 
            onClick={() => { setMode('REGISTER_USER'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${mode === 'REGISTER_USER' ? 'bg-white text-ocean-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <UserPlus size={18} /> Criar Conta
          </button>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 text-xs p-4 rounded-2xl mb-6 flex items-start gap-3 border border-red-100 animate-in fade-in zoom-in-95">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">{error}</p>
            </div>
        )}

        {/* --- LOGIN FORM --- */}
        {mode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in slide-in-from-left-4">
                <div>
                    <label className="block text-xs font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                        <input 
                            type="email" 
                            required
                            placeholder="seu@email.com"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-ocean-500/10 focus:border-ocean-500 outline-none transition-all text-sm font-medium"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                        <input 
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="••••••••"
                            className="w-full pl-12 pr-14 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-ocean-500/10 focus:border-ocean-500 outline-none transition-all text-sm font-medium"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-ocean-600">
                            {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                        </button>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-ocean-600 hover:bg-ocean-700 text-white font-bold py-4.5 rounded-2xl shadow-xl shadow-ocean-600/20 transition-all active:scale-[0.98] mt-4 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "ENTRAR NO SISTEMA"}
                </button>

                <div className="pt-6 border-t border-slate-100 mt-6 text-center">
                    <button 
                        type="button"
                        onClick={() => setMode('REGISTER_COMPANY')}
                        className="text-slate-400 text-xs font-bold hover:text-ocean-600 transition-colors inline-flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl"
                    >
                        <Building2 size={16} /> Quero cadastrar minha empresa
                    </button>
                </div>
            </form>
        )}

        {/* --- REGISTER USER FORM --- */}
        {mode === 'REGISTER_USER' && (
            <form onSubmit={handleUserRegisterSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div>
                    <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Nome Completo</label>
                    <input required className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-ocean-500/10" value={regName} onChange={(e) => setRegName(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Email</label>
                    <input type="email" required className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-ocean-500/10" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Senha</label>
                    <input type="password" required className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-ocean-500/10" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-ocean-600 text-white font-bold py-4.5 rounded-2xl shadow-xl mt-4">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "CRIAR CONTA GRÁTIS"}
                </button>
            </form>
        )}

        {mode === 'REGISTER_COMPANY' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
                <button onClick={() => setMode('LOGIN')} className="flex items-center text-slate-400 hover:text-ocean-600 mb-6 text-sm font-bold gap-1 transition-colors">
                    <ChevronLeft size={20} /> Voltar
                </button>
                <h2 className="text-2xl font-bold text-ocean-950 mb-2">Cadastrar Empresa</h2>
                <p className="text-slate-500 text-xs mb-8 leading-relaxed">Conte-nos sobre seu negócio. Nossa equipe entrará em contato após a análise.</p>
                <form onSubmit={handleCompanyRegisterSubmit} className="space-y-5">
                    <input placeholder="Nome da Empresa" required className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100" value={regForm.companyName} onChange={e => setRegForm({...regForm, companyName: e.target.value})} />
                    <input placeholder="Seu Nome (Responsável)" required className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100" value={regForm.ownerName} onChange={e => setRegForm({...regForm, ownerName: e.target.value})} />
                    <input type="email" placeholder="Email Comercial" required className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} />
                    <input type="tel" placeholder="WhatsApp (DDD + Número)" required className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} />
                    <select className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 font-bold text-sm" value={regForm.category} onChange={e => setRegForm({...regForm, category: e.target.value})}>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <textarea placeholder="Fale um pouco sobre o que sua empresa oferece..." rows={3} className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm" value={regForm.description} onChange={e => setRegForm({...regForm, description: e.target.value})} />
                    <button type="submit" disabled={loading} className="w-full bg-gold-500 text-ocean-950 font-bold py-4.5 rounded-2xl shadow-xl hover:bg-gold-400 transition-all flex justify-center items-center">
                        {loading ? <Loader2 className="animate-spin" size={20}/> : "ENVIAR SOLICITAÇÃO"}
                    </button>
                </form>
            </div>
        )}

      </div>
    </div>
  );
};
