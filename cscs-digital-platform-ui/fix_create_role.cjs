const fs = require("fs");
const path = "D:/cscs-digital-price-tag/cscs-digital-platform-ui/src/pages/Users.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  "isEditingRole ? 'Save Changes' : 'Create Role'",
  "isEditingRole ? 'Save Changes / حفظ التغييرات' : 'Create Role / إنشاء دور'"
);

fs.writeFileSync(path, content, "utf8");
console.log("Done");
