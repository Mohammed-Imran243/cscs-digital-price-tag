const fs = require('fs');
let code = fs.readFileSync('src/pages/Products.tsx', 'utf8');

// 1. Add EmptyState import
if (!code.includes('EmptyState')) {
  code = code.replace(/import \{ Store \} from/, "import { EmptyState } from '../components/common/EmptyState';\nimport { Store } from");
}

// 2. Fix PageHeader
code = code.replace(/title="Product Management"[\s\S]*?titleAr="إدارة المنتجات"/, 'title="Product Management / إدارة المنتجات"\n        titleAr=""');

// 3. Fix Toolbar
const toolbarPattern = /<PageToolbar>[\s\S]*?<\/PageToolbar>/;
const newToolbar = `<PageToolbar>
        <div className="store-selector-wrapper" style={{ width: 'var(--store-selector-width)' }}>
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
        <button className="btn-action btn-action-filter" style={{ padding: '0 12px' }}>
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
        <ActionButtons
          onRefresh={() => fetchProducts()}
          onImport={() => setShowImportExport(true)}
          onExport={() => setShowImportExport(true)}
          onAdd={() => setIsModalOpen(true)}
          addLabel="Add Product"
          addLabelAr="إضافة منتج"
          loading={loading}
          isSelectMode={isSelectMode}
          onCancelSelectMode={() => {
            setIsSelectMode(false);
            setSelectedProductIds([]);
          }}
        />
      </PageToolbar>`;
code = code.replace(toolbarPattern, newToolbar);

// 4. Fix Empty State
const loadingPattern = /\{loading \? \([\s\S]*?\} : products\.length === 0 \? \([\s\S]*?\} : \(/;
const newLoading = `{loading ? (
        <EmptyState type="loading" message="Fetching product data... / جاري جلب بيانات المنتجات..." />
      ) : products.length === 0 ? (
        <EmptyState type="empty" message="No products found in the selected store. / لم يتم العثور على منتجات في المتجر المحدد." />
      ) : (`;
code = code.replace(loadingPattern, newLoading);

fs.writeFileSync('src/pages/Products.tsx', code);
