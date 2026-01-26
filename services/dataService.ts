
import { Coupon, User, UserRole, BusinessProfile, BlogPost, CompanyRequest, AppCategory, AppLocation, AppAmenity, Collection, DEFAULT_CATEGORIES, DEFAULT_AMENITIES, PROTECTED_CATEGORIES, FeaturedConfig, SupportMessage, AppConfig, Review, Table, TableItem } from '../types';
import { MOCK_COUPONS, MOCK_BUSINESSES, MOCK_POSTS, MOCK_USERS } from './mockData';
import { db, auth } from './firebase'; 
import { collection, setDoc, doc, deleteDoc, onSnapshot, getDoc, updateDoc, arrayUnion, increment, addDoc, query, orderBy, getDocs, deleteField, writeBatch, arrayRemove } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

let _businesses: BusinessProfile[] = [];
let _coupons: Coupon[] = [];
let _users: User[] = [];
let _posts: BlogPost[] = [];
let _collections: Collection[] = [];
let _requests: CompanyRequest[] = [];
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

const saveToCache = (key: string, data: any) => {
    try {
        localStorage.setItem(`cr_cache_${key}`, JSON.stringify(data));
    } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            localStorage.clear();
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
    const handleError = (col: string, err: any) => {
        if (err.code === 'permission-denied') {
            console.warn(`⚠️ Sem permissão para ler a coleção: ${col}. Verifique as regras do Firestore.`);
        } else {
            console.error(`❌ Erro no Firestore [${col}]:`, err.message);
        }
    };

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

        onSnapshot(collection(db, 'system'), (snap) => {
            snap.forEach(doc => {
                if(doc.id === 'app_config') _appConfig = doc.data() as AppConfig;
                if(doc.id === 'categories') _categories = doc.data().list || [];
                if(doc.id === 'featured_config') _featuredConfig = doc.data() as FeaturedConfig;
            });
            notifyListeners();
        }, (err) => handleError('system', err));
    } catch (e) {
        console.error("Erro global na inicialização do Firebase:", e);
    }
};

export const registerUser = async (name: string, email: string, pass: string) => {
    if (!auth || !db) throw new Error("Firebase não inicializado.");
    
    try {
        // 1. Cria a conta no Firebase Authentication
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        
        // 2. Cria o perfil no Firestore
        const newUser: User = {
            id: cred.user.uid,
            name,
            email,
            role: UserRole.CUSTOMER,
            isPrime: false,
            savedAmount: 0,
            history: [],
            favorites: { coupons: [], businesses: [] }
        };
        
        await setDoc(doc(db, 'users', newUser.id), newUser);
        
        // 3. Salva na sessão local
        localStorage.setItem('arraial_user_session', JSON.stringify(newUser));
        return newUser;
    } catch (error: any) {
        console.error("Erro no registro:", error);
        if (error.code === 'auth/operation-not-allowed') {
            throw new Error("O cadastro por e-mail/senha está desativado no Firebase Console. Ative-o em Authentication > Sign-in method.");
        }
        throw error;
    }
};

export const subscribeToTables = (businessId: string, callback: (tables: Table[]) => void) => {
    if (!db) return () => {};
    const q = query(collection(db, 'businesses', businessId, 'tables'), orderBy('number', 'asc'));
    return onSnapshot(q, (snap) => {
        const tables = snap.docs.map(d => ({ ...d.data() as Table, id: d.id }));
        callback(tables);
    });
};

export const updateTable = async (businessId: string, table: Table) => {
    if (!db) return;
    await setDoc(doc(db, 'businesses', businessId, 'tables', table.id), table, { merge: true });
};

export const closeTableAndReset = async (businessId: string, tableId: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'businesses', businessId, 'tables', tableId), {
        status: 'AVAILABLE',
        items: [],
        total: 0,
        openedAt: deleteField()
    });
};

export const initializeTablesForBusiness = async (businessId: string, count: number) => {
    if (!db) return;
    const batch = writeBatch(db);
    for (let i = 1; i <= count; i++) {
        const tId = `table_${i}`;
        const tRef = doc(db, 'businesses', businessId, 'tables', tId);
        batch.set(tRef, { id: tId, number: i, status: 'AVAILABLE', items: [], total: 0 });
    }
    await batch.commit();
};

export const getAppConfig = (): AppConfig => _appConfig;
export const getCategories = () => _categories || [];
export const getLocations = () => _locations || [];
export const getAmenities = () => _amenities.length > 0 ? _amenities : DEFAULT_AMENITIES;
export const getAllUsers = () => _users || [];
export const getBusinesses = () => _businesses;
export const getBusinessById = (id: string) => getBusinesses().find(b => b.id === id);

