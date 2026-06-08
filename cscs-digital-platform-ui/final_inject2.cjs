const fs = require("fs");
const path = "D:/cscs-digital-price-tag/cscs-digital-platform-ui/src/pages/Templates.tsx";
let content = fs.readFileSync(path, "utf8");

// 1. Imports
content = content.replace(
  "  getStoreIcons\r\n} from '../services/templateService';", 
  "  getStoreIcons,\r\n  deleteStoreIcon\r\n} from '../services/templateService';"
).replace(
  "  getStoreIcons\n} from '../services/templateService';", 
  "  getStoreIcons,\n  deleteStoreIcon\n} from '../services/templateService';"
);

content = content.replace(
  "import { CustomSelect } from '../components/common/CustomSelect';", 
  "import { CustomSelect } from '../components/common/CustomSelect';\nimport { StoreIconUploadModal } from '../components/templates/StoreIconUploadModal';"
);

// 2. handleDeleteStoreIcon
const injection = `
  const handleDeleteStoreIcon = (id: string | number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Store Icon / حذف أيقونة المتجر',
      message: 'Are you sure you want to delete this store icon? / هل أنت متأكد أنك تريد حذف أيقونة المتجر هذه؟',
      onConfirm: async () => {
        try {
          await deleteStoreIcon(id);
          showNotification('Store icon deleted successfully', 'success');
          getStoreIcons(0, 1000, { storeId: selectedStore }).then(response => {
            if (response && (response.content || response.list || response.data)) {
              setStoreIcons(response.content || response.list || response.data || []);
            } else if (response && Array.isArray(response)) {
              setStoreIcons(response);
            }
          }).catch(console.error);
        } catch (err: any) {
          showNotification('Failed to delete store icon.', 'error');
        }
      }
    });
  };
`;

content = content.replace(
  "  const handleCreateCategory = async (e: React.FormEvent) => {",
  injection + "\n  const handleCreateCategory = async (e: React.FormEvent) => {"
);

// 3. Add onClick to trash
// Instead of matching Arabic exact text, match regex:
content = content.replace(
  /className="icon-action danger" title="Delete \/ [^"]*">/, 
  'className="icon-action danger" title="Delete / حذف" onClick={() => handleDeleteStoreIcon(icon.id)}>'
);

// 4. Inject Modal at the END of templates-dashboard BEFORE `}</style>`
// We match:
//        `}</style>
//      </div>
//    );
//
//  // Modular
//
content = content.replace(
  /        `\}<\/style>\r?\n      <\/div>\r?\n    \);\r?\n\r?\n  \/\/ Modular/g,
  "        `}</style>\n" +
`        <StoreIconUploadModal
          isOpen={isStoreIconModalOpen}
          onClose={() => setIsStoreIconModalOpen(false)}
          onConfirm={() => {
            setIsStoreIconModalOpen(false);
            getStoreIcons(0, 1000, { storeId: selectedStore }).then(response => {
              if (response && (response.content || response.list || response.data)) {
                setStoreIcons(response.content || response.list || response.data || []);
              } else if (response && Array.isArray(response)) {
                setStoreIcons(response);
              }
            }).catch(console.error);
          }}
          showNotification={showNotification}
          storeId={selectedStore}
        />
      </div>
    );

  // Modular`
);

fs.writeFileSync(path, content, "utf8");
console.log("Imports missing?", !content.includes("deleteStoreIcon"));
console.log("Modal missing?", !content.includes("StoreIconUploadModal"));
console.log("Function missing?", !content.includes("handleDeleteStoreIcon"));
console.log("Trash missing?", !content.includes("icon.id"));
