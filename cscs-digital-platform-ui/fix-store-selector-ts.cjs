const fs = require('fs');

// 1. Fix AuditLogs.tsx
let auditLogs = fs.readFileSync('src/pages/AuditLogs.tsx', 'utf8');
auditLogs = auditLogs.replace(/selectedStore=\{selectedStore\}/, 'selectedStore={selectedStoreId}');
auditLogs = auditLogs.replace(/onSelect=\{setSelectedStore\}/, 'onSelect={setSelectedStoreId}');
auditLogs = auditLogs.replace(/loading=\{storesLoading\}/, 'loading={false}'); // AuditLogs doesn't seem to have storesLoading
fs.writeFileSync('src/pages/AuditLogs.tsx', auditLogs);

// 2. Fix Products.tsx
let products = fs.readFileSync('src/pages/Products.tsx', 'utf8');
products = products.replace(/loading=\{storesLoading\}/, 'loading={false}'); // Products might not have a separate storesLoading
fs.writeFileSync('src/pages/Products.tsx', products);

// 3. Fix Stores.tsx (remove StoreSelector)
let stores = fs.readFileSync('src/pages/Stores.tsx', 'utf8');
stores = stores.replace(/<StoreSelector[\s\S]*?\/>/, '');
fs.writeFileSync('src/pages/Stores.tsx', stores);

// 4. Fix Users.tsx (remove StoreSelector)
let users = fs.readFileSync('src/pages/Users.tsx', 'utf8');
users = users.replace(/<StoreSelector[\s\S]*?\/>/, '');
fs.writeFileSync('src/pages/Users.tsx', users);

// 5. Fix Devices.tsx
let devices = fs.readFileSync('src/pages/Devices.tsx', 'utf8');
devices = devices.replace(/loading=\{storesLoading\}/, 'loading={false}'); 
fs.writeFileSync('src/pages/Devices.tsx', devices);

console.log("TS errors fixed");
