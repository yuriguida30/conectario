
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

// Monitora mudanças na autenticação do Firebase para manter sincronizado
onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
        // Se houver um usuário no Firebase Auth, garantimos que os dados locais reflitam o Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        }
    }
});

// Helper para remover campos undefined que quebram o Firestore
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
        console.error("❌ Erro ao inicializar Firebase:", error);
    }
};

initFirebaseData();

export const getCategories = () => _categories;
export const getBusinesses = () => _businesses;
export const getAllUsers = () => _users;

export const getCoupons = async () => {
    const snap = await getDocs(collection(db, 'coupons'));
    _coupons = snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
    return _coupons;
};

export const getBusinessById = (id: string) => _businesses.find(b => b.id === id);
export const getBlogPostById = (id: string) => _posts.find(p => p.id === id);

export const getCurrentUser = (): User | null => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
};

export const login = async (email: string, password?: string): Promise<User | null> => {
    const cleanEmail = email.toLowerCase().trim();
    const pass = password || '123456';

    try {
        // Tenta autenticar REALMENTE no Firebase
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        const firebaseUser = userCred.user;

        // Busca os dados complementares no Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
            notifyListeners();
            return userData;
        } else {
            // Caso o usuário exista no Auth mas não no Firestore (raro, mas pode acontecer)
            const fallbackUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Usuário',
                email: cleanEmail,
                role: UserRole.CUSTOMER
            };
            await updateUser(fallbackUser);
            return fallbackUser;
        }
    } catch (err: any) {
        console.error("Erro no Login Firebase Auth:", err.code);
        // Fallback para o admin master se o Firebase Auth falhar (apenas para facilitar seu primeiro acesso)
        if (cleanEmail === 'admin@conectario.com' && pass === '123456') {
            const admin = _users.find(u => u.role === UserRole.SUPER_ADMIN) || MOCK_USERS[0];
            localStorage.setItem(SESSION_KEY, JSON.stringify(admin));
            return admin;
        }
        throw new Error(err.message);
    }
};

export const logout = async () => {
    await auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    notifyListeners();
};

export const registerUser = async (name: string, email: string, password?: string): Promise<User> => {
    const pass = password || '123456';
    
    // Cria usuário no Firebase Authentication
    const userCred = await createUserWithEmailAndPassword(auth, email.toLowerCase(), pass);
    const firebaseUser = userCred.user;

    const newUser: User = {
        id: firebaseUser.uid, // Usamos o UID do Firebase Auth para consistência
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

export const saveBusiness = async (b: BusinessProfile) => {
    const cleaned = cleanObject(b);
    await setDoc(doc(db, 'businesses', b.id), cleaned);
    const idx = _businesses.findIndex(biz => biz.id === b.id);
    if (idx !== -1) _businesses[idx] = b;
    else _businesses.push(b);
    notifyListeners();
};

export const saveCoupon = async (c: Coupon) => {
    const cleaned = cleanObject(c);
    await setDoc(doc(db, 'coupons', c.id), cleaned);
    const idx = _coupons.findIndex(cp => cp.id === c.id);
    if (idx !== -1) _coupons[idx] = c;
    else _coupons.push(c);
    notifyListeners();
};

export const deleteCoupon = async (id: string) => {
    const couponRef = doc(db, 'coupons', id);
    await updateDoc(couponRef, { active: false });
    _coupons = _coupons.filter(c => c.id !== id);
    notifyListeners();
};

export const updateUser = async (u: User) => {
    const loggedUser = getCurrentUser();
    // Só atualiza o localStorage se estivermos editando o PRÓPRIO perfil
    if (loggedUser && loggedUser.id === u.id) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    }
    
    const cleaned = cleanObject(u);
    // Usamos setDoc para garantir que o documento seja criado se não existir
    await setDoc(doc(db, 'users', u.id), cleaned, { merge: true });
    
    const idx = _users.findIndex(user => user.id === u.id);
    if (idx !== -1) _users[idx] = { ..._users[idx], ...u };
    notifyListeners();
};

export const redeemCoupon = async (userId: string, coupon: Coupon) => {
    const user = getCurrentUser();
    if (!user || user.id !== userId) return;
    
    const amount = coupon.originalPrice - coupon.discountedPrice;
    const historyItem = { date: new Date().toISOString(), amount, couponTitle: coupon.title, couponId: coupon.id };
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        savedAmount: increment(amount),
        history: [...(user.history || []), historyItem]
    });

    const couponRef = doc(db, 'coupons', coupon.id);
    await updateDoc(couponRef, {
        currentRedemptions: increment(1)
    });

    await initFirebaseData(); 
};

