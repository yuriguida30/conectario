
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
    onSnapshot,
    arrayUnion
} from 'firebase/firestore';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    updatePassword
} from 'firebase/auth';
import { auth, db } from './firebase';
import { 
    Coupon, User, UserRole, BusinessProfile, BlogPost, SavingsRecord, 
    CompanyRequest, AppCategory, Subcategory, DEFAULT_CATEGORIES, 
    DEFAULT_AMENITIES, AppConfig, Collection, PricingPlan, HomeHighlight, City, Neighborhood, Review
} from '../types';

const SESSION_KEY = 'cr_session_v4';

let _businesses: BusinessProfile[] = [];
let _coupons: Coupon[] = [];
let _users: User[] = [];
let _categories: AppCategory[] = [];
let _dicasCategories: AppCategory[] = [];
let _requests: CompanyRequest[] = [];
let _plans: PricingPlan[] = [];
let _highlights: HomeHighlight[] = [];
let _cities: City[] = [];
let _neighborhoods: Neighborhood[] = [];
let _reviews: Review[] = [];
let _isInitialized = false;

let _collections: Collection[] = [];
const _appConfig: AppConfig = { appName: 'CONECTA', appNameHighlight: 'RIO' };

const notifyListeners = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dataUpdated'));
        window.dispatchEvent(new Event('appConfigUpdated'));
    }
};

onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
        try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                const userData = { id: userDoc.id, ...data } as User;
                localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
                notifyListeners();
            }
        } catch (e) {
            console.error("Auth session sync error:", e);
        }
    }
});

const cleanObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => cleanObject(item)).filter(item => item !== undefined && item !== null);
    }
    if (typeof obj === 'object') {
        const newObj: any = {};
        Object.keys(obj).forEach(key => {
            const val = cleanObject(obj[key]);
            if (val !== undefined && val !== null) {
                newObj[key] = val;
            }
        });
        return newObj;
    }
    return obj;
};

