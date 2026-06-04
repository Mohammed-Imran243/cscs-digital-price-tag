const fs = require('fs');
let code = fs.readFileSync('src/pages/Products.tsx', 'utf8');

// 1. Add copy icon import
code = code.replace(/Trash2 } from 'lucide-react';/, "Trash2, Copy } from 'lucide-react';");

// 2. Add handleCopyProduct function
const copyFn = `  const handleCopyProduct = (product: Product) => {
    setNewProduct({
      productCode: '',
      barCode: '',
      itemTitle: product.itemName || '',
      price: product.price ? String(product.price) : '',
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      vipPrice: (product as any).vipPrice ? String((product as any).vipPrice) : '',
      unit: product.unit || '1PCS',
      spec: product.spec || '',
      productLabel: product.productLabel || '',
      origin: product.origin || '',
      attrCategory: product.attrCategory || '',
      attrName: product.attrName || '',
      storeId: selectedStore,
    });
    setIsModalOpen(true);
    showNotification('Product copied. Please set a new Barcode before saving.', 'success');
  };
`;
if (!code.includes('handleCopyProduct')) {
    code = code.replace(/const handleCloseModal =/, copyFn + '\n  const handleCloseModal =');
}

// 3. Update Toolbar to have Filter and add Bulk Actions
const toolbarStrStart = '<PageToolbar>';
const toolbarStrEnd = '</PageToolbar>';
const toolbarIndex = code.indexOf(toolbarStrStart);
const toolbarEndIndex = code.indexOf(toolbarStrEnd, toolbarIndex);

if (toolbarIndex !== -1 && toolbarEndIndex !== -1) {
  const newToolbar = `<PageToolbar>
        <div style={{ display: 'flex', gap: '16px', flex: 1, alignItems: 'center' }}>
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
          <div className="global-search-bar">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Search products... / ابحث عن المنتجات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <button className="btn-action btn-action-slate">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            Filter
          </button>
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
      </PageToolbar>

      {selectedProductIds.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'var(--glass-card)', borderBottom: '1px solid var(--glass-border)', margin: '0 24px 20px', borderRadius: '12px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <button className="btn-action btn-action-slate" style={{ background: 'var(--bg-secondary)' }}>
                Bulk Actions <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
             </button>
             <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
               {selectedProductIds.length} Products Selected / {selectedProductIds.length} منتجات محددة
             </span>
           </div>
           <div style={{ display: 'flex', gap: '12px' }}>
             <button 
                className="btn-action btn-action-orange" 
                onClick={() => setShowImportExport(true)}
              >
                Export Selected / تصدير المحدد
              </button>
              <button 
                className="btn-action btn-action-red" 
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Delete Selected Products / حذف المنتجات المحددة',
                    message: \`Are you sure you want to delete \${selectedProductIds.length} products from this store? / هل أنت متأكد من حذف \${selectedProductIds.length} منتجات من هذا المتجر؟\`,
                    onConfirm: async () => {
                      setLoading(true);
                      try {
                        for (const id of selectedProductIds) {
                          const product = products.find(p => p.id === id);
                          if (product) {
                            await deleteProductFromStore(product.id, selectedStore, product.barcode);
                          }
                        }
                        showNotification('Selected products deleted successfully / تم حذف المنتجات المحددة بنجاح', 'success');
                        setSelectedProductIds([]);
                        setIsSelectMode(false);
                        setTimeout(() => fetchProducts(), 2000);
                      } catch (err) {
                        showNotification(\`Failed to delete selected products\`, 'error');
                      } finally {
                        setLoading(false);
                      }
                    }
                  });
                }}
              >
                <Trash2 size={16} />
                Delete Selected / حذف المحدد
              </button>
              <button 
                className="btn-action btn-action-red" 
                onClick={() => {
                   setConfirmDialog({
                    isOpen: true,
                    title: 'Delete All Products / حذف كل المنتجات',
                    message: \`Delete \${products.length} products from \${stores.find(s => s.storeId === selectedStore)?.storeName}? This cannot be undone. / هل أنت متأكد من حذف كل المنتجات؟\`,
                    onConfirm: async () => {
                      setLoading(true);
                      try {
                        await deleteAllProductsFromStore(selectedStore);
                        showNotification('All products deleted successfully', 'success');
                        setSelectedProductIds([]);
                        setIsSelectMode(false);
                        setTimeout(() => fetchProducts(), 2000);
                      } catch (err) {
                        showNotification(\`Failed to delete all products\`, 'error');
                      } finally {
                        setLoading(false);
                      }
                    }
                  });
                }}
              >
                <Trash2 size={16} />
                Delete All Products / حذف الكل
              </button>
           </div>
        </div>
      )}`;
  code = code.substring(0, toolbarIndex) + newToolbar + code.substring(toolbarEndIndex + toolbarStrEnd.length);
}

fs.writeFileSync('src/pages/Products.tsx', code);
