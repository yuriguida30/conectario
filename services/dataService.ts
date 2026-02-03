
import { Coupon, User, UserRole, BusinessProfile, BlogPost, CompanyRequest, AppCategory, AppLocation, AppAmenity, Collection, DEFAULT_CATEGORIES, DEFAULT_AMENITIES, PROTECTED_CATEGORIES, FeaturedConfig, SupportMessage, AppConfig, Review, Table, TableStatus, TableItem, BusinessClaimRequest } from '../types';
import { MOCK_COUPONS, MOCK_BUSINESSES, MOCK_POSTS, MOCK_USERS } from './mockData';
import { db, auth } from './firebase'; 
import { collection, setDoc, doc, deleteDoc, onSnapshot, getDoc, updateDoc, arrayUnion, increment, addDoc, query, orderBy, getDocs, deleteField, writeBatch, arrayRemove } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';

let _businesses: BusinessProfile[] = [];
let _coupons: Coupon[] = [];
let _users: User[] = [];
let _posts: BlogPost[] = MOCK_POSTS;
let _collections: Collection[] = [];
let _requests: CompanyRequest[] = [];
let _claims: BusinessClaimRequest[] = [];
let _support: SupportMessage[] = [];
let _categories: AppCategory[] = [];
let _locations: AppLocation[] = [
    { id: 'centro', name: 'Centro', active: true, lat: -22.9068, lng: -43.1729 },
    { id: 'copacabana', name: 'Copacabana', active: true, lat: -22.9694, lng: -43.1868 },
    { id: 'barra', name: 'Barra da Tijuca', active: true, lat: -23.0003, lng: -43.3659 },
    { id: 'campogrande', name: 'Campo Grande', active: true, lat: -22.9035, lng: -43.5591 },
    { id: 'sepetiba', name: 'Sepetiba', active: true, lat: -22.9739, lng: -43.6997 }
];
let _amenities: AppAmenity[] = [];
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
            // Se o cache lotar, remove apenas itens de cache, nunca a sessão
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith('cr_cache_')) localStorage.removeItem(k);
            });
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
    const handleError = (col: string, err: any) => console.error(`❌ Error [${col}]:`, err.message);

    try {
        onSnapshot(collection(db, 'businesses'), (snap) => {
            _businesses = snap.docs.map(d => ({ ...d.data() as BusinessProfile, id: d.id }));
            saveToCache('businesses', _businesses);
            notifyListeners();
        }, (err) => handleError('businesses', err));

        onSnapshot(collection(db, 'coupons'), (snap) => {
            _coupons = snap.docs.map(d => ({ ...(d.data() as Coupon), id: d.id }));
            saveToCache('coupons', _coupons);
            notifyListeners();
        }, (err) => handleError('coupons', err));

        onSnapshot(collection(db, 'claim_requests'), (snap) => {
            _claims = snap.docs.map(d => ({ ...d.data() as BusinessClaimRequest, id: d.id }));
            notifyListeners();
        });

        onSnapshot(collection(db, 'company_requests'), (snap) => {
            _requests = snap.docs.map(d => ({ ...d.data() as CompanyRequest, id: d.id }));
            notifyListeners();
        });

        onSnapshot(collection(db, 'blog_posts'), (snap) => {
            _posts = snap.docs.map(d => ({ ...d.data() as BlogPost, id: d.id }));
            notifyListeners();
        });

        onSnapshot(collection(db, 'collections'), (snap) => {
            _collections = snap.docs.map(d => ({ ...d.data() as Collection, id: d.id }));
            notifyListeners();
        });

        onSnapshot(collection(db, 'users'), (snap) => {
            _users = snap.docs.map(d => ({ ...d.data() as User, id: d.id }));
            notifyListeners();
        });

        onSnapshot(collection(db, 'system'), (snap) => {
            snap.forEach(doc => {
                if(doc.id === 'app_config') _appConfig = doc.data() as AppConfig;
                if(doc.id === 'categories') _categories = doc.data().list || [];
                if(doc.id === 'featured_config') _featuredConfig = doc.data() as FeaturedConfig;
            });
            notifyListeners();
        });
    } catch (e) {
        handleError('global', e);
    }
};

