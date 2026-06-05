const fs = require('fs');

const file = 'src/pages/Products.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the badge div entirely
content = content.replace(
  /\s*<div className="store-badge status-active" style=\{\{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: 'rgba\(59, 130, 246, 0\.15\)', color: 'var\(--primary-color\)' \}\}>\n\s*\{product\.unit \|\| '1PCS'\}\n\s*<\/div>/g,
  ''
);

fs.writeFileSync(file, content, 'utf8');
console.log('Removed PCS badge from Products.tsx');
