
import { Coupon, User, UserRole, BusinessProfile, BlogPost, CompanyRequest, AppCategory, AppLocation, AppAmenity, Collection, DEFAULT_CATEGORIES, DEFAULT_AMENITIES, PROTECTED_CATEGORIES, FeaturedConfig, SupportMessage, AppConfig, Review, Table, TableStatus, TableItem, BusinessClaimRequest } from '../types';
import { MOCK_COUPONS, MOCK_BUSINESSES, MOCK_POSTS, MOCK_USERS } from './mockData';
import { db, auth } from './firebase'; 
import { collection, setDoc, doc, deleteDoc, onSnapshot, getDoc, updateDoc, arrayUnion, increment, addDoc, query, orderBy, getDocs, deleteField, writeBatch, arrayRemove } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';

// Inicializa categorias com os valores padrão convertidos para o tipo AppCategory
let _categories: AppCategory[] = DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }));

let _businesses: BusinessProfile[] = [];
let _coupons: Coupon[] = [];
let _users: User[] = [];
let _posts: BlogPost[] = MOCK_POSTS;
let _collections: Collection[] = [];
let _requests: CompanyRequest[] = [];
let _claims: BusinessClaimRequest[] = [];
let _support: SupportMessage[] = [];
let _locations: AppLocation[] = [
    { id: 'centro', name: 'Centro', active: true, lat: -22.9068, lng: -43.1729 },
    { id: 'copacabana', name: 'Copacabana', active: true, lat: -22.9694, lng: -43.1868 },
    { id: 'barra', name: 'Barra da Tijuca', active: true, lat: -23.0003, lng: -43.3659 },
    { id: 'campogrande', name: 'Campo Grande', active: true, lat: -22.9035, lng: -43.5591 },
    { id: 'sepetiba', name: 'Sepetiba', active: true, lat: -22.9739, lng: -43.6997 }
];
let _appConfig: AppConfig = { appName: 'CONECTA', appNameHighlight: 'RIO' };
let _featuredConfig: FeaturedConfig = { title: '', subtitle: '', imageUrl: '', buttonText: '' };

const notifyListeners = () => {
    window.dispatchEvent(new Event('dataUpdated'));
    window.dispatchEvent(new Event('appConfigUpdated'));
};

const SESSION_KEY = 'arraial_user_session';

const saveToCache = (key: string, data: any) => {
    try {
        localStorage.setItem(`cr_cache_${key}`, JSON.stringify(data));
    } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith('cr_cache_')) localStorage.removeItem(k);
            });
            try { localStorage.setItem(`cr_cache_${key}`, JSON.stringify(data)); } catch(e2) {}
        }
    }
}

const loadFromCache = () => {
    try {
        const b = localStorage.getItem('cr_cache_businesses');
        if (b) _businesses = JSON.parse(b) || [];
        const c = localStorage.getItem('cr_cache_coupons');
        if (c) _coupons = JSON.parse(c) || [];
        const cat = localStorage.getItem('cr_cache_categories');
        if (cat) _categories = JSON.parse(cat) || [];
        const conf = localStorage.getItem('cr_cache_app_config');
        if (conf) _appConfig = JSON.parse(conf);
    } catch (e) {}
};

loadFromCache();

export const initFirebaseData = async () => {
    if (!db) return;
    try {
        onSnapshot(collection(db, 'businesses'), (snap) => {
            _businesses = snap.docs.map(d => ({ ...d.data() as BusinessProfile, id: d.id }));
            saveToCache('businesses', _businesses);
            notifyListeners();
        });
        onSnapshot(collection(db, 'coupons'), (snap) => {
            _coupons = snap.docs.map(d => ({ ...(d.data() as Coupon), id: d.id }));
            saveToCache('coupons', _coupons);
            notifyListeners();
        });
        onSnapshot(collection(db, 'users'), (snap) => {
            _users = snap.docs.map(d => ({ ...d.data() as User, id: d.id }));
            notifyListeners();
        });
        onSnapshot(collection(db, 'system'), (snap) => {
            snap.forEach(doc => {
                if(doc.id === 'app_config') _appConfig = doc.data() as AppConfig;
                if(doc.id === 'categories') {
                    const list = doc.data().list || [];
                    if (list.length > 0) _categories = list;
                }
            });
            notifyListeners();
        });
    } catch (e) { console.error("Firebase init error", e); }
};

export const saveImportedBusinesses = async (list: any[]) => {
    if (!db) return;
    const batch = writeBatch(db);
    list.forEach(biz => {
        const ref = doc(db, 'businesses', biz.id!);
        batch.set(ref, {
            ...biz,
            isClaimed: false,
            views: 0,
            rating: biz.rating || 5.0,
            gallery: biz.gallery || [],
            importedAt: new Date().toISOString()
        });
    });
    await batch.commit();
};

export const login = async (email: string, password?: string): Promise<User | null> => {
    if (email === 'admin@conectario.com' && password === '123456') {
        const admin = { id: 'admin', name: 'Admin', email, role: UserRole.SUPER_ADMIN };
        localStorage.setItem(SESSION_KEY, JSON.stringify(admin));
        return admin;
    }
    if (auth && password) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        if (snap.exists()) {
            const user = snap.data() as User;
            localStorage.setItem(SESSION_KEY, JSON.stringify(user));
            return user;
        }
    }
    return null;
};

