const fs = require('fs');

let c = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

// 1. Ensure `isStoreIconModalOpen` is defined.
if (!c.includes('const [isStoreIconModalOpen')) {
  c = c.replace(
    /const \[isTemplateModalOpen,\s*setIsTemplateModalOpen\]\s*=\s*useState\(false\);/,
    'const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);\n  const [isStoreIconModalOpen, setIsStoreIconModalOpen] = useState(false);'
  );
}

// 2. Update ActionButtons to handle both cases dynamically
const oldActionButtons = `<ActionButtons
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

const newActionButtons = `<ActionButtons
            onRefresh={() => {
              if (activeMenuTab === 'store') fetchTemplatesList();
              else if (activeMenuTab === 'store_icon') fetchStoreIconsList();
            }}
            onImport={activeMenuTab === 'store' ? () => setShowTemplateImportExport(true) : undefined}
            onExport={activeMenuTab === 'store' ? () => setShowTemplateImportExport(true) : undefined}
            onAdd={activeMenuTab === 'store' ? () => setIsTemplateModalOpen(true) : activeMenuTab === 'store_icon' ? () => setIsStoreIconModalOpen(true) : undefined}
            addLabel={activeMenuTab === 'store_icon' ? 'Add Store Icon' : 'Add Store Template'}
            addLabelAr={activeMenuTab === 'store_icon' ? 'إضافة أيقونة المتجر' : 'إضافة قالب متجر'}
            loading={loading}
          />`;

c = c.replace(oldActionButtons, newActionButtons);

// 3. Remove the inline blue button for Add Store Icon
// We know it looks like:
// <div className="workspace-tab-content">
//   <div className="icon-actions-bar">
//     <button className="btn-primary sm-btn">
//       ...
//     </button>
//   </div>
const iconBarRegex = /<div className="icon-actions-bar">[\s\S]*?<\/div>\s*/;
c = c.replace(iconBarRegex, '');

fs.writeFileSync('src/pages/Templates.tsx', c);
console.log('Fixed Templates.tsx buttons');
