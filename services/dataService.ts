
import { Coupon, User, UserRole, BusinessProfile, BlogPost, CompanyRequest, AppCategory, AppLocation, AppAmenity, Collection, DEFAULT_CATEGORIES, DEFAULT_AMENITIES, PROTECTED_CATEGORIES, FeaturedConfig, SupportMessage, AppConfig, Review } from '../types';
import { MOCK_COUPONS, MOCK_BUSINESSES, MOCK_POSTS, MOCK_USERS } from './mockData';
import { db, auth } from './firebase'; // Importa a conexão real e auth
import { collection, setDoc, doc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';

// --- HELPERS BÁSICOS ---
const LOCAL_AUTH_KEY = 'arraial_local_auth_db';

const getStored = <T>(key: string, defaultData: T): T => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultData;
    } catch {
        return defaultData;
    }
};

const setStored = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('dataUpdated'));
};

// --- SYNC HELPER ---
const syncToFirebase = async (collectionName: string, id: string, data: any) => {
    if (!db) return;
    try {
        await setDoc(doc(db, collectionName, id), data, { merge: true });
    } catch (e) {
        console.error(`Erro ao sincronizar ${collectionName}:`, e);
    }
};

const deleteFromFirebase = async (collectionName: string, id: string) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, collectionName, id));
    } catch (e) {
        console.error(`Erro ao deletar de ${collectionName}:`, e);
    }
}

// --- REALTIME LISTENERS ---
let unsubscribers: Function[] = [];

const setupRealtimeListener = (collectionName: string, storageKey: string, defaultData: any[]) => {
    if (!db) return;
    
    const unsub = onSnapshot(collection(db, collectionName), (snapshot) => {
        if (!snapshot.empty) {
            const data = snapshot.docs.map(d => d.data());
            setStored(storageKey, data);
        } else {
             if (defaultData.length > 0 && getStored(storageKey, []).length === 0) {
                 // First seed logic handled in init
             }
        }
    }, (error) => {
        console.warn(`Aviso: Firestore não configurado ou offline (${collectionName}). Usando dados locais.`);
    });

    unsubscribers.push(unsub);
};

// --- INITIALIZATION ---
export const initFirebaseData = async () => {
    console.log("Iniciando conexão Realtime Database...");
    
    // --- SEED ADMIN PASSWORD (LOCAL FALLBACK) ---
    try {
        const localAuth = JSON.parse(localStorage.getItem(LOCAL_AUTH_KEY) || '{}');
        // Senha padrão '123456' em base64
        const defaultPass = btoa('123456');
        
        if (!localAuth['admin@conectario.com']) {
            localAuth['admin@conectario.com'] = defaultPass; 
        }
        if (!localAuth['empresa@email.com']) {
            localAuth['empresa@email.com'] = defaultPass; 
        }
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(localAuth));
    } catch (e) {
        console.error("Erro ao configurar senhas padrão:", e);
    }

    if (db) {
        try {
            setupRealtimeListener('businesses', 'arraial_businesses', MOCK_BUSINESSES);
            setupRealtimeListener('coupons', 'arraial_coupons', MOCK_COUPONS);
            setupRealtimeListener('users', 'arraial_users_list', MOCK_USERS);
            setupRealtimeListener('posts', 'arraial_blog_posts', MOCK_POSTS);
            setupRealtimeListener('collections', 'arraial_collections', []);
            setupRealtimeListener('requests', 'arraial_requests', []);
            setupRealtimeListener('support', 'arraial_support_messages', []);
            
            onSnapshot(collection(db, 'system'), (snap) => {
                 snap.forEach(doc => {
                     if(doc.id === 'app_config') setStored('app_config', doc.data());
                     if(doc.id === 'featured_config') setStored('arraial_featured_config', doc.data());
                 });
            }, (err) => console.warn("Firestore System offline"));

            // Seed inicial se local estiver vazio
            setTimeout(() => {
                 const localBiz = getStored<any[]>('arraial_businesses', []);
                 if (localBiz.length === 0) {
                     // Se não tem nada local, carrega mocks para memória
                     setStored('arraial_businesses', MOCK_BUSINESSES);
                     setStored('arraial_coupons', MOCK_COUPONS);
                     setStored('arraial_users_list', MOCK_USERS);
                     setStored('arraial_blog_posts', MOCK_POSTS);
                 }
            }, 1000);

        } catch (e) {
            console.error("Erro ao iniciar listeners:", e);
        }
    } else {
        // Fallback total se não houver objeto DB
        const existingBiz = getStored<BusinessProfile[]>('arraial_businesses', []);
        if (existingBiz.length < 2) {
            setStored('arraial_businesses', MOCK_BUSINESSES);
            setStored('arraial_coupons', MOCK_COUPONS);
            setStored('arraial_blog_posts', MOCK_POSTS);
            setStored('arraial_users_list', MOCK_USERS);
        }
    }

    const cats = getStored<AppCategory[]>('arraial_categories', []);
    if (cats.length === 0) {
        const defaults = DEFAULT_CATEGORIES.map(c => ({ id: c.toLowerCase(), name: c }));
        setStored('arraial_categories', defaults);
    }
};

