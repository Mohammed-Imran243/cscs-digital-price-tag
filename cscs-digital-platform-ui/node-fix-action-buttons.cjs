const fs = require('fs');

let c = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

const targetOnAdd = "onAdd={activeMenuTab === 'store' ? () => setIsTemplateModalOpen(true) : undefined}";
const newOnAdd = "onAdd={activeMenuTab === 'store' ? () => setIsTemplateModalOpen(true) : activeMenuTab === 'store_icon' ? () => setIsStoreIconModalOpen(true) : undefined}";

c = c.replace(targetOnAdd, newOnAdd);

const targetLabel = 'addLabel="Add Store Template"';
const newLabel = "addLabel={activeMenuTab === 'store_icon' ? 'Add Store Icon' : 'Add Store Template'}";

c = c.replace(targetLabel, newLabel);

// For the Arabic label, we just match `addLabelAr="` and anything until `"`, then replace it.
const arLabelRegex = /addLabelAr="([^"]+)"/;
const newArLabel = "addLabelAr={activeMenuTab === 'store_icon' ? '\\u0625\\u0636\\u0627\\u0641\\u0629 \\u0623\\u064A\\u0642\\u0648\\u0646\\u0629 \\u0627\\u0644\\u0645\\u062A\\u062C\\u0631' : '\\u0625\\u0636\\u0627\\u0641\\u0629 \\u0642\\u0627\\u0644\\u0628 \\u0645\\u062A\\u062C\\u0631'}";

c = c.replace(arLabelRegex, newArLabel);

fs.writeFileSync('src/pages/Templates.tsx', c);
console.log('Fixed Templates.tsx action buttons');
