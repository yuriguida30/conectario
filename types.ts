
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  COMPANY = 'COMPANY',
  SUPER_ADMIN = 'SUPER_ADMIN',
  CONTENT_CREATOR = 'CONTENT_CREATOR',
}

export interface UserPermissions {
  canCreateCoupons: boolean;
  canManageBusiness: boolean;
  canManageBlog?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isPrime?: boolean;
  savedAmount?: number;
  history?: SavingsRecord[];
  companyName?: string;
  category?: string;
  phone?: string;
  maxCoupons?: number;
  permissions?: UserPermissions;
  isBlocked?: boolean;
  profession?: string;
  bio?: string;
  instagram?: string;
  website?: string;
  favorites?: {
      coupons: string[];
      businesses: string[];
  };
}

export interface BusinessProfile {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  coverImage: string;
  gallery: string[];
  address: string;
  locationId?: string;
  phone: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  amenities: string[];
  openingHours: { [key: string]: string };
  menu?: MenuSection[];
  reviews?: Review[];
  rating: number;
  reviewCount?: number;
  isOpenNow?: boolean;
  isFeatured?: boolean;
  lat?: number;
  lng?: number;
  views?: number;
  // --- CAMPOS IA & REIVINDICAÇÃO ---
  isClaimed: boolean;
  isImported?: boolean;
  claimedBy?: string; 
  socialClicks?: {
      whatsapp?: number;
      instagram?: number;
      website?: number;
      phone?: number;
      map?: number;
  };
}

export interface BusinessClaimRequest {
    id: string;
    businessId: string;
    businessName: string;
    requesterName: string;
    requesterEmail: string;
    requesterPhone: string;
    documentProofUrl?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    date: string;
}

export interface CompanyRequest {
  id: string;
  companyName: string;
  ownerName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  document: string;
  category: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestDate: string;
}

export interface SavingsRecord {
  date: string;
  amount: number;
  couponTitle: string;
  couponId?: string;
}

export interface Coupon {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  title: string;
  description: string;
  rules?: string[];
  address?: string;
  lat?: number;
  lng?: number;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  imageUrl: string;
  category: string;
  expiryDate: string;
  code: string;
  active: boolean;
  rating?: number;
  reviews?: number;
  maxRedemptions?: number;
  currentRedemptions?: number;
  limitPerUser?: number;
}

export interface AppCategory {
  id: string;
  name: string;
  subcategories?: string[];
}

export interface AppLocation {
  id: string;
  name: string;
  active: boolean;
  lat?: number;
  lng?: number;
}

export interface AppAmenity {
  id: string;
  label: string;
  icon?: string;
}

export interface FeaturedConfig {
    title: string;
    subtitle: string;
    imageUrl: string;
    buttonText: string;
}

export interface AppConfig {
    appName: string;
    appNameHighlight: string;
    logoUrl?: string;
    loginLogoUrl?: string;
    faviconUrl?: string;
}

export interface SupportMessage {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    message: string;
    date: string;
    status: 'OPEN' | 'RESOLVED';
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
}

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'BILLING';

export interface TableItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  addedAt: string;
}

export interface Table {
  id: string;
  number: number;
  status: TableStatus;
  items: TableItem[];
  total: number;
  openedAt?: string;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  businessIds: string[];
  featured?: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  category: 'Roteiro' | 'Dica' | 'Notícia' | 'Curiosidade';
  date: string;
  author: string;
  authorId?: string;
}

export const PROTECTED_CATEGORIES = ['Gastronomia', 'Hospedagem', 'Comércio', 'Serviços'];
export const DEFAULT_CATEGORIES = [...PROTECTED_CATEGORIES, 'Passeios', 'Entretenimento'];
export const DEFAULT_AMENITIES: AppAmenity[] = [
    { id: 'wifi', label: 'Wi-Fi Grátis' },
    { id: 'ac', label: 'Ar Condicionado' },
    { id: 'parking', label: 'Estacionamento' },
    { id: 'access', label: 'Acessibilidade' },
    { id: 'kids', label: 'Espaço Kids' },
    { id: 'pet', label: 'Pet Friendly' },
    { id: 'pool', label: 'Piscina' },
    { id: 'breakfast', label: 'Café da Manhã' },
    { id: 'tv', label: 'Televisão' },
    { id: 'bar', label: 'Bar no Local' },
    { id: 'card', label: 'Aceita Cartão' },
    { id: 'delivery', label: 'Faz Entrega' }
];

export const AMENITIES_LABELS: Record<string, string> = DEFAULT_AMENITIES.reduce((acc, curr) => {
    acc[curr.id] = curr.label;
    return acc;
}, {} as Record<string, string>);
