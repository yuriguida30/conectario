
import { Coupon, User, UserRole, BusinessProfile, BlogPost, BusinessPlan } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'admin1',
    name: 'Super Admin',
    email: 'admin@conectario.com',
    role: UserRole.SUPER_ADMIN,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
  }
];

export const MOCK_BUSINESSES: BusinessProfile[] = [];

export const MOCK_COUPONS: Coupon[] = [];

export const MOCK_POSTS: BlogPost[] = [
  {
    id: 'p1',
    title: 'Bem-vindo ao Conecta Rio',
    excerpt: 'Explore o melhor da cidade maravilhosa com descontos exclusivos.',
    content: 'O Conecta Rio nasceu para unir turistas e cariocas aos melhores estabelecimentos da cidade...',
    imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=1200',
    category: 'Notícia',
    date: '01/01/2024',
    author: 'Equipe Conecta Rio'
  }
];