export const createCompanyRequest = async (req: any) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newReq = { ...req, id, status: 'PENDING', requestDate: new Date().toISOString() };
    await setDoc(doc(db, 'requests', id), cleanObject(newReq));
    notifyListeners();
};

export const getCompanyRequests = async () => {
    const snap = await getDocs(collection(db, 'requests'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CompanyRequest));
};

export const approveCompanyRequest = async (id: string) => {
    const reqRef = doc(db, 'requests', id);
    const reqSnap = await getDoc(reqRef);
    
    if (reqSnap.exists()) {
        const req = reqSnap.data() as CompanyRequest;
        await updateDoc(reqRef, { status: 'APPROVED' });
        
        const userId = `company_${id}`;
        const newUser: User = {
            id: userId,
            name: req.ownerName,
            email: req.email.toLowerCase(),
            role: UserRole.COMPANY,
            companyName: req.companyName,
            category: req.category,
            permissions: { canCreateCoupons: true, canManageBusiness: true }
        };
        await setDoc(doc(db, 'users', userId), cleanObject(newUser));

        const newBiz: BusinessProfile = {
            id: userId,
            name: req.companyName,
            category: req.category,
            description: req.description || 'Bem-vindo!',
            coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
            gallery: [],
            address: 'Sepetiba, RJ',
            phone: req.phone,
            whatsapp: req.whatsapp || req.phone,
            amenities: [],
            openingHours: { 'Seg-Sex': '09:00 - 18:00' },
            rating: 5.0,
            views: 0,
            isOpenNow: true
        };
        await setDoc(doc(db, 'businesses', userId), cleanObject(newBiz));
        
        await initFirebaseData();
    }
};

export const getAmenities = () => DEFAULT_AMENITIES;
export const getAppConfig = () => _appConfig;
export const getBlogPosts = () => _posts;
export const getLocations = () => [
    { id: 'sepetiba', name: 'Sepetiba', active: true },
    { id: 'centro', name: 'Centro', active: true }
];
export const toggleFavorite = async (type: string, id: string) => {
    const user = getCurrentUser();
    if (!user) return;
    if (!user.favorites) user.favorites = { coupons: [], businesses: [] };
    
    if (type === 'coupon') {
        const idx = user.favorites.coupons.indexOf(id);
        if (idx === -1) user.favorites.coupons.push(id);
        else user.favorites.coupons.splice(idx, 1);
    } else {
        const idx = user.favorites.businesses.indexOf(id);
        if (idx === -1) user.favorites.businesses.push(id);
        else user.favorites.businesses.splice(idx, 1);
    }
    await updateUser(user);
};
export const incrementBusinessView = async (id: string) => {
    const bizRef = doc(db, 'businesses', id);
    await updateDoc(bizRef, { views: increment(1) });
};
export const getCollections = () => _collections;
export const getFeaturedConfig = () => null;
export const identifyNeighborhood = (lat: number, lng: number) => "Sepetiba, Rio de Janeiro";
export const calculateDistance = (la1: number, lo1: number, la2: number, lo2: number) => 0;
export const sendSupportMessage = async (m: any) => {};
export const fetchReviewsForBusiness = async (id: string) => [];
export const addBusinessReview = async (bid: string, r: any) => {};
export const incrementSocialClick = async (bid: string, t: string) => {};
export const getCollectionById = (id: string) => _collections.find(c => c.id === id) || null;