export const getAppConfig = (): AppConfig => {
    return getStored<AppConfig>('app_config', {
        appName: 'CONECTA',
        appNameHighlight: 'RIO',
        logoUrl: '', 
        loginLogoUrl: '',
        faviconUrl: ''
    });
};

export const saveAppConfig = (config: AppConfig) => {
    setStored('app_config', config);
    syncToFirebase('system', 'app_config', config);
};

// --- GPS UTILS ---
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function deg2rad(deg: number) { return deg * (Math.PI / 180) }

export const identifyNeighborhood = (lat: number, lng: number): string => {
    return "Arraial do Cabo"; 
};

// --- FEATURED CONFIG ---
export const getFeaturedConfig = (): FeaturedConfig => {
    return getStored<FeaturedConfig>('arraial_featured_config', {
        title: "Arraial Vip Tour",
        subtitle: "Passeio de barco inesquecível pelas águas cristalinas.",
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a42a4571d0?auto=format&fit=crop&q=80&w=1600",
        buttonText: "Ver Oferta"
    });
};

export const saveFeaturedConfig = (config: FeaturedConfig) => {
    setStored('arraial_featured_config', config);
    syncToFirebase('system', 'featured_config', config);
};

// --- CONFIGS ---
export const getCategories = (): AppCategory[] => {
    const stored = getStored<AppCategory[]>('arraial_categories', []);
    if (stored.length === 0) return DEFAULT_CATEGORIES.map(c => ({ id: c.toLowerCase(), name: c }));
    return stored;
};

export const addCategory = (name: string): void => {
    const current = getCategories();
    const newCat = { id: Date.now().toString(), name };
    setStored('arraial_categories', [...current, newCat]);
};

export const deleteCategory = (id: string): void => {
    const current = getCategories();
    const catToDelete = current.find(c => c.id === id);
    if (catToDelete && PROTECTED_CATEGORIES.includes(catToDelete.name)) {
        alert("Categoria padrão não pode ser excluída.");
        return;
    }
    setStored('arraial_categories', current.filter(c => c.id !== id));
};

export const getLocations = (): AppLocation[] => getStored<AppLocation[]>('arraial_locations', []);
export const addLocation = (name: string): void => {
    const current = getLocations();
    const newLoc = { id: Date.now().toString(), name, active: true };
    setStored('arraial_locations', [...current, newLoc]);
};
export const deleteLocation = (id: string): void => {
    const current = getLocations();
    setStored('arraial_locations', current.filter(l => l.id !== id));
};

export const getAmenities = (): AppAmenity[] => getStored<AppAmenity[]>('arraial_amenities', DEFAULT_AMENITIES);
export const addAmenity = (label: string): void => {
    const current = getAmenities();
    const id = label.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newAmenity = { id: id + Date.now().toString().slice(-4), label };
    setStored('arraial_amenities', [...current, newAmenity]);
};
export const deleteAmenity = (id: string): void => {
    const current = getAmenities();
    setStored('arraial_amenities', current.filter(a => a.id !== id));
};

