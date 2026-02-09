
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

const SESSION_KEY = 'cr_session_v3';

let _businesses: BusinessProfile[] = [];
let _coupons: Coupon[] = [];
let _users: User[] = [];
let _posts: BlogPost[] = [...MOCK_POSTS];
let _categories: AppCategory[] = DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }));
let _appConfig: AppConfig = { appName: 'CONECTA', appNameHighlight: 'RIO' };

// Fix: Define the missing _collections variable
let _collections: Collection[] = [
    {
        id: 'col1',
        title: 'Melhores de Arraial',
        description: 'Uma seleção dos lugares mais incríveis para visitar em Arraial do Cabo.',
        coverImage: 'https://images.unsplash.com/photo-1590089415225-401cd6f9ad5d?auto=format&fit=crop&q=80&w=800',
        businessIds: ['comp1', 'b1']
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
    console.log("🔄 Inicializando dados do Banco...");
    try {
        const bizSnap = await getDocs(collection(db, 'businesses'));
        const fbBusinesses = bizSnap.docs.map(d => ({ id: d.id, ...d.data() } as BusinessProfile));
        
        const coupSnap = await getDocs(collection(db, 'coupons'));
        const fbCoupons = coupSnap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
        
        const userSnap = await getDocs(collection(db, 'users'));
        _users = userSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));

        // Mescla ou substitui Mock apenas se o FB estiver vazio
        _businesses = fbBusinesses.length > 0 ? fbBusinesses : MOCK_BUSINESSES;
        _coupons = fbCoupons.length > 0 ? fbCoupons : MOCK_COUPONS;
        
        notifyListeners();
        console.log("✅ Dados carregados com sucesso!");
    } catch (error) {
        console.warn("⚠️ Usando dados Mock (Firebase Offline ou Vazio)");
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
        console.warn(`Fallback Login para ${cleanEmail}...`);
        // Fallback para usuários MOCK para facilitar o desenvolvimento
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
    try {
        const snap = await getDocs(collection(db, 'coupons'));
        const cloudCoupons = snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
        if (cloudCoupons.length > 0) {
            _coupons = cloudCoupons;
            return cloudCoupons;
        }
        return _coupons.length > 0 ? _coupons : MOCK_COUPONS;
    } catch {
        return _coupons.length > 0 ? _coupons : MOCK_COUPONS;
    }
};

export const getBusinessById = (id: string) => {
    return _businesses.find(b => b.id === id) || MOCK_BUSINESSES.find(b => b.id === id);
};

export const saveBusiness = async (b: BusinessProfile) => {
    try {
        const cleaned = cleanObject(b);
        await setDoc(doc(db, 'businesses', b.id), cleaned);
    } catch (e) { console.error("Erro ao salvar no Firestore:", e); }
    
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

export const createCompanyRequest = async (r: any) => { 
    const id = Math.random().toString(36).substring(2, 9);
    const newReq = { ...r, id, status: 'PENDING', requestDate: new Date().toISOString() };
    try { await setDoc(doc(db, 'requests', id), cleanObject(newReq)); } catch(e){}
    notifyListeners();
};

export const sendSupportMessage = async (msg: string) => { 
    console.log("Support message sent:", msg); 
};

export const getCompanyRequests = async () => {
    try {
        const snap = await getDocs(collection(db, 'requests'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as CompanyRequest));
    } catch {
        return [];
    }
};

export const approveCompanyRequest = async (id: string) => {
    try {
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
                address: 'Rio de Janeiro, RJ',
                phone: req.phone,
                whatsapp: req.whatsapp || req.phone,
                amenities: [],
                openingHours: { 'Seg-Sex': '09:00 - 18:00' },
                rating: 5.0,
                views: 0,
                isOpenNow: true,
                menu: []
            };
            await setDoc(doc(db, 'businesses', userId), cleanObject(newBiz));
            await initFirebaseData();
        }
    } catch(e) {}
};

export const getAmenities = () => DEFAULT_AMENITIES;
export const getAppConfig = () => _appConfig;
export const getBlogPosts = () => _posts;
export const getLocations = () => [
    { id: 'sepetiba', name: 'Sepetiba', active: true },
    { id: 'centro', name: 'Centro', active: true },
    { id: 'zona-sul', name: 'Zona Sul', active: true }
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

// Fix: Now uses the defined _collections variable
export const getCollections = () => _collections;
export const getFeaturedConfig = () => null;
export const identifyNeighborhood = (lat: number, lng: number) => "Rio de Janeiro";
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

// Fix: Now uses the defined _collections variable
export const getCollectionById = (id: string) => _collections.find(c => c.id === id) || null;