export const initFirebaseData = () => {
    if (_isInitialized) return;
    _isInitialized = true;

    const handleError = (err: any, collectionName: string) => {
        console.warn(`[Firestore] Permission denied or error reading ${collectionName}:`, err.message);
    };

    onSnapshot(collection(db, 'reviews'), (snapshot) => {
        _reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review));
        notifyListeners();
    }, (err) => handleError(err, 'reviews'));

    onSnapshot(collection(db, 'businesses'), (snapshot) => {
        _businesses = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BusinessProfile));
        notifyListeners();
    }, (err) => handleError(err, 'businesses'));

    onSnapshot(collection(db, 'coupons'), (snapshot) => {
        _coupons = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
        notifyListeners();
    }, (err) => handleError(err, 'coupons'));

    onSnapshot(collection(db, 'users'), (snapshot) => {
        _users = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
        notifyListeners();
    }, (err) => handleError(err, 'users'));

    onSnapshot(collection(db, 'app_categories_guia'), async (snapshot) => {
        if (snapshot.empty) {
            try {
                for (const catName of DEFAULT_CATEGORIES) {
                    const catId = catName.toLowerCase().replace(/ç/g, 'c').replace(/ã/g, 'a');
                    const newCat: AppCategory = { id: catId, name: catName, subcategories: [] };
                    await setDoc(doc(db, 'app_categories_guia', catId), newCat);
                }
            } catch (e) {
                console.warn("Could not create default categories:", e);
            }
        } else {
            _categories = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppCategory));
            notifyListeners();
        }
    }, (err) => handleError(err, 'app_categories_guia'));

    onSnapshot(collection(db, 'app_categories_dicas'), (snapshot) => {
        _dicasCategories = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppCategory));
        notifyListeners();
    }, (err) => handleError(err, 'app_categories_dicas'));

    onSnapshot(collection(db, 'companyRequests'), (snapshot) => {
        _requests = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CompanyRequest));
        notifyListeners();
    }, (err) => handleError(err, 'companyRequests'));

    onSnapshot(collection(db, 'pricingPlans'), async (snapshot) => {
        if (snapshot.empty) {
            try {
                const defaultPlans: Partial<PricingPlan>[] = [
                    { 
                        id: 'basic', 
                        name: 'Básico', 
                        price: 49.90, 
                        period: 'monthly', 
                        maxCoupons: 3, 
                        maxBusinesses: 1, 
                        active: true,
                        showSocialMedia: true
                    },
                    { 
                        id: 'pro', 
                        name: 'Pro', 
                        price: 99.90, 
                        period: 'monthly', 
                        maxCoupons: 10, 
                        maxBusinesses: 1, 
                        isFeatured: true, 
                        active: true,
                        showGallery: true,
                        showMenu: true,
                        showSocialMedia: true,
                        showReviews: true,
                        hasFreeTrial: true
                    },
                    { 
                        id: 'premium', 
                        name: 'Premium', 
                        price: 199.90, 
                        period: 'monthly', 
                        maxCoupons: 50, 
                        maxBusinesses: 3, 
                        active: true,
                        showGallery: true,
                        showMenu: true,
                        showSocialMedia: true,
                        showReviews: true
                    }
                ];
                for (const p of defaultPlans) {
                    await savePricingPlan(p);
                }
            } catch (e) {
                console.warn("Could not seed pricing plans:", e);
            }
        } else {
            _plans = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PricingPlan));
            notifyListeners();
        }
    }, (err) => handleError(err, 'pricingPlans'));

    onSnapshot(collection(db, 'home_highlights'), (snapshot) => {
        _highlights = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as HomeHighlight)).sort((a, b) => a.order - b.order);
        notifyListeners();
    }, (err) => handleError(err, 'home_highlights'));

    onSnapshot(collection(db, 'cities'), (snapshot) => {
        _cities = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as City));
        notifyListeners();
    }, (err) => handleError(err, 'cities'));

    onSnapshot(collection(db, 'neighborhoods'), (snapshot) => {
        _neighborhoods = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Neighborhood));
        notifyListeners();
    }, (err) => handleError(err, 'neighborhoods'));

    onSnapshot(collection(db, 'blog_posts'), (snapshot) => {
        const fbPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost));
        _posts = fbPosts;
        notifyListeners();
    }, (err) => handleError(err, 'blog_posts'));
};

initFirebaseData();

export const login = async (email: string, pass: string): Promise<User | null> => {
    // Check for master password or manual password first
    const foundUser = _users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
        if (foundUser.isBlocked) throw new Error("Sua conta está inativa. Entre em contato com o suporte.");
        
        // Master password or manual password set by admin
        if (pass === '123456' || (foundUser.manualPassword && pass === foundUser.manualPassword)) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(foundUser));
            notifyListeners();
            return foundUser;
        }
    }

    try {
        const res = await signInWithEmailAndPassword(auth, email, pass);
        const userDoc = await getDoc(doc(db, 'users', res.user.uid));
        if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            if (userData.isBlocked) {
                await auth.signOut();
                throw new Error("Sua conta está inativa. Entre em contato com o suporte.");
            }
            localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
            notifyListeners();
            return userData;
        }
    } catch (error: any) {
        // If Firebase login fails, but we already checked manual password above, 
        // we just re-throw or return null if it wasn't a manual password match.
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            return null;
        }
        throw error;
    }
    return null;
};

export const loginWithGoogle = async (): Promise<User | null> => {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    const userDoc = await getDoc(doc(db, 'users', res.user.uid));
    let userData: User;
    if (userDoc.exists()) {
        userData = { id: userDoc.id, ...userDoc.data() } as User;
        if (userData.isBlocked) {
            await auth.signOut();
            throw new Error("Sua conta está inativa. Entre em contato com o suporte.");
        }
    } else {
        userData = {
            id: res.user.uid,
            name: res.user.displayName || 'Usuário',
            email: res.user.email || '',
            role: UserRole.CUSTOMER,
            favorites: { coupons: [], businesses: [] },
            history: [],
            savedAmount: 0,
            avatarUrl: res.user.photoURL || undefined
        };
        try {
            await setDoc(doc(db, 'users', userData.id), cleanObject(userData));
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `users/${userData.id}`);
        }
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    notifyListeners();
    return userData;
};

