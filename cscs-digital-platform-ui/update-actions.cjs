const fs = require('fs');

let products = fs.readFileSync('src/pages/Products.tsx', 'utf8');

// Replace card actions
products = products.replace(/<div className="store-card-actions"[^>]*>[\s\S]*?<\/div>/, `<div className="table-actions" style={{ paddingTop: '10px', borderTop: '1px solid var(--glass-border)', marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="icon-action" onClick={() => openEditProductModal(product)} title="Edit Product">
                  <Edit2 size={18} />
                </button>
                <button className="icon-action" onClick={() => openEditProductModal(product)} title="Copy Product">
                  <Copy size={18} />
                </button>
                <button className="icon-action danger" onClick={() => handleDeleteStoreOnly(product)} title="Delete Product">
                  <Trash2 size={18} />
                </button>
              </div>`);

fs.writeFileSync('src/pages/Products.tsx', products);

let stores = fs.readFileSync('src/pages/Stores.tsx', 'utf8');

// Replace card actions
stores = stores.replace(/<div className="store-card-actions"[^>]*>[\s\S]*?<\/div>/, `<div className="table-actions" style={{ paddingTop: '10px', borderTop: '1px solid var(--glass-border)', marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button className="icon-action" onClick={() => openEditModal(store)} title="Edit Store">
                    <Edit2 size={18} />
                  </button>
                  <button className="icon-action" onClick={() => handleDisable(store.storeId)} title="Disable Store">
                    <AlertTriangle size={18} />
                  </button>
                  <button className="icon-action danger" onClick={() => setConfirmDialog({ isOpen: true, title: 'Delete Store / حذف المتجر', message: 'Are you sure you want to delete this store? / هل أنت متأكد أنك تريد حذف هذا المتجر؟', onConfirm: () => handleDelete(store.storeId) })} title="Delete Store">
                    <Trash2 size={18} />
                  </button>
                </div>`);

// Replace Toolbar
const oldToolbarStores = /<PageToolbar>[\s\S]*?<ActionButtons/m;
const newToolbarStores = `<PageToolbar>
        <div style={{ display: 'flex', gap: '16px', flex: 1, alignItems: 'center' }}>
          <div className="store-selector-wrapper">
            <StoreIcon size={16} className="text-muted" />
            <select className="glass-select">
              <option value="">Select a Store... / اختر متجراً...</option>
            </select>
          </div>
          <button className="btn-action btn-action-filter">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </button>
          <div className="global-search-bar" style={{ flex: 1, minWidth: 'var(--search-min-width)' }}>
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Search stores... / ابحث عن المتاجر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ActionButtons`;

stores = stores.replace(oldToolbarStores, newToolbarStores);
fs.writeFileSync('src/pages/Stores.tsx', stores);

// Products Page Toolbar Fix
const oldToolbarProducts = /<div style=\{\{ display: 'flex', gap: '16px', flex: 1, alignItems: 'center' \}\}>[\s\S]*?<ActionButtons/m;
const newToolbarProducts = `<div style={{ display: 'flex', gap: '16px', flex: 1, alignItems: 'center' }}>
          <div className="store-selector-wrapper">
            <StoreIcon size={16} className="text-muted" />
            <select 
              value={selectedStore} 
              onChange={(e) => setSelectedStore(e.target.value)}
              className="glass-select"
            >
              <option value="">Select a Store... / اختر متجراً...</option>
              {stores.map(store => (
                <option key={store.storeId} value={store.storeId}>
                  {store.storeName} {store.externalStoreId ? \`(\${store.externalStoreId})\` : ''}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-action btn-action-filter">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </button>
          <div className="global-search-bar" style={{ flex: 1, minWidth: 'var(--search-min-width)' }}>
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Search products... / ابحث عن المنتجات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <ActionButtons`;
products = products.replace(oldToolbarProducts, newToolbarProducts);
fs.writeFileSync('src/pages/Products.tsx', products);
