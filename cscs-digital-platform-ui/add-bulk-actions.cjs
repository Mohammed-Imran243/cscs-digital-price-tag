const fs = require('fs');
let c = fs.readFileSync('src/pages/Products.tsx', 'utf8');

// 1. Add showBulkMenu state
const stateIdx = c.indexOf('const [isSelectMode, setIsSelectMode] = useState(false);');
if (stateIdx !== -1 && !c.includes('const [showBulkMenu')) {
  c = c.slice(0, stateIdx) + 'const [showBulkMenu, setShowBulkMenu] = useState(false);\n  ' + c.slice(stateIdx);
}

// 2. Add ChevronDown, Download to lucide-react imports if not there
if (c.includes('lucide-react')) {
  if (!c.includes('ChevronDown')) c = c.replace('Search,', 'Search, ChevronDown,');
  if (!c.includes('Download')) c = c.replace('Search,', 'Search, Download,');
}

// 3. Replace the existing conditional bulk actions bar with the always-visible dropdown bulk actions bar
const bulkBarRegex = /\{selectedProductIds\.length > 0 && \([\s\S]*?\}\s*\)\}/m;
const newBulkBar = `
      {/* Always-visible Bulk Actions Bar */}
      <div className="bulk-actions-bar glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'var(--glass-card)', borderBottom: '1px solid var(--glass-border)', margin: '0 24px 20px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
          <div className="bulk-dropdown-container">
            <button 
              className="btn-action btn-action-slate" 
              onClick={() => setShowBulkMenu(!showBulkMenu)}
              style={{ background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              Bulk Actions <ChevronDown size={14} />
            </button>
            {showBulkMenu && (
              <div className="dropdown-menu glass-card" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', zIndex: 100, minWidth: '180px', display: 'flex', flexDirection: 'column', padding: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                 <button 
                   className="dropdown-item" 
                   onClick={() => { 
                     setShowBulkMenu(false); 
                     if (selectedProductIds.length === 0) return;
                     setConfirmDialog({
                       isOpen: true,
                       title: 'Delete Selected Products / حذف المنتجات المحددة',
                       message: \`Are you sure you want to delete \${selectedProductIds.length} products from this store? / هل أنت متأكد من حذف \${selectedProductIds.length} منتجات من هذا المتجر؟\`,
                       onConfirm: async () => {
                         setLoading(true);
                         try {
                           for (const id of selectedProductIds) {
                             const product = products.find(p => p.id === id);
                             if (product) await deleteProductFromStore(product.id, selectedStore, product.barcode);
                           }
                           showNotification('Selected products deleted successfully / تم حذف المنتجات المحددة بنجاح', 'success');
                           setSelectedProductIds([]);
                           setTimeout(() => fetchProducts(), 2000);
                         } catch (err) {
                           showNotification('Failed to delete selected products', 'error');
                         } finally {
                           setLoading(false);
                         }
                       }
                     });
                   }}
                   disabled={selectedProductIds.length === 0}
                   style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'transparent', border: 'none', color: selectedProductIds.length === 0 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: selectedProductIds.length === 0 ? 'not-allowed' : 'pointer', textAlign: 'left', width: '100%' }}
                 >
                   <Trash2 size={14} /> Delete Selected
                 </button>
                 
                 <button 
                   className="dropdown-item" 
                   onClick={() => { 
                     setShowBulkMenu(false); 
                     setShowImportExport(true); 
                   }}
                   disabled={selectedProductIds.length === 0}
                   style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'transparent', border: 'none', color: selectedProductIds.length === 0 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: selectedProductIds.length === 0 ? 'not-allowed' : 'pointer', textAlign: 'left', width: '100%' }}
                 >
                   <Download size={14} /> Export Selected
                 </button>
                 
                 <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 0' }}></div>
                 
                 <button 
                   className="dropdown-item danger" 
                   onClick={() => { 
                     setShowBulkMenu(false); 
                     handleDeleteAllFromStore();
                   }}
                   style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--danger-color, #ef4444)', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                 >
                   <Trash2 size={14} /> Delete All Products
                 </button>
              </div>
            )}
          </div>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {selectedProductIds.length} selected
          </span>
        </div>
      </div>
`;
if (c.match(bulkBarRegex)) {
  c = c.replace(bulkBarRegex, newBulkBar);
} else {
  // if it's missing entirely, insert it after PageToolbar
  const tbIdx = c.indexOf('</PageToolbar>');
  if (tbIdx !== -1) {
    c = c.slice(0, tbIdx + 14) + '\n' + newBulkBar + c.slice(tbIdx + 14);
  }
}

// 4. Remove {isSelectMode && ...} wrapper around checkbox
c = c.replace(/\{isSelectMode && \(\s*<input\s*type="checkbox"[\s\S]*?zIndex: 10\s*\}\}\s*\/>\s*\)\}/gm, (match) => {
  return match.replace('{isSelectMode && (\n              ', '').replace(/\s*\)\}$/, '');
});

// 5. Remove the Delete button from individual cards to fulfill "move destructive actions into Bulk Actions"
c = c.replace(/<button \s*className="card-action-btn delete-action" \s*onClick=\{\(\) => handleDeleteStoreOnly\(product\)\}\s*>[\s\S]*?<Trash2 size=\{14\} \/> Delete\s*<\/button>/m, '');

fs.writeFileSync('src/pages/Products.tsx', c);
console.log('Restored Bulk Actions workflow successfully');
