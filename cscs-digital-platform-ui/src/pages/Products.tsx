import React, { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProductPrice, deleteProductFromStore, deleteProductGlobal } from '../services/productService';
import type { Product, ProductCreateRequest } from '../services/productService';
import { storeService } from '../services/storeService';
import type { Store } from '../services/storeService';
import { Search, Plus, Loader2, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import { getPaginationRange } from '../utils/paginationUtils';

const Products: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Custom alert/confirm / notification state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStore, debouncedSearch]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [editItem, setEditItem] = useState<{ id: string, price: string } | null>(null);
  
  // New Product State
  const [newProduct, setNewProduct] = useState<ProductCreateRequest>({
    itemTitle: '',
    barCode: '',
    price: 0,
    originalPrice: 0,
    storeId: '',
    unit: '1PCS',
    attrCategory: 'General',
    attrName: 'Normal Price'
  });

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      fetchProducts();
      setNewProduct(prev => ({ ...prev, storeId: selectedStore }));
    } else {
      setProducts([]);
    }
  }, [selectedStore, currentPage, pageSize, debouncedSearch]);

  const fetchStores = async () => {
    try {
      const response = await storeService.getAllStores();
      if (response && response.length > 0) {
        setStores(response);
        setSelectedStore(response[0].storeId);
      }
    } catch (err) {
      console.error('Failed to fetch stores', err);
    }
  };

  const fetchProducts = async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const data = await getProducts(selectedStore, currentPage - 1, pageSize, undefined, debouncedSearch);
      setProducts(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch products', err);
      showNotification('Failed to query products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createProduct(newProduct);
      setIsModalOpen(false);
      setNewProduct({
        ...newProduct,
        itemTitle: '',
        barCode: '',
        price: 0,
        originalPrice: 0
      });
      fetchProducts();
      showNotification('Product successfully created!', 'success');
    } catch (err: any) {
      console.error('Failed to create product', err);
      showNotification(err.message || 'Failed to create product', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteStoreOnly = (product: Product) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Product from Store',
      message: `Are you sure you want to delete "${product.itemName}" (${product.barcode}) from THIS STORE ONLY?`,
      onConfirm: async () => {
        try {
          await deleteProductFromStore(product.id, product.storeId, product.barcode);
          fetchProducts();
          showNotification('Product deleted from store.', 'success');
        } catch (err: any) {
          console.error('Failed to delete product', err);
          showNotification(err.message || 'Failed to delete product', 'error');
        }
      }
    });
  };
  
  const handleDeleteGlobal = (product: Product) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Global Product Deletion',
      message: `WARNING: Delete "${product.itemName}" (${product.barcode}) from ALL STORES? This will break any price tags associated with it.`,
      onConfirm: async () => {
        try {
          await deleteProductGlobal(product.id, product.barcode);
          fetchProducts();
          showNotification('Product deleted globally.', 'success');
        } catch (err: any) {
          console.error('Failed to delete product globally', err);
          showNotification(err.message || 'Failed to delete product globally', 'error');
        }
      }
    });
  };

  const handleUpdatePrice = async (id: string, newPrice: string) => {
    try {
      await updateProductPrice(id, selectedStore, parseFloat(newPrice));
      setEditItem(null);
      fetchProducts();
      showNotification('Price successfully updated!', 'success');
    } catch (err: any) {
      console.error('Failed to update price', err);
      showNotification(err.message || 'Failed to update price', 'error');
    }
  };

  const totalPages = Math.ceil(totalElements / pageSize) || 1;

  return (
    <div className="products-page">
      {/* Toast Notification */}
      {notification && (
        <div className={`toast-notification ${notification.type} glass-card`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmDialog?.isOpen && (
        <div className="modal-overlay confirm-dialog-overlay">
          <div className="modal-content confirm-dialog glass-card">
            <h3>{confirmDialog.title}</h3>
            <p>{confirmDialog.message}</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmDialog(null)}>Cancel</button>
              <button className="btn-primary danger" onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(null);
              }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h2>Product Management</h2>
          <p className="text-muted">Manage products and prices across your stores.</p>
        </div>
        <div className="header-actions">
          <select 
            className="store-selector glass-input"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            <option value="">Select a Store...</option>
            {stores.map(store => (
              <option key={store.storeId} value={store.storeId}>{store.storeName} ({store.storeId})</option>
            ))}
          </select>
          <button 
            className="btn-primary" 
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedStore}
          >
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div className="search-bar glass-card">
        <Search size={20} className="text-muted" />
        <input 
          type="text" 
          placeholder="Search products by barcode or name (auto-updates)..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="products-grid">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state glass-card">
            <AlertTriangle size={48} className="text-warning mb-4" />
            <h3>No Products Found</h3>
            <p>There are no products in this store matching your search.</p>
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} className="product-card glass-card">
              <div className="product-header">
                <span className={`status-badge ${product.status ? product.status.toLowerCase() : 'inactive'}`}>
                  {product.status || 'Unknown'}
                </span>
                <div className="actions">
                  <button className="icon-btn danger" onClick={() => handleDeleteStoreOnly(product)} title="Delete from Store">
                    <Trash2 size={16} />
                  </button>
                  <button className="icon-btn warning" onClick={() => handleDeleteGlobal(product)} title="Delete Globally">
                    <AlertTriangle size={16} />
                  </button>
                </div>
              </div>
              
              <div className="product-details">
                <h3 className="product-title">{product.itemName}</h3>
                <p className="product-code">Barcode: <strong>{product.barcode}</strong></p>
                <p className="product-code">Internal ID: {product.id}</p>
                
                <div className="price-section">
                  {editItem?.id === product.id ? (
                    <div className="edit-price-form">
                      <input 
                        type="number" 
                        value={editItem.price}
                        onChange={(e) => setEditItem({ ...editItem, price: e.target.value })}
                        className="glass-input"
                        autoFocus
                      />
                      <button className="btn-primary sm" onClick={() => handleUpdatePrice(product.id, editItem.price)}>Save</button>
                      <button className="btn-secondary sm" onClick={() => setEditItem(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="price-display">
                      <span className="currency">SAR</span>
                      <span className="amount">{product.price}</span>
                      <button className="icon-btn edit" onClick={() => setEditItem({ id: product.id, price: product.price })}>
                        <Edit2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Premium Zkong/DragonESL Pagination */}
      {totalElements > 0 && (
        <div className="dragonesl-pagination-bar glass-card">
          <div className="pagination-left">
            <span className="pagination-total">Total {totalElements} items</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="pagination-size-select"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>

          <div className="pagination-right">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="pagination-arrow-btn"
            >
              &lt;
            </button>

            {getPaginationRange(currentPage, totalPages, 1).map((pageNum, idx) => (
              pageNum === '...' ? (
                <span key={`dots-${idx}`} className="pagination-dots">...</span>
              ) : (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(Number(pageNum))}
                  className={`pagination-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              )
            ))}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="pagination-arrow-btn"
            >
              &gt;
            </button>

            <div className="pagination-jump">
              <span>Go to</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 1 && val <= totalPages) {
                    setCurrentPage(val);
                  }
                }}
                className="pagination-jump-input"
              />
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h3>Create New Product</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateProduct} className="create-form">
              <div className="form-group">
                <label>Item Title</label>
                <input required type="text" value={newProduct.itemTitle} onChange={e => setNewProduct({...newProduct, itemTitle: e.target.value})} className="glass-input" />
              </div>
              <div className="form-group">
                <label>Barcode</label>
                <input required type="text" value={newProduct.barCode} onChange={e => setNewProduct({...newProduct, barCode: e.target.value})} className="glass-input" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (SAR)</label>
                  <input required type="number" step="0.01" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="glass-input" />
                </div>
                <div className="form-group">
                  <label>Original Price</label>
                  <input type="number" step="0.01" value={newProduct.originalPrice || ''} onChange={e => setNewProduct({...newProduct, originalPrice: parseFloat(e.target.value)})} className="glass-input" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <input type="text" value={newProduct.attrCategory} onChange={e => setNewProduct({...newProduct, attrCategory: e.target.value})} className="glass-input" />
                </div>
                <div className="form-group">
                  <label>Price Name</label>
                  <input type="text" value={newProduct.attrName} onChange={e => setNewProduct({...newProduct, attrName: e.target.value})} className="glass-input" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isCreating}>
                  {isCreating ? <Loader2 className="animate-spin" size={18} /> : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .products-page {
          padding: 24px;
        }

        .toast-notification {
          position: fixed;
          top: 24px;
          right: 24px;
          padding: 16px 24px;
          border-radius: 8px;
          z-index: 1100;
          font-weight: 500;
          animation: slideIn 0.3s ease-out;
        }

        .toast-notification.success {
          border-left: 4px solid var(--success-color);
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .toast-notification.error {
          border-left: 4px solid var(--danger-color);
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .toast-notification.warning {
          border-left: 4px solid var(--warning-color);
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .confirm-dialog {
          max-width: 400px !important;
        }

        .confirm-dialog h3 {
          margin-bottom: 12px;
          color: var(--text-primary);
        }

        .confirm-dialog p {
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 24px;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .store-selector {
          padding: 10px 16px;
          border-radius: 8px;
          min-width: 200px;
          outline: none;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          margin-bottom: 32px;
        }

        .search-bar input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 16px;
          outline: none;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .product-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: transform 0.2s;
        }

        .product-card:hover {
          transform: translateY(-4px);
        }

        .product-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.active, .status-badge.online {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success-color);
        }

        .status-badge.inactive, .status-badge.offline {
          background: rgba(148, 163, 184, 0.1);
          color: var(--text-muted);
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .icon-btn.edit { color: var(--primary-color); }
        .icon-btn.danger { color: var(--danger-color); }
        .icon-btn.warning { color: var(--warning-color); }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .product-title {
          font-size: 18px;
          margin-bottom: 8px;
        }

        .product-code {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .price-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--glass-border);
        }

        .price-display {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .currency {
          font-size: 14px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .amount {
          font-size: 28px;
          font-weight: 800;
          color: var(--primary-color);
        }

        .edit-price-form {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .edit-price-form input {
          width: 100px;
          padding: 6px 10px;
        }

        .btn-primary.sm, .btn-secondary.sm {
          padding: 6px 12px;
          font-size: 13px;
        }

        .btn-secondary {
          background: rgba(148, 163, 184, 0.2);
          color: var(--text-primary);
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          width: 100%;
          max-width: 500px;
          padding: 32px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: var(--text-muted);
          cursor: pointer;
        }

        .create-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .form-row .form-group {
          flex: 1;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .glass-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px;
          border-radius: 8px;
          color: var(--text-primary);
        }

        .glass-input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .loading-state, .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          text-align: center;
          color: var(--text-muted);
        }

        .pagination-dots {
          color: var(--text-muted);
          padding: 8px 12px;
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default Products;
