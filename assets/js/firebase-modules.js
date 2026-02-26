import {
    db,
    storage,
    auth,
    ref,
    uploadBytes,
    getDownloadURL,
    collection,
    addDoc,
    serverTimestamp,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    deleteDoc,
    orderBy,
    limit,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithPopup,
    updateDoc,

    deleteObject,
    arrayUnion
} from './firebase-config.js';
import { sendContactNotification, sendNewsletterNotification } from './email-notifications.js';

/**
 * Submit Contact Form
 * Used in contact.html for the contact form submission
 * Stores in Firebase and sends email notification to admin
 */
export async function submitContactForm(data, files = []) {
    try {
        let attachments = [];

        // Handle multiple file uploads
        if (files && files.length > 0) {
            const uploadPromises = Array.from(files).map(async (file, index) => {
                const storageRef = ref(storage, `contact-attachments/${Date.now() + index}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadUrl = await getDownloadURL(snapshot.ref);
                return {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    url: downloadUrl
                };
            });
            const uploadedFiles = await Promise.all(uploadPromises);
            attachments.push(...uploadedFiles);
        }

        // Store in Firebase
        await addDoc(collection(db, "messages"), {
            ...data,
            attachments: attachments,
            // Keep legacy field for backward compatibility
            attachmentUrl: attachments.length > 0 ? attachments[0].url : null,
            createdAt: serverTimestamp(),
            status: "new",
            orgId: getCurrentOrgId()
        });

        // Send email notification to admin (non-blocking)
        sendContactNotification({
            ...data,
            attachments: attachments,
            attachmentUrl: attachments.length > 0 ? attachments[0].url : null
        }).catch(err => console.warn('Email notification failed:', err));

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Subscribe to Newsletter
 * Used in app.js for the footer newsletter subscription
 * Stores in Firebase and sends email notification to admin
 */
export async function subscribeNewsletter(email) {
    try {
        // Store in Firebase
        await addDoc(collection(db, "newsletter"), {
            email: email,

            subscribedAt: serverTimestamp(),
            status: "active",
            orgId: getCurrentOrgId()
        });

        // Send email notification to admin (non-blocking)
        sendNewsletterNotification(email).catch(err => console.warn('Email notification failed:', err));

        return { success: true };
    } catch (error) {
        console.error("Newsletter Subscription Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Log Activity
 * Records actions in the activity_logs collection
 * @param {string} action - Action type (e.g., LOGIN, LOGOUT, CREATE, UPDATE, DELETE)
 * @param {string} module - Module name (e.g., AUTH, USERS, CALENDAR)
 * @param {string} details - detailed description of the activity
 * @param {string} [userId] - Optional user ID override
 * @param {string} [userName] - Optional user name override
 */
export async function logActivity(action, module, details, userId = null, userName = null) {
    try {
        const user = auth.currentUser;

        // If specific user not provided, try to use current authenticated user
        const finalUserId = userId || user?.uid || 'system';
        const finalUserName = userName || user?.displayName || user?.email || 'System';
        const finalUserEmail = user?.email || null;

        await addDoc(collection(db, "activity_logs"), {
            userId: finalUserId,
            userName: finalUserName,
            userEmail: finalUserEmail,
            action: action,
            module: module,
            details: details,
            orgId: getCurrentOrgId(), // Add Organization ID to logs
            timestamp: serverTimestamp()
        });
        return { success: true };
    } catch (e) {
        console.warn("Failed to log activity:", e);
        return { success: false, error: e.message };
    }
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Login User
 * Used in portal/login.html
 */
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store last login time
        await setDoc(doc(db, "users", user.uid), {
            lastLogin: serverTimestamp()
        }, { merge: true });

        // Log Activity
        await logActivity('LOGIN', 'AUTH', `User logged in`, user.uid, user.email);

        return { success: true, user: user };
    } catch (error) {
        let errorMessage = error.message;
        // Make error messages more user-friendly
        if (error.code === 'auth/invalid-credential') {
            errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later.';
        }
        return { success: false, error: errorMessage };
    }
}

/**
 * Register User
 * Used in portal/signup.html
 * Self-registered users get 'guest' role by default
 */
export async function registerUser(email, password, fullName) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user profile in Firestore with guest role (self-registered)
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: email,
            fullName: fullName,
            role: 'guest', // Primary role for backward compatibility
            roles: ['guest'], // Support for multiple roles
            provider: 'email',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            orgIds: ['default'] // Default organization
        });

        // Log Register Activity
        await logActivity('REGISTER', 'AUTH', `New user registered: ${email}`, user.uid, fullName);

        return { success: true, user: user };
    } catch (error) {
        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'An account with this email already exists.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password should be at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
        }
        return { success: false, error: errorMessage };
    }
}

/**
 * Logout User
 * Used in portal for logout button
 */
export async function logoutUser() {
    try {
        // Log before signing out to capture user ID
        await logActivity('LOGOUT', 'AUTH', 'User logged out');

        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Reset Password
 * Used in portal/forgot_password.html
 */
export async function resetPassword(email) {
    try {
        // First check if user exists in our Firestore database
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return {
                success: false,
                error: 'No account found with this email address. Please check your email or sign up for a new account.'
            };
        }

        // User exists, now send password reset email
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        let errorMessage = error.message;
        if (error.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many password reset attempts. Please try again later.';
        }
        return { success: false, error: errorMessage };
    }
}

/**
 * Sign in with Google
 * Used in portal/login.html for Google OAuth
 */
export async function signInWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Create or update user profile in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // New user - create profile
            await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                fullName: user.displayName || user.email?.split('@')[0],
                photoURL: user.photoURL,
                provider: 'google',
                role: 'employee',
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });
        } else {
            // Existing user - update last login
            await setDoc(userDocRef, {
                lastLogin: serverTimestamp(),
                photoURL: user.photoURL
            }, { merge: true });
        }

        return { success: true, user: user };
    } catch (error) {
        let errorMessage = error.message;
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign-in cancelled. Please try again.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Pop-up blocked. Please allow pop-ups and try again.';
        } else if (error.code === 'auth/account-exists-with-different-credential') {
            errorMessage = 'An account already exists with this email using a different sign-in method.';
        }
        return { success: false, error: errorMessage };
    }
}

/**
 * Upload Profile Photo
 * Used in portal/profile.html
 * Uploads photo to Storage and updates user profile in Firestore
 */
export async function uploadProfilePhoto(file) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        // Check for existing photo and delete it if it exists
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.photoURL) {
                try {
                    // Create a reference to the file to delete
                    // Only delete if it's a firebase storage url
                    if (userData.photoURL.includes('firebasestorage.googleapis.com')) {
                        const fileRef = ref(storage, userData.photoURL);
                        await deleteObject(fileRef);
                    }
                } catch (deleteErr) {
                    console.warn("Could not delete old photo:", deleteErr);
                    // Continue with upload even if delete fails
                }
            }
        }

        // Create storage reference
        const fileExt = file.name.split('.').pop();
        const fileName = `profile_${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, `users/${user.uid}/profile/${fileName}`);

        // Upload file
        const snapshot = await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(snapshot.ref);

        // Update user profile in Firestore
        await updateDoc(userDocRef, {
            photoURL: photoURL,
            updatedAt: serverTimestamp()
        });

        // Update global UI immediately
        updateUserDisplay(user, { ...userDoc.data(), photoURL: photoURL });

        return { success: true, photoURL: photoURL };
    } catch (error) {
        console.error('Error uploading profile photo:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sign in with Apple
 * Used in portal/login.html for Apple OAuth
 */
export async function signInWithApple() {
    try {
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');

        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Create or update user profile in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // New user - create profile
            await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                fullName: user.displayName || user.email?.split('@')[0] || 'Apple User',
                photoURL: user.photoURL,
                provider: 'apple',
                role: 'employee',
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });
        } else {
            // Existing user - update last login
            await setDoc(userDocRef, {
                lastLogin: serverTimestamp()
            }, { merge: true });
        }

        return { success: true, user: user };
    } catch (error) {
        let errorMessage = error.message;
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign-in cancelled. Please try again.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Pop-up blocked. Please allow pop-ups and try again.';
        } else if (error.code === 'auth/account-exists-with-different-credential') {
            errorMessage = 'An account already exists with this email using a different sign-in method.';
        }
        return { success: false, error: errorMessage };
    }
}

/**
 * Get User Profile
 * Returns user profile data from Firestore
 */
export async function getUserProfile(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error("Error getting user profile:", error);
        return null;
    }
}

/**
 * Initialize Auth Observer
 * Monitors auth state and handles redirects
 * @param {boolean} isProtected - If true, redirects unauthenticated users to login
 */
export function initAuthObserver(isProtected = false) {
    onAuthStateChanged(auth, async (user) => {
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.includes('login.html');
        const isSignupPage = currentPath.includes('signup.html');
        const isForgotPasswordPage = currentPath.includes('forgot_password.html');
        const isAuthPage = isLoginPage || isSignupPage || isForgotPasswordPage;

        if (user) {
            // User is signed in
            const profile = await getUserProfile(user.uid);

            // Update user display in UI
            updateUserDisplay(user, profile);

            // Redirect away from auth pages if already logged in
            if (isAuthPage) {
                window.location.href = 'index.html';
            }
        } else {
            // User is signed out
            if (isProtected && !isAuthPage) {
                // Redirect to login if trying to access protected page
                window.location.href = 'login.html';
            }
        }
    });
}

/**
 * Update User Display
 * Updates user name and avatar in the UI
 */
function updateUserDisplay(user, profile) {
    // Update user name displays
    const nameDisplays = document.querySelectorAll('.user-name-display');
    nameDisplays.forEach(el => {
        el.textContent = profile?.fullName || user.email?.split('@')[0] || 'User';
    });

    // Update avatar displays (initials or image)
    const avatarDisplays = document.querySelectorAll('.user-avatar-display');
    avatarDisplays.forEach(el => {
        const name = profile?.fullName || user.email?.split('@')[0] || 'U';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const photoURL = profile?.photoURL || user.photoURL;
        const container = el.parentElement;

        if (photoURL && container) {
            container.style.backgroundImage = `url('${photoURL}')`;
            container.style.backgroundSize = 'cover';
            container.style.backgroundPosition = 'center';
            // Clear fallback background style if needed or rely on cover
            el.style.display = 'none'; // Hide initials
        } else {
            el.textContent = initials;
            el.style.display = 'block'; // Show initials
            if (container) {
                container.style.backgroundImage = 'none';
            }
        }
    });
}

/**
 * Handle Logout
 * Global function to handle logout from any page
 */
window.handleLogout = async function () {
    const result = await logoutUser();
    if (result.success) {
        window.location.href = 'login.html';
    } else {
        alert('Logout failed: ' + result.error);
    }
};

/**
 * Refresh Global User UI
 * Exposed to allow app.js to trigger UI updates after dynamic content loading (header.html)
 */
window.refreshGlobalUserUI = async function () {
    // Wait slightly to ensure auth state is initialized if this is called very early
    // But typically auth state persists.
    const user = auth.currentUser;
    if (user) {
        // Optimistic update
        updateUserDisplay(user, null);

        // Full update
        const profile = await getUserProfile(user.uid);
        updateUserDisplay(user, profile);
    }
};

/**
 * Get Organization Profile
 * Returns organization data from Firestore
 */
export async function getOrganizationProfile() {
    try {
        const orgId = getCurrentOrgId();

        // Single Tenant / Default Fallback
        if (orgId === 'default' || !orgId) {
            const docRef = doc(db, "settings", "organization");
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data() : { name: 'Adhirat Inc.' };
        }

        // Multi Tenant
        const docRef = doc(db, "organizations", orgId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        console.error("Error getting organization profile:", error);
        return null;
    }
}

/**
 * Update Organization Profile
 * Updates organization data in Firestore
 */
export async function updateOrganizationProfile(data) {
    try {
        const orgId = getCurrentOrgId();
        let docRef;

        if (orgId === 'default' || !orgId) {
            docRef = doc(db, "settings", "organization");
        } else {
            docRef = doc(db, "organizations", orgId);
        }

        await setDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error("Error updating organization profile:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Upload Organization Logo
 * Uploads logo to Storage and updates organization profile
 */
export async function uploadOrganizationLogo(file) {
    try {
        const orgId = getCurrentOrgId();

        // Create storage reference
        const fileExt = file.name.split('.').pop();
        const fileName = `logo_${Date.now()}.${fileExt}`;
        const storagePath = (orgId === 'default' || !orgId)
            ? `organization/logo/${fileName}`
            : `organizations/${orgId}/logo/${fileName}`;

        const storageRef = ref(storage, storagePath);

        // Upload file
        const snapshot = await uploadBytes(storageRef, file);
        const logoURL = await getDownloadURL(snapshot.ref);

        // Update organization profile in Firestore
        await updateOrganizationProfile({ logoURL: logoURL });

        return { success: true, logoURL: logoURL };
    } catch (error) {
        console.error('Error uploading organization logo:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Upload Organization Document
 * Uploads a document to Storage and returns the URL and metadata
 */
export async function uploadOrganizationDocument(file) {
    try {
        const orgId = getCurrentOrgId();

        // Create storage reference
        // Format: organizations/{orgId}/documents/{timestamp}_{filename}
        const fileExt = file.name.split('.').pop();
        // Sanitize filename to avoid issues
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}_${safeName}`;

        const storagePath = (orgId === 'default' || !orgId)
            ? `organization/documents/${fileName}`
            : `organizations/${orgId}/documents/${fileName}`;

        const storageRef = ref(storage, storagePath);

        // Upload file
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        return {
            success: true,
            document: {
                name: file.name,
                url: downloadUrl,
                type: file.type,
                size: file.size,
                uploadedAt: new Date().toISOString(),
                storagePath: storagePath
            }
        };
    } catch (error) {
        console.error('Error uploading organization document:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Generate Next Employee ID
 * Generates a sequential employee ID based on organization prefix
 * Format: [PREFIX][5-digit Sequence] e.g. EMP00001
 */
export async function generateNextEmployeeId() {
    try {
        // 1. Fetch Organization Prefix
        let orgPrefix = 'EMP'; // Fallback
        const orgData = await getOrganizationProfile();

        if (orgData && orgData.employeeIdPrefix) {
            orgPrefix = orgData.employeeIdPrefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        }

        // 2. Determine Next Sequence Number
        // Query users to find the highest current ID with this prefix using an efficient index scan
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('customId', '>=', orgPrefix + '0'),
            where('customId', '<=', orgPrefix + '9\uf8ff'),
            orderBy('customId', 'desc'),
            limit(1)
        );

        const usersSnap = await getDocs(q);
        let maxSeq = 0;

        if (!usersSnap.empty) {
            const data = usersSnap.docs[0].data();
            if (data.customId) {
                const prefixRegex = new RegExp(`^${orgPrefix}(\\d+)$`);
                const match = data.customId.match(prefixRegex);
                if (match) {
                    maxSeq = parseInt(match[1], 10);
                }
            }
        }

        const nextSeq = (maxSeq + 1).toString().padStart(5, '0');
        const newId = `${orgPrefix}${nextSeq}`;

        return { success: true, id: newId };
    } catch (error) {
        console.error('Error generating employee ID:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// MULTI-TENANCY / ORGANIZATION FUNCTIONS
// ============================================

/**
 * Get Current Organization ID
 * Retrieves the currently active organization from localStorage or defaults
 */
export function getCurrentOrgId() {
    return localStorage.getItem('adhirat_current_org_id') || 'default';
}

/**
 * Switch Organization
 * Sets the active organization and reloads the page to apply context
 */
export async function switchOrganization(orgId) {
    localStorage.setItem('adhirat_current_org_id', orgId);
    // Log switch if possible, guarding against circular deps if logActivity uses this
    try {
        // logic here
    } catch (e) { }

    return { success: true };
}

/**
 * Get User Organizations
 * Returns a list of organizations the current user belongs to
 */
export async function getUserOrganizations() {
    try {
        const user = auth.currentUser;
        if (!user) return [];

        // 1. Get User Profile to find their Org IDs
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) return [];

        const userData = userDoc.data();
        const orgIds = userData.orgIds || [];

        if (orgIds.length === 0) return [];

        // 2. Fetch Organization Details
        // Firestore 'in' query supports up to 10 items. For more, we'd need to batch or loop.
        // Assuming < 10 orgs for now.
        const q = query(collection(db, "organizations"), where("__name__", "in", orgIds));
        const snapshots = await getDocs(q);

        return snapshots.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            role: 'Member' // You might store roles map in user profile eventually: { orgId: 'role' }
        }));

    } catch (error) {
        console.error("Error fetching organizations:", error);
        return [];
    }
}

/**
 * Create Organization
 */
export async function createOrganization(data) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User must be logged in");

        // Handle if 'data' is just a string (backward compatibility)
        const orgInfo = typeof data === 'string' ? { name: data } : data;

        const orgData = {
            ...orgInfo,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            members: [user.uid]
        };

        const docRef = await addDoc(collection(db, "organizations"), orgData);

        // Add Org ID to User's profile
        await updateDoc(doc(db, "users", user.uid), {
            orgIds: arrayUnion(docRef.id)
        });

        await switchOrganization(docRef.id);
        return { success: true, orgId: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