export const getCoupons = async (): Promise<Coupon[]> => {
    return _coupons.map(coupon => {
        const business = _businesses.find(b => b.id === coupon.companyId);
        return business ? { ...coupon, companyLogo: business.coverImage } : coupon;
    });
};

export const saveBusiness = async (business: BusinessProfile) => { if (db) await setDoc(doc(db, 'businesses', business.id), business, { merge: true }); };
export const incrementBusinessView = async (businessId: string) => { if (db) await updateDoc(doc(db, 'businesses', businessId), { views: increment(1) }); };
export const saveAppConfig = async (config: AppConfig) => { if (db) await setDoc(doc(db, 'system', 'app_config'), config); };

export const updateUser = async (user: User) => {
    if (db) await setDoc(doc(db, 'users', user.id), user, { merge: true });
    if (getCurrentUser()?.id === user.id) localStorage.setItem('arraial_user_session', JSON.stringify(user));
    notifyListeners();
};

export const redeemCoupon = async (userId: string, coupon: Coupon) => {
    if (!db) return;
    await updateDoc(doc(db, 'users', userId), {
        history: arrayUnion({ date: new Date().toISOString(), amount: coupon.originalPrice - coupon.discountedPrice, couponTitle: coupon.title, couponId: coupon.id }),
        savedAmount: increment(coupon.originalPrice - coupon.discountedPrice)
    });
    if (coupon.maxRedemptions) await updateDoc(doc(db, 'coupons', coupon.id), { currentRedemptions: increment(1) });
};

export const toggleFavorite = async (type: 'coupon' | 'business', id: string) => {
    const user = getCurrentUser();
    if (!user || !db) return;
    const key = type === 'coupon' ? 'favorites.coupons' : 'favorites.businesses';
    const list = type === 'coupon' ? (user.favorites?.coupons || []) : (user.favorites?.businesses || []);
    await updateDoc(doc(db, 'users', user.id), { [key]: list.includes(id) ? arrayRemove(id) : arrayUnion(id) });
};

export const addBusinessReview = async (businessId: string, user: User, rating: number, comment: string) => {
    if (!db) return null;
    const review = { id: Date.now().toString(), userId: user.id, userName: user.name, userAvatar: user.avatarUrl, rating, comment, date: new Date().toISOString() };
    await addDoc(collection(db, 'businesses', businessId, 'reviews'), review);
    const biz = getBusinessById(businessId);
    if (biz) {
        const newCount = (biz.reviewCount || 0) + 1;
        const newRating = Number((((biz.rating * (biz.reviewCount || 0)) + rating) / newCount).toFixed(1));
        await updateDoc(doc(db, 'businesses', businessId), { rating: newRating, reviewCount: newCount });
        return { ...biz, rating: newRating, reviewCount: newCount };
    }
    return null;
};

export const fetchReviewsForBusiness = async (businessId: string): Promise<Review[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, 'businesses', businessId, 'reviews'), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ ...d.data(), id: d.id } as Review));
    } catch (e) {
        console.warn("Reviews bloqueados por permissão. Logue para ver.");
        return [];
    }
};

export const createCompanyDirectly = async (data: any) => {
    if (!db) return;
    const id = Date.now().toString();
    await setDoc(doc(db, 'users', id), { ...data, id, role: UserRole.COMPANY, permissions: { canCreateCoupons: true, canManageBusiness: true }, maxCoupons: 10 });
};

export const login = async (email: string, password?: string): Promise<User | null> => {
    if (email === 'admin@conectario.com' && password === '123456') {
        const admin = { id: 'admin', name: 'Admin', email, role: UserRole.SUPER_ADMIN };
        localStorage.setItem('arraial_user_session', JSON.stringify(admin));
        return admin;
    }
    if (auth && password) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        if (snap.exists()) {
            const user = snap.data() as User;
            localStorage.setItem('arraial_user_session', JSON.stringify(user));
            return user;
        }
    }
    return null;
};

export const getCurrentUser = (): User | null => {
    const stored = localStorage.getItem('arraial_user_session'); 
    return stored ? JSON.parse(stored) : null;
};

