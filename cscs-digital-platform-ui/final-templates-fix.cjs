const fs = require('fs');
let content = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

// 1. Change default tab to 'store' if it was 'merchant'
content = content.replace("const activeMenuTab = query.get('tab') || 'merchant';", "const activeMenuTab = query.get('tab') || 'store';");

// 2. Remove Merchant Template text from breadcrumb
content = content.replace("{activeMenuTab === 'merchant' && 'Merchant Template / قوالب التاجر'}", "");

// 3. Add the Tabs before PageToolbar
const navigateTabsHtml = `
      <div className="workspace-tabs-container" style={{ padding: '0 24px', marginBottom: '16px' }}>
        <div className="workspace-tabs glass-card" style={{ display: 'flex', gap: '8px', padding: '4px', borderRadius: '12px' }}>
          <button 
            style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeMenuTab === 'store' ? 'var(--primary-color)' : 'transparent', color: activeMenuTab === 'store' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
            onClick={() => navigate('/templates?tab=store')}
          >
            Store Template / قوالب المتجر
          </button>
          <button 
            style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeMenuTab === 'store_icon' ? 'var(--primary-color)' : 'transparent', color: activeMenuTab === 'store_icon' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
            onClick={() => navigate('/templates?tab=store_icon')}
          >
            Store Icon / أيقونة المتجر
          </button>
          <button 
            style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeMenuTab === 'properties' ? 'var(--primary-color)' : 'transparent', color: activeMenuTab === 'properties' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
            onClick={() => navigate('/templates?tab=properties')}
          >
            Template Properties / خصائص القالب
          </button>
        </div>
      </div>
      <PageToolbar>`;

content = content.replace('<PageToolbar>', navigateTabsHtml);

// 4. Update the PageToolbar contents to include Store Selector and standardized layout
const oldToolbarRegex = /<PageToolbar>[\s\S]*?<\/PageToolbar>/;
const newToolbarHtml = `<PageToolbar>
        <div style={{ display: 'flex', gap: '16px', flex: 1, alignItems: 'center' }}>
          {(activeMenuTab === 'store' || activeMenuTab === 'store_icon') && (
            <div className="store-selector-wrapper" style={{ minWidth: 'var(--store-selector-width)' }}>
              <StoreIcon size={16} className="text-muted" />
              {storesLoading ? (
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading...</span>
              ) : (
                <select 
                  value={selectedStore} 
                  onChange={e => setSelectedStore(e.target.value)}
                  className="glass-select"
                >
                  <option value="">Select a Store... / اختر متجراً</option>
                  {stores.map(s => (
                    <option key={s.storeId} value={s.storeId}>
                      {s.storeName} {s.externalStoreId ? \`(\${s.externalStoreId})\` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          
          <button className="btn-action btn-action-filter" style={{ padding: '0 12px' }} onClick={() => setShowFilters(!showFilters)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </button>
          
          <div className="global-search-bar" style={{ flex: 1, minWidth: 'var(--search-min-width)' }}>
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Search templates... / ابحث عن القوالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <ActionButtons
          onRefresh={() => {}}
          onImport={() => setShowTemplateImportExport(true)}
          onExport={() => setShowTemplateImportExport(true)}
          onAdd={() => setIsTemplateModalOpen(true)}
          addLabel="Add Store Template"
          addLabelAr="إضافة قالب متجر"
          loading={loading}
        />
      </PageToolbar>`;

content = content.replace(oldToolbarRegex, newToolbarHtml);

// 5. Remove SECTION 1: MERCHANT TEMPLATES entirely
const merchantSectionRegex = /\{\/\* ================= SECTION 1: MERCHANT TEMPLATES ================= \*\/\}[\s\S]*?(?=\{\/\* ================= SECTION 2: STORE TEMPLATES ================= \*\/)/;
content = content.replace(merchantSectionRegex, '');

// 6. Remove duplicate Add Store Template button from store section
const storeActionsRegex = /<div className="actions-row">\s*<button className="btn-primary sm-btn" onClick=\{\(\) => setIsTemplateModalOpen\(true\)\}>\s*<Plus size=\{16\} \/> New Store Template \/ قالب متجر جديد\s*<\/button>\s*<\/div>/;
content = content.replace(storeActionsRegex, '');

fs.writeFileSync('src/pages/Templates.tsx', content);
