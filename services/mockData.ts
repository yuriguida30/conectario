
import { Coupon, User, UserRole, BusinessProfile, BlogPost, BusinessPlan } from '../types';

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
        businesses: ['comp1']
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
    maxCoupons: 10,
    plan: BusinessPlan.PREMIUM
  }
];

export const MOCK_BUSINESSES: BusinessProfile[] = [
  {
    id: 'comp1', // ID Sincronizado com o usuário de teste
    name: 'Arraial Vip Tour',
    category: 'Passeios',
    description: 'Experiência única de navegação pelas águas cristalinas de Arraial do Cabo. Passeios privativos e compartilhados com total segurança.',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
    gallery: [],
    address: 'Praia dos Anjos, Cais do Porto, Arraial do Cabo - RJ',
    locationId: 'sepetiba',
    phone: '(22) 99999-9999',
    whatsapp: '5522999999999',
    amenities: ['wifi', 'access', 'kids'],
    openingHours: { 'Seg-Dom': '08:00 - 18:00' },
    rating: 4.9,
    reviewCount: 240,
    isFeatured: true,
    isOpenNow: true,
    lat: -22.9691,
    lng: -42.0232,
    plan: BusinessPlan.PREMIUM,
    menu: [
        {
            title: "Passeios Tradicionais",
            items: [
                { id: "p1", name: "Roteiro Clássico (4h)", description: "Inclui Ilha do Farol, Prainhas e Forno.", price: 100.00 },
                { id: "p2", name: "Pôr do Sol VIP", description: "Champanhe e petiscos a bordo.", price: 250.00 }
            ]
        }
    ]
  },
  {
    id: 'b1',
    name: 'Restaurante Bacalhau do Tuga',
    category: 'Gastronomia',
    description: 'O melhor da culinária portuguesa no coração de Arraial. Ambiente familiar, vinhos selecionados e o famoso Bolinho de Bacalhau.',
    coverImage: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1200',
    gallery: [],
    address: 'Praia dos Anjos, Rua dos Pescadores, 120',
    locationId: 'centro',
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
  }
];

export const MOCK_COUPONS: Coupon[] = [
  {
    id: 'c1',
    companyId: 'comp1',
    companyName: 'Arraial Vip Tour',
    companyLogo: 'https://ui-avatars.com/api/?name=AV&background=0c4a6e&color=fff',
    title: 'Passeio de Barco - 20% OFF',
    description: 'Ganhe 20% de desconto no passeio clássico agendando via site.',
    rules: ['Válido para pagamentos via PIX', 'Agendamento prévio necessário'],
    address: 'Praia dos Anjos, Cais do Porto',
    originalPrice: 100.00,
    discountedPrice: 80.00,
    discountPercentage: 20,
    imageUrl: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?auto=format&fit=crop&q=80&w=800',
    category: 'Passeios',
    expiryDate: '2024-12-31',
    code: 'VIP20',
    active: true,
    rating: 5.0,
    reviews: 12
  }
];

export const MOCK_POSTS: BlogPost[] = [
  {
    id: 'p1',
    title: 'As 5 Praias Mais Bonitas de Arraial',
    excerpt: 'Todo mundo conhece o Forno e a Ilha do Farol, mas você já visitou essas joias?',
    content: 'Descubra praias desertas e águas cristalinas...',
    imageUrl: 'https://images.unsplash.com/photo-1590089415225-401cd6f9ad5d?auto=format&fit=crop&q=80&w=800',
    category: 'Roteiro',
    date: '12/05/2024',
    author: 'Ana Terra',
    authorId: 'creator1'
  }
];
