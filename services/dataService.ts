
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

let _collections: Collection[] = [
    {
        id: 'col1',
        title: 'Os Melhores Cafés',
        description: 'Uma seleção dos cafés mais charmosos do Rio.',
        coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800',
        businessIds: ['local_1765502020338']
    }
];

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

/**
 * Inicializa a conexão em tempo real.
 * Garante que o site reflita exatamente o que está no Firestore.
 */
export const initFirebaseData = () => {
    if (_isInitialized) return;
    _isInitialized = true;

    console.log("🌐 Conectando ao fluxo de dados em tempo real...");

    // Sincronizar Empresas
    onSnapshot(collection(db, 'businesses'), (snapshot) => {
        const fbBusinesses = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BusinessProfile));
        if (fbBusinesses.length > 0) {
            _businesses = fbBusinesses;
        } else if (snapshot.metadata.fromCache === false) {
            _businesses = fbBusinesses; 
        }
        notifyListeners();
    }, (err) => console.error("Erro Empresas:", err));

    // Sincronizar Cupons
    onSnapshot(collection(db, 'coupons'), (snapshot) => {
        const fbCoupons = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
        if (fbCoupons.length > 0) {
            _coupons = fbCoupons;
        } else if (snapshot.metadata.fromCache === false) {
            _coupons = fbCoupons;
        }
        notifyListeners();
    }, (err) => console.error("Erro Cupons:", err));

    // Sincronizar Usuários
    onSnapshot(collection(db, 'users'), (snapshot) => {
        const fbUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
        if (fbUsers.length > 0) _users = fbUsers;
        notifyListeners();
    });
};

// Início automático
initFirebaseData();

export const login = async (email: string, pass: string): Promise<User | null> => {
    const mockUser = MOCK_USERS.find(u => u.email === email);
    if (mockUser) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(mockUser));
        notifyListeners();
        return mockUser;
    }

    try {
        const res = await signInWithEmailAndPassword(auth, email, pass);
        const userDoc = await getDoc(doc(db, 'users', res.user.uid));
        if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
            notifyListeners();
            return userData;
        }
    } catch (e: any) {
        if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
            throw new Error("E-mail ou senha incorretos.");
        }
        throw e;
    }
    return null;
};

export const loginWithGoogle = async (): Promise<User | null> => {
    const provider = new GoogleAuthProvider();
    try {
        const res = await signInWithPopup(auth, provider);
        const userDoc = await getDoc(doc(db, 'users', res.user.uid));
        if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
            notifyListeners();
            return userData;
        } else {
            const newUser: User = {
                id: res.user.uid,
                name: res.user.displayName || 'Usuário Google',
                email: res.user.email || '',
                role: UserRole.CUSTOMER,
                favorites: { coupons: [], businesses: [] },
                history: [],
                savedAmount: 0,
                avatarUrl: res.user.photoURL || undefined
            };
            await setDoc(doc(db, 'users', newUser.id), cleanObject(newUser));
            localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
            notifyListeners();
            return newUser;
        }
    } catch (e: any) {
        console.error("Google Login Error:", e);
        throw e;
    }
};

export const logout = async () => {
    await auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    notifyListeners();
};

export const resetUserPassword = async (email: string) => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (e: any) {
        console.error("Erro ao enviar reset de senha:", e);
        throw new Error(e.message || "Não foi possível enviar o e-mail de redefinição.");
    }
};

export const getBusinesses = () => _businesses;
export const getCoupons = async () => _coupons;
export const getBusinessById = (id: string) => _businesses.find(b => b.id === id);

export const saveBusiness = async (b: BusinessProfile) => {
    try { 
        await setDoc(doc(db, 'businesses', b.id), cleanObject(b), { merge: true }); 
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

export const getCategories = () => DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }));
export const getAllUsers = () => _users;

export const saveCoupon = async (c: Coupon) => {
    try { 
        await setDoc(doc(db, 'coupons', c.id), cleanObject(c)); 
    } catch(e) {
        console.error("Erro ao salvar cupom:", e);
    }
};

export const deleteCoupon = async (id: string) => {
    try { 
        await deleteDoc(doc(db, 'coupons', id)); 
    } catch(e) {
        console.error("Erro ao deletar cupom:", e);
    }
};

export const trackAction = async (businessId: string, action: string) => {
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
    const data: any = bizSnap.exists() ? bizSnap.data() : {};
    
    const coupons = _coupons.filter(c => c.companyId === businessId);
    const totalCouponUsage = coupons.reduce((acc, c) => acc + (c.currentRedemptions || 0), 0);

    return {
        views: data.views || 0,
        totalConversions: (data.totalConversions || 0) + totalCouponUsage,
        shares: data.shares || 0,
        conversionTrend: [
            { day: 'Seg', valor: 10 }, { day: 'Ter', valor: 15 }, { day: 'Qua', valor: 8 },
            { day: 'Qui', valor: 20 }, { day: 'Sex', valor: 35 }, { day: 'Sáb', valor: 50 }, { day: 'Dom', valor: 30 },
        ],
        trafficSource: [
            { name: 'Direto/Guia', value: data.directVisits || 10 },
            { name: 'Pesquisas', value: data.searchVisits || 5 },
        ],
        actionHeatmap: [
            { name: 'Redes Sociais', cliques: data.socialClicks || 0 },
            { name: 'Mapa/GPS', cliques: data.mapClicks || 0 },
            { name: 'Ver Cardápio', cliques: data.menuViews || 0 },
            { name: 'Cliques Telefone', cliques: data.phoneClicks || 0 },
            { name: 'Cupons Usados', cliques: totalCouponUsage || 0 },
        ],
        activeCoupons: coupons.length
    };
};

export const getAdminStats = async () => {
    const totalEconomy = _users.reduce((acc, u) => acc + (u.savedAmount || 0), 0);
    const totalLeads = _businesses.reduce((acc, b: any) => acc + (b.totalConversions || 0), 0);

    return {
        totalUsers: _users.length,
        totalBusinesses: _businesses.length,
        totalEconomy,
        totalLeads,
        chartData: [
            { name: 'Gastronomia', value: _businesses.filter(b => b.category === 'Gastronomia').length },
            { name: 'Hospedagem', value: _businesses.filter(b => b.category === 'Hospedagem').length },
            { name: 'Passeios', value: _businesses.filter(b => b.category === 'Passeios').length },
            { name: 'Comércio', value: _businesses.filter(b => b.category === 'Comércio').length }
        ],
        totalCoupons: _coupons.length
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
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

export const identifyNeighborhood = (lat: number, lng: number): string => {
    const sepetibaLat = -22.9689;
    const sepetibaLng = -43.6967;
    const dist = calculateDistance(lat, lng, sepetibaLat, sepetibaLng);
    if (dist < 10) return "Sepetiba";
    return "Rio de Janeiro";
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
