
import { Coupon, User, UserRole, BusinessProfile, BlogPost, CompanyRequest, AppCategory, AppLocation, AppAmenity, Collection, DEFAULT_CATEGORIES, DEFAULT_AMENITIES, PROTECTED_CATEGORIES, FeaturedConfig, SupportMessage, AppConfig } from '../types';
import { MOCK_COUPONS, MOCK_BUSINESSES, MOCK_POSTS, MOCK_USERS } from './mockData';
import { db } from './firebase'; // Importa a conexão real
import { collection, getDocs, setDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// --- HELPERS BÁSICOS ---
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
};

// --- SYNC HELPER (Mágica do Firebase) ---
// Função genérica que salva no Firebase se ele estiver ativo
const syncToFirebase = async (collectionName: string, id: string, data: any) => {
    if (!db) return; // Se não tiver firebase configurado, ignora
    try {
        await setDoc(doc(db, collectionName, id), data);
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

// --- INITIALIZATION & SYNC ---
export const initFirebaseData = async () => {
    console.log("Iniciando sincronização de dados...");
    
    // Se o Firebase estiver configurado, tentamos baixar os dados dele primeiro
    if (db) {
        try {
            // 1. Tenta buscar empresas do Firebase
            const bizSnapshot = await getDocs(collection(db, 'businesses'));
            
            if (!bizSnapshot.empty) {
                // MODO ONLINE: Baixa tudo do Firebase e atualiza o LocalStorage
                console.log("Baixando dados do Firebase...");
                
                const businesses = bizSnapshot.docs.map(d => d.data() as BusinessProfile);
                setStored('arraial_businesses', businesses);

                const couponSnap = await getDocs(collection(db, 'coupons'));
                setStored('arraial_coupons', couponSnap.docs.map(d => d.data()));

                const userSnap = await getDocs(collection(db, 'users'));
                setStored('arraial_users_list', userSnap.docs.map(d => d.data()));
                
                const postSnap = await getDocs(collection(db, 'posts'));
                setStored('arraial_blog_posts', postSnap.docs.map(d => d.data()));

                const colSnap = await getDocs(collection(db, 'collections'));
                setStored('arraial_collections', colSnap.docs.map(d => d.data()));

            } else {
                // MODO SEED: Firebase está vazio. Vamos enviar os MOCKS para lá!
                console.log("Firebase vazio. Enviando dados iniciais (Seed)...");
                
                // FEEDBACK VISUAL PARA O DONO (VOCÊ)
                alert("🔥 Primeira conexão detectada!\n\nSeu banco de dados no Firebase está vazio. O sistema vai enviar os dados de exemplo (Empresas, Cupons, etc) para lá agora.\n\nAguarde um instante...");

                // Upload Businesses
                for (const b of MOCK_BUSINESSES) await syncToFirebase('businesses', b.id, b);
                setStored('arraial_businesses', MOCK_BUSINESSES);
                
                // Upload Coupons
                for (const c of MOCK_COUPONS) await syncToFirebase('coupons', c.id, c);
                setStored('arraial_coupons', MOCK_COUPONS);
                
                // Upload Users
                for (const u of MOCK_USERS) await syncToFirebase('users', u.id, u);
                setStored('arraial_users_list', MOCK_USERS);

                // Upload Posts
                for (const p of MOCK_POSTS) await syncToFirebase('posts', p.id, p);
                setStored('arraial_blog_posts', MOCK_POSTS);

                console.log("Dados iniciais enviados com sucesso!");
                
                alert("✅ Sucesso! O banco de dados foi preenchido.\n\nO site será recarregado para puxar os dados diretamente da nuvem.");
                window.location.reload();
            }
        } catch (e) {
            console.error("Erro na sincronização inicial (usando dados locais):", e);
        }
    } else {
        // MODO OFFLINE/SEM FIREBASE: Usa mocks locais se estiver vazio
        const existingBiz = getStored<BusinessProfile[]>('arraial_businesses', []);
        if (existingBiz.length < 2) {
            setStored('arraial_businesses', MOCK_BUSINESSES);
            setStored('arraial_coupons', MOCK_COUPONS);
            setStored('arraial_blog_posts', MOCK_POSTS);
            setStored('arraial_users_list', MOCK_USERS);
        }
    }

    // Configs secundárias (Categorias, etc)
    const cats = getStored<AppCategory[]>('arraial_categories', []);
    if (cats.length === 0) {
        const defaults = DEFAULT_CATEGORIES.map(c => ({ id: c.toLowerCase(), name: c }));
        setStored('arraial_categories', defaults);
    }
};

// --- APP CONFIG ---
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
    syncToFirebase('system', 'app_config', config); // Save to cloud
    window.dispatchEvent(new Event('appConfigUpdated'));
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
    // Simple logic placeholder
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
    // Sync configs logic omitted for brevity, usually stored in a single doc or collection
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
    if (users.find(u => u.email === user.email)) throw new Error("Email já cadastrado");
    
    // Defaults
    if (user.role === UserRole.COMPANY && !user.permissions) {
        user.maxCoupons = 5;
        user.permissions = { canCreateCoupons: true, canManageBusiness: true };
    }
    
    users.push(user);
    setStored('arraial_users_list', users);
    syncToFirebase('users', user.id, user); // SYNC
};

export const updateUser = (user: User): void => {
    const users = getAllUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
        users[index] = user;
        setStored('arraial_users_list', users);
        syncToFirebase('users', user.id, user); // SYNC
        
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
    // Always read from local storage for speed (which is kept in sync by init)
    // join with businesses for GPS
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
    const current = getStored<Coupon[]>('arraial_coupons', []);
    const index = current.findIndex(c => c.id === coupon.id);
    if (index >= 0) current[index] = coupon;
    else current.unshift(coupon);
    
    setStored('arraial_coupons', current);
    await syncToFirebase('coupons', coupon.id, coupon); // SYNC
};

export const deleteCoupon = async (id: string): Promise<void> => {
    const current = getStored<Coupon[]>('arraial_coupons', []);
    setStored('arraial_coupons', current.filter(c => c.id !== id));
    await deleteFromFirebase('coupons', id);
};

// --- AUTH ---
let currentUser: User | null = null;

export const getCurrentUser = (): User | null => {
    if (currentUser) return currentUser;
    const stored = localStorage.getItem('arraial_user');
    currentUser = stored ? JSON.parse(stored) : null;
    return currentUser;
};

export const login = async (email: string, role: UserRole): Promise<User | null> => {
    await new Promise(r => setTimeout(r, 500));
    
    // In a real firebase app, use auth.signInWithEmailAndPassword
    // Here we simulate using our synced user list
    const allUsers = getAllUsers();
    let user = allUsers.find(u => u.email === email);
    
    if (user) {
        if (user.role === UserRole.SUPER_ADMIN) { /* ok */ }
        else if (user.role !== role && role !== UserRole.CUSTOMER) {
             alert(`Email sem permissão de ${role}`);
             return null;
        }
        currentUser = user;
        localStorage.setItem('arraial_user', JSON.stringify(user));
        return user;
    }

    // Auto-create customer
    if (role === UserRole.CUSTOMER) {
        const newUser: User = {
            id: 'u_' + Date.now(),
            name: email.split('@')[0],
            email: email,
            role: UserRole.CUSTOMER,
            savedAmount: 0,
            history: [],
            favorites: { coupons: [], businesses: [] }
        };
        currentUser = newUser;
        localStorage.setItem('arraial_user', JSON.stringify(newUser));
        createUser(newUser); // Will sync to firebase
        return newUser;
    }
    return null;
};

export const logout = async () => {
    currentUser = null;
    localStorage.removeItem('arraial_user');
};

export const toggleFavorite = (type: 'coupon' | 'business', id: string): User | null => {
    const user = getCurrentUser();
    if (!user) return null;
    if (!user.favorites) user.favorites = { coupons: [], businesses: [] };

    const list = type === 'coupon' ? user.favorites.coupons : user.favorites.businesses;
    const index = list.indexOf(id);
    if (index >= 0) list.splice(index, 1);
    else list.push(id);

    updateUser(user); // Will sync
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
        updateUser(updatedUser); // Will sync
    }
};

// --- BUSINESSES ---
export const getBusinesses = (): BusinessProfile[] => {
    return getStored<BusinessProfile[]>('arraial_businesses', []);
};

export const saveBusiness = (business: BusinessProfile): void => {
    const current = getBusinesses();
    const index = current.findIndex(b => b.id === business.id);
    if (index >= 0) current[index] = business;
    else current.push(business);
    
    setStored('arraial_businesses', current);
    syncToFirebase('businesses', business.id, business); // SYNC
};

export const rateBusiness = (businessId: string, rating: number) => {
    const current = getBusinesses();
    const index = current.findIndex(b => b.id === businessId);
    if (index >= 0) {
        const biz = current[index];
        const oldRating = biz.rating || 5.0;
        const count = biz.reviewCount || 10;
        const newCount = count + 1;
        const newRating = ((oldRating * count) + rating) / newCount;
        
        current[index] = { ...biz, rating: parseFloat(newRating.toFixed(1)), reviewCount: newCount };
        setStored('arraial_businesses', current);
        syncToFirebase('businesses', biz.id, current[index]); // SYNC
        return current[index];
    }
    return null;
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
        
        // Create User & Business Stub
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
            openingHours: {},
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
