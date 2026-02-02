
import { Coupon, User, UserRole, BusinessProfile, BlogPost } from '../types';

// --- MOCK USERS ---
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
    bio: 'Apaixonada pelo Rio e suas histórias. Escrevo sobre turismo sustentável, gastronomia local e os segredos escondidos de Arraial do Cabo. Minha missão é fazer você viver experiências autênticas.',
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
        coupons: ['c1', 'c4'],
        businesses: ['b1', 'b5']
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

// --- MOCK BUSINESSES (ARRAIAL DO CABO THEMED) ---
export const MOCK_BUSINESSES: BusinessProfile[] = [
  {
    id: 'b1',
    name: 'Restaurante Bacalhau do Tuga',
    category: 'Gastronomia',
    description: 'O melhor da culinária portuguesa no coração de Arraial. Ambiente familiar, vinhos selecionados e o famoso Bolinho de Bacalhau.',
    coverImage: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1200',
    gallery: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=800'
    ],
    address: 'Praia dos Anjos, Rua dos Pescadores, 120',
    locationId: 'Praia dos Anjos',
    phone: '(22) 2622-1111',
    whatsapp: '5522999991111',
    amenities: ['wifi', 'ac', 'kids', 'access', 'wine'],
    openingHours: { 'Seg-Dom': '11:00 - 23:00' },
    rating: 4.9,
    reviewCount: 156, // High count
    isFeatured: true, // DESTAQUE
    reviews: [
        { id: 'r1', userId: 'u99', userName: 'Maria Silva', rating: 5, comment: 'Simplesmente divino! O bolinho de bacalhau é o melhor que já comi.', date: '2024-02-10' },
        { id: 'r2', userId: 'u98', userName: 'João Souza', rating: 5, comment: 'Atendimento impecável e comida saborosa.', date: '2024-02-15' },
        { id: 'r3', userId: 'u97', userName: 'Ana Costa', rating: 4.5, comment: 'Lugar aconchegante, preço justo.', date: '2024-03-01' }
    ],
    isOpenNow: true,
    lat: -22.9691,
    lng: -42.0232,
    // Fix: Missing isClaimed property
    isClaimed: false
  },
  {
    id: 'b2',
    name: 'Pousada Caminho do Sol',
    category: 'Hospedagem',
    description: 'Acorde com o nascer do sol na Prainha. Conforto, piscina aquecida e café da manhã tropical incluso.',
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800'
    ],
    address: 'Rua do Sol, 55 - Prainha',
    locationId: 'Prainha',
    phone: '(22) 2622-2222',
    amenities: ['pool', 'wifi', 'ac', 'breakfast', 'parking'],
    openingHours: { 'Recepção': '24h' },
    rating: 4.8,
    reviewCount: 42,
    isFeatured: false,
    reviews: [
        { id: 'r4', userId: 'u96', userName: 'Pedro H.', rating: 5, comment: 'A vista do quarto é inacreditável. Voltarei com certeza!', date: '2024-01-20' },
        { id: 'r5', userId: 'u95', userName: 'Carla Dias', rating: 4.5, comment: 'Café da manhã muito bom.', date: '2024-02-05' }
    ],
    isOpenNow: true,
    lat: -22.9554,
    lng: -42.0336,
    // Fix: Missing isClaimed property
    isClaimed: false
  },
  {
    id: 'b3',
    name: 'Arraial Vip Tour',
    category: 'Passeios',
    description: 'Passeios de barco exclusivos. Conheça a Gruta Azul, Ilha do Farol e Prainhas com serviço de bordo open bar.',
    coverImage: 'https://images.unsplash.com/photo-1544551763-46a42a4571d0?auto=format&fit=crop&q=80&w=1200',
    gallery: [
        'https://images.unsplash.com/photo-1544551763-46a42a4571d0?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1605281317010-fe5ffe79ba02?auto=format&fit=crop&q=80&w=800'
    ],
    address: 'Marina dos Pescadores - Pier 2',
    locationId: 'Praia dos Anjos',
    phone: '(22) 99888-7777',
    amenities: ['bar', 'wifi', 'guide', 'photo'],
    openingHours: { 'Seg-Dom': '08:00 - 18:00' },
    rating: 5.0,
    reviewCount: 89, // High count but less than b1
    isFeatured: true, // DESTAQUE (concorrendo com b1)
    reviews: [
        { id: 'r6', userId: 'u94', userName: 'Lucas M.', rating: 5, comment: 'Melhor passeio de barco da vida! A equipe é animada demais.', date: '2024-03-10' }
    ],
    isOpenNow: true,
    lat: -22.9700,
    lng: -42.0220,
    // Fix: Missing isClaimed property
    isClaimed: false
  },
  {
    id: 'b4',
    name: 'Quiosque Onda Azul',
    category: 'Gastronomia',
    description: 'Pé na areia na Praia Grande. Petiscos, drinks gelados e o pôr do sol mais bonito da cidade.',
    coverImage: 'https://images.unsplash.com/photo-1534234828569-189f921d5910?auto=format&fit=crop&q=80&w=1200',
    gallery: ['https://images.unsplash.com/photo-1534234828569-189f921d5910?auto=format&fit=crop&q=80&w=800'],
    address: 'Orla da Praia Grande, Quiosque 12',
    locationId: 'Praia Grande',
    phone: '(22) 99777-6666',
    amenities: ['beach', 'bar', 'live_music'],
    openingHours: { 'Ter-Dom': '10:00 - 22:00' },
    rating: 4.6,
    reviewCount: 12,
    isFeatured: false,
    reviews: [],
    isOpenNow: true,
    lat: -22.9712,
    lng: -42.0390,
    // Fix: Missing isClaimed property
    isClaimed: false
  },
  {
    id: 'b5',
    name: 'Mergulho Sea Diver',
    category: 'Passeios',
    description: 'Descubra o fundo do mar da Capital do Mergulho. Batismos para iniciantes e saídas para credenciados.',
    coverImage: 'https://images.unsplash.com/photo-1544551763-92ab472cad5d?auto=format&fit=crop&q=80&w=1200',
    gallery: ['https://images.unsplash.com/photo-1544551763-92ab472cad5d?auto=format&fit=crop&q=80&w=800'],
    address: 'Rua Santa Cruz, 10 - Praia dos Anjos',
    locationId: 'Praia dos Anjos',
    phone: '(22) 3333-5555',
    amenities: ['equipment', 'photo', 'shower'],
    openingHours: { 'Seg-Sáb': '08:00 - 18:00' },
    rating: 4.9,
    reviewCount: 30,
    isFeatured: false,
    reviews: [],
    isOpenNow: true,
    lat: -22.9680,
    lng: -42.0240,
    // Fix: Missing isClaimed property
    isClaimed: false
  },
  {
    id: 'b6',
    name: 'Sorveteria Gelato Real',
    category: 'Gastronomia',
    description: 'Sorvetes artesanais italianos com frutas tropicais. A sobremesa perfeita.',
    coverImage: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&q=80&w=1200',
    gallery: ['https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&q=80&w=800'],
    address: 'Praça do Cova, Centro',
    locationId: 'Centro',
    phone: '(22) 2222-1111',
    amenities: ['ac', 'wifi'],
    openingHours: { 'Seg-Dom': '13:00 - 00:00' },
    rating: 4.7,
    reviewCount: 55, // Should rank higher than b4
    isFeatured: false,
    reviews: [],
    isOpenNow: true,
    lat: -22.9660,
    lng: -42.0260,
    // Fix: Missing isClaimed property
    isClaimed: false
  }
];

