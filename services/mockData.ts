
import { Coupon, User, UserRole, BusinessProfile, BlogPost, BusinessPlan } from '../types';

// ID REAL DA DOCERIA DO PRINT
const KARAMELO_ID = 'local_1765502020338';

export const MOCK_USERS: User[] = [
  {
    id: KARAMELO_ID, // Agora o ID do usuário André é o mesmo da empresa para linkar direto
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
    id: KARAMELO_ID,
    name: 'Doceria Karamelo',
    category: 'Gastronomia',
    description: 'Karamelo Doceria, tradicional em Sepetiba, é reconhecida por seus doces artesanais preparados com ingredientes de qualidade, oferecendo tortas, mousses, copos especiais, sobremesas geladas e criações exclusivas que conquistam a região. Com ambiente acolhedor e atendimento atento, tornou-se referência em momentos doces. Recentemente, ampliou sua experiência gastronômica ao inaugurar um espaço dedicado a massas e comidas típicas da Itália, unindo confeitaria premium e culinária italiana em um único lugar.',
    coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=1200',
    gallery: [],
    address: 'Estrada São Tarcísio 239, Sepetiba RJ',
    phone: '(21) 99999-9999',
    whatsapp: '5521999999999',
    instagram: '@doceriakaramelo',
    website: 'www.doceriakaramelo.com.br',
    amenities: ['wifi', 'ac', 'kids', 'access', 'pet', 'delivery', 'card', 'tv'],
    openingHours: { 'Ter-Sáb': '11:00 - 20:00', 'Dom': '11:00 - 18:00' },
    rating: 5.0,
    reviewCount: 128,
    views: 1450,
    isFeatured: true,
    isOpenNow: true,
    plan: BusinessPlan.PREMIUM,
    menu: [
        {
            title: "Destaques da Confeitaria",
            items: [
                { id: "k1", name: "Red Velvet Premium", description: "Fatia generosa com nosso recheio secreto de cream cheese.", price: 18.50 },
                { id: "k2", name: "Copo da Felicidade", description: "Camadas de brigadeiro gourmet, morango e brownie.", price: 22.00 }
            ]
        },
        {
            title: "Culinária Italiana",
            items: [
                { id: "k3", name: "Fettuccine à Carbonara", description: "Massa fresca produzida na casa com molho clássico.", price: 42.00 }
            ]
        }
    ]
  }
];

export const MOCK_COUPONS: Coupon[] = [
  {
    id: 'c_karamelo_1',
    companyId: KARAMELO_ID,
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
    companyId: KARAMELO_ID,
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
    title: 'Roteiro Gastronômico: O melhor de Sepetiba',
    excerpt: 'Descobrimos os segredos doces e salgados da região.',
    content: 'O Rio de Janeiro é famoso por suas confeitarias, e Sepetiba guarda uma das maiores joias...',
    imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800',
    category: 'Gastronomia',
    date: '15/05/2024',
    author: 'Equipe Conecta Rio'
  }
];
