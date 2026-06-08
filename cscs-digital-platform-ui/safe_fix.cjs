const fs = require("fs");
const path = "D:/cscs-digital-price-tag/cscs-digital-platform-ui/src/pages/Users.tsx";
let content = fs.readFileSync(path, "utf8");

const word1 = Buffer.from("2KfZhNmF2LnYr9in2Ko=", "base64").toString("utf8");
const word2 = Buffer.from("2KfZhNi12YTYp9it2YrYp9iqINin2YTZhdit2K/Yr9ip", "base64").toString("utf8");
const word3 = Buffer.from("2KfZhNi12YTYp9it2YrYp9iqINin2YTZhdiq2KfYrdip", "base64").toString("utf8");

content = content.replace(
  /if \(name\.trim\(\)\.toLowerCase\(\) === 'equipment'\) return 'EQUIPMENT \/ .*?';/,
  `if (name.trim().toLowerCase() === 'equipment') return 'EQUIPMENT / ${word1}';`
);

content = content.replace(
  /<span className="permission-stat-badge highlight">Permissions Selected \/ .*?: \{roleFormData\.menuIdList\.length\}<\/span>/,
  `<span className="permission-stat-badge highlight">Permissions Selected / ${word2}: {roleFormData.menuIdList.length}</span>`
);

content = content.replace(
  /<span className="permission-stat-badge">Available Permissions \/ .*?: \{availablePermissions\.length\}<\/span>/,
  `<span className="permission-stat-badge">Available Permissions / ${word3}: {availablePermissions.length}</span>`
);

fs.writeFileSync(path, content, "utf8");
console.log("Replaced 1:", content.includes(word1));
console.log("Replaced 2:", content.includes(word2));
console.log("Replaced 3:", content.includes(word3));
