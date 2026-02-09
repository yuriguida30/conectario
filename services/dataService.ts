
import { Coupon, User, UserRole, BusinessProfile, BlogPost, CompanyRequest, AppCategory, AppLocation, AppAmenity, Collection, DEFAULT_CATEGORIES, DEFAULT_AMENITIES, AppConfig, Review, SavingsRecord } from '../types';
import { MOCK_COUPONS, MOCK_BUSINESSES, MOCK_POSTS, MOCK_USERS } from './mockData';

const INITIAL_CATEGORIES: AppCategory[] = DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }));

let _categories: AppCategory[] = [...INITIAL_CATEGORIES];
let _businesses: BusinessProfile[] = [...MOCK_BUSINESSES];
let _coupons: Coupon[] = [...MOCK_COUPONS];
let _users: User[] = [...MOCK_USERS];
let _posts: BlogPost[] = [...MOCK_POSTS];
let _companyRequests: CompanyRequest[] = [];
let _locations: AppLocation[] = [
    { id: 'centro', name: 'Centro', active: true, lat: -22.9068, lng: -43.1729 },
    { id: 'copacabana', name: 'Copacabana', active: true, lat: -22.9694, lng: -43.1868 },
    { id: 'barra', name: 'Barra da Tijuca', active: true, lat: -23.0003, lng: -43.3659 }
];
let _appConfig: AppConfig = { appName: 'CONECTA', appNameHighlight: 'RIO' };

const notifyListeners = () => {
    window.dispatchEvent(new Event('dataUpdated'));
    window.dispatchEvent(new Event('appConfigUpdated'));
};

const SESSION_KEY = 'arraial_user_session';

export const getCategories = () => _categories;
export const getLocations = () => _locations;
export const getBusinesses = () => _businesses;
export const getCoupons = async () => _coupons;
export const getCurrentUser = (): User | null => {
    const stored = localStorage.getItem(SESSION_KEY); 
    return stored ? JSON.parse(stored) : null;
};
export const login = async (email: string, password?: string): Promise<User | null> => {
    if (email === 'admin@conectario.com' && password === '123456') {
        const admin = { id: 'admin', name: 'Admin', email, role: UserRole.SUPER_ADMIN };
        localStorage.setItem(SESSION_KEY, JSON.stringify(admin));
        return admin;
    }
    // Simple mock login for companies
    if (email === 'empresa@email.com' && password === '123456') {
        const comp = _users.find(u => u.email === email);
        if (comp) localStorage.setItem(SESSION_KEY, JSON.stringify(comp));
        return comp || null;
    }
    return null;
};
export const logout = async () => { localStorage.removeItem(SESSION_KEY); notifyListeners(); };

// Added missing registerUser function
export const registerUser = async (name: string, email: string, password?: string): Promise<User> => {
    const newUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        name,
        email,
        role: UserRole.CUSTOMER,
        savedAmount: 0,
        history: [],
        favorites: { coupons: [], businesses: [] }
    };
    _users.push(newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    notifyListeners();
    return newUser;
};

export const getBusinessById = (id: string) => _businesses.find(b => b.id === id);

// Added missing getBlogPostById function
export const getBlogPostById = (id: string) => _posts.find(p => p.id === id);

// Added missing getCollectionById function
export const getCollectionById = (id: string) => (getCollections() as Collection[]).find(c => c.id === id);

export const getAmenities = () => DEFAULT_AMENITIES;
export const getAllUsers = () => _users;
export const getAppConfig = () => _appConfig;
export const getBlogPosts = () => _posts;
export const getCollections = () => [];
export const getFeaturedConfig = () => null;

export const saveBusiness = async (b: BusinessProfile) => { 
    const idx = _businesses.findIndex(biz => biz.id === b.id);
    if (idx !== -1) _businesses[idx] = b;
    else _businesses.push(b);
    notifyListeners();
};

export const saveCoupon = async (c: Coupon) => { 
    const idx = _coupons.findIndex(cp => cp.id === c.id);
    if (idx !== -1) _coupons[idx] = c;
    else _coupons.push(c);
    notifyListeners();
};

export const deleteCoupon = async (id: string) => { 
    _coupons = _coupons.filter(c => c.id !== id);
    notifyListeners();
};

export const updateUser = async (u: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    const idx = _users.findIndex(user => user.id === u.id);
    if (idx !== -1) _users[idx] = u;
    notifyListeners();
};

export const redeemCoupon = async (userId: string, coupon: Coupon) => {
    const user = getCurrentUser();
    if (!user || user.id !== userId) return;
    const amount = coupon.originalPrice - coupon.discountedPrice;
    const updatedUser: User = {
        ...user,
        savedAmount: (user.savedAmount || 0) + amount,
        history: [...(user.history || []), { date: new Date().toISOString(), amount, couponTitle: coupon.title, couponId: coupon.id }]
    };
    await updateUser(updatedUser);
};

export const createCompanyRequest = async (req: any) => { 
    _companyRequests.push({ ...req, id: Math.random().toString(36), status: 'PENDING', requestDate: new Date().toISOString() });
    notifyListeners();
};

export const getCompanyRequests = () => _companyRequests;
export const approveCompanyRequest = (id: string) => {
    const req = _companyRequests.find(r => r.id === id);
    if (req) {
        req.status = 'APPROVED';
        // Mocking user creation
        const newUser: User = {
            id: `comp_${req.id}`,
            name: req.ownerName,
            email: req.email,
            role: UserRole.COMPANY,
            companyName: req.companyName,
            category: req.category,
            permissions: { canCreateCoupons: true, canManageBusiness: true }
        };
        _users.push(newUser);
        const newBiz: BusinessProfile = {
            id: newUser.id,
            name: req.companyName,
            category: req.category,
            description: req.description,
            coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
            gallery: [],
            address: 'Pendente',
            phone: req.phone,
            whatsapp: req.whatsapp || req.phone,
            amenities: [],
            openingHours: {},
            rating: 5.0,
            isOpenNow: true
        };
        _businesses.push(newBiz);
        notifyListeners();
    }
};

export const identifyNeighborhood = (lat: number, lng: number) => "Rio de Janeiro";
export const calculateDistance = (la1: number, lo1: number, la2: number, lo2: number) => 0;
export const initFirebaseData = async () => {};
export const sendSupportMessage = async (m: any) => {};
export const fetchReviewsForBusiness = async (id: string) => [];
export const toggleFavorite = async (type: string, id: string) => {};
export const addBusinessReview = async (bid: string, r: any) => {};
export const incrementBusinessView = async (id: string) => {};
export const incrementSocialClick = async (bid: string, t: string) => {};
