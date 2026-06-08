using System;
using System.IO;

class Program {
    static void Main() {
        string path = @"D:\cscs-digital-price-tag\cscs-digital-platform-ui\src\pages\Templates.tsx";
        string content = File.ReadAllText(path);

        // 1. Add imports
        content = content.Replace("  getStoreIcons\n} from '../services/templateService';", "  getStoreIcons,\n  deleteStoreIcon\n} from '../services/templateService';");
        content = content.Replace("import { CustomSelect } from '../components/common/CustomSelect';", "import { CustomSelect } from '../components/common/CustomSelect';\nimport { StoreIconUploadModal } from '../components/templates/StoreIconUploadModal';");

        // 2. Add handleDeleteStoreIcon
        string deleteTemplateEnd = "    });\n  };\n";
        int idx = content.IndexOf(deleteTemplateEnd);
        if (idx != -1) {
            string injection = @"
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
";
            content = content.Insert(idx + deleteTemplateEnd.Length, injection);
        }

        // 3. Add onClick to trash
        content = content.Replace("<button className=\"icon-action danger\" title=\"Delete / حذف\">", "<button className=\"icon-action danger\" title=\"Delete / حذف\" onClick={() => handleDeleteStoreIcon(icon.id)}>");

        // 4. Inject Modal at the correct location
        string modalTarget = "      </div>\n    );\n\n  // Modular Template Table renderer";
        string modalInjection = @"
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

  // Modular Template Table renderer";
        content = content.Replace(modalTarget, modalInjection);

        File.WriteAllText(path, content, System.Text.Encoding.UTF8);
        Console.WriteLine(""Done."");
    }
}
