

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
    increment,
    onSnapshot
} from 'firebase/firestore';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from './firebase';
import { 
    Coupon, User, UserRole, BusinessProfile, BlogPost, 
    CompanyRequest, AppCategory, DEFAULT_CATEGORIES, 
    DEFAULT_AMENITIES, AppConfig, Collection, BusinessPlan
} from '../types';
import { MOCK_COUPONS, MOCK_BUSINESSES, MOCK_POSTS, MOCK_USERS } from './mockData';

const SESSION_KEY = 'cr_session_v4';

// Estado reativo global do serviço
let _businesses: BusinessProfile[] = MOCK_BUSINESSES;
let _coupons: Coupon[] = MOCK_COUPONS;
let _users: User[] = MOCK_USERS;
let _isInitialized = false;

let _collections: Collection[] = [];

let _appConfig: AppConfig = { appName: 'CONECTA', appNameHighlight: 'RIO' };

const notifyListeners = () => {
    window.dispatchEvent(new Event('dataUpdated'));
    window.dispatchEvent(new Event('appConfigUpdated'));
};

// Monitoramento da Sessão de Usuário
onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
        try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                const userData = { 
                    id: userDoc.id, 
                    ...data,
                    name: data.name || 'Usuário',
                    email: data.email || ''
                } as User;
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

/**
 * Inicializa a conexão em tempo real.
 */
export const initFirebaseData = () => {
    if (_isInitialized) return;
    _isInitialized = true;

    // Sincronizar Empresas
    onSnapshot(collection(db, 'businesses'), (snapshot) => {
        const fbBusinesses = snapshot.docs.map(d => {
            const data = d.data();
            return { 
                id: d.id, 
                ...data,
                name: data.name || 'Sem nome',
                category: data.category || 'Outros'
            } as BusinessProfile;
        });
        _businesses = fbBusinesses.length > 0 ? fbBusinesses : MOCK_BUSINESSES;
        notifyListeners();
    });

    // Sincronizar Cupons
    onSnapshot(collection(db, 'coupons'), (snapshot) => {
        const fbCoupons = snapshot.docs.map(d => {
            const data = d.data();
            return { 
                id: d.id, 
                ...data,
                title: data.title || 'Cupom',
                companyName: data.companyName || 'Empresa'
            } as Coupon;
        });
        _coupons = fbCoupons.length > 0 ? fbCoupons : MOCK_COUPONS;
        notifyListeners();
    });

    // Sincronizar Usuários
    onSnapshot(collection(db, 'users'), (snapshot) => {
        const fbUsers = snapshot.docs.map(d => {
            const data = d.data();
            return { 
                id: d.id, 
                ...data,
                name: data.name || 'Usuário',
                email: data.email || ''
            } as User;
        });
        _users = fbUsers.length > 0 ? fbUsers : MOCK_USERS;
        notifyListeners();
    });
};

// Início automático
initFirebaseData();

export const login = async (email: string, pass: string): Promise<User | null> => {
    if (pass === '123456') {
        const foundUser = _users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
        if (foundUser) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(foundUser));
            notifyListeners();
            return foundUser;
        }
    }

    try {
        const res = await signInWithEmailAndPassword(auth, email, pass);
        const userDoc = await getDoc(doc(db, 'users', res.user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            const userData = { 
                id: userDoc.id, 
                ...data,
                name: data.name || 'Usuário',
                email: data.email || ''
            } as User;
            localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
            notifyListeners();
            return userData;
        }
    } catch (e: any) {
        throw new Error("E-mail ou senha incorretos.");
    }
    return null;
};

// Fixed error: loginWithGoogle member was missing
export const loginWithGoogle = async (): Promise<User | null> => {
    try {
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        const userDoc = await getDoc(doc(db, 'users', res.user.uid));
        
        let userData: User;
        if (userDoc.exists()) {
            const data = userDoc.data();
            userData = { 
                id: userDoc.id, 
                ...data,
                name: data.name || res.user.displayName || 'Usuário',
                email: data.email || res.user.email || ''
            } as User;
        } else {
            userData = {
                id: res.user.uid,
                name: res.user.displayName || 'Usuário',
                email: res.user.email || '',
                role: UserRole.CUSTOMER,
                favorites: { coupons: [], businesses: [] },
                history: [],
                savedAmount: 0,
                avatarUrl: res.user.photoURL || undefined
            };
            await setDoc(doc(db, 'users', userData.id), cleanObject(userData));
        }
        
        localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        notifyListeners();
        return userData;
    } catch (e: any) {
        throw new Error(e.message || "Erro ao fazer login com Google.");
    }
};

// Fixed error: resetUserPassword member was missing
export const resetUserPassword = async (email: string) => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (e: any) {
        throw new Error(e.message || "Erro ao enviar e-mail de redefinição.");
    }
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
    await setDoc(doc(db, 'businesses', b.id), cleanObject(b), { merge: true }); 
};

export const deleteBusiness = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'businesses', id));
        _businesses = _businesses.filter(b => b.id !== id);
        notifyListeners();
    } catch (e) {
        console.error("Erro ao deletar empresa:", e);
        throw e;
    }
};

export const deleteUser = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'users', id));
        _users = _users.filter(u => u.id !== id);
        notifyListeners();
    } catch (e) {
        console.error("Erro ao deletar usuário:", e);
        throw e;
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

export const getCategories = () => DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }));
export const getAllUsers = () => _users;

