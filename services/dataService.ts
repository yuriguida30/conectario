
import { Coupon, User, UserRole, BusinessProfile, BlogPost, CompanyRequest, AppCategory, AppLocation, AppAmenity, Collection, DEFAULT_CATEGORIES, DEFAULT_AMENITIES, PROTECTED_CATEGORIES, FeaturedConfig, SupportMessage, AppConfig } from '../types';
import { MOCK_COUPONS, MOCK_BUSINESSES, MOCK_POSTS, MOCK_USERS } from './mockData';

// --- MOCK COLLECTIONS ---
const MOCK_COLLECTIONS: Collection[] = [
    {
        id: 'col1',
        title: 'Jantar Romântico',
        description: 'Os lugares perfeitos para impressionar quem você ama com boa gastronomia e ambiente intimista.',
        coverImage: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200',
        businessIds: ['b1', 'b4', 'b6'],
        featured: true
    },
    {
        id: 'col2',
        title: 'Aventura Radical',
        description: 'Para quem não consegue ficar parado. Mergulho, trilhas e passeios de buggy.',
        coverImage: 'https://images.unsplash.com/photo-1534068590799-09895a701e3e?auto=format&fit=crop&q=80&w=1200',
        businessIds: ['b3', 'b5'],
        featured: true
    }
];

// --- ARRAIAL DO CABO NEIGHBORHOODS CENTER POINTS ---
// Used for internal reverse geocoding without API costs
const ARRAIAL_LOCATIONS = [
    { id: 'prainha', name: 'Prainha', lat: -22.9554, lng: -42.0336 },
    { id: 'anjos', name: 'Praia dos Anjos', lat: -22.9691, lng: -42.0232 },
    { id: 'grande', name: 'Praia Grande', lat: -22.9712, lng: -42.0390 },
    { id: 'centro', name: 'Centro', lat: -22.9660, lng: -42.0260 },
    { id: 'pontal', name: 'Pontal do Atalaia', lat: -22.9750, lng: -42.0280 },
    { id: 'monte_alto', name: 'Monte Alto', lat: -22.9280, lng: -42.0500 },
    { id: 'figueira', name: 'Figueira', lat: -22.9350, lng: -42.0800 }
];

// --- LOCAL STORAGE HELPERS ---
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

// --- APP CONFIG (BRANDING) ---
export const getAppConfig = (): AppConfig => {
    return getStored<AppConfig>('app_config', {
        appName: 'CONECTA',
        appNameHighlight: 'RIO',
        logoUrl: '', // Empty means use default SVG
        loginLogoUrl: '',
        faviconUrl: ''
    });
};

export const saveAppConfig = (config: AppConfig) => {
    setStored('app_config', config);
    // Trigger window event so components can react immediately without refresh
    window.dispatchEvent(new Event('appConfigUpdated'));
};

// --- INITIALIZATION ---
// Loads mock data into local storage if empty or forces update for new demo
export const initFirebaseData = async () => {
    
    // FORCE UPDATE LOGIC: Check a version flag or just checking if business list is small/empty
    const existingBiz = getStored<BusinessProfile[]>('arraial_businesses', []);
    const shouldSeed = existingBiz.length < 2; // If very few businesses, re-seed with our robust mock data

    if (shouldSeed) {
        console.log("Seeding Database with Conecta Rio Mock Data...");
        setStored('arraial_businesses', MOCK_BUSINESSES);
        setStored('arraial_coupons', MOCK_COUPONS);
        setStored('arraial_blog_posts', MOCK_POSTS);
        setStored('arraial_collections', MOCK_COLLECTIONS);
        setStored('arraial_users_list', MOCK_USERS);
    }

    // Categories
    const cats = getStored<AppCategory[]>('arraial_categories', []);
    if (cats.length === 0) {
        const defaults = DEFAULT_CATEGORIES.map(c => ({ id: c.toLowerCase(), name: c }));
        setStored('arraial_categories', defaults);
    }
    
    // Locations
    const locs = getStored<AppLocation[]>('arraial_locations', []);
    if (locs.length === 0) {
        // Init locations based on our geo-points
        const geoLocs = ARRAIAL_LOCATIONS.map(l => ({ id: l.name, name: l.name, active: true }));
        setStored('arraial_locations', geoLocs);
    }

    // Amenities
    const amens = getStored<AppAmenity[]>('arraial_amenities', []);
    if (amens.length === 0) {
        setStored('arraial_amenities', DEFAULT_AMENITIES);
    }
};

// --- GPS UTILS ---
// Haversine formula to calculate distance in km
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}

