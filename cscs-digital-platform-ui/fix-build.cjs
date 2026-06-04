const fs = require('fs');

// 1. Fix Products.tsx -> missing export in index.ts
let idx = fs.readFileSync('src/components/common/index.ts', 'utf8');
if (!idx.includes('export * from "./StoreSelector";')) {
  idx += '\nexport * from "./StoreSelector";\n';
  fs.writeFileSync('src/components/common/index.ts', idx);
  console.log('Fixed index.ts');
}

// 2. Fix AuditLogs.tsx -> remaining filteredLogs references
let audit = fs.readFileSync('src/pages/AuditLogs.tsx', 'utf8');
// Replace filteredLogs with logs globally in JSX
audit = audit.replace(/filteredLogs\.length/g, 'logs.length');
audit = audit.replace(/filteredLogs === 0/g, 'logs.length === 0');
audit = audit.replace(/filteredLogs/g, 'logs');
fs.writeFileSync('src/pages/AuditLogs.tsx', audit);
console.log('Fixed AuditLogs.tsx');

// 3. Fix Templates.tsx -> missing setIsStoreIconModalOpen
let templates = fs.readFileSync('src/pages/Templates.tsx', 'utf8');
// Let's find out what the actual modal state setter is
const modalMatch = templates.match(/const \[.*?ModalOpen,\s*(set.*?ModalOpen)\] = useState/g);
console.log('Modals found:', modalMatch);

// It's probably setIsAddIconModalOpen or something similar.
// If it's not defined, maybe they just don't have a modal for it? 
// Wait, looking at lines 40-70 from earlier... maybe we can just find it.
