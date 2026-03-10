import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getAllUsers, updateUserRole, createJournalistUser } from '../services/dataService';
import { ChevronLeft, User as UserIcon, ShieldCheck, Mail, Plus, Loader2, Star, Edit3, Trash2 } from 'lucide-react';

interface UserManagerProps {
    onBack: () => void;
}

export const UserManager: React.FC<UserManagerProps> = ({ onBack }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });

    useEffect(() => {
        setUsers(getAllUsers());
    }, []);

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        if (confirm(`Tem certeza que deseja alterar o papel deste usuário para ${newRole}?`)) {
            await updateUserRole(userId, newRole);
            setUsers(getAllUsers());
            alert('Papel atualizado com sucesso!');
        }
    };

    const handleCreateJournalist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.name || !newUser.email || !newUser.password) {
            alert('Preencha todos os campos.');
            return;
        }
        setLoading(true);
        try {
            await createJournalistUser(newUser.name, newUser.email, newUser.password);
            setUsers(getAllUsers());
            setIsCreating(false);
            setNewUser({ name: '', email: '', password: '' });
            alert('Jornalista criado com sucesso!');
        } catch (error: any) {
            console.error(error);
            alert('Erro ao criar usuário: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6 space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-ocean-950">Gestão de Usuários</h2>
                <button onClick={onBack} className="flex items-center gap-2 text-ocean-600 font-black text-xs uppercase">
                    <ChevronLeft size={16} /> Voltar
                </button>
            </div>

            {isCreating ? (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h3 className="text-xl font-bold text-ocean-950 mb-4">Criar Novo Jornalista</h3>
                    <form onSubmit={handleCreateJournalist} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                            <input 
                                type="text" 
                                value={newUser.name}
                                onChange={e => setNewUser({...newUser, name: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-ocean-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
                            <input 
                                type="email" 
                                value={newUser.email}
                                onChange={e => setNewUser({...newUser, email: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-ocean-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha Provisória</label>
                            <input 
                                type="text" 
                                value={newUser.password}
                                onChange={e => setNewUser({...newUser, password: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-ocean-500 outline-none"
                                required
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="bg-ocean-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-ocean-700 transition-all flex items-center gap-2"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                Criar Usuário
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setIsCreating(false)}
                                className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="flex justify-end">
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="bg-ocean-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-ocean-600/20 hover:bg-ocean-700 transition-all flex items-center gap-2"
                    >
                        <Plus size={14} /> Novo Jornalista
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {users.length === 0 ? (
                    <p className="text-slate-500 text-center py-10">Nenhum usuário encontrado.</p>
                ) : (
                    users.map(user => (
                        <div key={user.id} className="p-6 rounded-[2rem] border bg-slate-50 border-slate-100 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-full bg-ocean-100 flex items-center justify-center text-ocean-600 font-bold shrink-0">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-ocean-950 flex items-center gap-2">
                                        {user.name}
                                        <span className="bg-ocean-100 text-ocean-600 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 uppercase">
                                            {user.role}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-1"><Mail size={12} /> {user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <select 
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none w-full md:w-auto"
                                    value={user.role}
                                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                >
                                    <option value={UserRole.CUSTOMER}>Cliente</option>
                                    <option value={UserRole.COMPANY}>Empresa</option>
                                    <option value={UserRole.JOURNALIST}>Jornalista</option>
                                    <option value={UserRole.SUPER_ADMIN}>Admin</option>
                                </select>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
