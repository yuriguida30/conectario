
import { Coupon, User, UserRole, BusinessProfile, BlogPost, CompanyRequest, AppCategory, AppLocation, AppAmenity, Collection, DEFAULT_CATEGORIES, DEFAULT_AMENITIES, PROTECTED_CATEGORIES, FeaturedConfig, SupportMessage, AppConfig, Review, Table, TableStatus, TableItem, BusinessClaimRequest, SavingsRecord } from '../types';
import { MOCK_COUPONS, MOCK_BUSINESSES, MOCK_POSTS, MOCK_USERS } from './mockData';
import { db, auth } from './firebase'; 
import { collection, setDoc, doc, deleteDoc, onSnapshot, getDoc, updateDoc, arrayUnion, increment, addDoc, query, orderBy, getDocs, deleteField, writeBatch, arrayRemove } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';

const INITIAL_CATEGORIES: AppCategory[] = DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }));

let _categories: AppCategory[] = [...INITIAL_CATEGORIES];
let _businesses: BusinessProfile[] = [...MOCK_BUSINESSES]; // Garantindo que as empresas mockadas apareçam
let _coupons: Coupon[] = [...MOCK_COUPONS]; // FIX: Restaurado para carregar os cupons iniciais
let _users: User[] = [...MOCK_USERS];
let _posts: BlogPost[] = [...MOCK_POSTS];
let _collections: Collection[] = [];
let _locations: AppLocation[] = [
    { id: 'centro', name: 'Centro', active: true, lat: -22.9068, lng: -43.1729 },
    { id: 'copacabana', name: 'Copacabana', active: true, lat: -22.9694, lng: -43.1868 },
    { id: 'barra', name: 'Barra da Tijuca', active: true, lat: -23.0003, lng: -43.3659 },
    { id: 'campogrande', name: 'Campo Grande', active: true, lat: -22.9035, lng: -43.5591 },
    { id: 'sepetiba', name: 'Sepetiba', active: true, lat: -22.9739, lng: -43.6997 }
];
let _appConfig: AppConfig = { appName: 'CONECTA', appNameHighlight: 'RIO' };

const notifyListeners = () => {
    window.dispatchEvent(new Event('dataUpdated'));
    window.dispatchEvent(new Event('appConfigUpdated'));
};

const SESSION_KEY = 'arraial_user_session';

export const getAIsessionCache = (neighborhood: string, category: string) => {
    try {
        const cacheKey = `cr_discovery_${neighborhood}_${category}`.toLowerCase().replace(/\s/g, '_');
        const cached = localStorage.getItem(cacheKey);
        return cached ? JSON.parse(cached) : null;
    } catch (e) { return null; }
};

export const setAIsessionCache = (neighborhood: string, category: string, data: any) => {
    try {
        const cacheKey = `cr_discovery_${neighborhood}_${category}`.toLowerCase().replace(/\s/g, '_');
        localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {}
};

export const initFirebaseData = async () => {
    if (!db) return;
    try {
        onSnapshot(collection(db, 'businesses'), (snap) => {
            const fbBiz = snap.docs.map(d => ({ ...d.data() as BusinessProfile, id: d.id }));
            if (fbBiz.length > 0) _businesses = fbBiz;
            notifyListeners();
        });
        onSnapshot(collection(db, 'coupons'), (snap) => {
            const fbCoupons = snap.docs.map(d => ({ ...d.data() as Coupon, id: d.id }));
            if (fbCoupons.length > 0) _coupons = fbCoupons;
            notifyListeners();
        });
    } catch (e) { console.error("Firebase fail", e); }
};

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
    return null;
};
export const logout = async () => { localStorage.removeItem(SESSION_KEY); notifyListeners(); };
export const saveImportedBusinesses = async (list: any[]) => {
    if (!db) return;
    const batch = writeBatch(db);
    list.forEach(biz => {
        const ref = doc(db, 'businesses', biz.id!);
        batch.set(ref, { ...biz, isClaimed: false, views: 0, rating: biz.rating || 5.0, gallery: biz.gallery || [] });
    });
    await batch.commit();
};

export const getBusinessById = (id: string) => _businesses.find(b => b.id === id);
export const getAmenities = () => DEFAULT_AMENITIES;
export const getAllUsers = () => _users;
export const getAppConfig = () => _appConfig;
export const getBlogPosts = () => _posts;
export const getBlogPostById = (id: string) => _posts.find(p => p.id === id);
export const getCollections = () => _collections;
export const getCollectionById = (id: string) => _collections.find(c => c.id === id);
export const saveBusiness = async (b: BusinessProfile) => { if(db) await setDoc(doc(db, 'businesses', b.id), b, {merge:true}); };
export const saveCoupon = async (c: Coupon) => { if(db) await setDoc(doc(db, 'coupons', c.id), c, {merge:true}); };
export const deleteCoupon = async (id: string) => { if(db) await deleteDoc(doc(db, 'coupons', id)); };
export const registerUser = async (n: string, e: string, p: string) => { return null; };
export const identifyNeighborhood = (lat: number, lng: number) => "Rio de Janeiro";
export const calculateDistance = (la1: number, lo1: number, la2: number, lo2: number) => 0;
export const updateUser = async (u: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    // Update local mock array too
    const idx = _users.findIndex(user => user.id === u.id);
    if (idx !== -1) _users[idx] = u;
    notifyListeners();
};
export const sendSupportMessage = async (m: any) => {};
export const fetchReviewsForBusiness = async (id: string) => [];
export const toggleFavorite = async (type: string, id: string) => {};
export const addBusinessReview = async (bid: string, r: any) => {};
export const incrementBusinessView = async (id: string) => {};
export const incrementSocialClick = async (bid: string, t: string) => {};

// FIX: Added missing redeemCoupon export and implementation
export const redeemCoupon = async (userId: string, coupon: Coupon) => {
    const user = getCurrentUser();
    if (!user || user.id !== userId) return;

    const amount = coupon.originalPrice - coupon.discountedPrice;
    const record: SavingsRecord = {
        date: new Date().toISOString(),
        amount: amount,
        couponTitle: coupon.title,
        couponId: coupon.id
    };

    const updatedUser: User = {
        ...user,
        savedAmount: (user.savedAmount || 0) + amount,
        history: [...(user.history || []), record]
    };

    await updateUser(updatedUser);

    if (db) {
        try {
            const couponRef = doc(db, 'coupons', coupon.id);
            await updateDoc(couponRef, {
                currentRedemptions: increment(1)
            });
        } catch (e) {
            console.error("Firebase update failed", e);
        }
    }
    
    // Update local cached coupons
    const cIdx = _coupons.findIndex(c => c.id === coupon.id);
    if (cIdx > -1) {
        _coupons[cIdx] = { 
            ..._coupons[cIdx], 
            currentRedemptions: (_coupons[cIdx].currentRedemptions || 0) + 1 
        };
    }
    
    notifyListeners();
};

// FIX: Added missing createCompanyRequest export
export const createCompanyRequest = async (req: any) => {
    if (db) {
        await addDoc(collection(db, 'companyRequests'), {
            ...req,
            status: 'PENDING',
            requestDate: new Date().toISOString()
        });
    }
};

// FIX: Implemented createClaimRequest which was empty
export const createClaimRequest = async (c: any) => {
    if (db) {
        await addDoc(collection(db, 'claimRequests'), {
            ...c,
            status: 'PENDING',
            date: new Date().toISOString()
        });
    }
};

export const getFeaturedConfig = () => null;
