const fs = require('fs');

// 1. Remove inline styles for global-search-bar in all TSX files
const files = ['src/pages/Stores.tsx', 'src/pages/Users.tsx', 'src/pages/AuditLogs.tsx', 'src/pages/Templates.tsx'];
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/className="global-search-bar" style=\{\{.*?\}\}/g, 'className="global-search-bar"');
    fs.writeFileSync(file, content, 'utf8');
  }
});

// 2. Remove Filter button in Products.tsx
if (fs.existsSync('src/pages/Products.tsx')) {
  let content = fs.readFileSync('src/pages/Products.tsx', 'utf8');
  
  // Also remove inline styles if any
  content = content.replace(/className="global-search-bar" style=\{\{.*?\}\}/g, 'className="global-search-bar"');
  
  // Remove the exact Filter button block
  const filterBtnRegex = /<button className="btn-action btn-action-slate">\s*<svg[\s\S]*?<\/svg>\s*Filter\s*<\/button>/g;
  content = content.replace(filterBtnRegex, '');
  
  fs.writeFileSync('src/pages/Products.tsx', content, 'utf8');
}

// 3. Update the global search bar css to be rigidly standard
const themeCss = 'src/styles/theme.css';
if (fs.existsSync(themeCss)) {
  let content = fs.readFileSync(themeCss, 'utf8');
  content = content.replace(/min-width: 280px !important;/g, 'width: 320px !important;\n  max-width: 320px !important;\n  flex: 0 0 320px !important;');
  fs.writeFileSync(themeCss, content, 'utf8');
}

console.log('Standardized search bars and removed Product filter');
