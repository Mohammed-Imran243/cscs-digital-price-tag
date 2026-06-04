const fs = require('fs');

let c = fs.readFileSync('src/pages/Products.tsx', 'utf8');

// 1. Remove handleDeleteSelected block
const hdsStartIdx = c.indexOf('const handleDeleteSelected = () => {');
if (hdsStartIdx !== -1) {
  let depth = 0;
  let inBlock = false;
  let endIdx = -1;
  for (let i = hdsStartIdx; i < c.length; i++) {
    if (c.slice(i, i + 36) === 'const handleDeleteSelected = () => {') {
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
    c = c.slice(0, hdsStartIdx) + c.slice(endIdx);
  }
}

// 2. Remove scattered setSelectedProductIds and setIsSelectMode references
c = c.replace(/setSelectedProductIds\(.*?\);\n?\s*/g, '');
c = c.replace(/setIsSelectMode\(.*?\);\n?\s*/g, '');

fs.writeFileSync('src/pages/Products.tsx', c);
console.log('Successfully removed leftover references');
