const fs = require('fs');

let c = fs.readFileSync('src/pages/Products.tsx', 'utf8');

// 1. Remove Filter Button
const filterBtnRegex = /<button className="btn-action btn-action-slate">\s*<svg[\s\S]*?<\/svg>\s*Filter\s*<\/button>/;
c = c.replace(filterBtnRegex, '');

// 2. Import StoreSelector if not already imported
if (!c.includes('import { StoreSelector }')) {
  c = c.replace(
    "import { PageHeader, PageToolbar, ActionButtons } from '../components/common';",
    "import { PageHeader, PageToolbar, ActionButtons, StoreSelector } from '../components/common';"
  );
}

// 3. Replace native select with StoreSelector
const nativeSelectRegex = /<div className="store-selector-wrapper"[\s\S]*?<\/select>\s*<\/div>/;
const replacement = `<StoreSelector 
              stores={stores} 
              selectedStore={selectedStore} 
              onSelect={setSelectedStore} 
            />`;

c = c.replace(nativeSelectRegex, replacement);

fs.writeFileSync('src/pages/Products.tsx', c);
console.log('Task 1 completed: Products.tsx updated.');