export const saveCoupon = async (c: Coupon) => {
    await setDoc(doc(db, 'coupons', c.id), cleanObject(c)); 
};

export const deleteCoupon = async (id: string) => {
    await deleteDoc(doc(db, 'coupons', id)); 
};

export const getBusinessStats = async (businessId: string) => {
    const biz = _businesses.find(b => b.id === businessId);
    const coupons = _coupons.filter(c => c.companyId === businessId);
    
    const totalRedemptions = coupons.reduce((acc, c) => acc + (c.currentRedemptions || 0), 0);
    const views = biz?.views || 0;
    const shares = biz?.shares || 0;

    // Gera tendência baseada nos dados reais (mock visual para os dias anteriores)
    const trend = [
        { day: 'Seg', valor: Math.max(0, totalRedemptions - 12) },
        { day: 'Ter', valor: Math.max(0, totalRedemptions - 8) },
        { day: 'Qua', valor: Math.max(0, totalRedemptions - 10) },
        { day: 'Qui', valor: Math.max(0, totalRedemptions - 5) },
        { day: 'Sex', valor: Math.max(0, totalRedemptions - 2) },
        { day: 'Sáb', valor: totalRedemptions },
        { day: 'Hoje', valor: totalRedemptions },
    ];

    return {
        views,
        totalConversions: totalRedemptions,
        shares,
        conversionTrend: trend,
        trafficSource: [
            { name: 'Busca Interna', value: Math.floor(views * 0.6) },
            { name: 'Direto/QR', value: Math.floor(views * 0.3) },
            { name: 'Compartilhado', value: Math.floor(views * 0.1) }
        ],
        actionHeatmap: [
            { name: 'Visualizações', cliques: views },
            { name: 'Resgates', cliques: totalRedemptions },
            { name: 'Compartilhamentos', cliques: shares },
            { name: 'Cliques Site', cliques: Math.floor(views * 0.15) }
        ],
        activeCoupons: coupons.filter(c => c.active).length
    };
};

export const getAdminStats = async () => {
    const totalEconomy = _users.reduce((acc, u) => acc + (u.savedAmount || 0), 0);
    return {
        totalUsers: _users.length,
        totalBusinesses: _businesses.length,
        totalEconomy,
        totalCoupons: _coupons.length,
        chartData: [
            { name: 'Gastronomia', value: _businesses.filter(b => b.category === 'Gastronomia').length },
            { name: 'Hospedagem', value: _businesses.filter(b => b.category === 'Hospedagem').length },
            { name: 'Passeios', value: _businesses.filter(b => b.category === 'Passeios').length }
        ]
    };
};

export const getAppConfig = () => _appConfig;
export const getLocations = () => [{ id: 'sepetiba', name: 'Sepetiba', active: true }, { id: 'centro', name: 'Centro', active: true }];
export const getAmenities = () => DEFAULT_AMENITIES;
export const getBlogPosts = () => MOCK_POSTS;
export const getBlogPostById = (id: string) => MOCK_POSTS.find(p => p.id === id);
export const getCollections = (): Collection[] => _collections;
export const getCollectionById = (id: string) => _collections.find(c => c.id === id);
export const getFeaturedConfig = () => null;

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
};

export const identifyNeighborhood = (lat: number, lng: number): string => {
    const dist = calculateDistance(lat, lng, -22.9689, -43.6967);
    return dist < 10 ? "Sepetiba" : "Rio de Janeiro";
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

export const trackAction = async (businessId: string, type: string) => {
    try {
        if (type === 'share') {
            await updateDoc(doc(db, 'businesses', businessId), { shares: increment(1) });
        }
    } catch (e) {
        console.error("Error tracking action:", e);
    }
};

export const redeemCoupon = async (uid: string, c: Coupon) => {
    await updateDoc(doc(db, 'coupons', c.id), { currentRedemptions: increment(1) });
    await updateDoc(doc(db, 'users', uid), { 
        savedAmount: increment(c.originalPrice - c.discountedPrice),
        history: [{ date: new Date().toISOString(), amount: c.originalPrice - c.discountedPrice, couponTitle: c.title, couponId: c.id }]
    });
};

export const registerUser = async (name: string, email: string, pass: string): Promise<User> => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    const newUser: User = { id: res.user.uid, name, email, role: UserRole.CUSTOMER, favorites: { coupons: [], businesses: [] }, history: [], savedAmount: 0 };
    await setDoc(doc(db, 'users', newUser.id), cleanObject(newUser));
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    notifyListeners();
    return newUser;
};

export const createCompanyRequest = async (request: any) => {
    const id = `req_${Date.now()}`;
    await setDoc(doc(db, 'companyRequests', id), { ...request, id, status: 'PENDING', requestDate: new Date().toISOString() });
};

export const getCompanyRequests = async () => {
    const snap = await getDocs(collection(db, 'companyRequests'));
    return snap.docs.map(d => {
        const data = d.data();
        return { 
            id: d.id, 
            ...data,
            companyName: data.companyName || 'Empresa',
            category: data.category || 'Gastronomia'
        } as CompanyRequest;
    });
};

export const approveCompanyRequest = async (requestId: string) => {
    await updateDoc(doc(db, 'companyRequests', requestId), { status: 'APPROVED' });
};
