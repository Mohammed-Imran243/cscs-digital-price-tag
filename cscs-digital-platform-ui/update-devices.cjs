const fs = require('fs');
let code = fs.readFileSync('src/pages/Devices.tsx', 'utf8');

// 1. Add EmptyState import
if (!code.includes('EmptyState')) {
  code = code.replace(/import \{ Store \} from/, "import { EmptyState } from '../components/common/EmptyState';\nimport { Store } from");
}

// 2. Fix PageHeader
code = code.replace(/title="Device Management"[\s\S]*?titleAr="إدارة الأجهزة"/, 'title="Device Management / إدارة الأجهزة"\n        titleAr=""');

// 3. Fix Toolbar
const toolbarPattern = /<PageToolbar>[\s\S]*?<\/PageToolbar>/;
const newToolbar = `<PageToolbar>
        <div className="store-selector-wrapper" style={{ width: 'var(--store-selector-width)' }}>
          <StoreIcon size={16} className="text-muted" />
          <select 
            value={selectedStoreId} 
            onChange={(e) => setSelectedStoreId(e.target.value)}
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
            placeholder="Search tags (MAC, item title)... / ابحث عن البطاقات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ActionButtons
          onRefresh={fetchTags}
          onImport={() => setShowImportExport(true)}
          onExport={() => setShowImportExport(true)}
        >
          <button className="btn-action btn-action-batch" onClick={() => setBatchBindModalOpen(true)}>
            <ListChecks size={18} />
            <div className="btn-label">
              <span>Batch Bind</span>
              <span>ربط مجمع</span>
            </div>
          </button>
        </ActionButtons>
      </PageToolbar>
      
      {selectedMacs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)', margin: '0 24px 20px', borderRadius: '12px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <button className="btn-action btn-action-slate" style={{ background: 'var(--bg-secondary)' }}>
                Bulk Actions <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
             </button>
             <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
               {selectedMacs.length} Devices Selected / {selectedMacs.length} أجهزة محددة
             </span>
           </div>
           <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-action btn-action-unbind" 
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Unbind Selected Devices / إلغاء ربط الأجهزة المحددة',
                    message: \`Are you sure you want to unbind \${selectedMacs.length} devices? / هل أنت متأكد من إلغاء ربط \${selectedMacs.length} أجهزة؟\`,
                    onConfirm: async () => {
                      setLoading(true);
                      try {
                        for (const mac of selectedMacs) {
                          await deviceService.unbindTag(mac);
                        }
                        showNotification('Selected devices unbound successfully / تم إلغاء ربط الأجهزة المحددة بنجاح', 'success');
                        setSelectedMacs([]);
                        fetchTags();
                      } catch (err) {
                        showNotification('Failed to unbind selected devices', 'error');
                      } finally {
                        setLoading(false);
                      }
                    }
                  });
                }}
              >
                <Unlink size={16} />
                Unbind Selected
              </button>
           </div>
        </div>
      )}`;
code = code.replace(toolbarPattern, newToolbar);

// 4. Fix Empty State
const loadingPattern = /\{loading \? \([\s\S]*?\} : tags\.length === 0 \? \([\s\S]*?\} : \(/;
const newLoading = `{loading ? (
        <EmptyState type="loading" message="Fetching device data... / جاري جلب بيانات الأجهزة..." />
      ) : tags.length === 0 ? (
        <EmptyState type="empty" message="No devices found matching your criteria. / لم يتم العثور على أجهزة تطابق معاييرك." />
      ) : (`;
code = code.replace(loadingPattern, newLoading);

fs.writeFileSync('src/pages/Devices.tsx', code);
