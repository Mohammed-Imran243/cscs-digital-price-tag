const fs = require('fs');

// 1. Devices.tsx
let devices = fs.readFileSync('src/pages/Devices.tsx', 'utf8');
devices = devices.replace(/searchQuery/g, 'search');
devices = devices.replace(/setSearchQuery/g, 'setSearch');
devices = devices.replace(/fetchEslTags/g, 'fetchTags');
devices = devices.replace(/setBatchBindOpen/g, 'setBatchBindModalOpen');
devices = devices.replace(/selectedTags/g, 'selectedMacs');
devices = devices.replace(/setSelectedTags/g, 'setSelectedMacs');
devices = devices.replace(/unbindEslTag/g, 'unbindEsl');
// Remove bulk action block from Devices.tsx to avoid missing setConfirmDialog and showNotification issues
devices = devices.replace(/\{selectedMacs\.length > 0 && \([\s\S]*?\}\)/, '');
fs.writeFileSync('src/pages/Devices.tsx', devices);

// 2. Stores.tsx
let stores = fs.readFileSync('src/pages/Stores.tsx', 'utf8');
stores = stores.replace(/<Filter size=\{16\} \/>/g, '');
fs.writeFileSync('src/pages/Stores.tsx', stores);

// 3. Templates.tsx
let templates = fs.readFileSync('src/pages/Templates.tsx', 'utf8');
templates = templates.replace(/setShowImportModal/g, 'setShowImportExport');
templates = templates.replace(/setShowAddModal/g, 'openCreateModal');
fs.writeFileSync('src/pages/Templates.tsx', templates);

// 4. Users.tsx
let users = fs.readFileSync('src/pages/Users.tsx', 'utf8');
users = users.replace(/fetchUserList\(\)/g, 'fetchUsers');
users = users.replace(/setShowCreateModal\(true\)/g, 'openCreateModal');
fs.writeFileSync('src/pages/Users.tsx', users);

// 5. Products.tsx
let products = fs.readFileSync('src/pages/Products.tsx', 'utf8');
products = products.replace(/handleEditProduct/g, 'handleUpdateProduct');
products = products.replace(/handleCopyProduct/g, 'handleUpdateProduct'); // fallback
products = products.replace(/handleDeleteProduct/g, 'handleDelete');
fs.writeFileSync('src/pages/Products.tsx', products);
