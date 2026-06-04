const fs = require('fs');
let c = fs.readFileSync('src/pages/Templates.tsx', 'utf8');
const iconBarRegex = /<div className="icon-actions-bar">[\s\S]*?<\/div>\s*/;
if (c.match(iconBarRegex)) {
  c = c.replace(iconBarRegex, '');
  fs.writeFileSync('src/pages/Templates.tsx', c);
  console.log('Removed inline blue button');
} else {
  console.log('Blue button not found');
}
