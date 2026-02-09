
import { 
    collection, 
    getDocs, 
    getDoc, 
    setDoc, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    increment 
} from 'firebase/firestore';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { auth, db } from './firebase';
import { 
    Coupon, User, UserRole, BusinessProfile, BlogPost, 
    CompanyRequest, AppCategory, DEFAULT_CATEGORIES, 
    DEFAULT_AMENITIES, AppConfig, Collection, BusinessPlan,
    FeaturedConfig
} from '../types';
import { MOCK_COUPONS, MOCK_BUSINESSES, MOCK_POSTS, MOCK_USERS } from './mockData';

const SESSION_KEY = 'cr_session_v4';

let _businesses: BusinessProfile[] = [];
let _coupons: Coupon[] = [];
let _users: User[] = [];
let _categories: AppCategory[] = DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }));
let _appConfig: AppConfig = { appName: 'CONECTA', appNameHighlight: 'RIO' };

const notifyListeners = () => {
    window.dispatchEvent(new Event('dataUpdated'));
    window.dispatchEvent(new Event('appConfigUpdated'));
};

onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
        try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
                const userData = { id: userDoc.id, ...userDoc.data() } as User;
                localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
                notifyListeners();
            }
        } catch (e) {
            console.error("Erro ao sincronizar sessão Auth:", e);
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

export const initFirebaseData = async () => {
    try {
        const bizSnap = await getDocs(collection(db, 'businesses'));
        const fbBusinesses = bizSnap.docs.map(d => ({ id: d.id, ...d.data() } as BusinessProfile));
        const coupSnap = await getDocs(collection(db, 'coupons'));
        const fbCoupons = coupSnap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
        const userSnap = await getDocs(collection(db, 'users'));
        _users = userSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));

        _businesses = fbBusinesses.length > 0 ? fbBusinesses : MOCK_BUSINESSES;
        _coupons = fbCoupons.length > 0 ? fbCoupons : MOCK_COUPONS;

        notifyListeners();
    } catch (error) {
        _businesses = MOCK_BUSINESSES;
        _coupons = MOCK_COUPONS;
        notifyListeners();
    }
};

initFirebaseData();

export const loginWithGoogle = async (): Promise<User | null> => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
            notifyListeners();
            return userData;
        } else {
            const newUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Usuário Google',
                email: firebaseUser.email || '',
                avatarUrl: firebaseUser.photoURL || undefined,
                role: UserRole.CUSTOMER,
                favorites: { coupons: [], businesses: [] },
                history: [],
                savedAmount: 0
            };
            await setDoc(doc(db, 'users', newUser.id), cleanObject(newUser));
            localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
            notifyListeners();
            return newUser;
        }
    } catch (error: any) {
        throw new Error(error.message || "Falha na autenticação com Google.");
    }
};

export const login = async (email: string, pass: string): Promise<User | null> => {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    const userDoc = await getDoc(doc(db, 'users', res.user.uid));
    if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        notifyListeners();
        return userData;
    }
    return null;
};

export const logout = async () => {
    await auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    notifyListeners();
};

export const getBusinesses = () => _businesses;
export const getCoupons = async () => _coupons;
export const getBusinessById = (id: string) => _businesses.find(b => b.id === id);

export const saveBusiness = async (b: BusinessProfile) => {
    try { 
        await setDoc(doc(db, 'businesses', b.id), cleanObject(b), { merge: true }); 
        const idx = _businesses.findIndex(biz => biz.id === b.id);
        if (idx !== -1) _businesses[idx] = b;
        else _businesses.push(b);
        notifyListeners();
    } catch (e) {
        console.error("Erro ao salvar empresa:", e);
    }
};

export const getCurrentUser = (): User | null => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
};

export const updateUser = async (user: User) => {
    await setDoc(doc(db, 'users', user.id), cleanObject(user), { merge: true });
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    notifyListeners();
};

export const getCategories = () => _categories;
export const getAllUsers = () => _users;

