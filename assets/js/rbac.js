/**
 * Role-Based Access Control (RBAC) Module
 * Handles roles, permissions, and access control for the Adhirat Portal
 */

import {
    db,
    auth,
    collection,
    addDoc,
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    onAuthStateChanged,
    query,
    where,
    getDocs,
    updateDoc,
    deleteDoc,
    orderBy,
    limit
} from './firebase-config.js';
import { getCurrentOrgId } from './firebase-modules.js';


// ============================================
// PREDEFINED PERMISSIONS
// ============================================
export const PERMISSIONS = {
    // Dashboard Access
    VIEW_DASHBOARD: 'view_dashboard',
    VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
    VIEW_EMPLOYEE_DASHBOARD: 'view_employee_dashboard',

    // User Management
    VIEW_USERS: 'view_users',
    CREATE_USER: 'create_user',
    EDIT_USER: 'edit_user',
    DELETE_USER: 'delete_user',
    ASSIGN_ROLES: 'assign_roles',

    // Role Management
    VIEW_ROLES: 'view_roles',
    CREATE_ROLE: 'create_role',
    EDIT_ROLE: 'edit_role',
    DELETE_ROLE: 'delete_role',

    // Subscription Management
    VIEW_SUBSCRIPTIONS: 'view_subscriptions',
    MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',
    EXPORT_SUBSCRIPTIONS: 'export_subscriptions',

    // Form Submissions Management
    VIEW_SUBMISSIONS: 'view_submissions',
    RESPOND_SUBMISSIONS: 'respond_submissions',
    DELETE_SUBMISSIONS: 'delete_submissions',
    EXPORT_SUBMISSIONS: 'export_submissions',

    // Employee Management
    VIEW_EMPLOYEES: 'view_employees',
    CREATE_EMPLOYEE: 'create_employee',
    EDIT_EMPLOYEE: 'edit_employee',
    DELETE_EMPLOYEE: 'delete_employee',

    // Recruitment
    VIEW_APPLICATIONS: 'view_applications',
    MANAGE_APPLICATIONS: 'manage_applications',

    // Finance
    VIEW_INVOICES: 'view_invoices',
    CREATE_INVOICE: 'create_invoice',
    EDIT_INVOICE: 'edit_invoice',
    VIEW_PAYROLL: 'view_payroll',
    MANAGE_PAYROLL: 'manage_payroll',

    // Documents
    VIEW_DOCUMENTS: 'view_documents',
    CREATE_DOCUMENT: 'create_document',
    EDIT_DOCUMENT: 'edit_document',
    DELETE_DOCUMENT: 'delete_document',

    // Timesheet
    VIEW_TIMESHEET: 'view_timesheet',
    MANAGE_TIMESHEET: 'manage_timesheet',
    APPROVE_TIMESHEET: 'approve_timesheet',

    // Organization
    MANAGE_ORGANIZATION: 'manage_organization',

    // Settings
    VIEW_SETTINGS: 'view_settings',
    MANAGE_SETTINGS: 'manage_settings',

    // Calendar
    VIEW_CALENDAR: 'view_calendar',
    MANAGE_CALENDAR: 'manage_calendar'
};

// ============================================
// DEFAULT ROLES
// ============================================
export const DEFAULT_ROLES = {
    admin: {
        name: 'Admin',
        description: 'Full system access with all permissions',
        color: '#8B5CF6',
        permissions: Object.values(PERMISSIONS),
        isDefault: true,
        createdAt: null
    },
    manager: {
        name: 'Manager',
        description: 'Can manage employees, view reports, and handle day-to-day operations',
        color: '#06B6D4',
        permissions: [
            PERMISSIONS.VIEW_DASHBOARD,
            PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD,
            PERMISSIONS.VIEW_USERS,
            PERMISSIONS.VIEW_EMPLOYEES,
            PERMISSIONS.EDIT_EMPLOYEE,
            PERMISSIONS.VIEW_APPLICATIONS,
            PERMISSIONS.MANAGE_APPLICATIONS,
            PERMISSIONS.VIEW_INVOICES,
            PERMISSIONS.VIEW_PAYROLL,
            PERMISSIONS.VIEW_DOCUMENTS,
            PERMISSIONS.VIEW_TIMESHEET,
            PERMISSIONS.APPROVE_TIMESHEET,
            PERMISSIONS.VIEW_SETTINGS,
            PERMISSIONS.VIEW_CALENDAR
        ],
        isDefault: true,
        createdAt: null
    },
    employee: {
        name: 'Employee',
        description: 'Standard employee access to self-service features',
        color: '#10B981',
        permissions: [
            PERMISSIONS.VIEW_DASHBOARD,
            PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD,
            PERMISSIONS.VIEW_DOCUMENTS,
            PERMISSIONS.VIEW_TIMESHEET,
            PERMISSIONS.VIEW_CALENDAR
        ],
        isDefault: true,
        createdAt: null
    },
    guest: {
        name: 'Guest',
        description: 'No access to portal features - view only public pages',
        color: '#6B7280',
        permissions: [],
        isDefault: true,
        createdAt: null
    }
};