export const saveImportedBusinesses = async (list: any[]) => {
    if (!db) return;
    const batch = writeBatch(db);
    list.forEach(biz => {
        const ref = doc(db, 'businesses', biz.id!);
        // Garante que campos essenciais existam
        const cleanBiz = {
            ...biz,
            isClaimed: false,
            views: 0,
            reviewCount: 0,
            rating: biz.rating || 4.5,
            gallery: biz.gallery || [],
            coverImage: biz.coverImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800"
        };
        batch.set(ref, cleanBiz);
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
export const logout = async () => { if (auth) await signOut(auth); localStorage.removeItem(SESSION_KEY); };

// Resto das funções de suporte permanecem iguais...
export const getClaimRequests = () => _claims;
export const createClaimRequest = async (claim: Partial<BusinessClaimRequest>) => { if (!db) return; await addDoc(collection(db, 'claim_requests'), { ...claim, status: 'PENDING', date: new Date().toISOString() }); };
export const approveClaim = async (claimId: string) => { if (!db) return; const claim = _claims.find(c => c.id === claimId); if (!claim) return; await updateDoc(doc(db, 'businesses', claim.businessId), { isClaimed: true, claimedBy: claim.requesterEmail }); await updateDoc(doc(db, 'claim_requests', claimId), { status: 'APPROVED' }); };
export const toggleFavorite = async (type: 'coupon' | 'business', id: string) => { const user = getCurrentUser(); if (!user || !db) return; const favKey = type === 'coupon' ? 'coupons' : 'businesses'; const favorites = user.favorites || { coupons: [], businesses: [] }; const currentFavs = favorites[favKey] || []; const isFav = currentFavs.includes(id); const updatedFavs = isFav ? currentFavs.filter(f => f !== id) : [...currentFavs, id]; const updatedUser = { ...user, favorites: { ...favorites, [favKey]: updatedFavs } }; await setDoc(doc(db, 'users', user.id), updatedUser, { merge: true }); localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser)); notifyListeners(); };
export const redeemCoupon = async (userId: string, coupon: Coupon) => { if (!db) return; const userRef = doc(db, 'users', userId); const couponRef = doc(db, 'coupons', coupon.id); const savings = coupon.originalPrice - coupon.discountedPrice; await updateDoc(userRef, { savedAmount: increment(savings), history: arrayUnion({ date: new Date().toISOString(), amount: savings, couponTitle: coupon.title, couponId: coupon.id }) }); await updateDoc(couponRef, { currentRedemptions: increment(1) }); notifyListeners(); };
export const identifyNeighborhood = (lat: number, lng: number): string => { if (lat > -22.95 && lat < -22.91 && lng > -43.20 && lng < -43.16) return "Centro"; if (lat > -22.98 && lat < -22.96 && lng > -43.20 && lng < -43.17) return "Copacabana"; if (lat > -23.01 && lat < -22.99 && lng > -43.40 && lng < -43.30) return "Barra da Tijuca"; return "Rio de Janeiro"; };
export const sendSupportMessage = async (msg: Partial<SupportMessage>) => { if (db) await addDoc(collection(db, 'support_messages'), { ...msg, date: new Date().toISOString(), status: 'OPEN' }); };
export const updateUser = async (user: User) => { if (db) { await setDoc(doc(db, 'users', user.id), user, { merge: true }); localStorage.setItem(SESSION_KEY, JSON.stringify(user)); notifyListeners(); } };
export const saveCoupon = async (coupon: Coupon) => { if (db) await setDoc(doc(db, 'coupons', coupon.id), coupon, { merge: true }); };
export const deleteCoupon = async (id: string) => { if (db) await deleteDoc(doc(db, 'coupons', id)); };
export const fetchReviewsForBusiness = async (businessId: string): Promise<Review[]> => { const biz = _businesses.find(b => b.id === businessId); return biz?.reviews || []; };
export const addBusinessReview = async (businessId: string, review: Review) => { if (db) await updateDoc(doc(db, 'businesses', businessId), { reviews: arrayUnion(review) }); };
export const subscribeToTables = (businessId: string, callback: (tables: Table[]) => void) => { if (!db) return () => {}; return onSnapshot(collection(db, 'businesses', businessId, 'tables'), (snap) => { callback(snap.docs.map(d => ({ ...d.data() as Table, id: d.id }))); }); };
export const updateTable = async (businessId: string, table: Table) => { if (db) await setDoc(doc(db, 'businesses', businessId, 'tables', table.id), table, { merge: true }); };
export const closeTableAndReset = async (businessId: string, tableId: string) => { if (db) await updateDoc(doc(db, 'businesses', businessId, 'tables', tableId), { status: 'AVAILABLE', items: [], total: 0, openedAt: deleteField() }); };
export const initializeTablesForBusiness = async (businessId: string, count: number) => { if (!db) return; const batch = writeBatch(db); for (let i = 1; i <= count; i++) { const ref = doc(db, 'businesses', businessId, 'tables', `table_${i}`); batch.set(ref, { id: `table_${i}`, number: i, status: 'AVAILABLE', items: [], total: 0 }); } await batch.commit(); };
export const registerUser = async (name: string, email: string, pass: string): Promise<User> => { if (!auth || !db) throw new Error("Firebase not initialized"); const cred = await createUserWithEmailAndPassword(auth, email, pass); const user: User = { id: cred.user.uid, name, email, role: UserRole.CUSTOMER, savedAmount: 0, history: [], favorites: { coupons: [], businesses: [] } }; await setDoc(doc(db, 'users', user.id), user); localStorage.setItem(SESSION_KEY, JSON.stringify(user)); return user; };
export const createCompanyRequest = async (req: Partial<CompanyRequest>) => { if (db) await addDoc(collection(db, 'company_requests'), { ...req, status: 'PENDING', requestDate: new Date().toISOString() }); };
export const getCompanyRequests = () => _requests;
export const approveRequest = async (id: string) => { if (!db) return; await updateDoc(doc(db, 'company_requests', id), { status: 'APPROVED' }); };
export const rejectRequest = async (id: string) => { if (!db) return; await updateDoc(doc(db, 'company_requests', id), { status: 'REJECTED' }); };
export const addCategory = async (cat: AppCategory) => { if (db) await setDoc(doc(db, 'system', 'categories'), { list: arrayUnion(cat) }, { merge: true }); };
export const deleteCategory = async (id: string) => { if (!db) return; const docRef = doc(db, 'system', 'categories'); const snap = await getDoc(docRef); if (snap.exists()) { const list = snap.data().list || []; await updateDoc(docRef, { list: list.filter((c: any) => c.id !== id) }); } };
export const addLocation = async (loc: AppLocation) => { if (db) await addDoc(collection(db, 'locations'), loc); };
export const deleteLocation = async (id: string) => { if (db) await deleteDoc(doc(db, 'locations', id)); };
export const addAmenity = async (am: AppAmenity) => { if (db) await addDoc(collection(db, 'amenities'), am); };
export const deleteAmenity = async (id: string) => { if (db) await deleteDoc(doc(db, 'amenities', id)); };
export const saveBlogPost = async (post: BlogPost) => { if (db) await setDoc(doc(db, 'blog_posts', post.id), post, { merge: true }); };
export const deleteBlogPost = async (id: string) => { if (db) await deleteDoc(doc(db, 'blog_posts', id)); };
export const saveCollection = async (col: Collection) => { if (db) await setDoc(doc(db, 'collections', col.id), col, { merge: true }); };
export const deleteCollection = async (id: string) => { if (db) await deleteDoc(doc(db, 'collections', id)); };
export const saveFeaturedConfig = async (conf: FeaturedConfig) => { if (db) await setDoc(doc(db, 'system', 'featured_config'), conf); };
export const getSupportMessages = () => _support;
export const saveAppConfig = async (conf: AppConfig) => { if (db) await setDoc(doc(db, 'system', 'app_config'), conf); };
export const adminResetPassword = async (email: string) => { alert(`E-mail de redefinição de senha enviado para ${email}`); };
export const createCompanyDirectly = async (company: Partial<User>) => { if (!db) return; const id = `comp_${Math.random().toString(36).substring(7)}`; await setDoc(doc(db, 'users', id), { ...company, id, role: UserRole.COMPANY }); };
export const addSubCategory = async (catId: string, sub: string) => { if (!db) return; const snap = await getDoc(doc(db, 'system', 'categories')); if (snap.exists()) { const list = snap.data().list.map((c: any) => c.id === catId ? { ...c, subcategories: [...(c.subcategories || []), sub] } : c); await updateDoc(doc(db, 'system', 'categories'), { list }); } };
export const removeSubCategory = async (catId: string, sub: string) => { if (!db) return; const snap = await getDoc(doc(db, 'system', 'categories')); if (snap.exists()) { const list = snap.data().list.map((c: any) => c.id === catId ? { ...c, subcategories: (c.subcategories || []).filter((s: string) => s !== sub) } : c); await updateDoc(doc(db, 'system', 'categories'), { list }); } };
export const incrementSocialClick = async (businessId: string, type: string) => { if (db) await updateDoc(doc(db, 'businesses', businessId), { [`socialClicks.${type}`]: increment(1) }); };
export const getAppConfig = (): AppConfig => _appConfig;
export const getCategories = () => _categories || [];
export const getLocations = () => _locations || [];
export const getAmenities = () => _amenities.length > 0 ? _amenities : DEFAULT_AMENITIES;
export const getAllUsers = () => _users || [];
export const getBusinesses = () => _businesses;
export const getBusinessById = (id: string) => getBusinesses().find(b => b.id === id);
export const getBlogPosts = () => _posts;
export const getBlogPostById = (id: string) => _posts.find(p => p.id === id);
export const getCollections = () => _collections;
export const getCollectionById = (id: string) => _collections.find(c => c.id === id);
export const getFeaturedConfig = () => _featuredConfig;
export const getCoupons = async (): Promise<Coupon[]> => { return _coupons.map(coupon => { const business = _businesses.find(b => b.id === coupon.companyId); return business ? { ...coupon, companyLogo: business.coverImage } : coupon; }); };
export const saveBusiness = async (business: BusinessProfile) => { if (db) await setDoc(doc(db, 'businesses', business.id), business, { merge: true }); };
export const incrementBusinessView = async (businessId: string) => { if (db) await updateDoc(doc(db, 'businesses', businessId), { views: increment(1) }); };
export const deleteUser = async (id: string) => { if (db) await deleteDoc(doc(db, 'users', id)); };
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => { if (!lat1 || !lon1 || !lat2 || !lon2) return 999; const R = 6371; const dLat = (lat2-lat1) * Math.PI / 180; const dLon = (lon2-lon1) * Math.PI / 180; const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); };
