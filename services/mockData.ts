
import { Coupon, User, UserRole, BusinessProfile, BlogPost } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'admin1',
    name: 'Super Admin',
    email: 'admin@conectario.com',
    role: UserRole.SUPER_ADMIN,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'creator1',
    name: 'Ana Terra',
    email: 'ana.terra@blog.com',
    role: UserRole.CONTENT_CREATOR,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    profession: 'Jornalista de Viagem',
    bio: 'Apaixonada pelo Rio e suas histórias.',
    instagram: '@anaterra.travel',
    website: 'anaterra.com.br'
  },
  {
    id: 'user1',
    name: 'Turista Feliz',
    email: 'cliente@email.com',
    role: UserRole.CUSTOMER,
    isPrime: true,
    savedAmount: 185.50,
    history: [
      { date: '2024-05-10', amount: 45.00, couponTitle: 'Passeio de Barco' },
      { date: '2024-05-12', amount: 140.50, couponTitle: 'Jantar Completo' },
    ],
    favorites: {
        coupons: ['c1'],
        businesses: ['b1']
    }
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
    maxCoupons: 10
  }
];

export const MOCK_BUSINESSES: BusinessProfile[] = [
  {
    id: 'b1',
    name: 'Restaurante Bacalhau do Tuga',
    category: 'Gastronomia',
    description: 'O melhor da culinária portuguesa no coração de Arraial. Ambiente familiar, vinhos selecionados e o famoso Bolinho de Bacalhau.',
    coverImage: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1200',
    gallery: [],
    address: 'Praia dos Anjos, Rua dos Pescadores, 120',
    locationId: 'Praia dos Anjos',
    phone: '(22) 2622-1111',
    whatsapp: '5522999991111',
    amenities: ['wifi', 'ac', 'kids', 'access'],
    openingHours: { 'Seg-Dom': '11:00 - 23:00' },
    rating: 4.9,
    reviewCount: 156,
    isFeatured: true,
    isOpenNow: true,
    lat: -22.9691,
    lng: -42.0232
  },
  {
    id: 'b2',
    name: 'Pousada Caminho do Sol',
    category: 'Hospedagem',
    description: 'Acorde com o nascer do sol na Prainha. Conforto, piscina aquecida e café da manhã tropical incluso.',
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200',
    gallery: [],
    address: 'Rua do Sol, 55 - Prainha',
    locationId: 'Prainha',
    phone: '(22) 2622-2222',
    amenities: ['pool', 'wifi', 'ac', 'breakfast'],
    openingHours: { 'Recepção': '24h' },
    rating: 4.8,
    reviewCount: 42,
    isOpenNow: true,
    lat: -22.9554,
    lng: -42.0336
  }
];

export const MOCK_COUPONS: Coupon[] = [
  {
    id: 'c1',
    companyId: 'b1',
    companyName: 'Restaurante Bacalhau do Tuga',
    companyLogo: 'https://ui-avatars.com/api/?name=BT&background=0c4a6e&color=fff',
    title: 'Moqueca de Peixe (2 Pessoas) - 30% OFF',
    description: 'Almoço completo para casal. Moqueca, arroz, pirão e farofa de dendê.',
    rules: ['Válido Seg-Sex', 'Exceto feriados'],
    address: 'Praia dos Anjos, Rua dos Pescadores, 120',
    originalPrice: 160.00,
    discountedPrice: 112.00,
    discountPercentage: 30,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    category: 'Gastronomia',
    expiryDate: '2024-12-30',
    code: 'TUGA30',
    active: true,
    rating: 4.9,
    reviews: 80
  }
];

export const MOCK_POSTS: BlogPost[] = [
  {
    id: 'p1',
    title: 'As 5 Praias Mais Bonitas de Arraial',
    excerpt: 'Todo mundo conhece o Forno e a Ilha do Farol, mas você já visitou essas joias?',
    content: '...',
    imageUrl: 'https://images.unsplash.com/photo-1590089415225-401cd6f9ad5d?auto=format&fit=crop&q=80&w=800',
    category: 'Roteiro',
    date: '12/05/2024',
    author: 'Ana Terra',
    authorId: 'creator1'
  }
];
