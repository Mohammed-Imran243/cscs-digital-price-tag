const fs = require("fs");
const path = "D:/cscs-digital-price-tag/cscs-digital-platform-ui/src/pages/Users.tsx";
let content = fs.readFileSync(path, "utf8");

// 1. Permissions Selected and Available Permissions
content = content.replace(
  "Permissions Selected: {roleFormData.menuIdList.length}",
  "Permissions Selected: {roleFormData.menuIdList.length} / الصلاحيات المحددة: {roleFormData.menuIdList.length}"
).replace(
  "Available Permissions: {availablePermissions.length}",
  "Available Permissions: {availablePermissions.length} / الصلاحيات المتاحة: {availablePermissions.length}"
);

// 2. EQUIPMENT
// The menuName mapping:
// menuName: String(item.menuName || item.name || item.title || `Permission ${item.id}`),
content = content.replace(
  "menuName: String(item.menuName || item.name || item.title || `Permission ${item.id}`),",
  "menuName: String(item.menuName || item.name || item.title || `Permission ${item.id}`) === 'EQUIPMENT' ? 'EQUIPMENT / المعدات' : String(item.menuName || item.name || item.title || `Permission ${item.id}`),"
);

fs.writeFileSync(path, content, "utf8");
console.log("Done");
