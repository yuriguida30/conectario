
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
        
        const userSnap = await getDocs(collection(db, 'users'));
        _users = userSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));

        _businesses = [...fbBusinesses];
        MOCK_BUSINESSES.forEach(mock => {
            if (!_businesses.find(b => b.id === mock.id)) _businesses.push(mock);
        });

        _coupons = [...fbCoupons];
        MOCK_COUPONS.forEach(mock => {
            if (!_coupons.find(c => c.id === mock.id)) _coupons.push(mock);
        });

        notifyListeners();
    } catch (error) {
        _businesses = MOCK_BUSINESSES;
        _coupons = MOCK_COUPONS;
        notifyListeners();
    }
};

initFirebaseData();

/**
 * LOGIN HÍBRIDO DEFINITIVO V3
 * Prioriza bypass via Firestore para permitir controle total do Admin.
 */
export const login = async (email: string, password?: string): Promise<User | null> => {
    const cleanEmail = email.toLowerCase().trim();
    const inputPass = password || '123456';
    
    // 1. CHECAGEM DE MASTER ADMIN (Segurança de Acesso)
    if (cleanEmail === 'admin@conectario.com') {
        const adminUser = MOCK_USERS.find(u => u.email === 'admin@conectario.com')!;
        // Busca se o admin mudou sua própria senha no banco
        const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const data = snap.docs[0].data() as any;
            if (data.passwordOverride && inputPass === data.passwordOverride) {
                localStorage.setItem(SESSION_KEY, JSON.stringify({ ...adminUser, ...data, id: snap.docs[0].id }));
                notifyListeners();
                return adminUser;
            }
        }
        // Senha padrão se não houver override
        if (inputPass === '123456') {
            localStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
            notifyListeners();
            return adminUser;
        }
    }

    // 2. BUSCA GERAL NO FIRESTORE (Empresas e Clientes)
    const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as any;
        const targetUser = { id: userDoc.id, ...userData } as User;
        
        // Verifica se o Admin definiu uma senha manual para este usuário
        if (userData.passwordOverride && inputPass === userData.passwordOverride) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(targetUser));
            notifyListeners();
            return targetUser;
        }

        // Se for um usuário Mock que já foi salvo no Firestore, aceita a senha padrão 123456
        if (MOCK_USERS.some(u => u.email.toLowerCase() === cleanEmail) && inputPass === '123456') {
            localStorage.setItem(SESSION_KEY, JSON.stringify(targetUser));
            notifyListeners();
            return targetUser;
        }
    } else {
        // 3. FALLBACK PARA MOCK USERS AINDA NÃO SALVOS (André, etc)
        const mockUser = MOCK_USERS.find(u => u.email.toLowerCase() === cleanEmail);
        if (mockUser && inputPass === '123456') {
            localStorage.setItem(SESSION_KEY, JSON.stringify(mockUser));
            notifyListeners();
            return mockUser;
        }
    }

    // 4. TENTA FIREBASE AUTH (Para usuários que se cadastraram sozinhos)
    try {
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, inputPass);
        const firebaseUser = userCred.user;
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
            notifyListeners();
            return userData;
        }
    } catch (err: any) {
        // Se falhou tudo, as credenciais estão erradas
        throw new Error("Credenciais inválidas. Verifique seu email e senha.");
    }
    
    throw new Error("Credenciais inválidas.");
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
    try { await setDoc(doc(db, 'users', u.id), cleanObject(u), { merge: true }); } catch(e){}
    notifyListeners();
};

/**
 * ATUALIZAÇÃO DE SENHA PELO ADMIN (SALVA NO BANCO)
 * Essa função garante que qualquer alteração seja soberana sobre o Auth.
 */
export const updateUserPassword = async (userId: string, newPass: string) => {
    try {
        await setDoc(doc(db, 'users', userId), { 
            passwordOverride: newPass 
        }, { merge: true });
        
        console.log(`Senha de override gravada com sucesso no Firestore para ${userId}`);
        await initFirebaseData(); 
    } catch(e) {
        console.error("Erro ao gravar override de senha:", e);
        throw e;
    }
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
export const getCompanyRequests = async () => {
    const snap = await getDocs(collection(db, 'requests'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CompanyRequest));
};
export const approveCompanyRequest = async (id: string) => {};
