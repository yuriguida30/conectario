import React, { useState, useEffect } from 'react';
import { CompanyRequest, UserRole } from '../types';
import { getCompanyRequests, approveCompanyRequest, rejectCompanyRequest } from '../services/dataService';
import { Loader2, Check, X } from 'lucide-react';

export const SuperAdminView: React.FC = () => {
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const allRequests = await getCompanyRequests();
    setRequests(allRequests.filter(r => r.status === 'PENDING'));
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (requestId: string) => {
    await approveCompanyRequest(requestId);
    fetchRequests();
  };

  const handleReject = async (requestId: string) => {
    await rejectCompanyRequest(requestId);
    fetchRequests();
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-ocean-600" size={48} /></div>;
  }

  return (
    <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-100">
      <h2 className="text-3xl font-black text-ocean-950 mb-8">Solicitações de Empresas</h2>
      <div className="space-y-4">
        {requests.length === 0 ? (
          <p className="text-slate-500">Nenhuma solicitação pendente.</p>
        ) : (
          requests.map(req => (
            <div key={req.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-ocean-900">{req.companyName}</h3>
                <p className="text-sm text-slate-600">{req.ownerName} - {req.email}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleApprove(req.id)} className="bg-green-500 text-white p-2 rounded-lg">
                  <Check size={20} />
                </button>
                <button onClick={() => handleReject(req.id)} className="bg-red-500 text-white p-2 rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