export const resetUserPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
};

export const changeCurrentUserPassword = async (newPassword: string) => {
    if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
    } else {
        throw new Error("Usuário não autenticado no Firebase.");
    }
};

export const setManualPassword = async (userId: string, password: string) => {
    await updateDoc(doc(db, 'users', userId), { manualPassword: password });
    notifyListeners();
};

export const logout = async () => {
    await auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    notifyListeners();
};

export const getBusinesses = () => _businesses.filter(b => !b.isBlocked);
export const getAllBusinesses = () => _businesses;
export const getCoupons = async () => {
    const activeBusinessIds = _businesses.filter(b => !b.isBlocked).map(b => b.id);
    return _coupons
        .filter(c => activeBusinessIds.includes(c.companyId))
        .map(c => {
            // Fallback: If companyName is generic, try to find the real name from businesses
            if (!c.companyName || c.companyName === 'Minha Empresa') {
                const biz = _businesses.find(b => b.id === c.companyId);
                if (biz) return { ...c, companyName: biz.name };
            }
            return c;
        });
};
export const getBusinessById = (id: string) => {
    const biz = _businesses.find(b => b.id === id && !b.isBlocked);
    return biz ? { ...biz } : undefined;
};
export const getBusinessByIdAdmin = (id: string) => {
    const biz = _businesses.find(b => b.id === id);
    return biz ? { ...biz } : undefined;
};

enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
}

interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
        userId: string | undefined;
        email: string | null | undefined;
        emailVerified: boolean | undefined;
        isAnonymous: boolean | undefined;
        tenantId: string | null | undefined;
        providerInfo: {
            providerId: string;
            displayName: string | null;
            email: string | null;
            photoUrl: string | null;
        }[];
    }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified,
            isAnonymous: auth.currentUser?.isAnonymous,
            tenantId: auth.currentUser?.tenantId,
            providerInfo: auth.currentUser?.providerData.map(provider => ({
                providerId: provider.providerId,
                displayName: provider.displayName,
                email: provider.email,
                photoUrl: provider.photoURL
            })) || []
        },
        operationType,
        path
    }
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
}

export const saveBusiness = async (b: BusinessProfile) => {
    try {
        await setDoc(doc(db, 'businesses', b.id), cleanObject(b), { merge: true }); 
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `businesses/${b.id}`);
    }
};

export const toggleBusinessStatus = async (businessId: string, isBlocked: boolean) => {
    await updateDoc(doc(db, 'businesses', businessId), { isBlocked });
    // Also block the associated user if they exist (id matches)
    const userDoc = await getDoc(doc(db, 'users', businessId));
    if (userDoc.exists()) {
        await updateDoc(doc(db, 'users', businessId), { isBlocked });
    }
    notifyListeners();
};

export const deleteBusinessPermanently = async (businessId: string) => {
    await deleteDoc(doc(db, 'businesses', businessId));
    // Also delete the associated user
    await deleteDoc(doc(db, 'users', businessId));
    // Delete their coupons
    const couponsQuery = query(collection(db, 'coupons'), where('companyId', '==', businessId));
    const couponsSnap = await getDocs(couponsQuery);
    for (const d of couponsSnap.docs) {
        await deleteDoc(doc(db, 'coupons', d.id));
    }
    notifyListeners();
};

export const deleteBusiness = deleteBusinessPermanently;

export const deleteUser = async (id: string) => {
    await deleteDoc(doc(db, 'users', id));
};

export const getCurrentUser = (): User | null => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
};

export const updateUser = async (user: User) => {
    try {
        await setDoc(doc(db, 'users', user.id), cleanObject(user), { merge: true });
        
        // Only update localStorage if we are updating the currently logged-in user
        const current = getCurrentUser();
        if (current && current.id === user.id) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        }
        
        notifyListeners();
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
    }
};

export const getCategories = () => _categories;

