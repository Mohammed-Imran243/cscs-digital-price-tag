const fs = require('fs');

const file1 = 'src/components/dashboard/PriceChangeMonitor.tsx';
let content1 = fs.readFileSync(file1, 'utf8');

content1 = content1.replace(
  /style=\{\{\s*background:\s*'rgba\(99, 102, 241, 0\.15\)',\s*border:\s*'1px solid rgba\(99, 102, 241, 0\.35\)',\s*cursor:\s*'pointer',\s*color:\s*'#a5b4fc',\s*padding:\s*'6px 14px',\s*borderRadius:\s*'20px',\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*'6px',\s*fontSize:\s*'13px',\s*fontWeight:\s*'600',\s*transition:\s*'background-color 0\.2s'\s*\}\}/,
  `style={{ background: 'transparent', border: '1px solid #3b82f6', cursor: 'pointer', color: '#3b82f6', padding: '6px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}`
);

content1 = content1.replace(
  /\.refresh-btn:hover \{\n\s+background-color: rgba\(99, 102, 241, 0\.25\) !important;\n\s+\}/,
  `.refresh-btn:hover {\n            background-color: rgba(59, 130, 246, 0.1) !important;\n          }`
);

fs.writeFileSync(file1, content1, 'utf8');

const file2 = 'src/pages/Dashboard.tsx';
if (fs.existsSync(file2)) {
  let content2 = fs.readFileSync(file2, 'utf8');
  content2 = content2.replace(
    /background: rgba\(99, 102, 241, 0\.15\);\s+border: 1px solid rgba\(99, 102, 241, 0\.35\);\s+color: #a5b4fc;\s+padding: 9px 18px;\s+border-radius: 8px;/,
    `background: transparent;\n          border: 1px solid #3b82f6;\n          color: #3b82f6;\n          padding: 8px 16px;\n          border-radius: 8px;`
  );
  content2 = content2.replace(
    /\.btn-refresh:hover \{ background: rgba\(99, 102, 241, 0\.25\); \}/,
    `.btn-refresh:hover { background: rgba(59, 130, 246, 0.1); }`
  );
  fs.writeFileSync(file2, content2, 'utf8');
}

console.log('Updated refresh button styles to match the screenshot');
