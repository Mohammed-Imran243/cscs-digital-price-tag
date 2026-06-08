const fs = require("fs");
const path = "D:/cscs-digital-price-tag/cscs-digital-platform-ui/src/pages/Templates.tsx";
let content = fs.readFileSync(path, "utf8");

// 1. Add imports
content = content.replace(
  "  getStoreIcons\n} from '../services/templateService';", 
  "  getStoreIcons,\n  deleteStoreIcon\n} from '../services/templateService';"
);
content = content.replace(
  "import { CustomSelect } from '../components/common/CustomSelect';", 
  "import { CustomSelect } from '../components/common/CustomSelect';\nimport { StoreIconUploadModal } from '../components/templates/StoreIconUploadModal';"
);

// 2. Add handleDeleteStoreIcon
const deleteTemplateEnd = "    });\n  };\n";
const idx = content.indexOf(deleteTemplateEnd);
if (idx !== -1) {
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
  content = content.slice(0, idx + deleteTemplateEnd.length) + injection + content.slice(idx + deleteTemplateEnd.length);
}

// 3. Add onClick to trash
content = content.replace(
  '<button className="icon-action danger" title="Delete / حذف">', 
  '<button className="icon-action danger" title="Delete / حذف" onClick={() => handleDeleteStoreIcon(icon.id)}>'
);

// 4. Inject Modal
const modalTarget = "      </div>\n    );\n\n  // Modular Template Table renderer";
const modalInjection = `
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

  // Modular Template Table renderer`;

content = content.replace(modalTarget, modalInjection);

fs.writeFileSync(path, content, "utf8");
console.log("Done");
