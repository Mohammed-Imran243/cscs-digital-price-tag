const fs = require('fs');
let content = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

// 1. Add the tabs under the PageHeader, before PageToolbar
const tabsHtml = `
      <div className="workspace-tabs-container">
        <div className="workspace-tabs">
          <button 
            className={\`workspace-tab \${activeMenuTab === 'merchant' ? 'active' : ''}\`}
            onClick={() => {
              const url = new URL(window.location);
              url.searchParams.set('tab', 'merchant');
              window.history.pushState({}, '', url);
              // Force a re-render or state update if needed, but since it reads from query...
              // We can just reload or dispatch a popstate event
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
          >
            Merchant Template / قوالب التاجر
          </button>
          <button 
            className={\`workspace-tab \${activeMenuTab === 'store' ? 'active' : ''}\`}
            onClick={() => {
              const url = new URL(window.location);
              url.searchParams.set('tab', 'store');
              window.history.pushState({}, '', url);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
          >
            Store Template / قوالب المتجر
          </button>
          <button 
            className={\`workspace-tab \${activeMenuTab === 'properties' ? 'active' : ''}\`}
            onClick={() => {
              const url = new URL(window.location);
              url.searchParams.set('tab', 'properties');
              window.history.pushState({}, '', url);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
          >
            Template Properties / خصائص القالب
          </button>
        </div>
      </div>
      <PageToolbar>`;

// Replace PageToolbar with tabsHtml + PageToolbar
content = content.replace('<PageToolbar>', tabsHtml);

// Since React Router might not re-render on pushState with just popstate dispatch, 
// let's actually just use navigation by wrapping it with Link or using navigate.
// But we don't have navigate handy in the string replace. 
// Actually, `useLocation` will trigger a re-render if we use `navigate`. Let's import `useNavigate` if it's there.
// `useNavigate` is already imported in Templates.tsx: `import { useNavigate, useLocation } from 'react-router-dom';`
// And `navigate = useNavigate();` is there.
const navigateTabsHtml = `
      <div className="workspace-tabs-container" style={{ padding: '0 24px', marginBottom: '16px' }}>
        <div className="workspace-tabs glass-card" style={{ display: 'flex', gap: '8px', padding: '4px', borderRadius: '12px' }}>
          <button 
            style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeMenuTab === 'merchant' ? 'var(--primary-color)' : 'transparent', color: activeMenuTab === 'merchant' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
            onClick={() => navigate('/templates?tab=merchant')}
          >
            Merchant Template / قوالب التاجر
          </button>
          <button 
            style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeMenuTab === 'store' ? 'var(--primary-color)' : 'transparent', color: activeMenuTab === 'store' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
            onClick={() => navigate('/templates?tab=store')}
          >
            Store Template / قوالب المتجر
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
content = content.replace(/<div className="workspace-tabs-container"[\s\S]*?<PageToolbar>/, navigateTabsHtml); // If it exists
if (!content.includes('workspace-tabs-container')) {
  content = content.replace('<PageToolbar>', navigateTabsHtml);
}

// 2. Remove duplicate actions rows
// Merchant:
const merchantActionsRegex = /<div className="actions-row">\s*<button className="btn-primary sm-btn" onClick=\{\(\) => setIsTemplateModalOpen\(true\)\}>\s*<Plus size=\{16\} \/> New Merchant Template \/ قالب تاجر جديد\s*<\/button>\s*<\/div>/;
content = content.replace(merchantActionsRegex, '');

// Store:
const storeActionsRegex = /<div className="actions-row">\s*<button className="btn-primary sm-btn" onClick=\{\(\) => setIsTemplateModalOpen\(true\)\}>\s*<Plus size=\{16\} \/> New Store Template \/ قالب متجر جديد\s*<\/button>\s*<\/div>/;
content = content.replace(storeActionsRegex, '');


fs.writeFileSync('src/pages/Templates.tsx', content);

// Also we need to make sure the sidebar has the icon. 
// "Add the proper Store Templates icon back into the sidebar... with the same visual identity/icon we used before."
// In Layout.tsx, it's currently using `<LayoutTemplate size={20} />`. Was it something else?
// The user says "with the same visual identity/icon we used before". 
// Wait, looking at the screenshot, the "Store Templates" item is highlighted and has an icon. The icon looks like a square with a header and two smaller squares below... wait, that's `LayoutTemplate`. It looks correct.
// The user says "Add the proper Store Templates icon back into the sidebar".
// Wait, in my previous refactor, did I use `LayoutTemplate`? Yes, I added `<LayoutTemplate size={20} />` for "Store Templates / قوالب المتجر".
// Let's check `Layout.tsx` for what is actually there.

let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');
// Is it possible the icon is missing?
// Yes, maybe I didn't import LayoutTemplate?
// Let me check if LayoutTemplate is imported in Layout.tsx.
if (!layout.includes('LayoutTemplate')) {
  layout = layout.replace('LayoutDashboard,', 'LayoutDashboard, LayoutTemplate,');
  fs.writeFileSync('src/components/Layout.tsx', layout);
}
