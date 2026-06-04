const fs = require('fs');

let c = fs.readFileSync('src/pages/Products.tsx', 'utf8');

// 1. Remove Bulk Actions Bar
const bulkStartStr = '{/* Always-visible Bulk Actions Bar */}';
const bulkStartIdx = c.indexOf(bulkStartStr);
if (bulkStartIdx !== -1) {
  let depth = 0;
  let inBlock = false;
  let endIdx = -1;
  // find the end of the div
  for (let i = bulkStartIdx; i < c.length; i++) {
    if (c.slice(i, i + 43) === '<div className="bulk-actions-bar glass-card"') {
      inBlock = true;
    }
    if (inBlock) {
      if (c.slice(i, i + 4) === '<div') depth++;
      if (c.slice(i, i + 5) === '</div') {
        depth--;
        if (depth === 0) {
          // Add 6 to skip over ">" of "</div>" and any newline
          endIdx = i + 6;
          break;
        }
      }
    }
  }
  if (endIdx !== -1) {
    c = c.slice(0, bulkStartIdx) + c.slice(endIdx);
  }
}

// 2. Remove showBulkMenu state
c = c.replace(/const \[showBulkMenu, setShowBulkMenu\] = useState\(false\);\n?\s*/g, '');

// 3. Remove checkbox from product cards
const checkboxRegex = /<input\s*type="checkbox"\s*checked=\{selectedProductIds\.includes\(product\.id\)\}[\s\S]*?zIndex:\s*10\s*\}\}\s*\/>/m;
c = c.replace(checkboxRegex, '');

// 4. Restore Copy and Delete buttons to product cards
const editButtonRegex = /<button\s*className="card-action-btn"\s*onClick=\{\(\) => openEditProductModal\(product\)\}\s*>\s*<Edit2 size=\{14\}\s*\/>\s*Edit\s*<\/button>/m;
const buttonsToRestore = `
                <button 
                  className="card-action-btn" 
                  onClick={() => openEditProductModal(product)}
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button 
                  className="card-action-btn" 
                  onClick={() => handleCopyProduct(product)}
                >
                  <Copy size={14} /> Copy
                </button>
                <button 
                  className="card-action-btn delete-action" 
                  onClick={() => handleDeleteStoreOnly(product)}
                >
                  <Trash2 size={14} /> Delete
                </button>`;

c = c.replace(editButtonRegex, buttonsToRestore);

fs.writeFileSync('src/pages/Products.tsx', c);
console.log('Successfully removed bulk actions and restored card buttons');
