const http = require('http');

const BASE_URL = 'http://localhost:8080/api';

async function fetchJson(url, options = {}) {
  const { default: fetch } = await import('node-fetch').catch(() => {
    // fallback to http module
    return { default: null };
  });
  
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 8080,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };
    
    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    });
    
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function login(username, password) {
  try {
    const res = await fetchJson(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (res.success && res.data?.token) {
      return { token: res.data.token, permissions: res.data.permissions, role: res.data.role };
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function getAllUsers(adminToken) {
  const res = await fetchJson(`${BASE_URL}/users?pageNum=1&pageSize=100`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  return res.data;
}

async function getAllRoles(adminToken) {
  const res = await fetchJson(`${BASE_URL}/roles?pageNum=1&pageSize=100`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  return res.data;
}

// ── EXPECTED PERMISSIONS per role keyword ──────────────────────────
function getExpectedPermissions(roleName) {
  const lower = roleName.toLowerCase();
  const expected = [];
  if (lower.includes('commodity') || lower.includes('product')) {
    expected.push('product', 'store');
  }
  if (lower.includes('device') || lower.includes('equipment')) {
    expected.push('equipment');
  }
  if (lower.includes('template') || lower.includes('display')) {
    expected.push('template');
  }
  if (lower.includes('staff') || lower.includes('personnel') || lower.includes('manager') || lower.includes('supervisor')) {
    expected.push('staffManager');
  }
  if (lower.includes('log') || lower.includes('audit')) {
    expected.push('log');
  }
  if (lower.includes('super') || lower.includes('admin')) {
    expected.push('product', 'store', 'equipment', 'template', 'log', 'staffManager');
  }
  return [...new Set(expected)];
}

async function main() {
  console.log('\n========================================');
  console.log('  CSCS ESL — Permission Verification');
  console.log('========================================\n');

  // Step 1: Admin login
  console.log('Step 1: Logging in as admin (DG0358)...');
  const adminAuth = await login('DG0358', 'xzlongan@123');
  if (!adminAuth) {
    console.error('❌ Admin login FAILED — check credentials or backend');
    process.exit(1);
  }
  console.log('✅ Admin login SUCCESS');
  console.log(`   Role: ${adminAuth.role}`);
  console.log(`   Permissions: [${adminAuth.permissions?.join(', ')}]\n`);

  // Step 2: Fetch all users
  console.log('Step 2: Fetching all users from DragonESL...');
  const usersData = await getAllUsers(adminAuth.token);
  const userList = usersData?.userVos || usersData?.userRoleStoreList || usersData?.list || [];
  console.log(`   Found ${userList.length} users\n`);

  // Step 3: Fetch all roles
  console.log('Step 3: Fetching all roles from DragonESL...');
  const rolesData = await getAllRoles(adminAuth.token);
  const rolesList = Array.isArray(rolesData) ? rolesData : (rolesData?.list || []);
  console.log(`   Found ${rolesList.length} roles`);
  console.log('   Roles:');
  rolesList.forEach(r => console.log(`     - [ID: ${r.id}] ${r.roleName || r.name}`));
  console.log('');

  // Step 4: Print user-role mapping
  console.log('Step 4: User → Role mapping:');
  console.log('─────────────────────────────────────────────────');
  const mappedUsers = userList.map((item) => {
    const u = item.user || item;
    return {
      account: u.account,
      staffName: u.name || u.staffName || 'Unknown',
      roleId: u.roleId,
      roleName: item.roleName || u.roleName || 'No Role'
    };
  }).filter(u => u.account && u.account !== 'DG0358');

  mappedUsers.forEach((u, i) => {
    console.log(`  ${i+1}. ${u.account} (${u.staffName}) → Role: "${u.roleName}" [ID: ${u.roleId}]`);
  });
  console.log('');

  // Step 5: NOTE — we cannot auto-login other users without their passwords
  // Instead verify admin permissions are complete
  console.log('Step 5: Verifying admin permissions are complete...');
  const requiredPerms = ['product', 'store', 'equipment', 'template', 'log', 'staffManager'];
  const missingPerms = requiredPerms.filter(p => !adminAuth.permissions?.includes(p));
  if (missingPerms.length === 0) {
    console.log('✅ Admin has ALL required permissions\n');
  } else {
    console.log(`❌ Admin MISSING permissions: [${missingPerms.join(', ')}]\n`);
  }

  // Step 6: Create test user
  console.log('Step 6: Creating test user TestVerify01...');
  
  // Get a valid role ID for commodity management
  const commodityRole = rolesList.find(r => 
    (r.roleName || r.name || '').toLowerCase().includes('commodity') ||
    (r.roleName || r.name || '').toLowerCase().includes('product')
  );
  
  if (!commodityRole) {
    console.log('⚠️  No commodity/product role found — skipping test user creation');
  } else {
    console.log(`   Using role: "${commodityRole.roleName || commodityRole.name}" [ID: ${commodityRole.id}]`);
    
    const createRes = await fetchJson(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminAuth.token}` },
      body: JSON.stringify({
        account: 'TestVerify01',
        staffName: 'Verification Test User',
        password: 'Test@12345',
        roleId: Number(commodityRole.id),
        allStorePermission: 1,
        storeIdList: []
      })
    });
    
    if (createRes.success) {
      console.log('✅ Test user TestVerify01 created successfully');
      
      // Step 7: Login as test user
      console.log('\nStep 7: Logging in as TestVerify01...');
      const testAuth = await login('TestVerify01', 'Test@12345');
      
      if (!testAuth) {
        console.log('❌ TestVerify01 login FAILED');
      } else {
        console.log('✅ TestVerify01 login SUCCESS');
        console.log(`   Role: ${testAuth.role}`);
        console.log(`   Permissions: [${testAuth.permissions?.join(', ')}]`);
        
        const expectedPerms = getExpectedPermissions(testAuth.role);
        const missing = expectedPerms.filter(p => !testAuth.permissions?.includes(p));
        const extra = testAuth.permissions?.filter(p => 
          !['product','store','equipment','template','log','staffManager'].includes(p)
        ) || [];
        
        console.log(`\n   Expected: [${expectedPerms.join(', ')}]`);
        if (missing.length === 0) {
          console.log('   ✅ All expected permissions present');
        } else {
          console.log(`   ❌ MISSING permissions: [${missing.join(', ')}]`);
        }
        if (extra.length > 0) {
          console.log('   ℹ️  Extra permissions (raw menu names): ' + extra.length + ' items');
        }
      }
      
      // Step 8: Delete test user
      console.log('\nStep 8: Cleaning up — deleting TestVerify01...');
      const newUsersList = await getAllUsers(adminAuth.token);
      const newList = newUsersList?.userVos || newUsersList?.userRoleStoreList || newUsersList?.list || [];
      const testUserEntry = newList.find((item) => {
        const u = item.user || item;
        return u.account === 'TestVerify01';
      });
      
      if (testUserEntry) {
        const u = testUserEntry.user || testUserEntry;
        const deleteRes = await fetchJson(`${BASE_URL}/users/${u.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${adminAuth.token}` }
        });
        if (deleteRes.success) {
          console.log('✅ Test user deleted successfully');
        } else {
          console.log('⚠️  Could not delete test user — delete manually from Users page');
        }
      }
    } else {
      console.log(`❌ Failed to create test user: ${JSON.stringify(createRes)}`);
    }
  }

  console.log('\n========================================');
  console.log('  Verification Complete');
  console.log('========================================\n');
  
  console.log('SUMMARY — Users and their roles:');
  console.log('─────────────────────────────────────────────────');
  mappedUsers.forEach((u, i) => {
    const expected = getExpectedPermissions(u.roleName);
    console.log(`  ${i+1}. ${u.account} → "${u.roleName}"`);
    console.log(`     Expected sidebar: [${expected.join(', ')}]`);
    console.log(`     → Ask them to log out and back in to get fresh JWT`);
  });
  console.log('');
  console.log('NOTE: To verify existing users (Madeeha, Arsheen etc),');
  console.log('ask them to log out and log back in, then run in browser console:');
  console.log('  JSON.parse(localStorage.getItem("user")).permissions');
}

main().catch(console.error);
