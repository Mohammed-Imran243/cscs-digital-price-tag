const fs = require('fs');
const path = require('path');

const files = [
  'AuditLogs.tsx',
  'Devices.tsx',
  'PriceMonitor.tsx',
  'Stores.tsx',
  'Templates.tsx',
  'Users.tsx',
  'Dashboard.tsx',
  'Merchant.tsx',
  'TemplateEditor.tsx'
];

const basePath = path.join('D:', 'cscs-digital-price-tag', 'cscs-digital-platform-ui', 'src', 'pages');

for (const file of files) {
  const filePath = path.join(basePath, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find where <PageHeader starts
  const headerIdx = content.indexOf('<PageHeader');
  if (headerIdx === -1) {
    console.log('No PageHeader in ' + file);
    continue;
  }
  
  // Some pages might not have PageToolbar. Let's find </PageToolbar>
  let endIdx = content.indexOf('</PageToolbar>', headerIdx);
  let closeTag = '</PageToolbar>';
  
  // If no PageToolbar, find the end of PageHeader '/>'
  if (endIdx === -1) {
    endIdx = content.indexOf('/>', headerIdx);
    closeTag = '/>';
  }
  
  if (endIdx !== -1) {
    const fullEndIdx = endIdx + closeTag.length;
    // Check if it's already wrapped (basic check)
    const beforeStr = content.substring(Math.max(0, headerIdx - 50), headerIdx);
    if (beforeStr.includes('sticky-page-header')) {
        console.log('Already wrapped in ' + file);
        continue;
    }

    const before = content.substring(0, headerIdx);
    const middle = content.substring(headerIdx, fullEndIdx);
    const after = content.substring(fullEndIdx);
    
    // We need to indent the middle a bit, or just wrap it
    const newMiddle = '    <div className="sticky-page-header">\n      ' + middle.replace(/\n/g, '\n  ') + '\n    </div>';
    
    fs.writeFileSync(filePath, before + newMiddle + after);
    console.log('Updated ' + file);
  }
}
