const fs = require('fs');
let code = fs.readFileSync('src/pages/Products.tsx', 'utf8');

const copyFn = `  const handleCopyProduct = (product: Product) => {
    setNewProduct({
      productCode: '',
      barCode: '',
      itemTitle: product.itemName || '',
      price: product.price ? String(product.price) : '',
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      vipPrice: (product as any).vipPrice ? String((product as any).vipPrice) : '',
      unit: product.unit || '1PCS',
      spec: product.spec || '',
      productLabel: product.productLabel || '',
      origin: product.origin || '',
      attrCategory: product.attrCategory || '',
      attrName: product.attrName || '',
      storeId: selectedStore,
    });
    setIsModalOpen(true);
    showNotification('Product copied. Please set a new Barcode before saving.', 'success');
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsViewOnly(false);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Product',
      message: \`Are you sure you want to delete \${product.itemName} (\${product.barcode})?\`,
      onConfirm: async () => {
        setLoading(true);
        try {
          await deleteProductFromStore(product.id, selectedStore, product.barcode);
          showNotification('Product deleted successfully', 'success');
          fetchProducts();
        } catch (err) {
          showNotification('Failed to delete product', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };
`;

if (!code.includes('const handleCopyProduct = (product: Product) => {')) {
  const targetStr = 'const handleCloseModal =';
  const idx = code.indexOf(targetStr);
  if (idx !== -1) {
    code = code.substring(0, idx) + copyFn + '\\n  ' + code.substring(idx);
    fs.writeFileSync('src/pages/Products.tsx', code);
  }
}