export const saveCoupon = async (c: Coupon) => {
    try { 
        await setDoc(doc(db, 'coupons', c.id), cleanObject(c)); 
        const idx = _coupons.findIndex(cp => cp.id === c.id);
        if (idx !== -1) _coupons[idx] = c;
        else _coupons.push(c);
        notifyListeners();
    } catch(e) {
        console.error("Erro ao salvar cupom:", e);
    }
};

export const deleteCoupon = async (id: string) => {
    try { 
        await deleteDoc(doc(db, 'coupons', id)); 
        _coupons = _coupons.filter(c => c.id !== id);
        notifyListeners();
    } catch(e) {
        console.error("Erro ao deletar cupom:", e);
    }
};

export const trackAction = async (businessId: string, action: 'menu' | 'social' | 'map' | 'share' | 'phone' | 'visit_direct' | 'visit_search') => {
    try {
        const fieldMap: any = {
            menu: 'menuViews',
            social: 'socialClicks',
            map: 'mapClicks',
            share: 'shares',
            phone: 'phoneClicks',
            visit_direct: 'directVisits',
            visit_search: 'searchVisits'
        };
        const field = fieldMap[action];
        if (field) {
            await updateDoc(doc(db, 'businesses', businessId), { 
                [field]: increment(1), 
                totalConversions: increment(1) 
            });
        }
    } catch (e) {}
};

export const getBusinessStats = async (businessId: string) => {
    const bizSnap = await getDoc(doc(db, 'businesses', businessId));
    const data: any = bizSnap.exists() ? bizSnap.data() : { 
        views: 0, 
        menuViews: 0, 
        socialClicks: 0, 
        mapClicks: 0, 
        shares: 0, 
        phoneClicks: 0,
        directVisits: 0,
        searchVisits: 0,
        totalConversions: 0 
    };
    
    const coupons = (await getCoupons()).filter(c => c.companyId === businessId);
    const totalCouponUsage = coupons.reduce((acc, c) => acc + (c.currentRedemptions || 0), 0);

    const conversionTrend = [
        { day: 'Seg', valor: Math.floor(Math.random() * 20) },
        { day: 'Ter', valor: Math.floor(Math.random() * 25) },
        { day: 'Qua', valor: Math.floor(Math.random() * 15) },
        { day: 'Qui', valor: Math.floor(Math.random() * 30) },
        { day: 'Sex', valor: Math.floor(Math.random() * 45) },
        { day: 'Sáb', valor: Math.floor(Math.random() * 60) },
        { day: 'Dom', valor: Math.floor(Math.random() * 40) },
    ];

    const trafficSource = [
        { name: 'Direto/Tuga', value: data.directVisits || 10 },
        { name: 'Pesquisas', value: data.searchVisits || 5 },
    ];

    const actionHeatmap = [
        { name: 'Redes Sociais', cliques: data.socialClicks || 0 },
        { name: 'Mapa/GPS', cliques: data.mapClicks || 0 },
        { name: 'Ver Cardápio', cliques: data.menuViews || 0 },
        { name: 'Cliques Telefone', cliques: data.phoneClicks || 0 },
        { name: 'Cupons Usados', cliques: totalCouponUsage || 0 },
    ];

    return {
        views: data.views || 0,
        totalConversions: (data.totalConversions || 0) + totalCouponUsage,
        shares: data.shares || 0,
        conversionTrend,
        trafficSource,
        actionHeatmap,
        activeCoupons: coupons.length
    };
};

export const getAdminStats = async () => {
    const users = getAllUsers();
    const biz = getBusinesses();
    const coupons = await getCoupons();
    
    const totalEconomy = users.reduce((acc, u) => acc + (u.savedAmount || 0), 0);
    const totalLeads = biz.reduce((acc, b: any) => acc + (b.totalConversions || 0), 0);

    const categoriesCount = biz.reduce((acc: any, b) => {
        acc[b.category] = (acc[b.category] || 0) + 1;
        return acc;
    }, {});

    const chartData = Object.keys(categoriesCount).map(key => ({
        name: key,
        value: categoriesCount[key]
    }));

    return {
        totalUsers: users.length,
        totalBusinesses: biz.length,
        totalEconomy,
        totalLeads,
        chartData,
        totalCoupons: coupons.length
    };
};

