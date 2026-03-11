
import { Coupon, User, UserRole, BusinessProfile, BlogPost } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'admin1',
    name: 'Super Admin',
    email: 'admin@conectario.com',
    role: UserRole.SUPER_ADMIN,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
  }
];

export const MOCK_BUSINESSES: BusinessProfile[] = [
  {
    id: 'biz1',
    name: 'Restaurante Sabor do Rio',
    description: 'A autêntica culinária carioca com vista para o mar. Desfrute de pratos clássicos em um ambiente descontraído e acolhedor.',
    category: 'Gastronomia',
    subcategory: 'Culinária Brasileira',
    coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
    gallery: [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=600'
    ],
    address: 'Av. Atlântica, 1702 - Copacabana, Rio de Janeiro',
    phone: '(21) 2222-3333',
    amenities: ['wifi', 'ac', 'card'],
    openingHours: { 'Segunda': '12:00 - 23:00', 'Terça': '12:00 - 23:00', 'Quarta': '12:00 - 23:00', 'Quinta': '12:00 - 23:00', 'Sexta': '12:00 - 00:00', 'Sábado': '12:00 - 00:00', 'Domingo': '12:00 - 22:00' },
    rating: 4.8,
    lat: -22.9697, 
    lng: -43.1833,
    views: 1250,
    shares: 320,
    plan: 'PREMIUM',
    actionCounts: { phone: 50, map: 120, social: 80, website: 60, delivery: 40, menu: 150 }
  },
  {
    id: 'biz2',
    name: 'Pousada Vista Verde',
    description: 'Refúgio na montanha com conforto e uma vista espetacular. Ideal para quem busca paz e contato com a natureza.',
    category: 'Hospedagem',
    subcategory: 'Pousada',
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
    gallery: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=600'
    ],
    address: 'Estr. da Gávea, 899 - Gávea, Rio de Janeiro',
    phone: '(21) 3333-4444',
    amenities: ['wifi', 'ac', 'pool', 'breakfast'],
    openingHours: { 'Segunda': 'Check-in 14:00', 'Terça': 'Check-in 14:00', 'Quarta': 'Check-in 14:00', 'Quinta': 'Check-in 14:00', 'Sexta': 'Check-in 14:00', 'Sábado': 'Check-in 14:00', 'Domingo': 'Check-out 12:00' },
    rating: 4.9,
    lat: -22.9782,
    lng: -43.2462,
    views: 890,
    shares: 150,
    plan: 'PREMIUM',
    actionCounts: { phone: 80, map: 200, social: 45, website: 90, booking: 60 }
  }
];

export const MOCK_COUPONS: Coupon[] = [];

export const MOCK_POSTS: BlogPost[] = [];