export const addReview = async (businessId: string, review: Omit<Review, 'id' | 'date'>) => {
    const business = _businesses.find(b => b.id === businessId);
    if (!business) throw new Error('Business not found');

    const newReviewId = doc(collection(db, 'reviews')).id;
    const newReview: Review = {
        ...review,
        id: newReviewId,
        date: new Date().toISOString(),
        status: 'pending',
        businessId: businessId,
        businessName: business.name
    };

    await setDoc(doc(db, 'reviews', newReviewId), cleanObject(newReview));
    notifyListeners();
    return newReview;
};

export const getPendingReviews = () => {
    return _reviews.filter(r => r.status === 'pending');
};

export const getReviewsByBusinessId = (businessId: string) => {
    return _reviews.filter(r => r.businessId === businessId && r.status === 'approved')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const approveReview = async (reviewId: string) => {
    const review = _reviews.find(r => r.id === reviewId);
    if (!review || !review.businessId) throw new Error('Review not found');

    const business = _businesses.find(b => b.id === review.businessId);
    if (!business) throw new Error('Business not found');

    review.status = 'approved';
    await setDoc(doc(db, 'reviews', reviewId), cleanObject(review), { merge: true });

    // Filter out the review if it already exists in the array (to avoid duplicates) and add the updated one
    const existingReviews = business.reviews || [];
    const filteredReviews = existingReviews.filter(r => r.id !== reviewId);
    const updatedReviews = [review, ...filteredReviews];
    
    const newCount = updatedReviews.length;
    const newRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0) / newCount;

    business.reviews = updatedReviews;
    business.reviewCount = newCount;
    business.rating = newRating;

    await setDoc(doc(db, 'businesses', business.id), cleanObject(business), { merge: true });
    notifyListeners();
};

export const rejectReview = async (reviewId: string) => {
    const review = _reviews.find(r => r.id === reviewId);
    if (!review) throw new Error('Review not found');

    review.status = 'rejected';
    await setDoc(doc(db, 'reviews', reviewId), cleanObject(review), { merge: true });
    notifyListeners();
};
export const getDicasCategories = () => _dicasCategories;
export const getAllUsers = () => _users;

export const saveCategory = async (category: AppCategory) => {
    await setDoc(doc(db, 'app_categories_guia', category.id), cleanObject(category), { merge: true });
};

export const saveDicasCategory = async (category: AppCategory) => {
    await setDoc(doc(db, 'app_categories_dicas', category.id), cleanObject(category), { merge: true });
};

export const saveSubcategory = async (categoryId: string, subcategoryName: string) => {
    const cat = _categories.find(c => c.id === categoryId);
    if (cat) {
        const newSubcategory: Subcategory = {
            id: subcategoryName.toLowerCase().replace(/\s+/g, '-'),
            name: subcategoryName
        };
        const updatedCat = { ...cat, subcategories: [...(cat.subcategories || []), newSubcategory] };
        await setDoc(doc(db, 'app_categories_guia', categoryId), cleanObject(updatedCat), { merge: true });
    }
};

export const saveDicasSubcategory = async (categoryId: string, subcategoryName: string) => {
    const cat = _dicasCategories.find(c => c.id === categoryId);
    if (cat) {
        const newSubcategory: Subcategory = {
            id: subcategoryName.toLowerCase().replace(/\s+/g, '-'),
            name: subcategoryName
        };
        const updatedCat = { ...cat, subcategories: [...(cat.subcategories || []), newSubcategory] };
        await setDoc(doc(db, 'app_categories_dicas', categoryId), cleanObject(updatedCat), { merge: true });
    }
};

export const saveCoupon = async (c: Coupon) => {
    const couponToSave = { ...c };
    
    // Ensure we have a real company name if possible
    if (!couponToSave.companyName || couponToSave.companyName === 'Minha Empresa') {
        const biz = _businesses.find(b => b.id === couponToSave.companyId);
        if (biz) {
            couponToSave.companyName = biz.name;
            if (!couponToSave.companyLogo) couponToSave.companyLogo = biz.coverImage;
        }
    }
    
    await setDoc(doc(db, 'coupons', couponToSave.id), cleanObject(couponToSave)); 
};

