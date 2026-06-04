const fs = require('fs');

let content = fs.readFileSync('src/components/common/PageToolbar.tsx', 'utf8');
content = content.replace(/flexWrap: 'wrap'/g, "flexWrap: 'nowrap', overflowX: 'auto', overflowY: 'hidden', paddingBottom: '8px'");
fs.writeFileSync('src/components/common/PageToolbar.tsx', content);

let theme = fs.readFileSync('src/styles/theme.css', 'utf8');
theme = theme.replace(/--search-min-width: 320px;/g, '--search-min-width: 200px;');
theme = theme.replace(/--store-selector-width: 260px;/g, '--store-selector-width: 200px;');
fs.writeFileSync('src/styles/theme.css', theme);
