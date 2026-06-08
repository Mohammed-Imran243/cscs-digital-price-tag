const fs = require("fs");
const path = "D:/cscs-digital-price-tag/cscs-digital-platform-ui/src/pages/Stores.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  `title="Store Management / إدارة المتاجر /"`,
  `title="Store Management / إدارة المتاجر"`
);

fs.writeFileSync(path, content, "utf8");
console.log("Replaced:", !content.includes(`title="Store Management / إدارة المتاجر /"`));