// Identifies the closest known neighborhood based on user coordinates
export const identifyNeighborhood = (lat: number, lng: number): string => {
    let closest = 'Arraial do Cabo';
    let minDistance = 5; // 5km threshold to consider being "inside" Arraial area logic

    for (const loc of ARRAIAL_LOCATIONS) {
        const dist = calculateDistance(lat, lng, loc.lat, loc.lng);
        if (dist < minDistance) {
            minDistance = dist;
            closest = loc.name;
        }
    }
    
    // If closes distance is still far (e.g. user is in Rio), just say "Longe de Arraial" or fallback to Arraial
    if (minDistance > 20) return "Arraial do Cabo (Distante)";

    return closest;
};

// --- FEATURED CONFIG ---
export const getFeaturedConfig = (): FeaturedConfig => {
    return getStored<FeaturedConfig>('arraial_featured_config', {
        title: "Arraial Vip Tour",
        subtitle: "Passeio de barco inesquecível pelas águas cristalinas do Caribe Brasileiro. Reserve agora com desconto.",
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a42a4571d0?auto=format&fit=crop&q=80&w=1600",
        buttonText: "Ver Oferta"
    });
};

export const saveFeaturedConfig = (config: FeaturedConfig) => {
    setStored('arraial_featured_config', config);
};

// --- SUPPORT MESSAGES ---
export const getSupportMessages = (): SupportMessage[] => {
    return getStored<SupportMessage[]>('arraial_support_messages', []);
};

export const sendSupportMessage = (msg: Omit<SupportMessage, 'id' | 'date' | 'status'>) => {
    const current = getSupportMessages();
    const newMsg: SupportMessage = {
        ...msg,
        id: Date.now().toString(),
        date: new Date().toISOString(),
        status: 'OPEN'
    };
    setStored('arraial_support_messages', [newMsg, ...current]);
};

// --- CONFIGURATIONS (CATEGORIES, LOCATIONS, AMENITIES) ---
export const getCategories = (): AppCategory[] => {
    const stored = getStored<AppCategory[]>('arraial_categories', []);
    if (stored.length === 0) {
         return DEFAULT_CATEGORIES.map(c => ({ id: c.toLowerCase(), name: c }));
    }
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
        alert("Esta categoria é padrão do sistema e não pode ser excluída.");
        return;
    }

    setStored('arraial_categories', current.filter(c => c.id !== id));
};

export const getLocations = (): AppLocation[] => {
    const stored = getStored<AppLocation[]>('arraial_locations', []);
    if (stored.length === 0) {
        // Fallback to geo locations
        return ARRAIAL_LOCATIONS.map(l => ({ id: l.name, name: l.name, active: true }));
    }
    return stored;
};

export const addLocation = (name: string): void => {
    const current = getLocations();
    const newLoc = { id: Date.now().toString(), name, active: true };
    setStored('arraial_locations', [...current, newLoc]);
};

export const deleteLocation = (id: string): void => {
    const current = getLocations();
    setStored('arraial_locations', current.filter(l => l.id !== id));
};

export const getAmenities = (): AppAmenity[] => {
    return getStored<AppAmenity[]>('arraial_amenities', DEFAULT_AMENITIES);
};

export const addAmenity = (label: string): void => {
    const current = getAmenities();
    // Simple ID generation based on label
    const id = label.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newAmenity = { id: id + Date.now().toString().slice(-4), label };
    setStored('arraial_amenities', [...current, newAmenity]);
};

export const deleteAmenity = (id: string): void => {
    const current = getAmenities();
    setStored('arraial_amenities', current.filter(a => a.id !== id));
};

// --- USERS MANAGEMENT ---
export const getAllUsers = (): User[] => {
    const storedUsers = getStored<User[]>('arraial_users_list', []);
    let combined = [...storedUsers];
    
    // Merge mocks if not present
    MOCK_USERS.forEach(mockUser => {
        if (!combined.find(u => u.email === mockUser.email)) {
            combined.push(mockUser);
        }
    });

    // Ensure session user is in list
    const sessionUser = getStored<User | null>('arraial_user', null);
    if (sessionUser && !combined.find(u => u.email === sessionUser.email)) {
        combined.push(sessionUser);
    }
    
    // Normalize Permissions for legacy data
    combined = combined.map(u => {
        if (u.role === UserRole.COMPANY && !u.permissions) {
             return {
                 ...u,
                 maxCoupons: 10,
                 permissions: {
                     canCreateCoupons: true,
                     canManageBusiness: true
                 }
             }
        }
        return u;
    });

    return combined;
};

export const createUser = (user: User): void => {
    const users = getAllUsers();
    if (users.find(u => u.email === user.email)) {
        throw new Error("Email já cadastrado");
    }
    // Set default permissions for new companies
    if (user.role === UserRole.COMPANY && !user.permissions) {
        user.maxCoupons = 5;
        user.permissions = {
            canCreateCoupons: true,
            canManageBusiness: true
        };
    }
    users.push(user);
    setStored('arraial_users_list', users);
};

