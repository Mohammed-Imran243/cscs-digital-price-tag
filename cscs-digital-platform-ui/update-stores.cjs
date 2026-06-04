const fs = require('fs');

let code = fs.readFileSync('src/pages/Stores.tsx', 'utf8');

// 1. Add EmptyState import
if (!code.includes('EmptyState')) {
  code = code.replace(/import \{ Store \} from/, "import { EmptyState } from '../components/common/EmptyState';\nimport { Store } from");
}
if (!code.includes('Filter, ')) {
  code = code.replace(/import \{ Search, Plus, MapPin, /g, "import { Search, Plus, MapPin, Filter, ");
}

// 2. Fix PageHeader
code = code.replace(/title="Store Management"[\s\S]*?titleAr="إدارة المتاجر"/, 'title="Store Management / إدارة المتاجر"\n        titleAr=""');

// 3. Fix Toolbar
const toolbarPattern = /<PageToolbar>[\s\S]*?<\/PageToolbar>/;
const newToolbar = `<PageToolbar>
        <button className="btn-action btn-action-filter" style={{ padding: '0 12px' }}>
          <Filter size={18} />
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
        <ActionButtons
          onRefresh={fetchStores}
          onImport={() => setShowImportExport(true)}
          onExport={() => setShowImportExport(true)}
          onAdd={openCreateModal}
          addLabel="Add Store"
          addLabelAr="إضافة متجر"
          loading={loading}
        />
      </PageToolbar>`;
code = code.replace(toolbarPattern, newToolbar);

// 4. Fix Empty State
const loadingPattern = /\{loading \? \([\s\S]*?\} : stores\.length === 0 \? \([\s\S]*?\} : \(/;
const newLoading = `{loading ? (
        <EmptyState type="loading" message="Fetching store data... / جاري جلب بيانات المتاجر..." />
      ) : stores.length === 0 ? (
        <EmptyState type="empty" message="No stores found matching your criteria. / لم يتم العثور على متاجر تطابق معاييرك." />
      ) : (`;
code = code.replace(loadingPattern, newLoading);

fs.writeFileSync('src/pages/Stores.tsx', code);
