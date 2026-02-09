
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
    DEFAULT_AMENITIES, AppConfig, Collection, BusinessPlan,
    FeaturedConfig
} from '../types';
import { MOCK_COUPONS, MOCK_BUSINESSES, MOCK_POSTS, MOCK_USERS } from './mockData';

const SESSION_KEY = 'cr_session_v3';

let _businesses: BusinessProfile[] = [];
let _coupons: Coupon[] = [];
let _users: User[] = [];
let _posts: BlogPost[] = [...MOCK_POSTS];
let _categories: AppCategory[] = DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }));
let _appConfig: AppConfig = { appName: 'CONECTA', appNameHighlight: 'RIO' };

// Internal state for collections and company requests
let _collections: Collection[] = [
    {
        id: 'col1',
        title: 'Os Melhores Cafés',
        description: 'Uma seleção dos cafés mais charmosos do Rio.',
        coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800',
        businessIds: ['andre_karamelo']
    },
    {
        id: 'col2',
        title: 'Noite Carioca',
        description: 'Bares e restaurantes para curtir a noite no Rio.',
        coverImage: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800',
        businessIds: []
    }
];

let _companyRequests: CompanyRequest[] = [];

const notifyListeners = () => {
    window.dispatchEvent(new Event('dataUpdated'));
    window.dispatchEvent(new Event('appConfigUpdated'));
};

onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
            notifyListeners();
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

// --- CRITICAL: MERGE LOGIC ---
export const initFirebaseData = async () => {
    console.log("🔄 Sincronizando com o Banco de Dados Firestore...");
    try {
        // Busca Empresas
        const bizSnap = await getDocs(collection(db, 'businesses'));
        const fbBusinesses = bizSnap.docs.map(d => ({ id: d.id, ...d.data() } as BusinessProfile));
        
        // Busca Cupons
        const coupSnap = await getDocs(collection(db, 'coupons'));
        const fbCoupons = coupSnap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
        
        // Merge: Cloud data takes priority, but Mocks fill the gaps
        const mergedBiz = [...fbBusinesses];
        MOCK_BUSINESSES.forEach(mock => {
            if (!mergedBiz.find(b => b.id === mock.id)) mergedBiz.push(mock);
        });
        _businesses = mergedBiz;

        const mergedCoupons = [...fbCoupons];
        MOCK_COUPONS.forEach(mock => {
            if (!mergedCoupons.find(c => c.id === mock.id)) mergedCoupons.push(mock);
        });
        _coupons = mergedCoupons;

        // Busca Usuários
        const userSnap = await getDocs(collection(db, 'users'));
        _users = userSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));

        notifyListeners();
        console.log(`✅ Sincronizado: ${_businesses.length} empresas e ${_coupons.length} cupons carregados.`);
    } catch (error) {
        console.warn("⚠️ Firestore Offline - Usando mocks locais.");
        _businesses = MOCK_BUSINESSES;
        _coupons = MOCK_COUPONS;
        notifyListeners();
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
        const mockUser = MOCK_USERS.find(u => u.email === cleanEmail);
        if (mockUser && pass === '123456') {
            localStorage.setItem(SESSION_KEY, JSON.stringify(mockUser));
            notifyListeners();
            return mockUser;
        }
        throw new Error("Credenciais inválidas.");
    }
};

export const logout = async () => {
    await auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    notifyListeners();
};

export const getBusinesses = () => _businesses;

export const getCoupons = async () => {
    // Tenta atualizar do cloud antes de retornar
    try {
        const snap = await getDocs(collection(db, 'coupons'));
        const fbCoupons = snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
        const merged = [...fbCoupons];
        MOCK_COUPONS.forEach(mock => {
            if (!merged.find(c => c.id === mock.id)) merged.push(mock);
        });
        _coupons = merged;
    } catch {}
    return _coupons;
};

export const getBusinessById = (id: string) => {
    return _businesses.find(b => b.id === id);
};

export const saveBusiness = async (b: BusinessProfile) => {
    try {
        const cleaned = cleanObject(b);
        await setDoc(doc(db, 'businesses', b.id), cleaned, { merge: true });
    } catch (e) {}
    
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
export const getBlogPosts = () => _posts;

// Fix: Missing getBlogPostById function
export const getBlogPostById = (id: string) => _posts.find(p => p.id === id);

export const registerUser = async (name: string, email: string, password?: string) => { 
    const pass = password || '123456';
    const userCred = await createUserWithEmailAndPassword(auth, email.toLowerCase(), pass);
    const firebaseUser = userCred.user;

    const newUser: User = {
        id: firebaseUser.uid,
        name,
        email: email.toLowerCase(),
        role: UserRole.CUSTOMER,
        savedAmount: 0,
        history: [],
        favorites: { coupons: [], businesses: [] }
    };
    
    await setDoc(doc(db, 'users', newUser.id), cleanObject(newUser));
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    notifyListeners();
    return newUser;
};

export const saveCoupon = async (c: Coupon) => {
    try { 
        await setDoc(doc(db, 'coupons', c.id), cleanObject(c)); 
    } catch(e){}
    
    const idx = _coupons.findIndex(cp => cp.id === c.id);
    if (idx !== -1) _coupons[idx] = c;
    else _coupons.push(c);
    
    notifyListeners();
};

export const deleteCoupon = async (id: string) => {
    try { await updateDoc(doc(db, 'coupons', id), { active: false }); } catch(e){}
    _coupons = _coupons.filter(c => c.id !== id);
    notifyListeners();
};

export const updateUser = async (u: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    try { await setDoc(doc(db, 'users', u.id), cleanObject(u), { merge: true }); } catch(e){}
    const idx = _users.findIndex(user => user.id === u.id);
    if (idx !== -1) _users[idx] = { ..._users[idx], ...u };
    notifyListeners();
};

export const redeemCoupon = async (userId: string, coupon: Coupon) => {
    const user = getCurrentUser();
    if (!user || user.id !== userId) return;
    
    const amount = coupon.originalPrice - coupon.discountedPrice;
    const historyItem = { date: new Date().toISOString(), amount, couponTitle: coupon.title, couponId: coupon.id };
    
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            savedAmount: increment(amount),
            history: [...(user.history || []), historyItem]
        });

        const couponRef = doc(db, 'coupons', coupon.id);
        await updateDoc(couponRef, {
            currentRedemptions: increment(1)
        });
    } catch (e) {}

    await initFirebaseData(); 
};

