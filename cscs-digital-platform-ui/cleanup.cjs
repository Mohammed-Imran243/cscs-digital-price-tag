const fs = require('fs');

// =============================================================================
// CLEANUP SCRIPT - Targeted removals only, no functional changes
// =============================================================================

// ===== FIX 1: Templates - Remove BOTH actions-row duplicate buttons =====
{
  let c = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

  // Remove the store tab actions-row (New Store Template button)
  c = c.replace(
    /\s*\{\/\* Action Buttons \*\/\}\s*<div className="actions-row">\s*<button className="btn-primary sm-btn" onClick=\{[^}]+\}>\s*<Plus size=\{16\} \/> New Store Template \/ قالب متجر جديد\s*<\/button>\s*\{\/\*[\s\S]*?\*\/\}\s*<\/div>/g,
    ''
  );

  // Remove the merchant actions-row (New Merchant Template button) - should not render anyway but clean it up
  c = c.replace(
    /\s*\{\/\* Action Buttons \*\/\}\s*<div className="actions-row">\s*<button className="btn-primary sm-btn" onClick=\{[^}]+\}>\s*<Plus size=\{16\} \/> New Merchant Template \/ قالب تاجر جديد\s*<\/button>\s*\{\/\*[\s\S]*?\*\/\}\s*<\/div>/g,
    ''
  );

  // Make filter button only show on store tab (hide it for store_icon and properties)
  // Current: always shows in toolbar
  // The filter button is the btn-action-slate one with Filter size
  // Wrap the filter button so it only renders on 'store' tab
  c = c.replace(
    `          <button 
            className={\`btn-action btn-action-slate \${showFilters ? 'active' : ''}\`} 
            onClick={() => setShowFilters(!showFilters)}
            title="Filters / التصفية"
            style={{ position: 'relative' }}
          >
            <Filter size={18} />`,
    `          {activeMenuTab === 'store' && <button 
            className={\`btn-action btn-action-slate \${showFilters ? 'active' : ''}\`} 
            onClick={() => setShowFilters(!showFilters)}
            title="Filters / التصفية"
            style={{ position: 'relative' }}
          >
            <Filter size={18} />`
  );

  // Close the conditional wrapper after the filter button's closing </button>
  // Find isFilterActive span and closing button
  c = c.replace(
    `            {isFilterActive && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                border: '1px solid var(--glass-border)'
              }} />
            )}
          </button>`,
    `            {isFilterActive && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                border: '1px solid var(--glass-border)'
              }} />
            )}
          </button>}`
  );

  fs.writeFileSync('src/pages/Templates.tsx', c);
  console.log('Templates.tsx: Removed duplicate buttons, scoped filter to store tab');
}

// ===== FIX 2: Products - Remove filter button and panel entirely =====
{
  let c = fs.readFileSync('src/pages/Products.tsx', 'utf8');

  // Remove the filter button (it's a large block with the badge)
  c = c.replace(
    /<button\s*\n\s*className=\{`btn-action btn-action-filter [^`]+`\}\s*\n\s*onClick=\{[^}]+\}\s*\n\s*title="Filters \/ التصفية"\s*\n\s*style=\{\{ padding: '0 12px', position: 'relative' \}\}\s*\n\s*>\s*\n\s*<svg[^>]+>[^<]*<polygon[^>]+>[^<]*<\/polygon><\/svg>\s*\n\s*\{activeProductFilterCount > 0 [^}]+\}\s*\n\s*\}\)\}\s*\n\s*<\/button>/g,
    ''
  );

  // Remove the Products Filter Panel block
  c = c.replace(
    /\s*\{\/\* Products Filter Panel \*\/\}\s*\{showProductFilters && \([\s\S]*?\)\)}/,
    ''
  );

  fs.writeFileSync('src/pages/Products.tsx', c);
  console.log('Products.tsx: Removed filter button and panel');
}

// ===== FIX 3: AuditLogs - Remove filter button and panel =====
{
  let c = fs.readFileSync('src/pages/AuditLogs.tsx', 'utf8');
  const before = c;

  // Remove the filter button from toolbar (connected to showFilters)
  c = c.replace(
    /<button\s*\n?\s*className=\{`btn-action btn-action-filter[^`]*`\} onClick=\{[^}]+\} title="Filters \/ التصفية"[^>]*>\s*\n?\s*<svg[^>]+>[^<]*<polygon[^>]+>[^<]*<\/polygon><\/svg>\s*\n?\s*<\/button>/g,
    ''
  );

  // Also try simpler line-by-line removal if regex failed
  if (c === before) {
    const lines = c.split('\n');
    const filtered = [];
    let skip = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('btn-action btn-action-filter') && line.includes('showFilters')) {
        skip = 3; // skip this line and a few more (svg etc)
      }
      if (skip > 0) { skip--; continue; }
      filtered.push(line);
    }
    c = filtered.join('\n');
    console.log('AuditLogs: Used line-by-line removal for filter button');
  }

  // Remove the Collapsible Advanced Filter Panel block
  c = c.replace(
    /\s*\{\/\* Collapsible Advanced Filter Panel \*\/\}\s*\{showFilters && \([\s\S]*?\)\)}/,
    ''
  );

  fs.writeFileSync('src/pages/AuditLogs.tsx', c);
  console.log('AuditLogs.tsx: Removed filter button and panel');
}

// ===== FIX 4: Users - Remove StoreSelector from toolbar =====
{
  let c = fs.readFileSync('src/pages/Users.tsx', 'utf8');

  // Remove the StoreSelector block from toolbar
  c = c.replace(
    /\s*<StoreSelector\s*\n\s*stores=\{stores\}\s*\n\s*selectedStore=\{selectedStore\}\s*\n\s*onSelect=\{setSelectedStore\}\s*\n\s*loading=\{storesLoading\}\s*\n\s*\/>/,
    ''
  );

  // Also remove the dead filter button (from before fix-filters.cjs - it's still the unconnected one)
  // Lines 668-670 are the dead filter button
  const lines = c.split('\n');
  const cleaned = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Detect the dead filter button (has btn-action-filter but no onClick bound to showUserFilters)
    if (line.includes('btn-action btn-action-filter') && !line.includes('showUserFilters')) {
      // Skip this button block - find its closing tag
      i++;
      while (i < lines.length && !lines[i].includes('</button>') && !lines[i].includes('/>')) {
        i++;
      }
      i++; // skip the closing tag line too
      continue;
    }
    cleaned.push(line);
    i++;
  }
  c = cleaned.join('\n');

  fs.writeFileSync('src/pages/Users.tsx', c);
  console.log('Users.tsx: Removed StoreSelector from toolbar and dead filter button');
}

console.log('\nAll cleanup changes applied!');