// --- USERS ---
export const getAllUsers = (): User[] => getStored<User[]>('arraial_users_list', []);

export const createUser = (user: User): void => {
    const users = getAllUsers();
    if (users.find(u => u.email === user.email)) return; 
    users.push(user);
    setStored('arraial_users_list', users);
    syncToFirebase('users', user.id, user); 
};

export const updateUser = (user: User): void => {
    const users = getAllUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
        users[index] = user;
        setStored('arraial_users_list', users);
        syncToFirebase('users', user.id, user);
        
        const session = getCurrentUser();
        if(session && session.id === user.id) {
             localStorage.setItem('arraial_user', JSON.stringify(user));
             if (currentUser && currentUser.id === user.id) currentUser = user;
        }
    }
};

export const deleteUser = (userId: string): void => {
    const users = getAllUsers();
    setStored('arraial_users_list', users.filter(u => u.id !== userId));
    deleteFromFirebase('users', userId);
};

// --- COUPONS ---
export const getCoupons = async (): Promise<Coupon[]> => {
    const storedCoupons = getStored<Coupon[]>('arraial_coupons', []);
    const businesses = getBusinesses();
    
    return storedCoupons.map(coupon => {
        const business = businesses.find(b => b.id === coupon.companyId);
        if (business) {
            return {
                ...coupon,
                lat: business.lat || coupon.lat,
                lng: business.lng || coupon.lng,
                companyLogo: business.coverImage
            };
        }
        return coupon;
    });
};

export const saveCoupon = async (coupon: Coupon): Promise<void> => {
    // Tenta salvar no Firebase, mas não bloqueia se falhar (quota/tamanho)
    try {
        await syncToFirebase('coupons', coupon.id, coupon);
    } catch (e) {
        console.warn("Falha ao salvar cupom no Firebase, salvando apenas localmente.");
    }

    // Salva Localmente com segurança de cota
    try {
        const current = getStored<Coupon[]>('arraial_coupons', []);
        const index = current.findIndex(c => c.id === coupon.id);
        if (index >= 0) current[index] = coupon;
        else current.unshift(coupon);
        setStored('arraial_coupons', current);
    } catch (e) {
        alert("⚠️ Memória cheia! Não foi possível salvar este cupom. Tente usar imagens menores.");
    }
};

export const deleteCoupon = async (id: string): Promise<void> => {
    const current = getStored<Coupon[]>('arraial_coupons', []);
    setStored('arraial_coupons', current.filter(c => c.id !== id));
    await deleteFromFirebase('coupons', id);
};

// --- AUTH (HYBRID REAL + FALLBACK) ---
let currentUser: User | null = null;

export const getCurrentUser = (): User | null => {
    if (currentUser) return currentUser;
    const stored = localStorage.getItem('arraial_user');
    currentUser = stored ? JSON.parse(stored) : null;
    return currentUser;
};

// Nova função para Cadastro com Fallback
export const registerUser = async (name: string, email: string, password: string): Promise<User | null> => {
    try {
        if (!auth) throw new Error("no_auth_service");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        const newUser: User = {
            id: firebaseUser.uid,
            name: name,
            email: email,
            role: UserRole.CUSTOMER,
            savedAmount: 0,
            history: [],
            favorites: { coupons: [], businesses: [] }
        };

        await syncToFirebase('users', newUser.id, newUser);
        setStored('arraial_user', newUser); 
        createUser(newUser);
        currentUser = newUser;
        return newUser;

    } catch (error: any) {
        // Códigos de erro que indicam problema no Firebase, mas não erro do usuário
        if (error.code === 'auth/configuration-not-found' || error.code === 'auth/operation-not-allowed' || error.message === 'no_auth_service' || error.code === 'auth/internal-error') {
            console.warn("⚠️ Firebase Auth indisponível ou mal configurado. Usando Auth Local.");
            
            const users = getAllUsers();
            if (users.find(u => u.email === email)) {
                const e = new Error("email-already-in-use");
                (e as any).code = "auth/email-already-in-use";
                throw e;
            }

            const localAuth = JSON.parse(localStorage.getItem(LOCAL_AUTH_KEY) || '{}');
            localAuth[email] = btoa(password); 
            localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(localAuth));

            const newUser: User = {
                id: 'local_' + Date.now(),
                name: name,
                email: email,
                role: UserRole.CUSTOMER,
                savedAmount: 0,
                history: [],
                favorites: { coupons: [], businesses: [] }
            };
            createUser(newUser);
            currentUser = newUser;
            localStorage.setItem('arraial_user', JSON.stringify(newUser));
            return newUser;
        }
        
        console.error("Erro no cadastro:", error);
        throw error;
    }
};

