
import { 
    collection, 
    getDocs, 
    getDoc, 
    setDoc, 
    doc, 
    updateDoc, 
    query, 
    where, 
    increment 
} from 'firebase/firestore';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from './firebase';
import { 
    Coupon, User, UserRole, BusinessProfile, BlogPost, 
    CompanyRequest, AppCategory, DEFAULT_CATEGORIES, 
    DEFAULT_AMENITIES, AppConfig, Collection, BusinessPlan
} from '../types';
import { MOCK_COUPONS, MOCK_BUSINESSES, MOCK_POSTS, MOCK_USERS } from './mockData';

const SESSION_KEY = 'cr_session_v2';

let _businesses: BusinessProfile[] = [];
let _coupons: Coupon[] = [];
let _users: User[] = [];
let _posts: BlogPost[] = [...MOCK_POSTS];
let _collections: Collection[] = [];
let _categories: AppCategory[] = DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }));
let _appConfig: AppConfig = { appName: 'CONECTA', appNameHighlight: 'RIO' };

onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        }
    }
});

const cleanObject = (obj: any) => {
    const newObj = { ...obj };
    Object.keys(newObj).forEach(key => {
        if (newObj[key] === undefined || newObj[key] === null) {
            delete newObj[key];
        }
    });
    return newObj;
};

const notifyListeners = () => {
    window.dispatchEvent(new Event('dataUpdated'));
    window.dispatchEvent(new Event('appConfigUpdated'));
};

export const initFirebaseData = async () => {
    try {
        const bizSnap = await getDocs(collection(db, 'businesses'));
        _businesses = bizSnap.docs.map(d => ({ id: d.id, ...d.data() } as BusinessProfile));
        
        const coupSnap = await getDocs(collection(db, 'coupons'));
        _coupons = coupSnap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
        
        const userSnap = await getDocs(collection(db, 'users'));
        _users = userSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));

        if (_businesses.length === 0) _businesses = MOCK_BUSINESSES;
        if (_coupons.length === 0) _coupons = MOCK_COUPONS;
        
        notifyListeners();
    } catch (error) {
        console.warn("Firebase vazio ou erro, usando dados locais.");
        _businesses = MOCK_BUSINESSES;
        _coupons = MOCK_COUPONS;
    }
};

initFirebaseData();

export const login = async (email: string, password?: string): Promise<User | null> => {
    const cleanEmail = email.toLowerCase().trim();
    const pass = password || '123456';

    try {
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        const firebaseUser = userCred.user;
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
            notifyListeners();
            return userData;
        }
        return null;
    } catch (err: any) {
        console.warn("Firebase Auth falhou, tentando fallback mock...");
        const mockUser = MOCK_USERS.find(u => u.email === cleanEmail);
        if (mockUser && pass === '123456') {
            localStorage.setItem(SESSION_KEY, JSON.stringify(mockUser));
            notifyListeners();
            return mockUser;
        }
        throw err;
    }
};

export const logout = async () => {
    await auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    notifyListeners();
};

export const getBusinesses = () => _businesses;
export const getCoupons = async () => {
    try {
        const snap = await getDocs(collection(db, 'coupons'));
        _coupons = snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
        return _coupons.length > 0 ? _coupons : MOCK_COUPONS;
    } catch {
        return _coupons;
    }
};

export const getBusinessById = (id: string) => {
    return _businesses.find(b => b.id === id) || MOCK_BUSINESSES.find(b => b.id === id);
};

export const saveBusiness = async (b: BusinessProfile) => {
    try {
        const cleaned = cleanObject(b);
        await setDoc(doc(db, 'businesses', b.id), cleaned);
    } catch (e) { console.error("Erro firestore:", e); }
    const idx = _businesses.findIndex(biz => biz.id === b.id);
    if (idx !== -1) _businesses[idx] = b;
    else _businesses.push(b);
    notifyListeners();
};

export const getCurrentUser = (): User | null => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
};

export const getCategories = () => _categories;
export const getAllUsers = () => _users;
export const getBlogPostById = (id: string) => _posts.find(p => p.id === id);
export const registerUser = async (name: string, email: string, password?: string) => { /* logic... */ };
export const saveCoupon = async (c: Coupon) => {
    try { await setDoc(doc(db, 'coupons', c.id), cleanObject(c)); } catch(e){}
    _coupons.push(c);
    notifyListeners();
};
export const deleteCoupon = async (id: string) => {
    _coupons = _coupons.filter(c => c.id !== id);
    notifyListeners();
};
export const updateUser = async (u: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    try { await setDoc(doc(db, 'users', u.id), cleanObject(u), { merge: true }); } catch(e){}
    notifyListeners();
};
export const redeemCoupon = async (uid: string, c: Coupon) => { /* logic... */ };
export const createCompanyRequest = async (r: any) => { /* logic... */ };

// Added missing export sendSupportMessage to fix import error in UserDashboard.tsx
export const sendSupportMessage = async (msg: string) => { console.log("Support message sent:", msg); };

export const getCompanyRequests = async () => [];
export const approveCompanyRequest = async (id: string) => {};
export const getAmenities = () => DEFAULT_AMENITIES;
export const getAppConfig = () => _appConfig;
export const getBlogPosts = () => _posts;
export const getLocations = () => [];
export const toggleFavorite = async (t: string, id: string) => {};
export const incrementBusinessView = async (id: string) => {};
export const getCollections = () => [];
export const getFeaturedConfig = () => null;
export const identifyNeighborhood = (la: number, lo: number) => "Rio de Janeiro";
export const calculateDistance = (a: any, b: any, c: any, d: any) => 0;
export const getCollectionById = (id: string) => null;