// ============================================
// ROLE MANAGEMENT FUNCTIONS
// ============================================

/**
 * Initialize default roles in Firestore
 * Called once during initial setup
 */
export async function initializeDefaultRoles() {
    try {
        const rolesRef = collection(db, 'roles');

        for (const [roleId, roleData] of Object.entries(DEFAULT_ROLES)) {
            const roleDocRef = doc(db, 'roles', roleId);
            const roleDoc = await getDoc(roleDocRef);

            if (!roleDoc.exists()) {
                await setDoc(roleDocRef, {
                    ...roleData,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                console.log(`Created default role: ${roleData.name}`);
            }
        }
        return { success: true };
    } catch (error) {
        console.error('Error initializing default roles:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create a new role
 * @param {Object} roleData - Role data including name, description, permissions
 */
export async function createRole(roleData) {
    try {
        const roleId = roleData.name.toLowerCase().replace(/\s+/g, '_');
        const roleDocRef = doc(db, 'roles', roleId);

        const existingRole = await getDoc(roleDocRef);
        if (existingRole.exists()) {
            return { success: false, error: 'A role with this name already exists' };
        }

        await setDoc(roleDocRef, {
            name: roleData.name,
            description: roleData.description || '',
            color: roleData.color || '#6B7280',
            permissions: roleData.permissions || [],
            isDefault: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            orgId: getCurrentOrgId()
        });

        return { success: true, roleId };
    } catch (error) {
        console.error('Error creating role:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update an existing role
 * @param {string} roleId - Role ID to update
 * @param {Object} roleData - Updated role data
 */
export async function updateRole(roleId, roleData) {
    try {
        const roleDocRef = doc(db, 'roles', roleId);
        const roleDoc = await getDoc(roleDocRef);

        if (!roleDoc.exists()) {
            return { success: false, error: 'Role not found' };
        }

        // Prevent editing default roles' core properties
        const existingData = roleDoc.data();
        if (existingData.isDefault && roleData.name !== existingData.name) {
            return { success: false, error: 'Cannot rename default roles' };
        }

        await updateDoc(roleDocRef, {
            ...roleData,
            updatedAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating role:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a role (only non-default roles can be deleted)
 * @param {string} roleId - Role ID to delete
 */
export async function deleteRole(roleId) {
    try {
        const roleDocRef = doc(db, 'roles', roleId);
        const roleDoc = await getDoc(roleDocRef);

        if (!roleDoc.exists()) {
            return { success: false, error: 'Role not found' };
        }

        if (roleDoc.data().isDefault) {
            return { success: false, error: 'Cannot delete default roles' };
        }

        // Check if any users have this role
        const usersQuery = query(collection(db, 'users'), where('role', '==', roleId));
        const usersSnapshot = await getDocs(usersQuery);

        if (!usersSnapshot.empty) {
            return { success: false, error: 'Cannot delete role - users are assigned to it' };
        }

        await deleteDoc(roleDocRef);
        return { success: true };
    } catch (error) {
        console.error('Error deleting role:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all roles
 */
export async function getAllRoles() {
    try {
        const orgId = getCurrentOrgId();

        // Fetch Default Roles
        const defaultRolesQuery = query(collection(db, 'roles'), where('isDefault', '==', true));

        // Fetch Org Specific Roles
        const orgRolesQuery = query(collection(db, 'roles'), where('orgId', '==', orgId));

        const [defaultSnap, orgSnap] = await Promise.all([getDocs(defaultRolesQuery), getDocs(orgRolesQuery)]);
        const roles = [];

        defaultSnap.forEach(doc => roles.push({ id: doc.id, ...doc.data() }));
        orgSnap.forEach(doc => roles.push({ id: doc.id, ...doc.data() }));

        return { success: true, roles };
    } catch (error) {
        console.error('Error fetching roles:', error);
        return { success: false, error: error.message, roles: [] };
    }
}

/**
 * Get a single role by ID
 * @param {string} roleId - Role ID
 */
export async function getRole(roleId) {
    try {
        const roleDocRef = doc(db, 'roles', roleId);
        const roleDoc = await getDoc(roleDocRef);

        if (!roleDoc.exists()) {
            return { success: false, error: 'Role not found' };
        }

        return {
            success: true,
            role: { id: roleDoc.id, ...roleDoc.data() }
        };
    } catch (error) {
        console.error('Error fetching role:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// USER ACCESS MANAGEMENT FUNCTIONS
// ============================================

/**
 * Assign a role to a user (single role - legacy support)
 * @param {string} userId - User ID
 * @param {string} roleId - Role ID to assign
 */
export async function assignRoleToUser(userId, roleId) {
    try {
        // Verify role exists
        const roleDoc = await getDoc(doc(db, 'roles', roleId));
        if (!roleDoc.exists()) {
            return { success: false, error: 'Role not found' };
        }

        // Update user's role (both single and array for compatibility)
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            role: roleId,
            roles: [roleId],
            roleUpdatedAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error assigning role:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Assign multiple roles to a user
 * @param {string} userId - User ID
 * @param {string[]} roleIds - Array of Role IDs to assign
 */
export async function assignRolesToUser(userId, roleIds) {
    try {
        if (!Array.isArray(roleIds) || roleIds.length === 0) {
            return { success: false, error: 'At least one role is required' };
        }

        // Verify all roles exist
        const roleChecks = await Promise.all(
            roleIds.map(async (roleId) => {
                const roleDoc = await getDoc(doc(db, 'roles', roleId));
                return { roleId, exists: roleDoc.exists() };
            })
        );

        for (const check of roleChecks) {
            if (!check.exists) {
                return { success: false, error: `Role '${check.roleId}' not found` };
            }
        }

        // Update user's roles
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            role: roleIds[0], // Primary role for backward compatibility
            roles: roleIds,
            roleUpdatedAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error assigning roles:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all users with their roles
 */
export async function getAllUsersWithRoles() {
    try {
        // Fetch users and roles in parallel for better performance
        // Filter users by orgIds array containing current Org ID
        const orgId = getCurrentOrgId();
        const usersQuery = query(collection(db, 'users'), where('orgIds', 'array-contains', orgId));

        const [usersSnapshot, rolesResult] = await Promise.all([
            getDocs(usersQuery),
            getAllRoles()
        ]);

        // Create a lookup map for roles
        const rolesMap = new Map();
        if (rolesResult.success) {
            rolesResult.roles.forEach(role => {
                rolesMap.set(role.id, role);
            });
        }

        const users = [];

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            let roleData = null;

            if (userData.role) {
                if (rolesMap.has(userData.role)) {
                    roleData = rolesMap.get(userData.role);
                } else {
                    // Fallback to single fetch if not found in bulk fetch (edge case)
                    const roleResult = await getRole(userData.role);
                    if (roleResult.success) {
                        roleData = roleResult.role;
                    }
                }
            }

            users.push({
                id: userDoc.id,
                ...userData,
                roleData
            });
        }

        return { success: true, users };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { success: false, error: error.message, users: [] };
    }
}

/**
 * Check if current user has a specific permission
 * Checks across all assigned roles (permissions are combined)
 * @param {string} permission - Permission to check
 */
export async function hasPermission(permission) {
    try {
        const user = auth.currentUser;
        if (!user) return false;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) return false;

        const userData = userDoc.data();

        // Support both single role and multiple roles
        const roleIds = Array.isArray(userData.roles) ? userData.roles :
            userData.role ? [userData.role] : ['guest'];

        // Check if any of the user's roles have the permission
        for (const roleId of roleIds) {
            const roleDoc = await getDoc(doc(db, 'roles', roleId));
            if (roleDoc.exists()) {
                const roleData = roleDoc.data();
                if (roleData.permissions && roleData.permissions.includes(permission)) {
                    return true;
                }
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}

/**
 * Get current user's permissions (combined from all roles)
 */
export async function getCurrentUserPermissions() {
    try {
        const user = auth.currentUser;
        if (!user) return { success: false, permissions: [], roles: [] };

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) return { success: false, permissions: [], roles: [] };

        const userData = userDoc.data();

        // Support both single role and multiple roles
        const roleIds = Array.isArray(userData.roles) ? userData.roles :
            userData.role ? [userData.role] : ['guest'];

        const allPermissions = new Set();
        const roles = [];

        // Fetch all roles in parallel
        const roleDocs = await Promise.all(
            roleIds.map(roleId => getDoc(doc(db, 'roles', roleId)))
        );

        for (let i = 0; i < roleIds.length; i++) {
            const roleDoc = roleDocs[i];
            const roleId = roleIds[i];

            if (roleDoc.exists()) {
                const roleData = roleDoc.data();
                roles.push({ id: roleId, ...roleData });

                // If role is admin, grant all permissions defined in code
                if (roleId === 'admin') {
                    Object.values(PERMISSIONS).forEach(p => allPermissions.add(p));
                }
                // Otherwise use stored permissions
                else if (roleData.permissions) {
                    roleData.permissions.forEach(p => allPermissions.add(p));
                }
            }
        }

        return {
            success: true,
            permissions: Array.from(allPermissions),
            roles: roles,
            role: roles[0] || null // Primary role for backward compatibility
        };
    } catch (error) {
        console.error('Error getting permissions:', error);
        return { success: false, permissions: [], roles: [], role: null, error: error.message };
    }
}

/**
 * Check if user is admin (has admin role in any of their roles)
 */
export async function isAdmin() {
    try {
        const user = auth.currentUser;
        if (!user) return false;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) return false;

        const userData = userDoc.data();

        // Support both single role and multiple roles
        const roleIds = Array.isArray(userData.roles) ? userData.roles :
            userData.role ? [userData.role] : [];

        return roleIds.includes('admin');
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// ============================================
// ACCESS CONTROL GUARD
// ============================================

/**
 * Initialize RBAC guard for protected pages
 * @param {Array} requiredPermissions - Array of permissions required to access the page
 * @param {Function} onAccessDenied - Callback when access is denied
 * @param {Function} onAccessGranted - Callback when access is granted
 */
export function initRBACGuard(requiredPermissions = [], onAccessDenied = null, onAccessGranted = null) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            // Not logged in - redirect to login
            window.location.href = 'login.html';
            return;
        }

        const { permissions, role } = await getCurrentUserPermissions();

        // Check if user is guest (no permissions)
        if (role && role.id === 'guest') {
            if (onAccessDenied) {
                onAccessDenied('guests');
            } else {
                showAccessDeniedModal('You do not have access to this portal. Please contact an administrator.', true);
            }
            return;
        }

        // Check required permissions
        if (requiredPermissions.length > 0) {
            const hasAllPermissions = requiredPermissions.every(p => permissions.includes(p));

            if (!hasAllPermissions) {
                if (onAccessDenied) {
                    onAccessDenied('permissions');
                } else {
                    showAccessDeniedModal('You do not have the required permissions to access this page.');
                }
                return;
            }
        }

        // Access granted
        if (onAccessGranted) {
            onAccessGranted(user, role, permissions);
        }

        // Update UI based on permissions
        updateUIBasedOnPermissions(permissions);
    });
}

/**
 * Update UI elements based on user permissions
 * @param {Array} permissions - User's permissions array
 */
function updateUIBasedOnPermissions(permissions) {
    // Hide elements that require specific permissions
    document.querySelectorAll('[data-permission]').forEach(el => {
        const requiredPermission = el.dataset.permission;
        if (!permissions.includes(requiredPermission)) {
            el.style.display = 'none';
        }
    });

    // Hide elements that require multiple permissions (comma-separated)
    document.querySelectorAll('[data-permissions]').forEach(el => {
        const requiredPermissions = el.dataset.permissions.split(',').map(p => p.trim());
        const hasAll = requiredPermissions.every(p => permissions.includes(p));
        if (!hasAll) {
            el.style.display = 'none';
        }
    });

    // Show elements only for specific roles
    document.querySelectorAll('[data-role]').forEach(el => {
        const requiredRole = el.dataset.role;
        // This will be handled by role check
    });
}

/**
 * Show access denied modal
 * @param {string} message - Message to display
 * @param {boolean} logoutUser - Whether to log out the user
 */
function showAccessDeniedModal(message, logoutUser = false) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]';
    modal.innerHTML = `
        <div class="bg-white dark:bg-dark-card rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-red-500/20 animate-fade-in-up">
            <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <span class="material-symbols-outlined text-red-500 text-2xl">block</span>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h3>
                    <p class="text-sm text-slate-500">Insufficient permissions</p>
                </div>
            </div>
            <p class="text-slate-600 dark:text-slate-400 mb-6">${message}</p>
            <div class="flex gap-3">
                <button onclick="window.location.href='index.html'" class="flex-1 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold">
                    Go Home
                </button>
                ${logoutUser ? `
                <button onclick="handleLogout()" class="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-semibold">
                    Logout
                </button>
                ` : ''}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ============================================
// SUBSCRIPTION MANAGEMENT FUNCTIONS
// ============================================

/**
 * Get all newsletter subscriptions
 */
export async function getAllSubscriptions() {
    try {
        const subsQuery = query(
            collection(db, 'newsletter'),
            where('orgId', '==', getCurrentOrgId()),
            orderBy('subscribedAt', 'desc')
        );
        const subsSnapshot = await getDocs(subsQuery);
        const subscriptions = [];

        subsSnapshot.forEach((doc) => {
            subscriptions.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return { success: true, subscriptions };
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        return { success: false, error: error.message, subscriptions: [] };
    }
}

/**
 * Update subscription status
 * @param {string} subscriptionId - Subscription ID
 * @param {string} status - New status (active, unsubscribed, bounced)
 */
export async function updateSubscriptionStatus(subscriptionId, status) {
    try {
        const subDocRef = doc(db, 'newsletter', subscriptionId);
        await updateDoc(subDocRef, {
            status,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating subscription:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a subscription
 * @param {string} subscriptionId - Subscription ID
 */
export async function deleteSubscription(subscriptionId) {
    try {
        await deleteDoc(doc(db, 'newsletter', subscriptionId));
        return { success: true };
    } catch (error) {
        console.error('Error deleting subscription:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// FORM SUBMISSIONS MANAGEMENT FUNCTIONS
// ============================================

/**
 * Get all contact form submissions
 */
export async function getAllSubmissions() {
    try {
        const subsQuery = query(
            collection(db, 'messages'),
            where('orgId', '==', getCurrentOrgId()),
            orderBy('createdAt', 'desc')
        );
        const subsSnapshot = await getDocs(subsQuery);
        const submissions = [];

        subsSnapshot.forEach((doc) => {
            submissions.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return { success: true, submissions };
    } catch (error) {
        console.error('Error fetching submissions:', error);
        return { success: false, error: error.message, submissions: [] };
    }
}

/**
 * Update submission status
 * @param {string} submissionId - Submission ID
 * @param {string} status - New status (new, read, responded, archived)
 */
export async function updateSubmissionStatus(submissionId, status) {
    try {
        const subDocRef = doc(db, 'messages', submissionId);
        await updateDoc(subDocRef, {
            status,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating submission:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Add response to a submission
 * @param {string} submissionId - Submission ID
 * @param {string} response - Response text
 */
export async function addResponseToSubmission(submissionId, response) {
    try {
        const subDocRef = doc(db, 'messages', submissionId);
        await updateDoc(subDocRef, {
            response,
            status: 'responded',
            respondedAt: serverTimestamp(),
            respondedBy: auth.currentUser?.uid
        });
        return { success: true };
    } catch (error) {
        console.error('Error adding response:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a submission
 * @param {string} submissionId - Submission ID
 */
export async function deleteSubmission(submissionId) {
    try {
        await deleteDoc(doc(db, 'messages', submissionId));
        return { success: true };
    } catch (error) {
        console.error('Error deleting submission:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create a new submission manually
 * @param {Object} submissionData - Submission data (name, email, phone, company, service, message, status)
 */
export async function createSubmission(submissionData) {
    try {
        const newSubmission = {
            name: submissionData.name || '',
            email: submissionData.email || '',
            phone: submissionData.phone || '',
            company: submissionData.company || '',
            service: submissionData.service || '',
            message: submissionData.message || '',
            status: submissionData.status || 'new',
            attachments: submissionData.attachments || [],
            attachmentUrl: submissionData.attachmentUrl || null,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser?.uid,
            source: 'portal', // Mark as manually created from portal
            orgId: getCurrentOrgId()
        };

        const docRef = await addDoc(collection(db, 'messages'), newSubmission);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error creating submission:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file
 */
export function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
            let cell = row[h];
            // Handle special cases
            if (cell && cell.toDate) {
                cell = cell.toDate().toISOString();
            }
            if (typeof cell === 'object') {
                cell = JSON.stringify(cell);
            }
            // Escape quotes and wrap in quotes if contains comma
            if (cell && (cell.toString().includes(',') || cell.toString().includes('"'))) {
                cell = `"${cell.toString().replace(/"/g, '""')}"`;
            }
            return cell || '';
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}