export const updateUser = (user: User): void => {
    const users = getAllUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
        users[index] = user;
        setStored('arraial_users_list', users);
        // If updating current user, update session too
        const session = getCurrentUser();
        if(session && session.id === user.id) {
             localStorage.setItem('arraial_user', JSON.stringify(user));
             // Update memory reference
             if (currentUser && currentUser.id === user.id) currentUser = user;
        }
    }
};

export const deleteUser = (userId: string): void => {
    const users = getAllUsers();
    const filtered = users.filter(u => u.id !== userId);
    setStored('arraial_users_list', filtered);
};

// --- FAVORITES ---
export const toggleFavorite = (type: 'coupon' | 'business', id: string): User | null => {
    const user = getCurrentUser();
    if (!user) return null;

    if (!user.favorites) {
        user.favorites = { coupons: [], businesses: [] };
    }

    const list = type === 'coupon' ? user.favorites.coupons : user.favorites.businesses;
    const index = list.indexOf(id);

    if (index >= 0) {
        list.splice(index, 1); // Remove
    } else {
        list.push(id); // Add
    }

    // Save
    updateUser(user);
    currentUser = user; // Update local ref
    return user;
};


// --- COUPONS ---
export const getCoupons = async (): Promise<Coupon[]> => {
    // Artificial delay removed for snappier feel
    const storedCoupons = getStored<Coupon[]>('arraial_coupons', []);
    
    // If empty (and not caught by init), fall back to MOCK (safety)
    const dataToUse = storedCoupons.length > 0 ? storedCoupons : MOCK_COUPONS;

    // ENHANCEMENT: Join with Business Data to get real coordinates for the map
    const businesses = getBusinesses();
    
    return dataToUse.map(coupon => {
        const business = businesses.find(b => b.id === coupon.companyId);
        if (business) {
            return {
                ...coupon,
                lat: business.lat || coupon.lat,
                lng: business.lng || coupon.lng,
                companyLogo: business.coverImage // Use cover as logo if logo missing
            };
        }
        return coupon;
    });
};

export const saveCoupon = async (coupon: Coupon): Promise<void> => {
    const current = await getCoupons();
    const index = current.findIndex(c => c.id === coupon.id);
    
    if (index >= 0) {
        current[index] = coupon;
    } else {
        current.unshift(coupon);
    }
    setStored('arraial_coupons', current);
};

export const deleteCoupon = async (id: string): Promise<void> => {
    const current = await getCoupons();
    const filtered = current.filter(c => c.id !== id);
    setStored('arraial_coupons', filtered);
};

// --- AUTHENTICATION ---
let currentUser: User | null = null;

export const getCurrentUser = (): User | null => {
    if (currentUser) return currentUser;
    const stored = localStorage.getItem('arraial_user');
    let user = stored ? JSON.parse(stored) : null;
    
    // Normalize permissions on load
    if (user && user.role === UserRole.COMPANY && !user.permissions) {
        user.maxCoupons = 10;
        user.permissions = { canCreateCoupons: true, canManageBusiness: true };
    }

    // Normalize Favorites
    if (user && !user.favorites) {
        user.favorites = { coupons: [], businesses: [] };
    }
    
    currentUser = user;
    return user;
};

export const login = async (email: string, role: UserRole): Promise<User | null> => {
    await new Promise(r => setTimeout(r, 800)); 
    
    const allUsers = getAllUsers();
    let user = allUsers.find(u => u.email === email);
    
    if (user) {
        if (user.role === UserRole.SUPER_ADMIN) {
             // Super admin accesses everything
        } else if (user.role !== role && role !== UserRole.CUSTOMER) {
             alert(`Este email não tem permissão de ${role}`);
             return null;
        }

        // Normalize permissions
        if (user.role === UserRole.COMPANY && !user.permissions) {
            user.maxCoupons = 10;
            user.permissions = { canCreateCoupons: true, canManageBusiness: true };
        }
        
        // Normalize favorites
        if (!user.favorites) {
            user.favorites = { coupons: [], businesses: [] };
        }

        currentUser = user;
        localStorage.setItem('arraial_user', JSON.stringify(user));
        return user;
    }

    if (role === UserRole.CUSTOMER) {
        const newUser: User = {
            id: Date.now().toString(),
            name: email.split('@')[0],
            email: email,
            role: UserRole.CUSTOMER,
            savedAmount: 0,
            history: [],
            favorites: { coupons: [], businesses: [] }
        };
        currentUser = newUser;
        localStorage.setItem('arraial_user', JSON.stringify(newUser));
        createUser(newUser);
        return newUser;
    }

    return null;
};

export const logout = async () => {
    currentUser = null;
    localStorage.removeItem('arraial_user');
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
    const user = getCurrentUser();
    callback(user);
    return () => {};
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
        currentUser = updatedUser;
        localStorage.setItem('arraial_user', JSON.stringify(updatedUser));
        updateUser(updatedUser); 
    }
};

