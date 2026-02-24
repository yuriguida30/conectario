import React from 'react';
import { User, UserRole } from '../types';
import { PartnerView } from '../components/PartnerView';
import { SuperAdminView } from '../components/SuperAdminView';

interface AdminDashboardProps {
  currentUser: User;
  onNavigate: (page: string, params?: any) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onNavigate, onLogout }) => {
  if (currentUser.role === UserRole.SUPER_ADMIN) {
    return <SuperAdminView />;
  }

  return <PartnerView currentUser={currentUser} onNavigate={onNavigate} onLogout={onLogout} />;
};
