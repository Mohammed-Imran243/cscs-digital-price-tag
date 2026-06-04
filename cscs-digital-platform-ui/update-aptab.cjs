const fs = require('fs');
let code = fs.readFileSync('src/components/devices/ApTab.tsx', 'utf8');

// 1. Add missing imports
if (!code.includes('EmptyState')) {
  code = code.replace(/import \{ ApStation \} from/, "import { EmptyState } from '../common/EmptyState';\nimport { PageToolbar } from '../common/PageToolbar';\nimport { ActionButtons } from '../common/ActionButtons';\nimport { ApStation } from");
}

// 3. Fix Toolbar
const toolbarPattern = /<div className="ap-toolbar"[\s\S]*?<\/div>\s*<\/div>/;
const newToolbar = `<PageToolbar>
        <div className="store-selector-wrapper" style={{ width: 'var(--store-selector-width)' }}>
          <select 
            value={selectedStoreId} 
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="glass-select"
          >
            <option value="">Select a Store... / اختر متجراً...</option>
            {stores.map(store => (
              <option key={store.storeId} value={store.storeId}>
                {store.storeName}
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
            placeholder="Search AP stations... / ابحث عن محطات البث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ActionButtons
          onRefresh={fetchAps}
          onAdd={openCreateModal}
          addLabel="Add AP"
          addLabelAr="إضافة محطة بث"
          loading={loading}
        />
      </PageToolbar>`;
code = code.replace(toolbarPattern, newToolbar);

// 4. Fix Empty State
const loadingPattern = /\{loading \? \([\s\S]*?\} : aps\.length === 0 \? \([\s\S]*?\} : \(/;
const newLoading = `{loading ? (
        <EmptyState type="loading" message="Fetching AP stations... / جاري جلب محطات البث..." />
      ) : aps.length === 0 ? (
        <EmptyState type="empty" message="No AP stations found matching your criteria. / لم يتم العثور على محطات بث." />
      ) : (`;
code = code.replace(loadingPattern, newLoading);

fs.writeFileSync('src/components/devices/ApTab.tsx', code);
