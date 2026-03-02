const { performance } = require('perf_hooks');

// Mock Firestore getDoc
const getDoc = async (docRef) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                exists: () => true,
                id: docRef.id,
                data: () => ({ name: 'Mock Role' })
            });
        }, 50); // 50ms simulated latency
    });
};

// Mock doc function
const doc = (db, collection, id) => ({ id });
const db = {};

// Sequential Implementation (Current)
async function assignRolesToUserSequential(userId, roleIds) {
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
        return { success: false, error: 'At least one role is required' };
    }

    // Verify all roles exist
    for (const roleId of roleIds) {
        const roleDoc = await getDoc(doc(db, 'roles', roleId));
        if (!roleDoc.exists()) {
            return { success: false, error: `Role '${roleId}' not found` };
        }
    }

    return { success: true };
}

// Parallel Implementation (Optimized)
async function assignRolesToUserParallel(userId, roleIds) {
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
        return { success: false, error: 'At least one role is required' };
    }

    // Verify all roles exist
    // Start all requests in parallel
    const roleChecks = await Promise.all(
        roleIds.map(async (roleId) => {
            const roleDoc = await getDoc(doc(db, 'roles', roleId));
            return { roleId, exists: roleDoc.exists() };
        })
    );

    // Check results
    for (const check of roleChecks) {
        if (!check.exists) {
            return { success: false, error: `Role '${check.roleId}' not found` };
        }
    }

    return { success: true };
}

async function runBenchmark() {
    const roleIds = ['admin', 'manager', 'editor', 'viewer', 'guest'];

    console.log('Running benchmark with 5 roles (50ms latency per call)...\n');

    // Test Sequential
    const startSeq = performance.now();
    await assignRolesToUserSequential('user123', roleIds);
    const endSeq = performance.now();
    const timeSeq = endSeq - startSeq;
    console.log(`Sequential: ${timeSeq.toFixed(2)}ms`);

    // Test Parallel
    const startPar = performance.now();
    await assignRolesToUserParallel('user123', roleIds);
    const endPar = performance.now();
    const timePar = endPar - startPar;
    console.log(`Parallel:   ${timePar.toFixed(2)}ms`);

    const improvement = ((timeSeq - timePar) / timeSeq) * 100;
    console.log(`\nImprovement: ${improvement.toFixed(1)}%`);
}

runBenchmark();
