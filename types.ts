
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  COMPANY = 'COMPANY',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface UserPermissions {
  canCreateCoupons: boolean;
  canManageBusiness: boolean; // Guide profile
  canManageBlog?: boolean; // Super admin mostly
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
  
  // New Control Fields
  maxCoupons?: number; // Limit of active coupons
  permissions?: UserPermissions;
  isBlocked?: boolean; // Bloqueio de acesso
  
  // Favorites
  favorites?: {
      coupons: string[];
      businesses: string[];
  };
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
  couponId?: string; // Added for limit tracking
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
  
  // --- SCARCITY LOGIC ---
  maxRedemptions?: number; // Total supply (e.g., 100 coupons available)
  currentRedemptions?: number; // How many claimed so far
  limitPerUser?: number; // How many a single user can claim (e.g., 1 per person)
}

// --- NEW CONFIGURATION TYPES ---
export interface AppCategory {
  id: string;
  name: string;
  subcategories?: string[]; // NOVO: Lista de subcategorias (tags)
}

export interface AppLocation {
  id: string;
  name: string;
  active: boolean;
  lat?: number; // Center latitude of the neighborhood
  lng?: number; // Center longitude of the neighborhood
}

export interface AppAmenity {
  id: string;
  label: string;
  icon?: string; // string identifier for icon component
}

export interface FeaturedConfig {
    title: string;
    subtitle: string;
    imageUrl: string;
    buttonText: string;
}

export interface AppConfig {
    appName: string;
    appNameHighlight: string; // The part in Gold/Color
    logoUrl?: string; // Navbar logo
    loginLogoUrl?: string; // Large logo for login/subscribe
    faviconUrl?: string; // Browser tab icon
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

// --- NEW TYPES FOR GUIDE & BLOG ---

export interface MenuItem {
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

export interface BusinessProfile {
  id: string; // Should match User ID for simplicity in 1-to-1 relation
  name: string;
  category: string; // Gastronomia, Hotel, etc.
  subcategory?: string; // NOVO: Subcategoria específica
  description: string;
  coverImage: string;
  gallery: string[];
  address: string;
  locationId?: string; // Links to AppLocation
  phone: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  amenities: string[]; // array of AppAmenity IDs
  openingHours: { [key: string]: string }; // e.g., "Seg-Sex": "09:00 - 18:00"
  menu?: MenuSection[];
  reviews?: Review[];
  rating: number;
  reviewCount?: number;
  isOpenNow?: boolean; // Mock helper
  lat?: number; // GPS Latitude
  lng?: number; // GPS Longitude
  
  // Analytics
  views?: number;
  socialClicks?: {
      whatsapp?: number;
      instagram?: number;
      website?: number;
      phone?: number;
      map?: number;
  };
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  businessIds: string[]; // List of BusinessProfile IDs included in this collection
  featured?: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string; // HTML or Markdown
  imageUrl: string;
  category: 'Roteiro' | 'Dica' | 'Notícia' | 'Curiosidade';
  date: string;
  author: string;
}

// DEFAULT FALLBACKS (Used if DB is empty)
// Core categories that cannot be deleted
export const PROTECTED_CATEGORIES = ['Gastronomia', 'Hospedagem', 'Comércio', 'Serviços'];

export const DEFAULT_CATEGORIES = [
    ...PROTECTED_CATEGORIES,
    'Passeios', 
    'Entretenimento'
];

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