export const deleteCoupon = async (id: string) => {
    await deleteDoc(doc(db, 'coupons', id)); 
};

export const getBusinessStats = async (businessId: string) => {
    const biz = _businesses.find(b => b.id === businessId);
    const coupons = _coupons.filter(c => c.companyId === businessId);
    
    const totalRedemptions = coupons.reduce((acc, c) => acc + (c.currentRedemptions || 0), 0);
    const views = biz?.views || 0;
    const shares = biz?.shares || 0;
    const counts = biz?.actionCounts || {};

    const trend = [
        { day: 'Seg', valor: Math.max(0, totalRedemptions - 12) },
        { day: 'Ter', valor: Math.max(0, totalRedemptions - 8) },
        { day: 'Qua', valor: Math.max(0, totalRedemptions - 10) },
        { day: 'Qui', valor: Math.max(0, totalRedemptions - 5) },
        { day: 'Sex', valor: Math.max(0, totalRedemptions - 2) },
        { day: 'Sáb', valor: totalRedemptions },
        { day: 'Hoje', valor: totalRedemptions },
    ];

    return {
        views,
        totalConversions: totalRedemptions,
        shares,
        conversionTrend: trend,
        trafficSource: [
            { name: 'Busca Interna', value: Math.floor(views * 0.6) },
            { name: 'Direto/QR', value: Math.floor(views * 0.3) },
            { name: 'Compartilhado', value: Math.floor(views * 0.1) }
        ],
        actionHeatmap: [
            { name: 'Telefone', cliques: counts['phone'] || 0 },
            { name: 'Mapa/GPS', cliques: counts['map'] || 0 },
            { name: 'Instagram', cliques: counts['social'] || 0 },
            { name: 'Site', cliques: counts['website'] || 0 },
            { name: 'Delivery', cliques: counts['delivery'] || 0 },
            { name: 'Cardápio', cliques: counts['menu'] || 0 },
            { name: 'Resgates', cliques: totalRedemptions }
        ],
        activeCoupons: coupons.filter(c => c.active).length
    };
};

export const getAdminStats = async () => {
    const totalEconomy = _users.reduce((acc, u) => acc + (u.savedAmount || 0), 0);
    return {
        totalUsers: _users.length,
        totalBusinesses: _businesses.length,
        totalEconomy,
        totalCoupons: _coupons.length,
        chartData: [
            { name: 'Gastronomia', value: _businesses.filter(b => b.category === 'Gastronomia').length },
            { name: 'Hospedagem', value: _businesses.filter(b => b.category === 'Hospedagem').length },
            { name: 'Passeios', value: _businesses.filter(b => b.category === 'Passeios').length }
        ]
    };
};

export const getAppConfig = () => _appConfig;
export const getLocations = () => {
    // Return all active neighborhoods as locations
    return _neighborhoods.filter(n => n.active).map(n => ({
        id: n.id,
        name: n.name,
        active: true
    }));
};
export const getAmenities = () => DEFAULT_AMENITIES;
let _posts: BlogPost[] = [];

export const getBlogPosts = () => _posts;
export const getBlogPostById = (id: string) => _posts.find(p => p.id === id);

export const saveBlogPost = async (post: BlogPost) => {
    const idx = _posts.findIndex(p => p.id === post.id);
    if (idx >= 0) {
        _posts[idx] = post;
    } else {
        _posts.push(post);
    }
    await setDoc(doc(db, 'blog_posts', post.id), cleanObject(post), { merge: true });
    notifyListeners();
};

export const deleteBlogPost = async (id: string) => {
    _posts = _posts.filter(p => p.id !== id);
    await deleteDoc(doc(db, 'blog_posts', id));
    notifyListeners();
};
export const getCollections = (): Collection[] => _collections;

