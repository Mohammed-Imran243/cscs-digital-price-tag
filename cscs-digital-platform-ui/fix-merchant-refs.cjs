const fs = require('fs');

let content = fs.readFileSync('src/pages/Templates.tsx', 'utf8');

// Remove all references to 'merchant' tab in comparisons
// since merchant tab no longer exists as a valid value

// Fix 1: useEffect that checks for merchant tab
content = content.replace(
  "if (activeMenuTab === 'merchant' || activeMenuTab === 'store') {\n      fetchTemplatesList();\n    }",
  "if (activeMenuTab === 'store') {\n      fetchTemplatesList();\n    }"
);

// Fix 2: filteredTemplates derived check
content = content.replace(
  "if (activeMenuTab === 'store' || activeMenuTab === 'merchant') {",
  "if (activeMenuTab === 'store') {"
);

// Fix 3: fetchTemplatesList checks
content = content.replace(
  "if (activeMenuTab === 'store') {\n      storeId = selectedStore || (stores.length > 0 ? stores[0].storeId : '');\n    } else if (activeMenuTab === 'merchant') {",
  "if (activeMenuTab === 'store') {\n      storeId = selectedStore || (stores.length > 0 ? stores[0].storeId : '');\n    } else if (false) { // merchant tab removed"
);

// Fix 4: Any remaining merchant comparisons
content = content.replace(/activeMenuTab === 'merchant' \|\| /g, "");
content = content.replace(/ \|\| activeMenuTab === 'merchant'/g, "");
content = content.replace(/activeMenuTab === 'merchant' && /g, "false && ");
content = content.replace(/ && activeMenuTab === 'merchant'/g, "");
content = content.replace(/\(activeMenuTab === 'merchant'\)/g, "(false)");
content = content.replace(/activeMenuTab === 'merchant'/g, "false");

fs.writeFileSync('src/pages/Templates.tsx', content);
console.log("Removed all merchant tab references from Templates.tsx");
