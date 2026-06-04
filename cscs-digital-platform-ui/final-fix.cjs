const fs = require('fs');

let products = fs.readFileSync('src/pages/Products.tsx', 'utf8');
products = products.replace('// EDIT PRODUCT', '  const handleEditProduct = (product: Product) => { openEditProductModal(product); };\n  const handleCopyProduct = (product: Product) => { openEditProductModal(product); };\n  const handleDeleteProduct = (product: Product) => { handleDeleteStoreOnly(product); };\n\n  // EDIT PRODUCT');
fs.writeFileSync('src/pages/Products.tsx', products);

let stores = fs.readFileSync('src/pages/Stores.tsx', 'utf8');
stores = stores.replace('<Filter size={18} />', '');
fs.writeFileSync('src/pages/Stores.tsx', stores);

let templates = fs.readFileSync('src/pages/Templates.tsx', 'utf8');
templates = templates.replace(/setShowImportExport/g, 'setShowTemplateImportExport');
templates = templates.replace(/onAdd=\{openCreateModal\}/g, 'onAdd={() => setShowAddModal(true)}');
fs.writeFileSync('src/pages/Templates.tsx', templates);

let users = fs.readFileSync('src/pages/Users.tsx', 'utf8');
users = users.replace(/onRefresh=\{\(\) => fetchUsers\}/g, 'onRefresh={fetchData}');
users = users.replace(/onAdd=\{\(\) => openCreateModal\(\)\}/g, 'onAdd={() => setIsUserModalOpen(true)}');
fs.writeFileSync('src/pages/Users.tsx', users);
