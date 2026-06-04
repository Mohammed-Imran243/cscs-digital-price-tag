const fs = require('fs');
const c = fs.readFileSync('src/pages/Templates.tsx', 'utf8');
console.log('Has tabs container:', c.includes('workspace-tabs-container'));
console.log('Has StoreSelector:', c.includes('StoreSelector'));
console.log('Has ActionButtons with onAdd:', c.includes('onAdd={() => setIsTemplateModalOpen'));
console.log('Has old store-selector-wrapper:', c.includes('store-selector-wrapper'));

const layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');
console.log('\nLayout sidebar templates:');
const layoutLines = layout.split('\n');
layoutLines.forEach((line, idx) => {
  if (line.includes('template') || line.includes('Template')) {
    console.log((idx+1) + ': ' + line.trim().slice(0, 120));
  }
});
