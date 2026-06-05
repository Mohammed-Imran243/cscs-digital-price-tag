const fs = require('fs');

const file = 'src/pages/Templates.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the title in PageHeader
content = content.replace(
  /<PageHeader\s*\n\s*title="Store Management"\s*\n\s*titleAr="[^"]*"\s*\/>/,
  `<PageHeader\n          title="Store Template Management"\n          titleAr="إدارة قوالب المتجر"\n        />`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated title to Store Template Management');