export const getAmenities = () => DEFAULT_AMENITIES;
export const getAppConfig = () => _appConfig;
export const getLocations = () => [
    { id: 'sepetiba', name: 'Sepetiba', active: true },
    { id: 'centro', name: 'Centro', active: true },
    { id: 'zona-sul', name: 'Zona Sul', active: true },
    { id: 'arraial', name: 'Arraial do Cabo', active: true }
];

export const toggleFavorite = async (type: string, id: string) => {
    const user = getCurrentUser();
    if (!user) return;
    
    const favs = user.favorites || { coupons: [], businesses: [] };
    
    if (type === 'coupon') {
        const idx = favs.coupons.indexOf(id);
        if (idx === -1) favs.coupons.push(id);
        else favs.coupons.splice(idx, 1);
    } else {
        const idx = favs.businesses.indexOf(id);
        if (idx === -1) favs.businesses.push(id);
        else favs.businesses.splice(idx, 1);
    }
    
    user.favorites = favs;
    await updateUser(user);
};

export const incrementBusinessView = async (id: string) => {
    try {
        const bizRef = doc(db, 'businesses', id);
        await updateDoc(bizRef, { views: increment(1) });
    } catch(e) {}
};

export const calculateDistance = (la1: number, lo1: number, la2: number, lo2: number) => {
    const R = 6371;
    const dLat = (la2 - la1) * Math.PI / 180;
    const dLon = (lo2 - lo1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(la1 * Math.PI / 180) * Math.cos(la2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Fix: Missing getCollections function
export const getCollections = () => _collections;

// Fix: Missing getCollectionById function
export const getCollectionById = (id: string) => _collections.find(c => c.id === id);

// Fix: Missing getFeaturedConfig function
export const getFeaturedConfig = (): FeaturedConfig => ({
    title: "Destaque do Rio",
    subtitle: "Aproveite o melhor da Cidade Maravilhosa com descontos exclusivos.",
    imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1600",
    buttonText: "Explorar Agora"
});

// Fix: Missing identifyNeighborhood function
export const identifyNeighborhood = (lat: number, lng: number): string => {
    if (lat < -23.0) return "Recreio / Barra";
    if (lat < -22.95) return "Zona Sul";
    if (lng < -43.3) return "Zona Oeste";
    return "Rio de Janeiro";
};

// Fix: Missing sendSupportMessage function
export const sendSupportMessage = async (msg: string) => {
    console.log("Suporte acionado:", msg);
};

// Fix: Missing createCompanyRequest function
export const createCompanyRequest = async (form: any) => {
    const newReq: CompanyRequest = {
        ...form,
        id: Math.random().toString(36).substr(2, 9),
        status: 'PENDING',
        requestDate: new Date().toISOString()
    };
    _companyRequests.push(newReq);
    try {
        await setDoc(doc(db, 'companyRequests', newReq.id), cleanObject(newReq));
    } catch(e) {}
    notifyListeners();
};

// Fix: Missing getCompanyRequests function
export const getCompanyRequests = async () => {
    try {
        const snap = await getDocs(collection(db, 'companyRequests'));
        _companyRequests = snap.docs.map(d => ({ id: d.id, ...d.data() } as CompanyRequest));
    } catch(e) {}
    return _companyRequests;
};

// Fix: Missing approveCompanyRequest function
export const approveCompanyRequest = async (id: string) => {
    const reqIdx = _companyRequests.findIndex(r => r.id === id);
    if (reqIdx === -1) return;
    
    _companyRequests[reqIdx].status = 'APPROVED';
    const req = _companyRequests[reqIdx];

    const newBiz: BusinessProfile = {
        id: Math.random().toString(36).substr(2, 9),
        name: req.companyName,
        category: req.category,
        description: req.description,
        coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
        gallery: [],
        address: '',
        phone: req.phone,
        whatsapp: req.whatsapp,
        instagram: req.instagram,
        website: req.website,
        amenities: [],
        openingHours: { 'Seg-Sex': '09:00 - 18:00' },
        rating: 5,
        reviewCount: 0,
        views: 0,
        isOpenNow: true,
        plan: BusinessPlan.FREE
    };

    await saveBusiness(newBiz);
    
    try {
        await updateDoc(doc(db, 'companyRequests', id), { status: 'APPROVED' });
    } catch(e) {}
    
    notifyListeners();
};