export const login = async (email: string, password?: string): Promise<User | null> => {
    if (password) {
        try {
            if (!auth) throw new Error("no_auth_service");
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;
            
            if (db) {
                try {
                    const docRef = doc(db, 'users', uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const userData = docSnap.data() as User;
                        currentUser = userData;
                        localStorage.setItem('arraial_user', JSON.stringify(userData));
                        return userData;
                    }
                } catch(e) { console.warn("Erro ao buscar perfil extra:", e) }
            }
            
            // Fallback se logou no auth mas nao tem doc
            const fallbackUser: User = {
                id: uid,
                name: userCredential.user.displayName || email.split('@')[0],
                email: email,
                role: UserRole.CUSTOMER,
                savedAmount: 0,
                favorites: { coupons: [], businesses: [] }
            };
            currentUser = fallbackUser;
            localStorage.setItem('arraial_user', JSON.stringify(fallbackUser));
            return fallbackUser;

        } catch (error: any) {
            console.warn("Login Firebase falhou, tentando fallback local...", error.code);

            // FALLBACK ROBUSTO
            // 1. Tenta login com banco de dados local (contas criadas recentemente)
            const localAuth = JSON.parse(localStorage.getItem(LOCAL_AUTH_KEY) || '{}');
            const storedPass = localAuth[email];

            if (storedPass && storedPass === btoa(password)) {
                const allUsers = getAllUsers();
                const user = allUsers.find(u => u.email === email);
                if (user) {
                    currentUser = user;
                    localStorage.setItem('arraial_user', JSON.stringify(user));
                    return user;
                }
            }

            // 2. Tenta login HARDCODED para contas de demonstração (caso LocalStorage tenha sido limpo)
            // Isso resolve o problema de 'auth/configuration-not-found' para as contas demo
            if (email === 'empresa@email.com' && password === '123456') {
                 const user = MOCK_USERS.find(u => u.email === email);
                 if (user) {
                     currentUser = user;
                     localStorage.setItem('arraial_user', JSON.stringify(user));
                     return user;
                 }
            }
            if (email === 'admin@conectario.com' && password === '123456') {
                 const user = MOCK_USERS.find(u => u.email === email);
                 if (user) {
                     currentUser = user;
                     localStorage.setItem('arraial_user', JSON.stringify(user));
                     return user;
                 }
            }

            // Se nada funcionou, repassa o erro original
            throw error;
        }
    }
    return null;
};

export const logout = async () => {
    if (auth) {
        try { await signOut(auth); } catch {}
    }
    currentUser = null;
    localStorage.removeItem('arraial_user');
};

export const toggleFavorite = (type: 'coupon' | 'business', id: string): User | null => {
    const user = getCurrentUser();
    if (!user) return null;
    
    if (!user.favorites) {
        user.favorites = { coupons: [], businesses: [] };
    }
    if (!user.favorites.businesses) user.favorites.businesses = [];
    if (!user.favorites.coupons) user.favorites.coupons = [];

    const list = type === 'coupon' ? user.favorites.coupons : user.favorites.businesses;
    const index = list.indexOf(id);
    
    if (index >= 0) {
        list.splice(index, 1);
    } else {
        list.push(id);
    }

    updateUser(user);
    return user;
};

export const redeemCoupon = async (userId: string, coupon: Coupon) => {
    const user = getCurrentUser();
    if (user) {
        const saved = coupon.originalPrice - coupon.discountedPrice;
        const newHistory = [...(user.history || []), {
            date: new Date().toISOString().split('T')[0],
            amount: saved,
            couponTitle: coupon.title
        }];
        const updatedUser = {
            ...user,
            savedAmount: (user.savedAmount || 0) + saved,
            history: newHistory
        };
        updateUser(updatedUser);
    }
};

