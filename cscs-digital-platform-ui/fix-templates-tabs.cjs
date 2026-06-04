const fs = require('fs');

let content = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

// =====================================================
// FIX 1: Default tab = 'store' (not 'merchant') - handle CRLF line endings
// =====================================================
const oldTabParam = "const tabParam = searchParams.get('tab') || 'merchant';";
const newTabParam = "const tabParam = searchParams.get('tab') || 'store';";

if (content.includes(oldTabParam)) {
  content = content.replace(oldTabParam, newTabParam);
  console.log('FIX 1: Default tab changed to store');
} else {
  console.warn('FIX 1: Could not find old tabParam line');
}

// =====================================================
// FIX 2: Fix activeMenuTab mapping - add 'store_icon' as explicit param value
// =====================================================
const oldActiveMenuTab = "const activeMenuTab = tabParam === 'icon' ? 'store_icon' : \r\n                        tabParam === 'properties' ? 'properties' : \r\n                        tabParam === 'store' ? 'store' :\r\n                        tabParam === 'business_icon' ? 'business_icon' : 'merchant';";
const newActiveMenuTab = "const activeMenuTab = tabParam === 'icon' ? 'store_icon' :\r\n                        tabParam === 'store_icon' ? 'store_icon' :\r\n                        tabParam === 'properties' ? 'properties' :\r\n                        tabParam === 'store' ? 'store' :\r\n                        tabParam === 'business_icon' ? 'business_icon' : 'store';";

if (content.includes(oldActiveMenuTab)) {
  content = content.replace(oldActiveMenuTab, newActiveMenuTab);
  console.log('FIX 2: activeMenuTab mapping updated - store_icon and default=store');
} else {
  console.warn('FIX 2: Could not find old activeMenuTab block');
}

fs.writeFileSync('src/pages/Templates.tsx', content);
console.log('Templates.tsx updated.');

// =====================================================
// FIX 3: Fix PageToolbar overflow to allow dropdown visibility
// =====================================================
let toolbar = fs.readFileSync('src/components/common/PageToolbar.tsx', 'utf8');
const before = toolbar;
// Remove overflowY: 'hidden' and paddingBottom: '8px'
toolbar = toolbar.replace(/,\s*overflowY:\s*'hidden'/g, '');
toolbar = toolbar.replace(/,\s*paddingBottom:\s*'8px'/g, '');
// Replace overflowX: 'auto' with overflowX: 'visible'
toolbar = toolbar.replace(/overflowX:\s*'auto'/g, "overflowX: 'visible'");

if (toolbar !== before) {
  fs.writeFileSync('src/components/common/PageToolbar.tsx', toolbar);
  console.log('FIX 3: Fixed PageToolbar overflow - dropdown now visible');
} else {
  console.log('FIX 3: No overflow changes needed in PageToolbar');
}

// =====================================================
// FIX 4: Boost StoreSelector z-index in theme.css
// =====================================================
let theme = fs.readFileSync('src/styles/theme.css', 'utf8');
const beforeTheme = theme;

// Ensure the wrapper has high z-index
theme = theme.replace(
  '.custom-store-selector {\n  position: relative;\n  min-width: var(--store-selector-width);\n  height: var(--toolbar-control-height, 44px);\n  z-index: 100;',
  '.custom-store-selector {\n  position: relative;\n  min-width: var(--store-selector-width);\n  height: var(--toolbar-control-height, 44px);\n  z-index: 9999;'
);

// Ensure the dropdown has very high z-index
theme = theme.replace(
  '.custom-store-selector .selector-dropdown {\n  position: absolute;\n  top: calc(100% + 4px);\n  left: 0;\n  right: 0;\n  max-height: 250px;\n  overflow-y: auto;\n  background: var(--card-bg, #ffffff);\n  border-radius: 8px;\n  box-shadow: 0 4px 12px rgba(0,0,0,0.1);\n  padding: 4px;\n  z-index: 1000;',
  '.custom-store-selector .selector-dropdown {\n  position: absolute;\n  top: calc(100% + 4px);\n  left: 0;\n  right: 0;\n  max-height: 250px;\n  overflow-y: auto;\n  background: var(--card-bg, #ffffff);\n  border-radius: 8px;\n  box-shadow: 0 8px 24px rgba(0,0,0,0.18);\n  padding: 4px;\n  z-index: 99999;'
);

if (theme !== beforeTheme) {
  fs.writeFileSync('src/styles/theme.css', theme);
  console.log('FIX 4: Boosted StoreSelector z-index to 99999');
} else {
  console.log('FIX 4: theme.css z-index already OK or pattern mismatch');
}

// Also ensure the page-toolbar itself doesn't clip dropdowns
// by adding overflow: visible to page-toolbar
if (theme.includes('.page-toolbar') && !theme.includes('.page-toolbar { overflow: visible')) {
  theme = fs.readFileSync('src/styles/theme.css', 'utf8');
  if (!theme.includes('.page-toolbar {\n  overflow: visible')) {
    // Append overrides
    theme += `
/* Ensure toolbar allows dropdown overflow */
.page-toolbar {
  overflow: visible !important;
}
`;
    fs.writeFileSync('src/styles/theme.css', theme);
    console.log('FIX 4b: Added .page-toolbar overflow: visible');
  }
}

console.log('\nAll fixes applied successfully!');
