const fs = require('fs');
const path = require('path');

const pagesDir = 'src/pages';
const files = ['Templates.tsx', 'Users.tsx', 'Products.tsx', 'Devices.tsx', 'Stores.tsx', 'AuditLogs.tsx'];

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Make sure StoreSelector is imported
    if (!content.includes('import { StoreSelector }')) {
      if (content.includes('import { ActionButtons }')) {
        content = content.replace("import { ActionButtons }", "import { ActionButtons }\nimport { StoreSelector } from '../components/common/StoreSelector';");
      } else if (content.includes('import { PageToolbar }')) {
        content = content.replace("import { PageToolbar }", "import { PageToolbar }\nimport { StoreSelector } from '../components/common/StoreSelector';");
      } else {
        content = "import { StoreSelector } from '../components/common/StoreSelector';\n" + content;
      }
    }

    const regex = /<div className="store-selector-wrapper"[^>]*>[\s\S]*?(?:<select[\s\S]*?<\/select>|<\/div>[\s\S]*?<\/div>|{storesLoading[\s\S]*?<\/[a-z]+>[\s\S]*?\)\}?)[\s\S]*?<\/div>/;

    if (regex.test(content)) {
      content = content.replace(regex, `<StoreSelector 
              stores={stores} 
              selectedStore={selectedStore} 
              onSelect={setSelectedStore} 
              loading={storesLoading} 
            />`);
      fs.writeFileSync(filePath, content);
      console.log('Updated ' + file);
    } else {
      console.log('Could not find store-selector-wrapper in ' + file);
    }
  }
});
