const fs = require('fs');

let c = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

// 1. Fix the top toolbar button labels
c = c.replace(/addLabel="Add Store Template"/, "addLabel={activeMenuTab === 'store_icon' ? 'Add Store Icon' : 'Add Store Template'}");
c = c.replace(/addLabelAr="إضافة قالب متجر"/, "addLabelAr={activeMenuTab === 'store_icon' ? 'إضافة أيقونة المتجر' : 'إضافة قالب متجر'}");

// 2. Remove the inline Add Store Icon button
const iconActionBarIdx = c.indexOf('<div className="icon-actions-bar">');
if (iconActionBarIdx !== -1) {
  const endIdx = c.indexOf('</div>', iconActionBarIdx) + 6;
  if (endIdx !== -1) {
    // Also remove any trailing whitespace/newlines
    let sliceEnd = endIdx;
    while (c[sliceEnd] === '\n' || c[sliceEnd] === '\r' || c[sliceEnd] === ' ') {
      sliceEnd++;
    }
    c = c.slice(0, iconActionBarIdx) + c.slice(sliceEnd);
  }
}

fs.writeFileSync('src/pages/Templates.tsx', c);
console.log('Fixed duplicate buttons in Templates.tsx');