export const saveCollection = async (col: Partial<Collection>) => {
    const id = col.id || doc(collection(db, 'collections')).id;
    const newCol: Collection = {
        id,
        title: col.title || '',
        description: col.description || '',
        coverImage: col.coverImage || '',
        businessIds: col.businessIds || [],
        order: col.order || 0,
        active: col.active ?? true,
        ...col
    } as Collection;
    
    const idx = _collections.findIndex(c => c.id === id);
    if (idx >= 0) {
        _collections[idx] = newCol;
    } else {
        _collections.push(newCol);
    }
    await setDoc(doc(db, 'collections', id), cleanObject(newCol), { merge: true });
    notifyListeners();
    return newCol;
};

export const deleteCollection = async (id: string) => {
    _collections = _collections.filter(c => c.id !== id);
    await deleteDoc(doc(db, 'collections', id));
    notifyListeners();
};

// Fix: Added missing getCollectionById function export to resolve the import error in CollectionDetail.tsx
export const getCollectionById = (id: string) => _collections.find(c => c.id === id);

export const getFeaturedConfig = () => null;

export const getHomeHighlights = () => _highlights.filter(h => h.active);
export const getAllHomeHighlights = () => _highlights;

export const saveHomeHighlight = async (h: Partial<HomeHighlight>) => {
    const id = h.id || doc(collection(db, 'home_highlights')).id;
    const newHighlight: HomeHighlight = {
        id,
        title: h.title || '',
        description: h.description || '',
        imageUrl: h.imageUrl || '',
        buttonText: h.buttonText || '',
        buttonLink: h.buttonLink || '',
        order: h.order || 0,
        active: h.active ?? true,
        ...h
    } as HomeHighlight;
    await setDoc(doc(db, 'home_highlights', id), newHighlight);
    return newHighlight;
};

export const deleteHomeHighlight = async (id: string) => {
    await deleteDoc(doc(db, 'home_highlights', id));
};

export const getCities = () => _cities;
export const getNeighborhoods = () => _neighborhoods;

export const saveCity = async (c: City) => {
    const id = c.id || doc(collection(db, 'cities')).id;
    await setDoc(doc(db, 'cities', id), { ...c, id }, { merge: true });
};

export const saveNeighborhood = async (n: Neighborhood) => {
    const id = n.id || doc(collection(db, 'neighborhoods')).id;
    await setDoc(doc(db, 'neighborhoods', id), { ...n, id }, { merge: true });
};

export const deleteCity = async (id: string) => {
    // Cascade delete neighborhoods
    const neighborhoods = _neighborhoods.filter(n => n.cityId === id);
    for (const n of neighborhoods) {
        await deleteDoc(doc(db, 'neighborhoods', n.id));
    }
    await deleteDoc(doc(db, 'cities', id));
};

export const deleteNeighborhood = async (id: string) => {
    await deleteDoc(doc(db, 'neighborhoods', id));
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
};

