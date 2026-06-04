const fs = require('fs');

const fileNames = ['Templates.tsx', 'Devices.tsx', 'ApTab.tsx', 'Users.tsx', 'AuditLogs.tsx'];

for (const name of fileNames) {
  const path = `src/pages/${name}`;
  if (!fs.existsSync(path)) continue;
  
  let content = fs.readFileSync(path, 'utf8');

  // We want to make sure the structure is:
  // <div className="store-selector-wrapper">...</div>
  // <button className="btn-action btn-action-filter">...</button>
  // <div className="global-search-bar"...>...</div>
  
  // They are already wrapped in `<PageToolbar>`, but maybe not in `<div style={{ display: 'flex', gap: '16px', flex: 1, alignItems: 'center' }}>` with the exact order.

  // Let's first extract the components:
  let storeSelector = '';
  const storeSelectorMatch = content.match(/<div className="store-selector-wrapper"[\s\S]*?<\/select>\s*<\/div>/);
  if (storeSelectorMatch) storeSelector = storeSelectorMatch[0];

  let filter = '';
  const filterMatch = content.match(/<button className="btn-action btn-action-filter"[\s\S]*?<\/button>/);
  if (filterMatch) filter = filterMatch[0];

  let search = '';
  const searchMatch = content.match(/<div className="global-search-bar"[\s\S]*?<\/div>/);
  if (searchMatch) search = searchMatch[0];

  // If this page doesn't have a store selector, we add an empty one or a placeholder to keep layout consistent as requested by user
  if (!storeSelector) {
    storeSelector = `<div className="store-selector-wrapper">
            <StoreIcon size={16} className="text-muted" />
            <select className="glass-select">
              <option value="">Select a Store... / اختر متجراً...</option>
            </select>
          </div>`;
  }

  if (!filter) {
    filter = `<button className="btn-action btn-action-filter">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </button>`;
  }

  // Remove the old components and wrap them properly
  if (searchMatch) {
    // Replace the entire left side of the toolbar with the ordered wrapper
    // Since some files already have the `<div style={{ display: 'flex'...` we just use a regex to replace everything inside `<PageToolbar>` before `<ActionButtons`
    const toolbarRegex = /<PageToolbar>[\s\S]*?<ActionButtons/;
    const newToolbar = `<PageToolbar>
        <div style={{ display: 'flex', gap: '16px', flex: 1, alignItems: 'center' }}>
          ${storeSelector}
          ${filter}
          ${search}
        </div>
        <ActionButtons`;
    content = content.replace(toolbarRegex, newToolbar);
    
    // Some files might have missing StoreIcon import if it didn't exist before
    if (!content.includes('StoreIcon')) {
       content = content.replace(/import \{.*?\} from 'lucide-react';/, (match) => match.replace('}', ', Store as StoreIcon }'));
    }
    
    fs.writeFileSync(path, content);
  }
}