// --- BUSINESS DATA (GUIDE) ---
export const getBusinesses = (): BusinessProfile[] => {
    const stored = getStored<BusinessProfile[]>('arraial_businesses', []);
    
    if (stored.length === 0) {
        // Safe fallback if init hasn't run yet
        return MOCK_BUSINESSES;
    }
    return stored;
};

export const saveBusiness = (business: BusinessProfile): void => {
    const current = getBusinesses();
    const index = current.findIndex(b => b.id === business.id);
    if (index >= 0) {
        current[index] = business;
    } else {
        current.push(business);
    }
    setStored('arraial_businesses', current);
};

export const rateBusiness = (businessId: string, rating: number) => {
    const current = getBusinesses();
    const index = current.findIndex(b => b.id === businessId);
    if (index >= 0) {
        const biz = current[index];
        // Simulating simple average update for mock data
        const oldRating = biz.rating || 5.0;
        const count = biz.reviewCount || 10;
        const newCount = count + 1;
        const newRating = ((oldRating * count) + rating) / newCount;
        
        current[index] = { ...biz, rating: parseFloat(newRating.toFixed(1)), reviewCount: newCount };
        setStored('arraial_businesses', current);
        return current[index];
    }
    return null;
};

export const getBusinessById = (id: string): BusinessProfile | undefined => {
    const businesses = getBusinesses();
    return businesses.find(b => b.id === id);
}

// --- COLLECTIONS ---
export const getCollections = (): Collection[] => {
    return getStored<Collection[]>('arraial_collections', []);
};

export const saveCollection = (collection: Collection): void => {
    const current = getCollections();
    const index = current.findIndex(c => c.id === collection.id);
    if (index >= 0) {
        current[index] = collection;
    } else {
        current.unshift(collection);
    }
    setStored('arraial_collections', current);
};

export const deleteCollection = (id: string): void => {
    const current = getCollections();
    setStored('arraial_collections', current.filter(c => c.id !== id));
};

export const getCollectionById = (id: string): Collection | undefined => {
    return getCollections().find(c => c.id === id);
};


// BLOG
export const getBlogPosts = (): BlogPost[] => {
    return getStored<BlogPost[]>('arraial_blog_posts', []);
}

export const saveBlogPost = (post: BlogPost): void => {
    const current = getBlogPosts();
    const index = current.findIndex(p => p.id === post.id);
    if (index >= 0) {
        current[index] = post;
    } else {
        current.unshift(post);
    }
    setStored('arraial_blog_posts', current);
};

export const deleteBlogPost = (id: string): void => {
    const current = getBlogPosts();
    setStored('arraial_blog_posts', current.filter(p => p.id !== id));
}

export const getBlogPostById = (id: string): BlogPost | undefined => {
    return getBlogPosts().find(p => p.id === id);
}

// REQUESTS
export const getCompanyRequests = (): CompanyRequest[] => {
    return getStored<CompanyRequest[]>('arraial_requests', []);
};

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
};

export const approveRequest = (requestId: string): void => {
    const requests = getCompanyRequests();
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex >= 0) {
        const req = requests[reqIndex];
        req.status = 'APPROVED';
        setStored('arraial_requests', requests);
        
        try {
            // Create User
            const userId = `comp_${Date.now()}`;
            const newUser: User = {
                id: userId,
                name: req.ownerName,
                email: req.email,
                role: UserRole.COMPANY,
                companyName: req.companyName,
                category: req.category,
                phone: req.phone,
                // Default Permissions
                maxCoupons: 5,
                permissions: {
                    canCreateCoupons: true,
                    canManageBusiness: true
                },
                favorites: { coupons: [], businesses: [] }
            };
            createUser(newUser);

            // Create Business Profile Stub with Request Data
            const newBusiness: BusinessProfile = {
                id: userId, 
                name: req.companyName,
                category: req.category,
                description: req.description,
                coverImage: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=800', // Better placeholder
                gallery: [],
                address: 'Endereço não informado',
                phone: req.phone,
                whatsapp: req.whatsapp || req.phone, // Map WA
                instagram: req.instagram || '',      // Map Insta
                website: req.website || '',          // Map Site
                amenities: [],
                openingHours: {},
                rating: 5.0,
                lat: -22.966, // Default Arraial
                lng: -42.026
            };
            saveBusiness(newBusiness);

            alert(`Empresa ${req.companyName} aprovada!`);
        } catch (e) {
            alert(`Erro ao criar: ${e}`);
        }
    }
};

export const rejectRequest = (requestId: string): void => {
    const requests = getCompanyRequests();
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex >= 0) {
        requests[reqIndex].status = 'REJECTED';
        setStored('arraial_requests', requests);
    }
};