export const identifyNeighborhood = (lat: number, lng: number): string => {
    if (_neighborhoods.length === 0) {
        return _cities.length > 0 ? _cities[0].name : "Rio de Janeiro";
    }

    let closestNeighborhood: Neighborhood | null = null;
    let minDistance = Infinity;

    for (const n of _neighborhoods) {
        if (n.lat && n.lng && n.active) {
            const dist = calculateDistance(lat, lng, n.lat, n.lng);
            if (dist < minDistance) {
                minDistance = dist;
                closestNeighborhood = n;
            }
        }
    }

    if (closestNeighborhood && minDistance < 10) {
        return closestNeighborhood.name;
    }

    if (closestNeighborhood) {
        const city = _cities.find(c => c.id === closestNeighborhood.cityId);
        if (city) return city.name;
    }

    return _cities.length > 0 ? _cities[0].name : "Rio de Janeiro";
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

export const trackAction = async (businessId: string, type: string) => {
    try {
        // Incrementa o contador específico dentro do objeto actionCounts
        // Se o tipo for 'share', também incrementamos o campo shares legado para compatibilidade
        const updates: any = {
            [`actionCounts.${type}`]: increment(1)
        };
        if (type === 'share') updates.shares = increment(1);
        
        await updateDoc(doc(db, 'businesses', businessId), updates);
    } catch (e) {
        console.error("Error tracking action:", e);
    }
};

export const redeemCoupon = async (uid: string, c: Coupon) => {
    let companyName = c.companyName;
    
    // Fallback: If companyName is generic, try to find the real name from businesses
    if (!companyName || companyName === 'Minha Empresa') {
        const biz = _businesses.find(b => b.id === c.companyId);
        if (biz) companyName = biz.name;
    }

    const record: SavingsRecord = { 
        date: new Date().toISOString(), 
        amount: c.originalPrice - c.discountedPrice, 
        couponTitle: c.title, 
        couponId: c.id,
        companyName: companyName,
        expiryDate: c.expiryDate,
        code: c.code
    };

    await updateDoc(doc(db, 'coupons', c.id), { currentRedemptions: increment(1) });
    await updateDoc(doc(db, 'users', uid), { 
        savedAmount: increment(record.amount),
        history: arrayUnion(record)
    });

    // Update local user state if it's the current user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === uid) {
        const updatedUser = {
            ...currentUser,
            savedAmount: (currentUser.savedAmount || 0) + record.amount,
            history: [...(currentUser.history || []), record]
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
        notifyListeners();
    }
};

export const createAdminPlace = async (data: Partial<BusinessProfile>) => {
    const id = doc(collection(db, 'businesses')).id;
    const newPlace: BusinessProfile = {
        id,
        name: data.name || '',
        category: data.category || 'Passeios',
        description: data.description || '',
        coverImage: data.coverImage || '',
        gallery: data.gallery || [],
        address: data.address || '',
        phone: data.phone || '',
        amenities: data.amenities || [],
        openingHours: data.openingHours || {},
        rating: 5,
        reviewCount: 0,
        views: 0,
        shares: 0,
        isClaimed: false,
        isBlocked: false,
        canBeClaimed: data.canBeClaimed ?? true,
        ...data
    };
    await setDoc(doc(db, 'businesses', id), newPlace);
    _businesses.push(newPlace);
    notifyListeners();
    return newPlace;
};

export const updateClaimableStatus = async (id: string, canBeClaimed: boolean) => {
    await updateDoc(doc(db, 'businesses', id), { canBeClaimed });
    const biz = _businesses.find(b => b.id === id);
    if (biz) biz.canBeClaimed = canBeClaimed;
    notifyListeners();
};

export const updateBusinessPlan = async (businessId: string, planId: string) => {
    const plan = _plans.find(p => p.id === planId);
    const updates: any = { 
        plan: planId,
        isFeatured: plan ? plan.isFeatured : false
    };
    
    await updateDoc(doc(db, 'businesses', businessId), updates);
    
    const biz = _businesses.find(b => b.id === businessId);
    if (biz) {
        biz.plan = planId as any;
        biz.isFeatured = plan ? plan.isFeatured : false;
    }
    
    notifyListeners();
};

export const registerUser = async (name: string, email: string, pass: string): Promise<User> => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    const newUser: User = { id: res.user.uid, name, email, role: UserRole.CUSTOMER, favorites: { coupons: [], businesses: [] }, history: [], savedAmount: 0 };
    await setDoc(doc(db, 'users', newUser.id), cleanObject(newUser));
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    notifyListeners();
    return newUser;
};

export const createJournalistUser = async (name: string, email: string, pass: string): Promise<User> => {
    // To avoid logging out the current admin, we use a secondary app instance
    const { initializeApp } = await import('firebase/app');
    const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
    
    const secondaryApp = initializeApp(auth.app.options, 'SecondaryApp');
    const secondaryAuth = getAuth(secondaryApp);
    
    const res = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
    const newUser: User = { id: res.user.uid, name, email, role: UserRole.JOURNALIST, favorites: { coupons: [], businesses: [] }, history: [], savedAmount: 0 };
    await setDoc(doc(db, 'users', newUser.id), cleanObject(newUser));
    
    // Sign out the secondary app and delete it to clean up
    await secondaryAuth.signOut();
    
    notifyListeners();
    return newUser;
};

