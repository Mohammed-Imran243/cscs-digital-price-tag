const fs = require('fs');

let content = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

// =====================================================
// FIX 1: Add tabs right after PageHeader breadcrumb, before PageToolbar
// =====================================================

const tabsHtml = `
      {/* Top Navigation Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--glass-card)', borderRadius: '12px', padding: '4px', border: '1px solid var(--glass-border)' }}>
        <button
          onClick={() => navigate('/templates?tab=store')}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s',
            background: activeMenuTab === 'store' ? 'var(--primary-color)' : 'transparent',
            color: activeMenuTab === 'store' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          Store Template / قوالب المتجر
        </button>
        <button
          onClick={() => navigate('/templates?tab=store_icon')}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s',
            background: activeMenuTab === 'store_icon' ? 'var(--primary-color)' : 'transparent',
            color: activeMenuTab === 'store_icon' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          Store Icon / أيقونة المتجر
        </button>
        <button
          onClick={() => navigate('/templates?tab=properties')}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s',
            background: activeMenuTab === 'properties' ? 'var(--primary-color)' : 'transparent',
            color: activeMenuTab === 'properties' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          Template Properties / خصائص القالب
        </button>
      </div>
      <PageToolbar>`;

// Replace <PageToolbar> with tabs + PageToolbar
if (!content.includes('Store Template / قوالب المتجر\n        </button>')) {
  content = content.replace('<PageToolbar>', tabsHtml);
  console.log('FIX 1: Added top navigation tabs');
} else {
  console.log('FIX 1: Tabs already present');
}

// =====================================================
// FIX 2: Replace old store-selector-wrapper with the StoreSelector component
// =====================================================

// Check imports - add StoreSelector if missing
if (!content.includes("import { StoreSelector }")) {
  // Find a good import location
  content = content.replace(
    "import { ActionButtons,",
    "import { ActionButtons, StoreSelector,"
  );
  // If that didn't work, try another pattern
  if (!content.includes("StoreSelector,")) {
    content = content.replace(
      "import { ActionButtons",
      "import { StoreSelector } from '../components/common/StoreSelector';\nimport { ActionButtons"
    );
  }
  console.log('FIX 2: Added StoreSelector import');
}

// Replace old native select store wrapper with the custom StoreSelector component
const oldStoreSelectorBlock = `          {(activeMenuTab === 'store' || activeMenuTab === 'store_icon') && (
            <div className="store-selector-wrapper">
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
          )}`;

const newStoreSelectorBlock = `          {(activeMenuTab === 'store' || activeMenuTab === 'store_icon') && (
            <StoreSelector
              stores={stores}
              selectedStore={selectedStore}
              onSelect={setSelectedStore}
              loading={storesLoading}
            />
          )}`;

if (content.includes('store-selector-wrapper')) {
  // Use regex to match the entire block regardless of exact whitespace
  const regex = /\{(\(activeMenuTab === 'store' \|\| activeMenuTab === 'store_icon'\) &&\s*\([\s\S]*?<\/div>\s*\)\s*\)}\s*)/;
  if (regex.test(content)) {
    content = content.replace(regex, newStoreSelectorBlock + '\n          ');
    console.log('FIX 2: Replaced store-selector-wrapper with StoreSelector component (regex)');
  } else {
    console.log('FIX 2: Could not replace via regex, store-selector-wrapper still present');
  }
} else {
  console.log('FIX 2: No old store-selector-wrapper found');
}

// =====================================================
// FIX 3: Wire up ActionButtons onAdd for Store Template tab only
// =====================================================
// Current: no onAdd
// Required: onAdd only visible on store tab → pass conditionally
const oldActionButtons = `        <ActionButtons
          onRefresh={fetchTemplatesList}
          onImport={() => setShowTemplateImportExport(true)}
          onExport={() => setShowTemplateImportExport(true)}
          loading={loading}
        />`;

const newActionButtons = `        <ActionButtons
          onRefresh={() => {
            if (activeMenuTab === 'store') fetchTemplatesList();
            else if (activeMenuTab === 'store_icon') fetchStoreIconsList();
          }}
          onImport={activeMenuTab === 'store' ? () => setShowTemplateImportExport(true) : undefined}
          onExport={activeMenuTab === 'store' ? () => setShowTemplateImportExport(true) : undefined}
          onAdd={activeMenuTab === 'store' ? () => setIsTemplateModalOpen(true) : undefined}
          addLabel="Add Store Template"
          addLabelAr="إضافة قالب متجر"
          loading={loading}
        />`;

if (content.includes(oldActionButtons)) {
  content = content.replace(oldActionButtons, newActionButtons);
  console.log('FIX 3: Wired ActionButtons with onAdd for Store Template tab');
} else {
  // Try to handle CRLF
  console.log('FIX 3: Could not find exact ActionButtons block - trying line by line...');
  content = content.replace(
    'onRefresh={fetchTemplatesList}',
    `onRefresh={() => {\n            if (activeMenuTab === 'store') fetchTemplatesList();\n            else if (activeMenuTab === 'store_icon') fetchStoreIconsList();\n          }}`
  );
  // Add onAdd before loading
  content = content.replace(
    /(\s*onImport=\{[^}]+\}\s*onExport=\{[^}]+\}\s*)(loading=\{loading\}\s*\/>)/,
    `$1onAdd={activeMenuTab === 'store' ? () => setIsTemplateModalOpen(true) : undefined}\n          addLabel="Add Store Template"\n          addLabelAr="إضافة قالب متجر"\n          $2`
  );
  console.log('FIX 3: Applied partial fix');
}

fs.writeFileSync('src/pages/Templates.tsx', content);
console.log('\nAll fixes applied to Templates.tsx!');
