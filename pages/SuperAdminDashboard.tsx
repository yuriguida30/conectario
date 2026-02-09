
import React, { useState, useEffect } from 'react';
import { User, CompanyRequest, AppCategory } from '../types';
import { getCategories, getCompanyRequests, approveCompanyRequest } from '../services/dataService';
import { LayoutDashboard, Users, Store, CheckCircle, XCircle, Clock, Search, ChevronRight, Globe, ShieldCheck } from 'lucide-react';

export const SuperAdminDashboard: React.FC<{ onNavigate: (page: string) => void; currentUser: User; onLogout: () => void }> = ({ onNavigate, currentUser, onLogout }) => {
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('PENDING');

  useEffect(() => {
    setRequests(getCompanyRequests());
    const handleUpdate = () => setRequests(getCompanyRequests());
    window.addEventListener('dataUpdated', handleUpdate);
    return () => window.removeEventListener('dataUpdated', handleUpdate);
  }, []);

  const handleApprove = (id: string) => {
      if(confirm('Aprovar esta empresa? Um perfil e usuário de acesso serão criados.')) {
          approveCompanyRequest(id);
      }
  };

  const filteredRequests = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 pt-16">
      <div className="w-full md:w-72 bg-white border-r border-slate-200 p-4 flex flex-col z-40">
         <div className="mb-8 px-4">
             <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Painel Master</h2>
             <p className="text-ocean-950 font-bold text-sm">Administrador</p>
         </div>
         <nav className="flex flex-col gap-1">
             <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-ocean-600 text-white shadow-lg">
                 <Store size={18} /> Solicitações
             </button>
             <button onClick={() => onNavigate('home')} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">
                 <Globe size={18} /> Ver Site
             </button>
             <button onClick={onLogout} className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50">
                 Sair
             </button>
         </nav>
      </div>

      <div className="flex-1 p-4 md:p-10">
          <div className="max-w-6xl">
              <div className="mb-8">
                  <h1 className="text-2xl font-bold text-ocean-950">Gestão de Parceiros</h1>
                  <p className="text-sm text-slate-500">Aprove ou gerencie empresas que desejam anunciar no Conecta Rio.</p>
              </div>

              <div className="flex gap-2 mb-6">
                  <button onClick={() => setFilter('PENDING')} className={`px-4 py-2 rounded-full text-xs font-bold ${filter === 'PENDING' ? 'bg-orange-500 text-white' : 'bg-white text-slate-500'}`}>Pendentes</button>
                  <button onClick={() => setFilter('APPROVED')} className={`px-4 py-2 rounded-full text-xs font-bold ${filter === 'APPROVED' ? 'bg-green-500 text-white' : 'bg-white text-slate-500'}`}>Aprovadas</button>
                  <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-full text-xs font-bold ${filter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500'}`}>Todas</button>
              </div>

              <div className="space-y-4">
                  {filteredRequests.map(req => (
                      <div key={req.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                          <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-bold text-ocean-950 text-lg">{req.companyName}</h3>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${req.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                      {req.status}
                                  </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                                  <p><strong>Responsável:</strong> {req.ownerName}</p>
                                  <p><strong>Email:</strong> {req.email}</p>
                                  <p><strong>WhatsApp:</strong> {req.phone}</p>
                                  <p><strong>Categoria:</strong> {req.category}</p>
                              </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                              {req.status === 'PENDING' && (
                                  <>
                                      <button onClick={() => handleApprove(req.id)} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-green-700">
                                          <CheckCircle size={16}/> Aprovar
                                      </button>
                                      <button className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-red-100">
                                          <XCircle size={16}/> Rejeitar
                                      </button>
                                  </>
                              )}
                              <button className="bg-slate-50 text-slate-400 p-2 rounded-xl"><ChevronRight size={20}/></button>
                          </div>
                      </div>
                  ))}

                  {filteredRequests.length === 0 && (
                      <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                          <Clock className="mx-auto mb-4 text-slate-200" size={48} />
                          <p className="text-slate-400 font-medium">Nenhuma solicitação encontrada.</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};
