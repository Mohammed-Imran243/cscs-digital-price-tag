const fs = require("fs");
const path = "D:/cscs-digital-price-tag/cscs-digital-platform-ui/src/pages/Users.tsx";
let content = fs.readFileSync(path, "utf8");

// Fix double labels
content = content.replace(
  "Permissions Selected: {roleFormData.menuIdList.length} / الصلاحيات المحددة: {roleFormData.menuIdList.length}",
  "Permissions Selected / الصلاحيات المحددة: {roleFormData.menuIdList.length}"
).replace(
  "Available Permissions: {availablePermissions.length} / الصلاحيات المتاحة: {availablePermissions.length}",
  "Available Permissions / الصلاحيات المتاحة: {availablePermissions.length}"
);

// Fix EQUIPMENT check: use a function to check case-insensitive
content = content.replace(
  /menuName:\s*String\(item\.menuName\s*\|\|\s*item\.name\s*\|\|\s*item\.title\s*\|\|\s*`Permission \$\{item\.id\}`\)\s*===\s*'EQUIPMENT'\s*\?\s*'EQUIPMENT \/\s*المعدات'\s*:\s*String\(item\.menuName\s*\|\|\s*item\.name\s*\|\|\s*item\.title\s*\|\|\s*`Permission \$\{item\.id\}`\),/,
  `menuName: (() => {
          let name = String(item.menuName || item.name || item.title || \`Permission \${item.id}\`);
          if (name.trim().toLowerCase() === 'equipment') return 'EQUIPMENT / المعدات';
          return name;
        })(),`
);

fs.writeFileSync(path, content, "utf8");
console.log("Double strings fixed?", content.includes("Permissions Selected / الصلاحيات المحددة"));
console.log("Equipment check replaced?", content.includes("name.trim().toLowerCase() === 'equipment'"));
