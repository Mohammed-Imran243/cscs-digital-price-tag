const fs = require('fs');

const file = 'src/components/dashboard/PriceChangeMonitor.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the inline style of the refresh button
content = content.replace(
  /style=\{\{\s*background:\s*'rgba\(255,255,255,0\.05\)',\s*border:\s*'1px solid var\(--glass-border\)',\s*cursor:\s*'pointer',\s*color:\s*'var\(--text-primary\)',\s*padding:\s*'8px 12px',\s*borderRadius:\s*'20px',\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*'6px',\s*fontSize:\s*'13px',\s*fontWeight:\s*'500',\s*transition:\s*'background-color 0\.2s'\s*\}\}/,
  `style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.35)', cursor: 'pointer', color: '#a5b4fc', padding: '6px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', transition: 'background-color 0.2s' }}`
);

// Add the hover effect to the CSS string
content = content.replace(
  /\.refresh-btn:hover \{\s+background-color: rgba\(255, 255, 255, 0\.08\) !important;\s+\}/,
  `.refresh-btn:hover {\n            background-color: rgba(99, 102, 241, 0.25) !important;\n          }`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated refresh button in PriceChangeMonitor.tsx');
