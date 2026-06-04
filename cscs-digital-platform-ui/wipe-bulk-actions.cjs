const fs = require('fs');

let c = fs.readFileSync('src/pages/Products.tsx', 'utf8');

// 1. Remove states
c = c.replace(/const \[selectedProductIds, setSelectedProductIds\] = useState<string\[\]>\(\[\]\);\n?\s*/, '');
c = c.replace(/const \[isSelectMode, setIsSelectMode\] = useState\(false\);\n?\s*/, '');

// 2. Remove isSelectMode props from PageToolbar
c = c.replace(/isSelectMode=\{isSelectMode\}\n?\s*/, '');
c = c.replace(/onCancelSelectMode=\{\(\) => \{\n\s*setIsSelectMode\(false\);\n\s*setSelectedProductIds\(\[\]\);\n\s*\}\}\n?\s*/, '');

// 3. Remove conditional Bulk Actions UI block
const bulkStartStr = '{selectedProductIds.length > 0 && (';
const bulkStartIdx = c.indexOf(bulkStartStr);
if (bulkStartIdx !== -1) {
  let depth = 0;
  let inBlock = false;
  let endIdx = -1;
  for (let i = bulkStartIdx; i < c.length; i++) {
    if (c.slice(i, i + bulkStartStr.length) === bulkStartStr) {
      inBlock = true;
    }
    if (inBlock) {
      if (c[i] === '{') depth++;
      if (c[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }
  }
  if (endIdx !== -1) {
    c = c.slice(0, bulkStartIdx) + c.slice(endIdx);
  }
}

// 4. Remove {isSelectMode && ... } checkbox block
const checkboxRegex = /\{isSelectMode && \([\s\S]*?zIndex:\s*10\s*\}\}\s*\/>\s*\)\}\n?\s*/g;
c = c.replace(checkboxRegex, '');

fs.writeFileSync('src/pages/Products.tsx', c);
console.log('Successfully wiped out Bulk Actions from Products.tsx');