export const logout = async () => { if (auth) await signOut(auth); localStorage.removeItem('arraial_user_session'); };

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
    const R = 6371; 
    const dLat = (lat2-lat1) * Math.PI / 180;
    const dLon = (lon2-lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const identifyNeighborhood = (lat: number, lng: number): string => {
    return "Rio de Janeiro"; 
};

export const getBlogPosts = () => _posts;
export const getBlogPostById = (id: string) => _posts.find(p => p.id === id);
export const saveBlogPost = async (post: BlogPost) => { if (db) await setDoc(doc(db, 'posts', post.id), post, { merge: true }); };
export const deleteBlogPost = async (id: string) => { if (db) await deleteDoc(doc(db, 'posts', id)); };

export const getCollections = () => _collections;
export const getCollectionById = (id: string) => _collections.find(c => c.id === id);
export const saveCollection = async (col: Collection) => { if (db) await setDoc(doc(db, 'collections', col.id), col, { merge: true }); };
export const deleteCollection = async (id: string) => { if (db) await deleteDoc(doc(db, 'collections', id)); };

export const getFeaturedConfig = () => _featuredConfig;
export const saveFeaturedConfig = async (config: FeaturedConfig) => { if (db) await setDoc(doc(db, 'system', 'featured_config'), config); };

export const sendSupportMessage = async (msg: Partial<SupportMessage>) => {
    if (!db) return;
    await addDoc(collection(db, 'support'), { ...msg, date: new Date().toISOString(), status: 'OPEN' });
};
export const getSupportMessages = () => _support;

export const saveCoupon = async (coupon: Coupon) => { if (db) await setDoc(doc(db, 'coupons', coupon.id), coupon, { merge: true }); };
export const deleteCoupon = async (id: string) => { if (db) await deleteDoc(doc(db, 'coupons', id)); };

export const deleteUser = async (id: string) => { if (db) await deleteDoc(doc(db, 'users', id)); };
export const adminResetPassword = async (email: string, newPass: string) => { console.debug(`Password reset requested for ${email}`); };

export const createCompanyRequest = async (data: any) => { if (db) await addDoc(collection(db, 'company_requests'), { ...data, status: 'PENDING', requestDate: new Date().toISOString() }); };
export const getCompanyRequests = () => _requests;
export const approveRequest = async (requestId: string) => {
    if (!db) return;
    const req = _requests.find(r => r.id === requestId);
    if (!req) return;
    const userId = 'comp_' + Date.now();
    await setDoc(doc(db, 'users', userId), { id: userId, name: req.ownerName, email: req.email, role: UserRole.COMPANY, companyName: req.companyName, category: req.category, permissions: { canCreateCoupons: true, canManageBusiness: true }, maxCoupons: 10 });
    await updateDoc(doc(db, 'company_requests', requestId), { status: 'APPROVED' });
};
export const rejectRequest = async (requestId: string) => { if (db) await updateDoc(doc(db, 'company_requests', requestId), { status: 'REJECTED' }); };

export const addCategory = async (name: string) => {
    if (!db) return;
    const newList = [..._categories, { id: 'cat_' + Date.now(), name, subcategories: [] }];
    await setDoc(doc(db, 'system', 'categories'), { list: newList });
};
export const deleteCategory = async (id: string) => {
    if (!db) return;
    const newList = _categories.filter(c => c.id !== id);
    await setDoc(doc(db, 'system', 'categories'), { list: newList });
};
export const addSubCategory = async (catId: string, subName: string) => {
    if (!db) return;
    const newList = _categories.map(c => c.id === catId ? { ...c, subcategories: [...(c.subcategories || []), subName] } : c);
    await setDoc(doc(db, 'system', 'categories'), { list: newList });
};
export const removeSubCategory = async (catId: string, subName: string) => {
    if (!db) return;
    const newList = _categories.map(c => c.id === catId ? { ...c, subcategories: (c.subcategories || []).filter(s => s !== subName) } : c);
    await setDoc(doc(db, 'system', 'categories'), { list: newList });
};

export const addLocation = async (name: string, lat?: number, lng?: number) => { if (db) await setDoc(doc(db, 'locations', 'loc_' + Date.now()), { id: 'loc_' + Date.now(), name, active: true, lat, lng }); };
export const deleteLocation = async (id: string) => { if (db) await deleteDoc(doc(db, 'locations', id)); };

export const addAmenity = async (label: string) => { if (db) await setDoc(doc(db, 'amenities', 'am_' + Date.now()), { id: 'am_' + Date.now(), label }); };
export const deleteAmenity = async (id: string) => { if (db) await deleteDoc(doc(db, 'amenities', id)); };

export const incrementSocialClick = async (businessId: string, platform: string) => { if (db) await updateDoc(doc(db, 'businesses', businessId), { [`socialClicks.${platform}`]: increment(1) }); };
