
import { Coupon, User, UserRole, BusinessProfile, BlogPost, CompanyRequest, AppCategory, AppLocation, AppAmenity, Collection, DEFAULT_CATEGORIES, DEFAULT_AMENITIES, PROTECTED_CATEGORIES, FeaturedConfig, SupportMessage, AppConfig, Review } from '../types';
import { MOCK_COUPONS, MOCK_BUSINESSES, MOCK_POSTS, MOCK_USERS } from './mockData';
import { db, auth } from './firebase'; 
import { collection, setDoc, doc, deleteDoc, onSnapshot, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

// --- IN-MEMORY CACHE (Substitui LocalStorage) ---
// Estes dados vivem apenas na memória enquanto a aba está aberta
// Eles são populados automaticamente pelos listeners do Firebase
let _businesses: BusinessProfile[] = [];
let _coupons: Coupon[] = [];
let _users: User[] = [];
let _posts: BlogPost[] = [];
let _collections: Collection[] = [];
let _requests: CompanyRequest[] = [];
let _support: SupportMessage[] = [];
let _categories: AppCategory[] = [];
let _locations: AppLocation[] = [];
let _amenities: AppAmenity[] = [];
let _appConfig: AppConfig = { appName: 'CONECTA', appNameHighlight: 'RIO' };
let _featuredConfig: FeaturedConfig | null = null;

// Dispara evento para atualizar a UI (React)
const notifyListeners = () => {
    window.dispatchEvent(new Event('dataUpdated'));
    window.dispatchEvent(new Event('appConfigUpdated'));
};

// --- REALTIME DATABASE LISTENERS ---
export const initFirebaseData = async () => {
    console.log("Iniciando conexão Exclusiva com Banco de Dados...");

    if (!db) {
        console.error("Firebase DB não inicializado. O App funcionará apenas com dados Mock em memória.");
        loadMocksToMemory();
        return;
    }

    try {
        // Configura listeners para cada coleção do banco
        // Assim que algo muda no banco, atualiza a variável em memória e a tela
        
        onSnapshot(collection(db, 'businesses'), (snap) => {
            _businesses = snap.docs.map(d => d.data() as BusinessProfile);
            notifyListeners();
        });

        onSnapshot(collection(db, 'coupons'), (snap) => {
            _coupons = snap.docs.map(d => d.data() as Coupon);
            notifyListeners();
        });

        onSnapshot(collection(db, 'users'), (snap) => {
            _users = snap.docs.map(d => d.data() as User);
            notifyListeners();
        });

        onSnapshot(collection(db, 'posts'), (snap) => {
            _posts = snap.docs.map(d => d.data() as BlogPost);
            notifyListeners();
        });

        onSnapshot(collection(db, 'collections'), (snap) => {
            _collections = snap.docs.map(d => d.data() as Collection);
            notifyListeners();
        });

        onSnapshot(collection(db, 'requests'), (snap) => {
            _requests = snap.docs.map(d => d.data() as CompanyRequest);
            notifyListeners();
        });

        onSnapshot(collection(db, 'support'), (snap) => {
            _support = snap.docs.map(d => d.data() as SupportMessage);
            notifyListeners();
        });

        // Configurações do Sistema
        onSnapshot(collection(db, 'system'), (snap) => {
            snap.forEach(doc => {
                if(doc.id === 'app_config') _appConfig = doc.data() as AppConfig;
                if(doc.id === 'featured_config') _featuredConfig = doc.data() as FeaturedConfig;
                if(doc.id === 'categories' && doc.data().list) _categories = doc.data().list;
                if(doc.id === 'locations' && doc.data().list) _locations = doc.data().list;
                if(doc.id === 'amenities' && doc.data().list) _amenities = doc.data().list;
            });
            // Se categorias estiverem vazias no banco, salva as padrões
            if (_categories.length === 0) {
                _categories = DEFAULT_CATEGORIES.map(c => ({ id: c.toLowerCase(), name: c }));
                setDoc(doc(db, 'system', 'categories'), { list: _categories });
            }
            if (_amenities.length === 0) {
                _amenities = DEFAULT_AMENITIES;
                setDoc(doc(db, 'system', 'amenities'), { list: _amenities });
            }
            notifyListeners();
        });

    } catch (e) {
        console.error("Erro ao conectar listeners:", e);
        loadMocksToMemory();
    }
};

const loadMocksToMemory = () => {
    // Fallback apenas se o banco falhar totalmente
    _businesses = MOCK_BUSINESSES;
    _coupons = MOCK_COUPONS;
    _users = MOCK_USERS;
    _posts = MOCK_POSTS;
    _categories = DEFAULT_CATEGORIES.map(c => ({ id: c.toLowerCase(), name: c }));
    _amenities = DEFAULT_AMENITIES;
    notifyListeners();
};

// --- DATA ACCESS METHODS (READ) ---
// Agora apenas retornam a variável em memória, que está sincronizada com o banco

export const getAppConfig = (): AppConfig => _appConfig;
export const getFeaturedConfig = (): FeaturedConfig => _featuredConfig || {
    title: "Bem-vindo",
    subtitle: "Descubra o melhor da cidade",
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a42a4571d0",
    buttonText: "Explorar"
};

export const getCategories = () => _categories;
export const getLocations = () => _locations;
export const getAmenities = () => _amenities;

export const getAllUsers = () => _users;
export const getBusinesses = () => _businesses.map(b => ({ ...b, isOpenNow: checkIsOpen(b.openingHours) }));
export const getBusinessById = (id: string) => getBusinesses().find(b => b.id === id);

export const getCoupons = async (): Promise<Coupon[]> => {
    return _coupons.map(coupon => {
        const business = _businesses.find(b => b.id === coupon.companyId);
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

export const getCollections = () => _collections;
export const getCollectionById = (id: string) => _collections.find(c => c.id === id);
export const getBlogPosts = () => _posts;
export const getBlogPostById = (id: string) => _posts.find(p => p.id === id);
export const getCompanyRequests = () => _requests;
export const getSupportMessages = () => _support;

// --- DATA MODIFICATION METHODS (WRITE TO DB) ---

export const saveAppConfig = async (config: AppConfig) => {
    if (db) await setDoc(doc(db, 'system', 'app_config'), config);
};

export const saveFeaturedConfig = async (config: FeaturedConfig) => {
    if (db) await setDoc(doc(db, 'system', 'featured_config'), config);
};

export const addCategory = async (name: string) => {
    if (db) {
        const newCat = { id: Date.now().toString(), name };
        const updated = [..._categories, newCat];
        await setDoc(doc(db, 'system', 'categories'), { list: updated });
    }
};

export const deleteCategory = async (id: string) => {
    if (db) {
        const updated = _categories.filter(c => c.id !== id);
        await setDoc(doc(db, 'system', 'categories'), { list: updated });
    }
};

export const addLocation = async (name: string) => {
    if (db) {
        const newLoc = { id: Date.now().toString(), name, active: true };
        const updated = [..._locations, newLoc];
        await setDoc(doc(db, 'system', 'locations'), { list: updated });
    }
};

export const deleteLocation = async (id: string) => {
    if (db) {
        const updated = _locations.filter(l => l.id !== id);
        await setDoc(doc(db, 'system', 'locations'), { list: updated });
    }
};

export const addAmenity = async (label: string) => {
    if (db) {
        const id = label.toLowerCase().replace(/[^a-z0-9]/g, '');
        const newAm = { id: id + Date.now().toString().slice(-4), label };
        const updated = [..._amenities, newAm];
        await setDoc(doc(db, 'system', 'amenities'), { list: updated });
    }
};

export const deleteAmenity = async (id: string) => {
    if (db) {
        const updated = _amenities.filter(a => a.id !== id);
        await setDoc(doc(db, 'system', 'amenities'), { list: updated });
    }
};

// --- BUSINESS & REVIEWS ---

export const saveBusiness = async (business: BusinessProfile) => {
    if (db) {
        try {
            await setDoc(doc(db, 'businesses', business.id), business, { merge: true });
        } catch (e) {
            console.error("Erro ao salvar empresa:", e);
            alert("Erro ao salvar. Verifique se a imagem não é muito grande.");
        }
    }
};

export const addBusinessReview = (businessId: string, user: User, rating: number, comment: string) => {
    if (!db) return null;

    const newReview: Review = {
        id: `rev_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatarUrl,
        rating: rating,
        comment: comment,
        date: new Date().toISOString().split('T')[0]
    };

    // Atualiza diretamente no documento da empresa no Firestore
    const businessRef = doc(db, 'businesses', businessId);
    
    // Precisamos recalcular a média, então precisamos ler primeiro (embora tenhamos na memória)
    const currentBiz = _businesses.find(b => b.id === businessId);
    if (currentBiz) {
        const currentReviews = currentBiz.reviews || [];
        const updatedReviews = [newReview, ...currentReviews];
        
        const totalStars = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
        const newAverage = parseFloat((totalStars / updatedReviews.length).toFixed(1));

        const updateData = {
            reviews: updatedReviews,
            rating: newAverage,
            reviewCount: updatedReviews.length
        };

        // Salva no banco
        updateDoc(businessRef, updateData).catch(e => console.error("Erro ao salvar review:", e));
        
        // Retorna optimistically o objeto atualizado
        return { ...currentBiz, ...updateData };
    }
    return null;
};

// --- COUPONS ---

export const saveCoupon = async (coupon: Coupon) => {
    if (db) {
        try {
            await setDoc(doc(db, 'coupons', coupon.id), coupon);
        } catch (e) {
            console.error("Erro ao salvar cupom:", e);
            alert("Erro ao salvar cupom. Verifique se a imagem é muito pesada.");
        }
    }
};

export const deleteCoupon = async (id: string) => {
    if (db) await deleteDoc(doc(db, 'coupons', id));
};

// --- USERS ---

export const updateUser = async (user: User) => {
    if (db) {
        await setDoc(doc(db, 'users', user.id), user, { merge: true });
        
        // Se for o usuário logado, atualiza sessão
        if (currentUser && currentUser.id === user.id) {
            currentUser = user;
            // Mantemos APENAS a sessão do usuário no localStorage para persistir login F5
            localStorage.setItem('arraial_user_session', JSON.stringify(user));
        }
    }
};

export const deleteUser = async (userId: string) => {
    if (db) await deleteDoc(doc(db, 'users', userId));
};

export const toggleFavorite = (type: 'coupon' | 'business', id: string) => {
    const user = getCurrentUser();
    if (!user || !db) return null;
    
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

    updateUser(user); // Salva no banco
    return user;
};

export const redeemCoupon = async (userId: string, coupon: Coupon) => {
    const user = getCurrentUser();
    if (user && db) {
        const saved = coupon.originalPrice - coupon.discountedPrice;
        const newRecord = {
            date: new Date().toISOString().split('T')[0],
            amount: saved,
            couponTitle: coupon.title
        };
        
        // Atualiza histórico do usuário
        const updatedUser = {
            ...user,
            savedAmount: (user.savedAmount || 0) + saved,
            history: [...(user.history || []), newRecord]
        };
        
        updateUser(updatedUser);
    }
};

// --- BLOG & COLLECTIONS ---

export const saveBlogPost = async (post: BlogPost) => {
    if (db) await setDoc(doc(db, 'posts', post.id), post);
};

export const deleteBlogPost = async (id: string) => {
    if (db) await deleteDoc(doc(db, 'posts', id));
};

export const saveCollection = async (collection: Collection) => {
    if (db) await setDoc(doc(db, 'collections', collection.id), collection);
};

export const deleteCollection = async (id: string) => {
    if (db) await deleteDoc(doc(db, 'collections', id));
};

// --- REQUESTS & SUPPORT ---

export const createCompanyRequest = async (request: Omit<CompanyRequest, 'id' | 'status' | 'requestDate'>) => {
    if (db) {
        const newRequest: CompanyRequest = {
            ...request,
            id: Date.now().toString(),
            status: 'PENDING',
            requestDate: new Date().toISOString()
        };
        await setDoc(doc(db, 'requests', newRequest.id), newRequest);
    }
};

export const approveRequest = async (requestId: string) => {
    if (db) {
        const req = _requests.find(r => r.id === requestId);
        if (req) {
            req.status = 'APPROVED';
            await setDoc(doc(db, 'requests', req.id), req);
            
            const userId = `comp_${Date.now()}`;
            // Cria usuário empresa
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
            await setDoc(doc(db, 'users', userId), newUser);

            // Cria perfil empresa
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
            await setDoc(doc(db, 'businesses', userId), newBusiness);
        }
    }
};

export const rejectRequest = async (requestId: string) => {
    if (db) {
        await updateDoc(doc(db, 'requests', requestId), { status: 'REJECTED' });
    }
};

export const sendSupportMessage = async (msg: Omit<SupportMessage, 'id' | 'date' | 'status'>) => {
    if (db) {
        const newMsg: SupportMessage = {
            ...msg,
            id: Date.now().toString(),
            date: new Date().toISOString(),
            status: 'OPEN'
        };
        await setDoc(doc(db, 'support', newMsg.id), newMsg);
    }
};

// --- AUTHENTICATION ---
let currentUser: User | null = null;

// Admin Password Reset (Agora apenas um mock, pois admin não pode mudar senha firebase de outro)
export const adminResetPassword = (email: string, newPass: string) => {
    alert("Funcionalidade indisponível com autenticação real do Firebase. O usuário deve usar 'Esqueci minha senha'.");
};

export const getCurrentUser = (): User | null => {
    if (currentUser) return currentUser;
    const stored = localStorage.getItem('arraial_user_session'); // Apenas sessão
    currentUser = stored ? JSON.parse(stored) : null;
    return currentUser;
};

export const registerUser = async (name: string, email: string, password: string): Promise<User | null> => {
    if (!auth || !db) throw new Error("no_auth_service");
    
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

    await setDoc(doc(db, 'users', newUser.id), newUser);
    currentUser = newUser;
    localStorage.setItem('arraial_user_session', JSON.stringify(newUser));
    return newUser;
};

export const login = async (email: string, password?: string): Promise<User | null> => {
    // Fallback Admin
    if (email === 'admin@conectario.com' && password === '123456') {
        const adminUser: User = {
            id: 'admin_master',
            name: 'Super Admin',
            email: 'admin@conectario.com',
            role: UserRole.SUPER_ADMIN
        };
        currentUser = adminUser;
        localStorage.setItem('arraial_user_session', JSON.stringify(adminUser));
        return adminUser;
    }

    if (auth && db) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password || '');
        const uid = userCredential.user.uid;
        
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            if (userData.isBlocked) {
                await signOut(auth);
                throw new Error("blocked");
            }
            currentUser = userData;
            localStorage.setItem('arraial_user_session', JSON.stringify(userData));
            return userData;
        }
    }
    return null;
};

export const logout = async () => {
    if (auth) await signOut(auth);
    currentUser = null;
    localStorage.removeItem('arraial_user_session');
};

// --- UTILS ---
const checkIsOpen = (hours: { [key: string]: string } | undefined): boolean => {
    if (!hours) return false;
    const DAYS_LOOKUP = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const now = new Date();
    const dayName = DAYS_LOOKUP[now.getDay()];
    const timeString = hours[dayName];

    if (!timeString || timeString.toLowerCase().includes('fechado')) return false;
    if (timeString.toLowerCase().includes('24h')) return true;

    const parts = timeString.split('-').map(p => p.trim());
    if (parts.length !== 2) return false;

    const [start, end] = parts;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = start.split(':').map(Number);
    const startMinutes = startH * 60 + (startM || 0);

    const [endH, endM] = end.split(':').map(Number);
    let endMinutes = endH * 60 + (endM || 0);

    if (endMinutes < startMinutes) {
        const extendedEnd = endMinutes + 1440;
        if (currentMinutes >= startMinutes) return true;
        if (currentMinutes < endMinutes) return true;
        return false;
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

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

export const identifyNeighborhood = (lat: number, lng: number): string => "Arraial do Cabo";