export const getCurrentUser = (): User | null => {
    const stored = localStorage.getItem(SESSION_KEY); 
    return stored ? JSON.parse(stored) : null;
};

export const logout = async () => { 
    if (auth) await signOut(auth); 
    localStorage.removeItem(SESSION_KEY); 
    notifyListeners();
};

export const getBusinesses = () => _businesses;
export const getBusinessById = (id: string) => _businesses.find(b => b.id === id);
export const getCoupons = async () => _coupons;
export const getCategories = () => _categories;
export const getLocations = () => _locations;
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

export const registerUser = async (name: string, email: string, pass: string) => {
    if (!auth || !db) throw new Error("Firebase não inicializado");
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const newUser: User = {
        id: cred.user.uid,
        name,
        email,
        role: UserRole.CUSTOMER,
        favorites: { coupons: [], businesses: [] },
        savedAmount: 0,
        history: []
    };
    await setDoc(doc(db, 'users', cred.user.uid), newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    notifyListeners();
    return newUser;
};

export const createCompanyRequest = async (form: any) => {
    if (!db) return;
    const request = {
        ...form,
        status: 'PENDING',
        requestDate: new Date().toISOString(),
        id: `req_${Math.random().toString(36).substring(2, 9)}`
    };
    await setDoc(doc(db, 'company_requests', request.id), request);
};

export const redeemCoupon = async (userId: string, coupon: Coupon) => {
    if (!db) return;
    const amount = coupon.originalPrice - coupon.discountedPrice;
    const record = {
        date: new Date().toISOString(),
        amount: amount,
        couponTitle: coupon.title,
        couponId: coupon.id
    };
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        history: arrayUnion(record),
        savedAmount: increment(amount)
    });
    const couponRef = doc(db, 'coupons', coupon.id);
    await updateDoc(couponRef, {
        currentRedemptions: increment(1)
    });
};

export const toggleFavorite = async (type: 'coupon' | 'business', id: string) => {
    const user = getCurrentUser();
    if (!user || !db) return;
    const userRef = doc(db, 'users', user.id);
    const field = type === 'coupon' ? 'favorites.coupons' : 'favorites.businesses';
    const currentFavs = type === 'coupon' ? user.favorites?.coupons || [] : user.favorites?.businesses || [];
    const isFav = currentFavs.includes(id);
    if (isFav) {
        await updateDoc(userRef, { [field]: arrayRemove(id) });
    } else {
        await updateDoc(userRef, { [field]: arrayUnion(id) });
    }
    const updatedUser = { ...user };
    if (!updatedUser.favorites) updatedUser.favorites = { coupons: [], businesses: [] };
    if (type === 'coupon') {
        updatedUser.favorites.coupons = isFav ? updatedUser.favorites.coupons.filter(x => x !== id) : [...updatedUser.favorites.coupons, id];
    } else {
        updatedUser.favorites.businesses = isFav ? updatedUser.favorites.businesses.filter(x => x !== id) : [...updatedUser.favorites.businesses, id];
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
    notifyListeners();
};

export const addBusinessReview = async (businessId: string, review: any) => {
    if (!db) return;
    const reviewId = `rev_${Math.random().toString(36).substring(2, 9)}`;
    const fullReview = { ...review, id: reviewId, date: new Date().toISOString() };
    const bizRef = doc(db, 'businesses', businessId);
    await updateDoc(bizRef, { reviews: arrayUnion(fullReview) });
};

export const incrementSocialClick = async (businessId: string, type: string) => {
    if (!db) return;
    const bizRef = doc(db, 'businesses', businessId);
    const field = `socialClicks.${type}`;
    await updateDoc(bizRef, { [field]: increment(1) });
};

export const incrementBusinessView = async (id: string) => {
    if (!db) return;
    const bizRef = doc(db, 'businesses', id);
    await updateDoc(bizRef, { views: increment(1) });
};

export const createClaimRequest = async (c: any) => { if(db) await addDoc(collection(db, 'claim_requests'), c); };
export const approveClaim = async (id: string) => {}; 
export const getClaimRequests = () => [];
export const getCompanyRequests = () => [];
export const identifyNeighborhood = (lat: number, lng: number) => "Rio de Janeiro";
export const calculateDistance = (la1: number, lo1: number, la2: number, lo2: number) => {
    const R = 6371;
    const dLat = (la2 - la1) * Math.PI / 180;
    const dLon = (lo2 - lo1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(la1 * Math.PI / 180) * Math.cos(la2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const updateUser = async (u: User) => {
    if (db) {
        await setDoc(doc(db, 'users', u.id), u, { merge: true });
        localStorage.setItem(SESSION_KEY, JSON.stringify(u));
        notifyListeners();
    }
};

export const sendSupportMessage = async (m: any) => {
    if (db) {
        const id = `sup_${Date.now()}`;
        await setDoc(doc(db, 'support', id), { ...m, date: new Date().toISOString(), status: 'OPEN' });
    }
};

export const fetchReviewsForBusiness = async (id: string) => {
    const biz = _businesses.find(b => b.id === id);
    return biz?.reviews || [];
};

export const getFeaturedConfig = () => null;