// --- MOCK COUPONS ---
export const MOCK_COUPONS: Coupon[] = [
  {
    id: 'c1',
    companyId: 'b1',
    companyName: 'Restaurante Bacalhau do Tuga',
    companyLogo: 'https://ui-avatars.com/api/?name=BT&background=0c4a6e&color=fff',
    title: 'Moqueca de Peixe (2 Pessoas) - 30% OFF',
    description: 'Almoço completo para casal. Moqueca, arroz, pirão e farofa de dendê.',
    rules: ['Válido Seg-Sex', 'Exceto feriados', 'Bebidas à parte'],
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
  },
  {
    id: 'c2',
    companyId: 'b3',
    companyName: 'Arraial Vip Tour',
    companyLogo: 'https://ui-avatars.com/api/?name=AV&background=0ea5e9&color=fff',
    title: 'Passeio de Barco - Ingresso Duplo',
    description: 'Compre 1 ingresso adulto e o acompanhante paga meia entrada.',
    rules: ['Necessário agendamento', 'Taxa de embarque não inclusa'],
    address: 'Marina dos Pescadores - Pier 2',
    originalPrice: 200.00,
    discountedPrice: 150.00,
    discountPercentage: 25,
    imageUrl: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=80&w=800',
    category: 'Passeios',
    expiryDate: '2024-11-20',
    code: 'VIPDUPLO',
    active: true,
    rating: 5.0,
    reviews: 340
  },
  {
    id: 'c3',
    companyId: 'b4',
    companyName: 'Quiosque Onda Azul',
    companyLogo: 'https://ui-avatars.com/api/?name=OA&background=fbbf24&color=000',
    title: 'Caipirinha em Dobro no Pôr do Sol',
    description: 'Compre uma caipirinha e ganhe outra. Válido das 17h às 19h.',
    rules: ['Consumo no balcão', 'Maiores de 18 anos'],
    address: 'Orla da Praia Grande, Quiosque 12',
    originalPrice: 50.00,
    discountedPrice: 25.00,
    discountPercentage: 50,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800',
    category: 'Gastronomia',
    expiryDate: '2024-12-15',
    code: 'DOUBLECAIPI',
    active: true,
    rating: 4.5,
    reviews: 120
  },
  {
    id: 'c4',
    companyId: 'b5',
    companyName: 'Mergulho Sea Diver',
    companyLogo: 'https://ui-avatars.com/api/?name=SD&background=0284c7&color=fff',
    title: 'Batismo de Mergulho + Fotos Grátis',
    description: 'Faça seu primeiro mergulho e ganhe o pacote de fotos subaquáticas (R$ 80,00 off).',
    rules: ['Agendamento prévio', 'Sujeito a condições do mar'],
    address: 'Rua Santa Cruz, 10 - Praia dos Anjos',
    originalPrice: 350.00,
    discountedPrice: 270.00,
    discountPercentage: 23,
    imageUrl: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?auto=format&fit=crop&q=80&w=800',
    category: 'Passeios',
    expiryDate: '2025-01-10',
    code: 'DIVEPHOTO',
    active: true,
    rating: 5.0,
    reviews: 95
  },
  {
    id: 'c5',
    companyId: 'b2',
    companyName: 'Pousada Caminho do Sol',
    companyLogo: 'https://ui-avatars.com/api/?name=CS&background=f59e0b&color=fff',
    title: 'Fim de Semana Romântico (2 Diárias)',
    description: 'Pacote Sex-Dom para casal com decoração especial e late checkout.',
    rules: ['Não válido feriados', 'Check-in sexta 14h'],
    address: 'Rua do Sol, 55 - Prainha',
    originalPrice: 800.00,
    discountedPrice: 600.00,
    discountPercentage: 25,
    imageUrl: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80&w=800',
    category: 'Hospedagem',
    expiryDate: '2024-11-30',
    code: 'LOVEWEEK',
    active: true,
    rating: 4.8,
    reviews: 200
  },
  {
    id: 'c6',
    companyId: 'b6',
    companyName: 'Sorveteria Gelato Real',
    companyLogo: 'https://ui-avatars.com/api/?name=GR&background=ec4899&color=fff',
    title: '2 Taças Sundae pelo preço de 1',
    description: 'Adoçe sua tarde. Válido para qualquer sabor de sundae.',
    rules: ['Segunda a Quinta'],
    address: 'Praça do Cova, Centro',
    originalPrice: 40.00,
    discountedPrice: 20.00,
    discountPercentage: 50,
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=800',
    category: 'Gastronomia',
    expiryDate: '2024-12-01',
    code: 'SUNDAE2X1',
    active: true,
    rating: 4.7,
    reviews: 410
  }
];

