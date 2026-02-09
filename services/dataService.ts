
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
const PASSWORDS_KEY = 'cr_custom_passwords'; // Novo "cofre" de senhas resetadas

let _businesses: BusinessProfile[] = [];
let _coupons: Coupon[] = [];
let _users: User[] = [];
let _posts: BlogPost[] = [...MOCK_POSTS];
let _categories: AppCategory[] = DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }));
let _appConfig: AppConfig = { appName: 'CONECTA', appNameHighlight: 'RIO' };

let _collections: Collection[] = [
    {
        id: 'col1',
        title: 'Os Melhores Cafés',
        description: 'Uma seleção dos cafés mais charmosos do Rio.',
        coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800',
        businessIds: ['local_1765502020338']
    }
];

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

export const initFirebaseData = async () => {
    try {
        const bizSnap = await getDocs(collection(db, 'businesses'));
        const fbBusinesses = bizSnap.docs.map(d => ({ id: d.id, ...d.data() } as BusinessProfile));
        
        const coupSnap = await getDocs(collection(db, 'coupons'));
        const fbCoupons = coupSnap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
        
        const mergedBiz = [...fbBusinesses];
        MOCK_BUSINESSES.forEach(mock => {
            const existingIdx = mergedBiz.findIndex(b => b.id === mock.id);
            if (existingIdx === -1) mergedBiz.push(mock);
            else {
                if ((mergedBiz[existingIdx].description?.length || 0) < (mock.description?.length || 0)) {
                    mergedBiz[existingIdx] = { ...mock, ...mergedBiz[existingIdx], description: mock.description, address: mock.address, amenities: mock.amenities };
                }
            }
        });
        _businesses = mergedBiz;

        const mergedCoupons = [...fbCoupons];
        MOCK_COUPONS.forEach(mock => {
            if (!mergedCoupons.find(c => c.id === mock.id)) mergedCoupons.push(mock);
        });
        _coupons = mergedCoupons;

        const userSnap = await getDocs(collection(db, 'users'));
        _users = userSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));

        notifyListeners();
    } catch (error) {
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
        // 1. Tenta Firebase Real primeiro
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        const firebaseUser = userCred.user;
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
            notifyListeners();
            return userData;
        }
    } catch (err: any) {
        // 2. Fallback para Mock (André, Admin, etc)
        const mockUser = MOCK_USERS.find(u => u.email === cleanEmail);
        if (mockUser) {
            // Verifica se existe uma senha customizada definida pelo Admin
            const customPasses = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
            const savedPass = customPasses[mockUser.id] || '123456';
            
            if (pass === savedPass) {
                localStorage.setItem(SESSION_KEY, JSON.stringify(mockUser));
                notifyListeners();
                return mockUser;
            }
        }
        throw new Error("Credenciais inválidas.");
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
    try { await setDoc(doc(db, 'businesses', b.id), cleanObject(b), { merge: true }); } catch (e) {}
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
export const getBlogPostById = (id: string) => _posts.find(p => p.id === id);

export const saveCoupon = async (c: Coupon) => {
    try { await setDoc(doc(db, 'coupons', c.id), cleanObject(c)); } catch(e){}
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
    notifyListeners();
};

// Função para o Admin trocar a senha de qualquer usuário
export const updateUserPassword = async (userId: string, newPass: string) => {
    // Para persistir em ambiente de teste, salvamos no localStorage
    const customPasses = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
    customPasses[userId] = newPass;
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(customPasses));
    
    // Se fosse Firebase Real com Cloud Functions, chamaríamos a API aqui.
    console.log(`Senha do usuário ${userId} atualizada para ${newPass}`);
};

export const getAmenities = () => DEFAULT_AMENITIES;
export const getAppConfig = () => _appConfig;
export const getLocations = () => [
    { id: 'sepetiba', name: 'Sepetiba', active: true },
    { id: 'centro', name: 'Centro', active: true }
];

export const getCollections = () => _collections;
export const getCollectionById = (id: string) => _collections.find(c => c.id === id);
export const getFeaturedConfig = (): FeaturedConfig => ({
    title: "Destaque do Rio",
    subtitle: "Aproveite o melhor da Cidade Maravilhosa com descontos exclusivos.",
    imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1600",
    buttonText: "Explorar Agora"
});

export const identifyNeighborhood = (lat: number, lng: number): string => "Rio de Janeiro";
export const calculateDistance = (la1: number, lo1: number, la2: number, lo2: number) => 0;

export const redeemCoupon = async (userId: string, coupon: Coupon) => {
    const user = getCurrentUser();
    if (!user) return;
    const historyItem = { date: new Date().toISOString(), amount: coupon.originalPrice - coupon.discountedPrice, couponTitle: coupon.title, couponId: coupon.id };
    user.history = [...(user.history || []), historyItem];
    user.savedAmount = (user.savedAmount || 0) + historyItem.amount;
    await updateUser(user);
};

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
    try { await updateDoc(doc(db, 'businesses', id), { views: increment(1) }); } catch(e) {}
};

export const registerUser = async (name: string, email: string, pass: string): Promise<User> => {
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    const newUser: User = {
        id: userCred.user.uid,
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

export const sendSupportMessage = async (message: string) => {
    console.log("Support Message received:", message);
};

export const createCompanyRequest = async (form: any) => {};
export const getCompanyRequests = async () => [];
export const approveCompanyRequest = async (id: string) => {};