// --- HOURS & OPEN LOGIC ---
const DAYS_LOOKUP = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const checkIsOpen = (hours: { [key: string]: string } | undefined): boolean => {
    if (!hours) return false;
    const now = new Date();
    const dayName = DAYS_LOOKUP[now.getDay()];
    const timeString = hours[dayName];

    if (!timeString || timeString.toLowerCase().includes('fechado')) return false;
    if (timeString.toLowerCase().includes('24h')) return true;

    // Expected format: "09:00 - 18:00"
    const parts = timeString.split('-').map(p => p.trim());
    if (parts.length !== 2) return false;

    const [start, end] = parts;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = start.split(':').map(Number);
    const startMinutes = startH * 60 + (startM || 0);

    const [endH, endM] = end.split(':').map(Number);
    let endMinutes = endH * 60 + (endM || 0);

    // Handle overnight (e.g., 18:00 - 02:00)
    if (endMinutes < startMinutes) {
        const extendedEnd = endMinutes + 1440;
        if (currentMinutes >= startMinutes) {
            return true; // We are in the evening part
        }
        if (currentMinutes < endMinutes) {
             return true; 
        }
        return false;
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

// --- BUSINESSES ---
export const getBusinesses = (): BusinessProfile[] => {
    const biz = getStored<BusinessProfile[]>('arraial_businesses', []);
    return biz.map(b => ({
        ...b,
        isOpenNow: checkIsOpen(b.openingHours)
    }));
};

export const saveBusiness = async (business: BusinessProfile): Promise<void> => {
    // Tenta salvar localmente primeiro com try/catch para cota
    try {
        const current = getStored<BusinessProfile[]>('arraial_businesses', []);
        const index = current.findIndex(b => b.id === business.id);
        if (index >= 0) current[index] = business;
        else current.push(business);
        setStored('arraial_businesses', current);
    } catch (e) {
        alert("⚠️ Memória local cheia! Não foi possível salvar o perfil completo.");
        return;
    }
    
    // Tenta Firebase sem bloquear
    try {
        await syncToFirebase('businesses', business.id, business);
    } catch(e) {}
};

export const addBusinessReview = (businessId: string, user: User, rating: number, comment: string) => {
    const current = getBusinesses();
    const index = current.findIndex(b => b.id === businessId);
    
    if (index >= 0) {
        const biz = current[index];
        const newReview: Review = {
            id: `rev_${Date.now()}`,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatarUrl,
            rating: rating,
            comment: comment,
            date: new Date().toISOString().split('T')[0]
        };

        const existingReviews = biz.reviews || [];
        const newReviews = [newReview, ...existingReviews];
        
        // Recalculate average
        const totalStars = newReviews.reduce((sum, r) => sum + r.rating, 0);
        const newAverage = parseFloat((totalStars / newReviews.length).toFixed(1));

        current[index] = { 
            ...biz, 
            reviews: newReviews,
            rating: newAverage, 
            reviewCount: newReviews.length 
        };
        
        // We setStored with raw data
        const rawBiz = getStored<BusinessProfile[]>('arraial_businesses', []);
        const rawIndex = rawBiz.findIndex(b => b.id === businessId);
        if(rawIndex >= 0) {
            rawBiz[rawIndex] = current[index];
            setStored('arraial_businesses', rawBiz);
            syncToFirebase('businesses', biz.id, current[index]);
        }
        return current[index];
    }
    return null;
};

export const rateBusiness = (businessId: string, rating: number) => {
    // Deprecated in favor of addBusinessReview but kept for compatibility if needed elsewhere
    // This simple version doesn't add text
    return addBusinessReview(businessId, { id: 'anon', name: 'Anônimo' } as User, rating, '');
};

export const getBusinessById = (id: string): BusinessProfile | undefined => {
    return getBusinesses().find(b => b.id === id);
}

// --- COLLECTIONS & BLOG ---
export const getCollections = (): Collection[] => getStored<Collection[]>('arraial_collections', []);
export const saveCollection = (collection: Collection): void => {
    const current = getCollections();
    const index = current.findIndex(c => c.id === collection.id);
    if (index >= 0) current[index] = collection;
    else current.unshift(collection);
    setStored('arraial_collections', current);
    syncToFirebase('collections', collection.id, collection);
};
export const deleteCollection = (id: string): void => {
    const current = getCollections();
    setStored('arraial_collections', current.filter(c => c.id !== id));
    deleteFromFirebase('collections', id);
};
export const getCollectionById = (id: string): Collection | undefined => getCollections().find(c => c.id === id);

export const getBlogPosts = (): BlogPost[] => getStored<BlogPost[]>('arraial_blog_posts', []);
export const saveBlogPost = (post: BlogPost): void => {
    const current = getBlogPosts();
    const index = current.findIndex(p => p.id === post.id);
    if (index >= 0) current[index] = post;
    else current.unshift(post);
    setStored('arraial_blog_posts', current);
    syncToFirebase('posts', post.id, post);
};
export const deleteBlogPost = (id: string): void => {
    const current = getBlogPosts();
    setStored('arraial_blog_posts', current.filter(p => p.id !== id));
    deleteFromFirebase('posts', id);
};
export const getBlogPostById = (id: string): BlogPost | undefined => getBlogPosts().find(p => p.id === id);

// --- SUPPORT & REQUESTS ---
export const getCompanyRequests = (): CompanyRequest[] => getStored<CompanyRequest[]>('arraial_requests', []);
export const createCompanyRequest = (request: Omit<CompanyRequest, 'id' | 'status' | 'requestDate'>): void => {
    const requests = getCompanyRequests();
    const newRequest: CompanyRequest = {
        ...request,
        id: Date.now().toString(),
        status: 'PENDING',
        requestDate: new Date().toISOString()
    };
    requests.push(newRequest);
    setStored('arraial_requests', requests);
    syncToFirebase('requests', newRequest.id, newRequest);
};

export const approveRequest = (requestId: string): void => {
    const requests = getCompanyRequests();
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex >= 0) {
        const req = requests[reqIndex];
        req.status = 'APPROVED';
        setStored('arraial_requests', requests);
        syncToFirebase('requests', req.id, req);
        
        const userId = `comp_${Date.now()}`;
        const newUser: User = {
            id: userId,
            name: req.ownerName,
            email: req.email,
            role: UserRole.COMPANY,
            companyName: req.companyName,
            category: req.category,
            phone: req.phone,
            maxCoupons: 5,
            permissions: { canCreateCoupons: true, canManageBusiness: true },
            favorites: { coupons: [], businesses: [] }
        };
        createUser(newUser);

        const newBusiness: BusinessProfile = {
            id: userId, 
            name: req.companyName,
            category: req.category,
            description: req.description,
            coverImage: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=800', 
            gallery: [],
            address: 'Endereço não informado',
            phone: req.phone,
            whatsapp: req.whatsapp || req.phone,
            amenities: [],
            openingHours: { 'Segunda': '09:00 - 18:00', 'Terça': '09:00 - 18:00' },
            rating: 5.0,
            lat: -22.966, 
            lng: -42.026
        };
        saveBusiness(newBusiness);
    }
};

export const rejectRequest = (requestId: string): void => {
    const requests = getCompanyRequests();
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex >= 0) {
        requests[reqIndex].status = 'REJECTED';
        setStored('arraial_requests', requests);
        syncToFirebase('requests', requests[reqIndex].id, requests[reqIndex]);
    }
};

export const getSupportMessages = (): SupportMessage[] => getStored<SupportMessage[]>('arraial_support_messages', []);
export const sendSupportMessage = (msg: Omit<SupportMessage, 'id' | 'date' | 'status'>) => {
    const current = getSupportMessages();
    const newMsg: SupportMessage = {
        ...msg,
        id: Date.now().toString(),
        date: new Date().toISOString(),
        status: 'OPEN'
    };
    setStored('arraial_support_messages', [newMsg, ...current]);
    syncToFirebase('support', newMsg.id, newMsg);
};
