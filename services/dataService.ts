
import { Coupon, User, UserRole, BusinessProfile, BlogPost, CompanyRequest, AppCategory, AppLocation, AppAmenity, Collection, DEFAULT_CATEGORIES, DEFAULT_AMENITIES, PROTECTED_CATEGORIES, FeaturedConfig, SupportMessage, AppConfig, Review, Table, TableStatus, TableItem, BusinessClaimRequest } from '../types';
import { MOCK_COUPONS, MOCK_BUSINESSES, MOCK_POSTS, MOCK_USERS } from './mockData';
import { db, auth } from './firebase'; 
import { collection, setDoc, doc, deleteDoc, onSnapshot, getDoc, updateDoc, arrayUnion, increment, addDoc, query, orderBy, getDocs, deleteField, writeBatch, arrayRemove } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';

// CATEGORIAS PADRÃO SEMPRE DISPONÍVEIS
const INITIAL_CATEGORIES: AppCategory[] = DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }));

let _categories: AppCategory[] = [...INITIAL_CATEGORIES];
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

const notifyListeners = () => {
    window.dispatchEvent(new Event('dataUpdated'));
    window.dispatchEvent(new Event('appConfigUpdated'));
};

const SESSION_KEY = 'arraial_user_session';

const saveToCache = (key: string, data: any) => {
    try {
        localStorage.setItem(`cr_cache_${key}`, JSON.stringify(data));
    } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith('cr_cache_')) localStorage.removeItem(k);
            });
        }
    }
}

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
    } catch (e) { console.error("Firebase error", e); }
};

export const getCategories = () => _categories.length > 0 ? _categories : INITIAL_CATEGORIES;
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
export const createCompanyRequest = async (f: any) => {};
export const redeemCoupon = async (u: string, c: Coupon) => {};
export const toggleFavorite = async (t: string, id: string) => {};
export const addBusinessReview = async (b: string, r: any) => {};
export const incrementSocialClick = async (b: string, t: string) => {};
export const incrementBusinessView = async (id: string) => {};
export const createClaimRequest = async (c: any) => {};
export const approveClaim = async (id: string) => {}; 
export const getClaimRequests = () => [];
export const getCompanyRequests = () => [];
export const identifyNeighborhood = (lat: number, lng: number) => "Rio de Janeiro";
export const calculateDistance = (la1: number, lo1: number, la2: number, lo2: number) => 0;
export const updateUser = async (u: User) => {};
export const sendSupportMessage = async (m: any) => {};
export const fetchReviewsForBusiness = async (id: string) => [];
export const getFeaturedConfig = () => null;
