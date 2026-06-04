const fs = require('fs');
let c = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

c = c.replace(
  /\s*\{\/\* Action Buttons \*\/\}\s*<div className="actions-row">\s*<button className="btn-primary sm-btn" onClick=\{[^}]+\}>\s*<Plus size=\{16\} \/> New Store Template \/ قالب متجر جديد\s*<\/button>\s*\{\/\*[\s\S]*?\*\/\}\s*<\/div>/g,
  ''
);

c = c.replace(
  /\s*\{\/\* Action Buttons \*\/\}\s*<div className="actions-row">\s*<button className="btn-primary sm-btn" onClick=\{[^}]+\}>\s*<Plus size=\{16\} \/> New Merchant Template \/ قالب تاجر جديد\s*<\/button>\s*\{\/\*[\s\S]*?\*\/\}\s*<\/div>/g,
  ''
);

fs.writeFileSync('src/pages/Templates.tsx', c);
console.log('Removed duplicate buttons');
