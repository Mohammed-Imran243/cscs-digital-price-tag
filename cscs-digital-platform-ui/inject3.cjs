const fs = require("fs");
const path = "D:/cscs-digital-price-tag/cscs-digital-platform-ui/src/pages/Templates.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  "  getStoreIcons\n} from '../services/templateService';", 
  "  getStoreIcons,\n  deleteStoreIcon\n} from '../services/templateService';"
);
content = content.replace(
  "import { CustomSelect } from '../components/common/CustomSelect';", 
  "import { CustomSelect } from '../components/common/CustomSelect';\nimport { StoreIconUploadModal } from '../components/templates/StoreIconUploadModal';"
);

fs.writeFileSync(path, content, "utf8");
console.log("Done");
