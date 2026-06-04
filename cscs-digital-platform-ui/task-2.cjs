const fs = require('fs');

let c = fs.readFileSync('src/index.css', 'utf8');

if (!c.includes('--search-width:')) {
  // Add variables to :root
  c = c.replace(/:root\s*\{/, `:root {\n  --search-width: 350px;\n  --search-width-lg: 400px;\n`);
  
  // Apply globally to search inputs in global-search-bar
  const newStyles = `
/* Global Search Input Standardization */
.global-search-bar input {
  min-width: var(--search-width) !important;
  max-width: var(--search-width-lg) !important;
  width: 100% !important;
  height: 42px !important;
  border-radius: 12px !important;
}
`;
  c += newStyles;
  fs.writeFileSync('src/index.css', c);
}
console.log('Task 2 completed: src/index.css updated.');