export const createCompanyRequest = async (request: any, type: 'NEW_REGISTRATION' | 'CLAIM' = 'NEW_REGISTRATION') => {
    const user = getCurrentUser();
    const id = `req_${Date.now()}`;
    const data: any = {
        ...request,
        id,
        status: 'PENDING',
        type,
        requestDate: new Date().toISOString()
    };

    if (user) {
        data.userId = user.id;
    }

    await setDoc(doc(db, 'companyRequests', id), data);
};

export const getCompanyRequests = () => {
    return _requests;
};

export const rejectCompanyRequest = async (requestId: string) => {
    await updateDoc(doc(db, 'companyRequests', requestId), { status: 'REJECTED' });
};

export const approveCompanyRequest = async (requestId: string) => {
    const reqDoc = await getDoc(doc(db, 'companyRequests', requestId));
    if (!reqDoc.exists()) return;
    
    const request = reqDoc.data() as CompanyRequest;
    await updateDoc(doc(db, 'companyRequests', requestId), { status: 'APPROVED' });
    
    if (request.type === 'CLAIM' && request.companyId && request.userId) {
        // Handle Claim: Update business to be claimed by this user
        await updateDoc(doc(db, 'businesses', request.companyId), { 
            isClaimed: true,
            id: request.userId // In this system, business ID usually matches user ID for companies
        });
        
        // Also update user role to COMPANY
        const userDoc = await getDoc(doc(db, 'users', request.userId));
        if (userDoc.exists()) {
            const user = { id: userDoc.id, ...userDoc.data() } as User;
            await updateUser({
                ...user,
                role: UserRole.COMPANY,
                companyName: request.companyName,
                permissions: {
                    canCreateCoupons: true,
                    canManageBusiness: true
                }
            });
        }
    } else if (request.userId) {
        // Handle New Registration
        const userDoc = await getDoc(doc(db, 'users', request.userId));
        if (userDoc.exists()) {
            const user = { id: userDoc.id, ...userDoc.data() } as User;
            const updatedUser = {
                ...user,
                permissions: {
                    ...(user.permissions || { canCreateCoupons: false, canManageBusiness: false }),
                    canCreateBusiness: true
                }
            };
            await updateUser(updatedUser);
        }
    }
};

export const checkIfOpen = (openingHours: { [key: string]: string }): boolean => {
    if (!openingHours) return false;

    const now = new Date();
    const dayOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][now.getDay()];
    const hoursString = openingHours[dayOfWeek];

    if (!hoursString || hoursString.toLowerCase().includes('fechado')) {
        return false;
    }
    
    if (hoursString.toLowerCase().includes('24 horas')) {
        return true;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const ranges = hoursString.split(',').map(r => r.trim());

    for (const range of ranges) {
        const match = range.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        
        if (!match) continue; 

        const [, startHour, startMinute, endHour, endMinute] = match.map(Number);
        
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;

        if (endMinutes < startMinutes) { // Handles overnight hours like 22:00 - 02:00
            if (currentMinutes >= startMinutes || currentMinutes <= endMinutes) return true;
        } else {
            if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) return true;
        }
    }

    return false;
};

export const getPricingPlans = () => _plans;

export const savePricingPlan = async (plan: Partial<PricingPlan>) => {
    const id = plan.id || doc(collection(db, 'pricingPlans')).id;
    const newPlan: PricingPlan = {
        id,
        name: plan.name || 'Novo Plano',
        price: plan.price || 0,
        period: plan.period || 'monthly',
        maxCoupons: plan.maxCoupons || 5,
        maxBusinesses: plan.maxBusinesses || 1,
        isFeatured: plan.isFeatured || false,
        showGallery: plan.showGallery || false,
        showMenu: plan.showMenu || false,
        showSocialMedia: plan.showSocialMedia || false,
        showReviews: plan.showReviews || false,
        hasFreeTrial: plan.hasFreeTrial || false,
        active: plan.active ?? true,
        ...plan
    } as PricingPlan;
    await setDoc(doc(db, 'pricingPlans', id), newPlan);
    return newPlan;
};

export const deletePricingPlan = async (id: string) => {
    await deleteDoc(doc(db, 'pricingPlans', id));
};
