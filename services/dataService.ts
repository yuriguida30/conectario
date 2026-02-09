
import { 
    collection, 
    getDocs, 
    getDoc, 
    setDoc, 
    doc, 
    addDoc, 
    updateDoc, 
    query, 
    where, 
    increment,
    serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
    Coupon, User, UserRole, BusinessProfile, BlogPost, 
    CompanyRequest, AppCategory, AppLocation, AppAmenity, 
    DEFAULT_CATEGORIES, DEFAULT_AMENITIES, AppConfig 
} from '../types';
import { MOCK_COUPONS, MOCK_BUSINESSES, MOCK_POSTS, MOCK_USERS } from './mockData';

const SESSION_KEY = 'cr_session_v2';

// Cache em memória para performance, mas sincronizado com o Firebase
let _businesses: BusinessProfile[] = [];
let _coupons: Coupon[] = [];
let _users: User[] = [];
let _posts: BlogPost[] = [...MOCK_POSTS];
let _categories: AppCategory[] = DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }));
let _appConfig: AppConfig = { appName: 'CONECTA', appNameHighlight: 'RIO' };

const notifyListeners = () => {
    window.dispatchEvent(new Event('dataUpdated'));
    window.dispatchEvent(new Event('appConfigUpdated'));
};

// --- INICIALIZAÇÃO E SINCRONIZAÇÃO ---

export const initFirebaseData = async () => {
    try {
        // Carrega Empresas
        const bizSnap = await getDocs(collection(db, 'businesses'));
        _businesses = bizSnap.docs.map(d => ({ id: d.id, ...d.data() } as BusinessProfile));
        
        // Carrega Cupons
        const coupSnap = await getDocs(collection(db, 'coupons'));
        _coupons = coupSnap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
        
        // Carrega Usuários
        const userSnap = await getDocs(collection(db, 'users'));
        _users = userSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));

        // Se o banco estiver vazio (primeiro acesso), podemos carregar os Mocks opcionalmente
        if (_businesses.length === 0) _businesses = MOCK_BUSINESSES;
        if (_coupons.length === 0) _coupons = MOCK_COUPONS;
        
        notifyListeners();
        console.log("✅ Firebase sincronizado com sucesso!");
    } catch (error) {
        console.error("❌ Erro ao inicializar Firebase:", error);
    }
};

// Chama a inicialização imediatamente
initFirebaseData();

// --- FUNÇÕES DE BUSCA ---

export const getCategories = () => _categories;
export const getBusinesses = () => _businesses;

// Added missing getAllUsers export to fix errors in Blog and BlogDetail pages
export const getAllUsers = () => _users;

export const getCoupons = async () => {
    // Forçamos um refresh rápido para garantir que novos cupons apareçam
    const snap = await getDocs(collection(db, 'coupons'));
    _coupons = snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
    return _coupons;
};

export const getBusinessById = (id: string) => _businesses.find(b => b.id === id);
export const getBlogPostById = (id: string) => _posts.find(p => p.id === id);

// --- AUTENTICAÇÃO E SESSÃO ---

export const getCurrentUser = (): User | null => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
};

export const login = async (email: string, password?: string): Promise<User | null> => {
    const cleanEmail = email.toLowerCase().trim();
    
    // Login especial para Admin Master
    if (cleanEmail === 'admin@conectario.com' && password === '123456') {
        const admin = _users.find(u => u.role === UserRole.SUPER_ADMIN) || MOCK_USERS[0];
        localStorage.setItem(SESSION_KEY, JSON.stringify(admin));
        return admin;
    }

    // Busca no Firestore
    const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
        const userData = { id: snap.docs[0].id, ...snap.docs[0].data() } as User;
        // Senha padrão para demo 123456
        if (password === '123456') {
            localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
            notifyListeners();
            return userData;
        }
    }
    return null;
};

export const logout = async () => {
    localStorage.removeItem(SESSION_KEY);
    notifyListeners();
};

export const registerUser = async (name: string, email: string, password?: string): Promise<User> => {
    const newUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        name,
        email: email.toLowerCase(),
        role: UserRole.CUSTOMER,
        savedAmount: 0,
        history: [],
        favorites: { coupons: [], businesses: [] }
    };
    
    await setDoc(doc(db, 'users', newUser.id), newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    notifyListeners();
    return newUser;
};

// --- GESTÃO DE DADOS (ESCRITA NO FIREBASE) ---

export const saveBusiness = async (b: BusinessProfile) => {
    await setDoc(doc(db, 'businesses', b.id), b);
    const idx = _businesses.findIndex(biz => biz.id === b.id);
    if (idx !== -1) _businesses[idx] = b;
    else _businesses.push(b);
    notifyListeners();
};

export const saveCoupon = async (c: Coupon) => {
    await setDoc(doc(db, 'coupons', c.id), c);
    const idx = _coupons.findIndex(cp => cp.id === c.id);
    if (idx !== -1) _coupons[idx] = c;
    else _coupons.push(c);
    notifyListeners();
};

export const deleteCoupon = async (id: string) => {
    // Nota: Para deletar no Firebase use deleteDoc, aqui marcamos como inativo para segurança
    const couponRef = doc(db, 'coupons', id);
    await updateDoc(couponRef, { active: false });
    _coupons = _coupons.filter(c => c.id !== id);
    notifyListeners();
};

export const updateUser = async (u: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    await setDoc(doc(db, 'users', u.id), u);
    const idx = _users.findIndex(user => user.id === u.id);
    if (idx !== -1) _users[idx] = u;
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
        // Nota: No Firebase real usaríamos arrayUnion, aqui sobrescrevemos para simplificar a demo
        history: [...(user.history || []), historyItem]
    });

    // Atualiza contagem do cupom
    const couponRef = doc(doc(db, 'coupons', coupon.id));
    await updateDoc(couponRef, {
        currentRedemptions: increment(1)
    });

    await initFirebaseData(); // Refresh total
};

export const createCompanyRequest = async (req: any) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newReq = { ...req, id, status: 'PENDING', requestDate: new Date().toISOString() };
    await setDoc(doc(db, 'requests', id), newReq);
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
        
        const userId = `user_${id}`;
        const newUser: User = {
            id: userId,
            name: req.ownerName,
            email: req.email.toLowerCase(),
            role: UserRole.COMPANY,
            companyName: req.companyName,
            category: req.category,
            permissions: { canCreateCoupons: true, canManageBusiness: true }
        };
        await setDoc(doc(db, 'users', userId), newUser);

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
        await setDoc(doc(db, 'businesses', userId), newBiz);
        
        await initFirebaseData();
    }
};

// Outros helpers
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
export const getCollections = () => [];
export const getFeaturedConfig = () => null;
export const identifyNeighborhood = (lat: number, lng: number) => "Sepetiba, Rio de Janeiro";
export const calculateDistance = (la1: number, lo1: number, la2: number, lo2: number) => 0;
export const sendSupportMessage = async (m: any) => {};
export const fetchReviewsForBusiness = async (id: string) => [];
export const addBusinessReview = async (bid: string, r: any) => {};
export const incrementSocialClick = async (bid: string, t: string) => {};
export const getCollectionById = (id: string) => null;
