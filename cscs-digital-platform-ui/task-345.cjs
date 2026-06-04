const fs = require('fs');

let c = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

// 1. Ensure tab defaults properly on mount if not set
if (!c.includes("useEffect(() => {\n    if (!searchParams.has('tab')")) {
  c = c.replace(
    /const activeMenuTab.*?;/s,
    (match) => match + `\n\n  useEffect(() => {\n    if (!['store', 'store_icon', 'properties'].includes(activeMenuTab)) {\n      navigate('?tab=store', { replace: true });\n    }\n  }, [activeMenuTab, navigate]);\n`
  );
}

// 2. Hide global search for Store Icon & Properties by modifying PageToolbar search string conditionally
// Currently: Search templates... / ... 
// Let's modify where PageToolbar is used:
c = c.replace(/\{\(activeMenuTab === 'store' \|\| activeMenuTab === 'store_icon'\) && \(/, "{activeMenuTab === 'store' && (");

// 3. Move Add Store Icon to Toolbar
// Currently: onAdd={activeMenuTab === 'store' ? () => setIsTemplateModalOpen(true) : undefined}
// We will update ActionButtons props:
c = c.replace(/onAdd=\{activeMenuTab === 'store' \? \(\) => setIsTemplateModalOpen\(true\) : undefined\}/, "onAdd={activeMenuTab === 'store' ? () => setIsTemplateModalOpen(true) : activeMenuTab === 'store_icon' ? () => setIsStoreIconModalOpen(true) : undefined}");
c = c.replace(/addLabel="Add Template"/, 'addLabel={activeMenuTab === "store" ? "Add Template" : "Add Store Icon"}');
c = c.replace(/addLabelAr="إضافة قالب"/, 'addLabelAr={activeMenuTab === "store" ? "إضافة قالب" : "إضافة أيقونة المتجر"}');

// 4. Remove the inline Add Store Icon button above the table
c = c.replace(/<div className="flex justify-between items-center mb-4">[\s\S]*?<button[\s\S]*?onClick=\{\(\) => setIsStoreIconModalOpen\(true\)\}[\s\S]*?<\/button>\s*<\/div>/, '');

// 5. Update Navigation Tabs styling to be visual tabs
const oldTabsRegex = /<div style=\{\{\s*display: 'flex',\s*gap: '12px',\s*padding: '16px 24px'[\s\S]*?\}\}>\s*(<button[\s\S]*?<\/button>\s*)*<\/div>/;

const newTabs = `
      {/* Enterprise Visual Navigation Tabs */}
      <div className="enterprise-tabs-container" style={{ padding: '0 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '2px', background: 'var(--bg-primary)' }}>
        <button 
          className={\`enterprise-tab \${activeMenuTab === 'store' ? 'active' : ''}\`}
          onClick={() => navigate('?tab=store')}
        >
          Store Template <span className="tab-ar">/ قوالب المتجر</span>
        </button>
        <button 
          className={\`enterprise-tab \${activeMenuTab === 'store_icon' ? 'active' : ''}\`}
          onClick={() => navigate('?tab=store_icon')}
        >
          Store Icon <span className="tab-ar">/ أيقونة المتجر</span>
        </button>
        <button 
          className={\`enterprise-tab \${activeMenuTab === 'properties' ? 'active' : ''}\`}
          onClick={() => navigate('?tab=properties')}
        >
          Template Properties <span className="tab-ar">/ خصائص القالب</span>
        </button>
      </div>
`;
c = c.replace(oldTabsRegex, newTabs);

fs.writeFileSync('src/pages/Templates.tsx', c);

// 6. Inject CSS for enterprise-tabs
let css = fs.readFileSync('src/index.css', 'utf8');
if (!css.includes('.enterprise-tabs-container')) {
  css += `
/* Enterprise Tabs Styling */
.enterprise-tabs-container {
  margin-bottom: 20px;
}
.enterprise-tab {
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}
.enterprise-tab:hover {
  background: rgba(0, 0, 0, 0.03);
  color: var(--text-primary);
}
.dark .enterprise-tab:hover {
  background: rgba(255, 255, 255, 0.05);
}
.enterprise-tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  background: linear-gradient(to top, rgba(59, 130, 246, 0.05) 0%, transparent 100%);
}
.enterprise-tab .tab-ar {
  font-size: 13px;
  opacity: 0.8;
}
`;
  fs.writeFileSync('src/index.css', css);
}

console.log('Tasks 3, 4, 5 completed');
