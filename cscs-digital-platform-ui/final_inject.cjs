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
content = content.replace(
  '<button className="icon-action danger" title="Delete / حذف">', 
  '<button className="icon-action danger" title="Delete / حذف" onClick={() => handleDeleteStoreIcon(icon.id)}>'
);

// 4. Inject Modal
// We inject right before "  // Modular Template Table renderer to prevent redundancy"
content = content.replace(
  "  // Modular Template Table renderer to prevent redundancy",
`
        <StoreIconUploadModal
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

  // Modular Template Table renderer to prevent redundancy`
);

// Also we need to remove the closing div and return from where they were so we don't have duplicates.
// The file has:
//        `}</style>
//      </div>
//    );
//
//  // Modular Template Table renderer to prevent redundancy
// We want to delete the </div> and ); from the original place.
content = content.replace(
  "        `}</style>\r\n      </div>\r\n    );\r\n\r\n  // Modular",
  "        `}</style>\r\n  // Modular"
).replace(
  "        `}</style>\n      </div>\n    );\n\n  // Modular",
  "        `}</style>\n  // Modular"
);

fs.writeFileSync(path, content, "utf8");
console.log("Imports missing?", !content.includes("deleteStoreIcon"));
console.log("Modal missing?", !content.includes("StoreIconUploadModal"));
console.log("Function missing?", !content.includes("handleDeleteStoreIcon"));
console.log("Trash missing?", !content.includes("icon.id"));
