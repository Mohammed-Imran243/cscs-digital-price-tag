const fs = require('fs');
let code = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

// 1. Add EmptyState import
if (!code.includes('EmptyState')) {
  code = code.replace(/import \{ Store \} from/, "import { EmptyState } from '../components/common/EmptyState';\nimport { Store } from");
}

// 2. Fix PageHeader
code = code.replace(/title="Template Management"[\s\S]*?titleAr="إدارة القوالب"/, 'title="Store Templates / قوالب المتجر"\n        titleAr=""');

// 3. Fix Toolbar
const toolbarPattern = /<PageToolbar>[\s\S]*?<\/PageToolbar>/;
const newToolbar = `<PageToolbar>
        <button className="btn-action btn-action-filter" style={{ padding: '0 12px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
        </button>
        <div className="global-search-bar" style={{ flex: 1, minWidth: 'var(--search-min-width)' }}>
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Search templates... / ابحث عن القوالب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ActionButtons
          onRefresh={fetchTemplates}
          onImport={() => setShowImportExport(true)}
          onExport={() => setShowImportExport(true)}
          onAdd={openCreateModal}
          addLabel="Add Store Template"
          addLabelAr="إضافة قالب متجر"
          loading={loading}
        />
      </PageToolbar>`;
code = code.replace(toolbarPattern, newToolbar);

// 4. Fix Empty State
const loadingPattern = /\{loading \? \([\s\S]*?\} : templates\.length === 0 \? \([\s\S]*?\} : \(/;
const newLoading = `{loading ? (
        <EmptyState type="loading" message="Fetching template data... / جاري جلب بيانات القوالب..." />
      ) : templates.length === 0 ? (
        <EmptyState type="empty" message="No templates found matching your criteria. / لم يتم العثور على قوالب تطابق معاييرك." />
      ) : (`;
code = code.replace(loadingPattern, newLoading);

fs.writeFileSync('src/pages/Templates.tsx', code);
