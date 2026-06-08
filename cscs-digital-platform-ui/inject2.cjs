const fs = require("fs");
const path = "D:/cscs-digital-price-tag/cscs-digital-platform-ui/src/pages/Templates.tsx";
let content = fs.readFileSync(path, "utf8");

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

fs.writeFileSync(path, content, "utf8");
console.log("Done");
