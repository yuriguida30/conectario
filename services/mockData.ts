
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
  },
  {
    id: 'user1',
    name: 'Cliente Teste',
    email: 'cliente@email.com',
    role: UserRole.CUSTOMER,
    favorites: { coupons: [], businesses: [] }
  },
  {
    id: 'comp1',
    name: 'João do Barco',
    email: 'empresa@email.com',
    role: UserRole.COMPANY,
    companyName: 'Arraial Vip Tour',
    category: 'Passeios',
    phone: '22999999999',
    permissions: { canCreateCoupons: true, canManageBusiness: true },
    plan: BusinessPlan.PREMIUM
  }
];

export const MOCK_BUSINESSES: BusinessProfile[] = [
  {
    id: 'andre_karamelo', 
    name: 'Doceria Karamelo',
    category: 'Gastronomia',
    description: 'A mais doce e tradicional confeitaria da região. Bolos artesanais, doces finos e o melhor café do Rio.',
    coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=1200',
    gallery: [],
    address: 'Rua das Doceiras, 123, Rio de Janeiro - RJ',
    phone: '(21) 99999-9999',
    whatsapp: '5521999999999',
    amenities: ['wifi', 'ac', 'kids'],
    openingHours: { 'Seg-Sáb': '09:00 - 19:00' },
    rating: 5.0,
    reviewCount: 42,
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
  },
  {
    id: 'comp1', 
    name: 'Arraial Vip Tour',
    category: 'Passeios',
    description: 'Experiência única de navegação pelas águas cristalinas de Arraial do Cabo.',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
    gallery: [],
    address: 'Praia dos Anjos, Cais do Porto, Arraial do Cabo - RJ',
    phone: '(22) 99999-9999',
    // Added missing required properties 'amenities' and 'openingHours' to satisfy BusinessProfile interface
    amenities: ['parking', 'access'],
    openingHours: { 'Seg-Dom': '08:00 - 18:00' },
    rating: 4.9,
    isOpenNow: true
  }
];

export const MOCK_COUPONS: Coupon[] = [
  {
    id: 'c_karamelo_1',
    companyId: 'andre_karamelo',
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
    rating: 5.0
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