// --- BLOG POSTS ---
export const MOCK_POSTS: BlogPost[] = [
  {
    id: 'p1',
    title: 'As 5 Praias Mais Bonitas de Arraial (Além do óbvio)',
    excerpt: 'Todo mundo conhece o Forno e a Ilha do Farol, mas você já visitou essas joias escondidas?',
    content: '...',
    imageUrl: 'https://images.unsplash.com/photo-1590089415225-401cd6f9ad5d?auto=format&fit=crop&q=80&w=800',
    category: 'Roteiro',
    date: '12/05/2024',
    author: 'Ana Terra',
    authorId: 'creator1'
  },
  {
    id: 'p2',
    title: 'Onde comer barato e bem em Arraial do Cabo',
    excerpt: 'Guia gastronômico para economizar sem abrir mão do sabor. Pratos feitos, petiscos e mais.',
    content: '...',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800',
    category: 'Dica',
    date: '10/05/2024',
    author: 'Ana Terra',
    authorId: 'creator1'
  },
  {
    id: 'p3',
    title: 'Trilha da Praia do Forno: Tudo que você precisa saber',
    excerpt: 'Nível de dificuldade, melhores horários e o que levar na mochila para essa aventura.',
    content: '...',
    imageUrl: 'https://images.unsplash.com/photo-1504519632431-7e8c15923832?auto=format&fit=crop&q=80&w=800',
    category: 'Roteiro',
    date: '05/05/2024',
    author: 'Equipe Conecta'
  }
];
