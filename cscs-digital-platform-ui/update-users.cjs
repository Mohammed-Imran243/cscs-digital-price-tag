const fs = require('fs');
let code = fs.readFileSync('src/pages/Users.tsx', 'utf8');

// 1. Add EmptyState import
if (!code.includes('EmptyState')) {
  code = code.replace(/import \{ Search, Plus, /g, "import { EmptyState } from '../components/common/EmptyState';\nimport { Search, Plus, Filter, ");
}

// 2. Fix PageHeader
code = code.replace(/title="User Management"[\s\S]*?titleAr="إدارة المستخدمين"/, 'title="User Management / إدارة المستخدمين"\n        titleAr=""');

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
            placeholder="Search users... / ابحث عن المستخدمين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ActionButtons
          onRefresh={fetchUsers}
          onAdd={() => openCreateModal()}
          addLabel="Add User"
          addLabelAr="إضافة مستخدم"
          loading={loading}
        />
      </PageToolbar>`;
code = code.replace(toolbarPattern, newToolbar);

// 4. Fix Empty State
const loadingPattern = /\{loading \? \([\s\S]*?\} : users\.length === 0 \? \([\s\S]*?\} : \(/;
const newLoading = `{loading ? (
        <EmptyState type="loading" message="Fetching users data... / جاري جلب بيانات المستخدمين..." />
      ) : users.length === 0 ? (
        <EmptyState type="empty" message="No users found matching your criteria. / لم يتم العثور على مستخدمين تطابق معاييرك." />
      ) : (`;
code = code.replace(loadingPattern, newLoading);

fs.writeFileSync('src/pages/Users.tsx', code);
