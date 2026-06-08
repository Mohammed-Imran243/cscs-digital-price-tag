const fs = require("fs");
const path = "D:/cscs-digital-price-tag/cscs-digital-platform-ui/src/components/common/PageHeader.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  "{title} / {titleAr}",
  "{title}{titleAr ? ` / ${titleAr}` : ''}"
);

fs.writeFileSync(path, content, "utf8");
console.log("Done");