export const getAppConfig = () => _appConfig;
export const getLocations = () => [{ id: 'sepetiba', name: 'Sepetiba', active: true }, { id: 'centro', name: 'Centro', active: true }];
export const getAmenities = () => DEFAULT_AMENITIES;
export const getBlogPosts = () => MOCK_POSTS;
export const getBlogPostById = (id: string) => MOCK_POSTS.find(p => p.id === id);
export const getCollections = () => [];
export const getCollectionById = (id: string) => getCollections().find((c: Collection) => c.id === id);
export const getFeaturedConfig = () => null;

export const identifyNeighborhood = (lat?: number, lng?: number) => {
    if (!lat || !lng) return "Rio de Janeiro";
    if (lat < -22.98 && lng < -43.6) return "Sepetiba";
    return "Rio de Janeiro";
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

export const toggleFavorite = async (type: 'coupon' | 'business', id: string) => {
    const user = getCurrentUser();
    if (!user) return;
    if (!user.favorites) user.favorites = { coupons: [], businesses: [] };
    const list = type === 'coupon' ? user.favorites.coupons : user.favorites.businesses;
    const index = list.indexOf(id);
    if (index > -1) list.splice(index, 1);
    else list.push(id);
    await updateUser(user);
};

export const incrementBusinessView = (id: string) => updateDoc(doc(db, 'businesses', id), { views: increment(1) });

export const redeemCoupon = async (uid: string, c: Coupon) => {
    try {
        await updateDoc(doc(db, 'coupons', c.id), { currentRedemptions: increment(1) });
        await updateDoc(doc(db, 'users', uid), { 
            savedAmount: increment(c.originalPrice - c.discountedPrice),
            history: [{
                date: new Date().toISOString(),
                amount: c.originalPrice - c.discountedPrice,
                couponTitle: c.title,
                couponId: c.id
            }]
        });
        const user = getCurrentUser();
        if (user && user.id === uid) {
            user.savedAmount = (user.savedAmount || 0) + (c.originalPrice - c.discountedPrice);
            if (!user.history) user.history = [];
            user.history.unshift({
                date: new Date().toISOString(),
                amount: c.originalPrice - c.discountedPrice,
                couponTitle: c.title,
                couponId: c.id
            });
            localStorage.setItem(SESSION_KEY, JSON.stringify(user));
            notifyListeners();
        }
    } catch (e) {}
};

export const registerUser = async (name: string, email: string, pass: string): Promise<User> => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    const newUser: User = {
        id: res.user.uid,
        name,
        email,
        role: UserRole.CUSTOMER,
        favorites: { coupons: [], businesses: [] },
        history: [],
        savedAmount: 0
    };
    await setDoc(doc(db, 'users', newUser.id), cleanObject(newUser));
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    notifyListeners();
    return newUser;
};

export const createCompanyRequest = async (request: any) => {
    const id = `req_${Date.now()}`;
    await setDoc(doc(db, 'companyRequests', id), { 
        ...request, 
        id, 
        status: 'PENDING', 
        requestDate: new Date().toISOString() 
    });
};

export const getCompanyRequests = async () => {
    try {
        const snap = await getDocs(collection(db, 'companyRequests'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as CompanyRequest));
    } catch (e) {
        return [];
    }
};

export const approveCompanyRequest = async (requestId: string) => {
    await updateDoc(doc(db, 'companyRequests', requestId), { status: 'APPROVED' });
};

export const sendSupportMessage = async (msg: string) => {
    console.log("Suporte msg:", msg);
};
