const fs = require('fs');

const file = 'src/pages/Products.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the badge div entirely by splitting
const badgeStr = `<div className="store-badge status-active" style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary-color)' }}>
                  {product.unit || '1PCS'}
                </div>`;

content = content.replace(badgeStr, '');

// Also try a regex that is very lenient if exact string matching fails
content = content.replace(/<div className="store-badge status-active"[^>]*>\s*\{product\.unit \|\| '1PCS'\}\s*<\/div>/g, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Removed PCS badge');
