const { performance } = require('perf_hooks');

const PERMISSIONS = {
    VIEW_DASHBOARD: 'view_dashboard',
    VIEW_USERS: 'view_users',
    EDIT_USER: 'edit_user',
    VIEW_ROLES: 'view_roles',
    EDIT_ROLE: 'edit_role'
};

// Mock Data
const MOCK_ROLES = {
    'role1': { permissions: [PERMISSIONS.VIEW_DASHBOARD] },
    'role2': { permissions: [PERMISSIONS.VIEW_USERS] },
    'role3': { permissions: [PERMISSIONS.EDIT_USER] },
    'role4': { permissions: [PERMISSIONS.VIEW_ROLES] },
    'role5': { permissions: [PERMISSIONS.EDIT_ROLE] },
    'admin': { permissions: [] } // permissions added via code logic
};

// Mock DB functions
const db = {};

function doc(db, collection, id) {
    return { collection, id };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Simulate network latency (e.g., 50ms)
const LATENCY_MS = 50;

async function getDoc(docRef) {
    await sleep(LATENCY_MS);
    const data = MOCK_ROLES[docRef.id];
    return {
        exists: () => !!data,
        data: () => data,
        id: docRef.id
    };
}

// Current Implementation (Sequential)
async function fetchPermissionsSequential(roleIds) {
    const allPermissions = new Set();
    const roles = [];

    for (const roleId of roleIds) {
        const roleDoc = await getDoc(doc(db, 'roles', roleId));
        if (roleDoc.exists()) {
            const roleData = roleDoc.data();
            roles.push({ id: roleId, ...roleData });

            if (roleId === 'admin') {
                Object.values(PERMISSIONS).forEach(p => allPermissions.add(p));
            }
            else if (roleData.permissions) {
                roleData.permissions.forEach(p => allPermissions.add(p));
            }
        }
    }
    return { permissions: Array.from(allPermissions), roles };
}

// Optimized Implementation (Parallel)
async function fetchPermissionsParallel(roleIds) {
    const allPermissions = new Set();

    // Fetch all roles in parallel
    const roleDocs = await Promise.all(
        roleIds.map(roleId => getDoc(doc(db, 'roles', roleId)))
    );

    const roles = [];

    for (let i = 0; i < roleIds.length; i++) {
        const roleDoc = roleDocs[i];
        const roleId = roleIds[i];

        if (roleDoc.exists()) {
            const roleData = roleDoc.data();
            roles.push({ id: roleId, ...roleData });

            if (roleId === 'admin') {
                Object.values(PERMISSIONS).forEach(p => allPermissions.add(p));
            }
            else if (roleData.permissions) {
                roleData.permissions.forEach(p => allPermissions.add(p));
            }
        }
    }
    return { permissions: Array.from(allPermissions), roles };
}

async function runBenchmark() {
    const roleIds = ['role1', 'role2', 'role3', 'role4', 'role5'];

    console.log(`Running benchmark with ${roleIds.length} roles. Simulated latency: ${LATENCY_MS}ms per request.`);

    const startSeq = performance.now();
    await fetchPermissionsSequential(roleIds);
    const endSeq = performance.now();
    const timeSeq = endSeq - startSeq;
    console.log(`Sequential execution time: ${timeSeq.toFixed(2)}ms`);

    const startPar = performance.now();
    await fetchPermissionsParallel(roleIds);
    const endPar = performance.now();
    const timePar = endPar - startPar;
    console.log(`Parallel execution time: ${timePar.toFixed(2)}ms`);

    const improvement = timeSeq - timePar;
    const improvementPercent = (improvement / timeSeq) * 100;
    console.log(`Improvement: ${improvement.toFixed(2)}ms (${improvementPercent.toFixed(2)}%)`);
}

runBenchmark();
