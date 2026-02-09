
import { Coupon, User, UserRole, BusinessProfile, BlogPost, BusinessPlan } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'andre_karamelo',
    name: 'André Karamelo',
    email: 'andre@conectario.org',
    role: UserRole.COMPANY,
    companyName: 'Doceria Karamelo',
    category: 'Gastronomia',
    phone: '21999999999',
    permissions: { canCreateCoupons: true, canManageBusiness: true },
    plan: BusinessPlan.PREMIUM
  },
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
    id: 'andre_karamelo', // ID igual ao do usuário André
    name: 'Doceria Karamelo',
    category: 'Gastronomia',
    description: 'A mais doce e tradicional confeitaria da região. Bolos artesanais, doces finos e o melhor café do Rio.',
    coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=1200',
    gallery: [],
    address: 'Rua das Doceiras, 123, Rio de Janeiro - RJ',
    phone: '(21) 99999-9999',
    whatsapp: '5521999999999',
    instagram: '@doceriakaramelo',
    website: 'www.doceriakaramelo.com.br',
    amenities: ['wifi', 'ac', 'kids', 'card'],
    openingHours: { 'Seg-Sáb': '09:00 - 19:00', 'Dom': 'Fechado' },
    rating: 5.0,
    reviewCount: 128,
    views: 1450,
    isFeatured: true,
    isOpenNow: true,
    plan: BusinessPlan.PREMIUM,
    menu: [
        {
            title: "Bolos e Tortas",
            items: [
                { id: "k1", name: "Red Velvet Especial", description: "Fatia generosa com recheio de cream cheese.", price: 18.50 },
                { id: "k2", name: "Torta de Limão Siciliano", description: "Massa crocante e merengue maçaricado.", price: 15.00 }
            ]
        }
    ]
  }
];

export const MOCK_COUPONS: Coupon[] = [
  {
    id: 'c_karamelo_1',
    companyId: 'andre_karamelo', // Vinculado ao ID do André
    companyName: 'Doceria Karamelo',
    companyLogo: 'https://ui-avatars.com/api/?name=DK&background=f59e0b&color=fff',
    title: 'Corte de 15% na Primeira Compra',
    description: 'Válido para qualquer item do cardápio acima de R$ 50.',
    originalPrice: 50.00,
    discountedPrice: 42.50,
    discountPercentage: 15,
    imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80&w=800',
    category: 'Gastronomia',
    expiryDate: '2024-12-31',
    code: 'KARAMELO15',
    active: true,
    rating: 5.0,
    currentRedemptions: 24,
    maxRedemptions: 100
  },
  {
    id: 'c_karamelo_2',
    companyId: 'andre_karamelo',
    companyName: 'Doceria Karamelo',
    title: 'Combo Café + Fatia por R$ 25',
    description: 'Escolha qualquer fatia de bolo simples + café expresso grande.',
    originalPrice: 32.00,
    discountedPrice: 25.00,
    discountPercentage: 22,
    imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800',
    category: 'Gastronomia',
    expiryDate: '2024-11-30',
    code: 'CAFECOMBO',
    active: true,
    rating: 4.8,
    currentRedemptions: 45,
    maxRedemptions: 200
  }
];

export const MOCK_POSTS: BlogPost[] = [
  {
    id: 'p1',
    title: 'Roteiro Gastronômico: Onde comer doces no Rio',
    excerpt: 'Visitamos as melhores docerias e selecionamos a nossa favorita.',
    content: 'O Rio de Janeiro é famoso por suas confeitarias históricas...',
    imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800',
    category: 'Gastronomia',
    date: '15/05/2024',
    author: 'Equipe Conecta Rio'
  }
];
