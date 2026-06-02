import React, { useState, useEffect, useRef } from 'react';

import { getProducts, createProduct, updateProductPrice, deleteProductFromStore, deleteProductGlobal } from '../services/productService';
import type { Product, ProductCreateRequest } from '../services/productService';
import { storeService } from '../services/storeService';
import type { Store } from '../services/storeService';
import { Search, Plus, Loader2, AlertTriangle, RefreshCw, Package, Store as StoreIcon, Settings } from 'lucide-react';
import { getPaginationRange } from '../utils/paginationUtils';
import { getTemplates, getCategories, getTemplateTypes } from '../services/templateService';

interface SearchableDropdownProps {
  label: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
  loading?: boolean;
  error?: string | null;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  loading = false,
  error = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hasTyped, setHasTyped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== search) {
      setSearch(value);
      setHasTyped(false);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHasTyped(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = (options || []).filter(option => {
    if (!option) return false;
    if (!hasTyped) return true;
    const optStr = String(option).toLowerCase();
    const searchStr = (search || '').toLowerCase();
    return optStr.includes(searchStr);
  });

  return (
    <div className="searchable-dropdown-container" ref={containerRef}>
      <label>{label}</label>
      <div className="dropdown-input-wrapper">
        <input
          required={required}
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            const val = e.target.value;
            setSearch(val);
            onChange(val);
            setIsOpen(true);
            setHasTyped(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setHasTyped(false);
          }}
          className="glass-input dropdown-input"
        />
        {isOpen && (
          <div className="dropdown-options-list">
            {loading ? (
              <div className="dropdown-loading" style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 className="animate-spin" size={16} /> Loading... / جاري التحميل...
              </div>
            ) : error ? (
              <div className="dropdown-no-options text-danger" style={{ padding: '10px 16px', color: 'var(--danger-color)', fontSize: '14px' }}>
                {error}
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="dropdown-no-options" style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                No options found / لم يتم العثور على خيارات
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  className="dropdown-option-item"
                  onClick={() => {
                    onChange(option);
                    setSearch(option);
                    setIsOpen(false);
                    setHasTyped(false);
                  }}
                >
                  {option}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Products: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const prevSearchRef = useRef('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
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
    }, 3000);
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
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>({
    id: '',
    productCode: '',
    barCode: '',
    itemTitle: '',
    price: 0,
    originalPrice: 0,
    vipPrice: '',
    attrCategory: '',
    attrName: '',
    unit: '1PCS',
    spec: '',
    productLabel: '',
    origin: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  
  // New Product State
  const [newProduct, setNewProduct] = useState({
    productCode: '',
    barCode: '',
    itemTitle: '',
    price: '',
    originalPrice: '',
    vipPrice: '',
    unit: '1PCS',
    spec: '',
    productLabel: '',
    origin: '',
    attrCategory: '',
    attrName: '',
    storeId: '',
  });

  // Fetch available templates for store
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [apiTemplateTypes, setApiTemplateTypes] = useState<string[]>([]);
  const [typesLoading, setTypesLoading] = useState<boolean>(false);
  const [typesError, setTypesError] = useState<string | null>(null);

  useEffect(() => {
    if ((isModalOpen || isEditModalOpen) && selectedStore) {
      const fetchTemplates = async () => {
        try {
          const response = await getTemplates(0, 500, { storeId: selectedStore });
          if (response && response.content) {
            setAvailableTemplates(response.content);
          }
        } catch (err) {
          console.error('Failed to fetch templates', err);
        }
      };

      const fetchCategories = async () => {
        setCategoriesLoading(true);
        setCategoriesError(null);
        try {
          const response = await getCategories();
          if (response && Array.isArray(response)) {
            const mapped = response.map((c: any) => {
              if (c && typeof c === 'object') {
                return c.categoryName || '';
              }
              return String(c);
            }).filter(Boolean);
            setApiCategories(mapped);
          }
        } catch (err) {
          console.error('Failed to fetch categories', err);
          setCategoriesError('Failed to load template categories. / فشل تحميل تصنيفات القوالب.');
        } finally {
          setCategoriesLoading(false);
        }
      };

      const fetchTemplateTypesData = async () => {
        setTypesLoading(true);
        setTypesError(null);
        try {
          const response = await getTemplateTypes();
          console.log('Template types loaded:', response);
          if (response && Array.isArray(response)) {
            setApiTemplateTypes(response);
          }
        } catch (err) {
          console.error('Failed to fetch template types', err);
          setTypesError('Failed to load template types. / فشل تحميل أنواع القوالب.');
        } finally {
          setTypesLoading(false);
        }
      };

      fetchTemplates();
      fetchCategories();
      fetchTemplateTypesData();
    }
  }, [isModalOpen, isEditModalOpen, selectedStore]);


  const handleTemplateNameChange = (name: string) => {
    setNewProduct(prev => {
      const updated = { ...prev, attrName: name };
      const matchedTemp = availableTemplates.find(t => t.templateName === name);
      if (matchedTemp && matchedTemp.attrCategory) {
        updated.attrCategory = matchedTemp.attrCategory;
      }
      return updated;
    });
  };

  const handleCategoryChange = (category: string) => {
    setNewProduct(prev => ({
      ...prev,
      attrCategory: category,
      attrName: availableTemplates.some(t => (t.attrCategory || '').toLowerCase() === (category || '').toLowerCase() && t.templateName === prev.attrName)
        ? prev.attrName
        : ''
    }));
  };

  const handleEditTemplateNameChange = (name: string) => {
    setEditingProduct((prev: any) => {
      const updated = { ...prev, attrName: name };
      const matchedTemp = availableTemplates.find(t => t.templateName === name);
      if (matchedTemp && matchedTemp.attrCategory) {
        updated.attrCategory = matchedTemp.attrCategory;
      }
      return updated;
    });
  };

  const handleEditCategoryChange = (category: string) => {
    setEditingProduct((prev: any) => ({
      ...prev,
      attrCategory: category,
      attrName: availableTemplates.some(t => (t.attrCategory || '').toLowerCase() === (category || '').toLowerCase() && t.templateName === prev.attrName)
        ? prev.attrName
        : ''
    }));
  };

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
      const searchTerm = debouncedSearch.trim();
      const isSearchingNewTerm = prevSearchRef.current !== debouncedSearch;
      prevSearchRef.current = debouncedSearch;
      const activePage = isSearchingNewTerm ? 0 : (currentPage - 1);
      if (isSearchingNewTerm) setCurrentPage(1);

      const data = await getProducts(
        selectedStore,
        activePage,
        pageSize,
        undefined,
        searchTerm || undefined
      );
      const contentList = data.content || [];
      setProducts(contentList);

      let total = data.totalElements || 0;
      if (contentList.length === 0 && currentPage > 1 && !isSearchingNewTerm) {
        total = (currentPage - 1) * pageSize;
      }
      setTotalElements(total);

      const computedTotalPages = Math.ceil(total / pageSize) || 1;
      if (currentPage > computedTotalPages && !isSearchingNewTerm) {
        setCurrentPage(computedTotalPages);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
      showNotification('Failed to query products. / فشل الاستعلام عن المنتجات.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Load filter dropdown data on mount
  useEffect(() => {
    const loadFilterData = async () => {
      // Categories
      setCategoriesLoading(true);
      try {
        const response = await getCategories();
        if (response && Array.isArray(response)) {
          const mapped = response.map((c: any) => {
            if (c && typeof c === 'object') return c.categoryName || '';
            return String(c);
          }).filter(Boolean);
          setApiCategories(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch categories', err);
      } finally {
        setCategoriesLoading(false);
      }

      // Template Types
      setTypesLoading(true);
      try {
        const response = await getTemplateTypes();
        if (response && Array.isArray(response)) {
          setApiTemplateTypes(response);
        }
      } catch (err) {
        console.error('Failed to fetch template types', err);
      } finally {
        setTypesLoading(false);
      }
    };

    loadFilterData();
  }, []); // runs once on mount

  useEffect(() => {
    if (selectedStore) {
      fetchProducts();
      setNewProduct(prev => ({ ...prev, storeId: selectedStore }));
    }
  }, [selectedStore, currentPage, pageSize, debouncedSearch]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProduct.barCode?.trim()) {
      showNotification('Barcode is required / الرمز الشريطي مطلوب', 'error');
      return;
    }
    if (!newProduct.itemTitle?.trim()) {
      showNotification('Product name is required / اسم المنتج مطلوب', 'error');
      return;
    }
    if (newProduct.price === '' || isNaN(parseFloat(newProduct.price))) {
      showNotification('Selling price is required / سعر البيع مطلوب', 'error');
      return;
    }
    if (!newProduct.attrCategory?.trim()) {
      showNotification('Template category is required / تصنيف القالب مطلوب', 'error');
      return;
    }
    if (!newProduct.attrName?.trim()) {
      showNotification('Template type is required / نوع القالب مطلوب', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const payload: ProductCreateRequest = {
        itemTitle: newProduct.itemTitle,
        productCode: newProduct.productCode || undefined,
        barCode: newProduct.barCode,
        price: parseFloat(newProduct.price) || 0,
        originalPrice: newProduct.originalPrice ? parseFloat(newProduct.originalPrice) : undefined,
        vipPrice: newProduct.vipPrice || undefined,
        unit: newProduct.unit || undefined,
        spec: newProduct.spec || undefined,
        productLabel: newProduct.productLabel || undefined,
        origin: newProduct.origin || undefined,
        storeId: selectedStore,
        attrCategory: newProduct.attrCategory,
        attrName: newProduct.attrName,
      };
      await createProduct(payload);
      setIsModalOpen(false);
      setNewProduct({
        productCode: '',
        barCode: '',
        itemTitle: '',
        price: '',
        originalPrice: '',
        vipPrice: '',
        unit: '1PCS',
        spec: '',
        productLabel: '',
        origin: '',
        attrCategory: '',
        attrName: '',
        storeId: selectedStore,
      });
      fetchProducts();
      showNotification('Product added successfully / تمت إضافة المنتج بنجاح', 'success');
    } catch (err: any) {
      console.error('Failed to create product', err);
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      showNotification(`Failed to add product: ${msg} / فشل إضافة المنتج: ${msg}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteStoreOnly = (product: Product) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Product From Store / حذف المنتج من المتجر',
      message: 'This removes the product from this store only. Other stores are not affected. / سيزيل هذا المنتج من هذا المتجر فقط.',
      onConfirm: async () => {
        try {
          await deleteProductFromStore(product.id, selectedStore, product.barcode);
          showNotification('Product removed from store successfully / تم حذف المنتج من المتجر بنجاح', 'success');
          // Remove deleted product from local state immediately
          setProducts(prev => prev.filter(p => p.id !== product.id));
          // Then refresh from server after delay
          setTimeout(() => fetchProducts(), 2000);
        } catch (err: any) {
          console.error('Failed to delete product', err);
          const msg = err.response?.data?.message || err.message || 'Unknown error';
          showNotification(`Failed to delete product from store: ${msg} / فشل حذف المنتج من المتجر: ${msg}`, 'error');
        }
      }
    });
  };
  
  const handleDeleteGlobal = (product: Product) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Global Delete / حذف نهائي',
      message: 'WARNING: This permanently deletes the product from ALL stores and breaks any bound ESL tags. This cannot be undone. / تحذير: سيحذف هذا المنتج نهائياً من جميع المتاجر.',
      onConfirm: async () => {
        try {
          await deleteProductGlobal(product.id, product.barcode);
          showNotification('Product deleted globally successfully / تم حذف المنتج نهائياً بنجاح', 'success');
          // Remove deleted product from local state immediately
          setProducts(prev => prev.filter(p => p.id !== product.id));
          // Then refresh from server after delay
          setTimeout(() => fetchProducts(), 2000);
        } catch (err: any) {
          console.error('Failed to delete product', err);
          const msg = err.response?.data?.message || err.message || 'Unknown error';
          showNotification(`Failed to delete product globally: ${msg} / فشل حذف المنتج نهائياً: ${msg}`, 'error');
        }
      }
    });
  };

  const openEditProductModal = (product: Product, viewOnly = false) => {
    setIsViewOnly(viewOnly);
    setEditingProduct({
      id: product.id,
      productCode: product.barcode,
      barCode: product.barcode,
      itemTitle: product.itemName,
      price: parseFloat(product.price) || 0,
      originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : 0,
      vipPrice: product.vipPrice || '',
      attrCategory: product.attrCategory || product.category || '',
      attrName: product.attrName || '', 
      unit: product.unit || '1PCS',
      spec: product.spec || '',
      productLabel: product.productLabel || '',
      origin: product.origin || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct.barCode?.trim()) {
      showNotification('Barcode is required / الرمز الشريطي مطلوب', 'error');
      return;
    }
    if (!editingProduct.itemTitle?.trim()) {
      showNotification('Product name is required / اسم المنتج مطلوب', 'error');
      return;
    }
    if (editingProduct.price === undefined || editingProduct.price === null || isNaN(editingProduct.price)) {
      showNotification('Selling price is required / سعر البيع مطلوب', 'error');
      return;
    }
    if (!editingProduct.attrCategory?.trim()) {
      showNotification('Template category is required / تصنيف القالب مطلوب', 'error');
      return;
    }
    if (!editingProduct.attrName?.trim()) {
      showNotification('Template type is required / نوع القالب مطلوب', 'error');
      return;
    }

    if (isViewOnly) return;
    setIsUpdating(true);
    try {
      await updateProductPrice(editingProduct.id, selectedStore, {
        price: editingProduct.price,
        itemTitle: editingProduct.itemTitle,
        productCode: editingProduct.productCode || editingProduct.barCode,
        barCode: editingProduct.barCode,
        originalPrice: editingProduct.originalPrice || 0,
        attrCategory: editingProduct.attrCategory,
        attrName: editingProduct.attrName,
        unit: editingProduct.unit || '1PCS',
        vipPrice: editingProduct.vipPrice,
        spec: editingProduct.spec,
        origin: editingProduct.origin,
        productLabel: editingProduct.productLabel
      });
      setIsEditModalOpen(false);
      fetchProducts();
      showNotification('Product updated successfully / تم تحديث المنتج بنجاح', 'success');
    } catch (err: any) {
      console.error('Failed to update product', err);
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      showNotification(`Failed to update product: ${msg} / فشل تحديث المنتج: ${msg}`, 'error');
    } finally {
      setIsUpdating(false);
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

    {/* Confirmation Dialog */}
    {confirmDialog?.isOpen && (
      <div className="modal-overlay confirm-dialog-overlay">
        <div className="modal-content confirm-dialog glass-card">
          <h3>{confirmDialog.title}</h3>
          <p>{confirmDialog.message}</p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setConfirmDialog(null)}>Cancel / إلغاء</button>
            <button className="btn-primary danger" onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}>Confirm / تأكيد</button>
          </div>
        </div>
      </div>
    )}

    {/* Page Header */}
    <div className="page-header">
      <div>
        <h2>Product Management / إدارة المنتجات</h2>
      </div>
      <div className="header-actions">
        <div className="store-selector-wrapper">
          <StoreIcon size={16} className="text-muted" />
          <select 
            value={selectedStore} 
            onChange={(e) => setSelectedStore(e.target.value)}
            className="glass-select"
          >
            <option value="">Select a Store... / اختر متجراً...</option>
            {stores.map(store => (
              <option key={store.storeId} value={store.storeId}>
                {store.storeName} {store.externalStoreId ? `(${store.externalStoreId})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="global-search-bar">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Search products... / ابحث عن المنتجات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-secondary" onClick={() => fetchProducts()} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh / تحديث
        </button>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add / إضافة
        </button>
      </div>
    </div>

    {/* Unified Product Cards Grid */}
    {!selectedStore ? (
      <div className="zkong-no-data">
        <AlertTriangle size={40} className="text-warning" />
        <p>Please select a store / يرجى اختيار متجر</p>
      </div>
    ) : loading ? (
      <div className="zkong-no-data">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p>Loading... / جاري التحميل...</p>
      </div>
    ) : products.length === 0 ? (
      <div className="zkong-no-data">
        <AlertTriangle size={40} className="text-warning" />
        <p>No products found / لا توجد منتجات</p>
      </div>
    ) : (
      <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))', gap: '20px', width: '100%', marginBottom: '24px' }}>
        {products.map(product => (
          <div key={product.id} className="store-card glass-card" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', background: 'var(--glass-card)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
            <div className="store-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div className="store-icon-wrapper" style={{ width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary-color), #8b5cf6)', color: 'white' }}>
                <Package size={20} />
              </div>
              <div className="store-badge status-active" style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary-color)' }}>
                {product.unit || '1PCS'}
              </div>
            </div>

            <div className="store-card-body" style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 className="product-title-card" style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', minHeight: '44px', lineHeight: '1.4' }}>
                {product.itemName}
              </h3>
              <p className="store-id" style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', margin: '0 0 6px 0' }}>
                <span>Item Code: </span>
                <strong style={{ color: 'var(--text-secondary)' }}>{product.barcode || '—'}</strong>
              </p>
              <p className="store-id" style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', margin: '0 0 12px 0' }}>
                <span>Barcode: </span>
                <strong style={{ color: 'var(--text-secondary)' }}>{product.barcode || '—'}</strong>
              </p>

              <div className="store-info-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span>Selling Price:</span>
                  <strong style={{ color: 'var(--primary-color)', fontWeight: '700' }}>{product.price ? `${product.price} SAR` : '—'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span>Original Price:</span>
                  <span style={{ fontWeight: '500' }}>{product.originalPrice && parseFloat(product.originalPrice) > 0 ? `${product.originalPrice} SAR` : '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span>VIP Price:</span>
                  <span style={{ fontWeight: '500' }}>{(product as any).vipPrice ? `${(product as any).vipPrice} SAR` : '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span>Category:</span>
                  <span style={{ fontWeight: '500' }}>{product.attrCategory || product.category || '—'}</span>
                </div>
              </div>
            </div>

            <div className="store-card-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--glass-border)', marginTop: '14px' }}>
              <button className="op-btn primary-btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openEditProductModal(product)}>
                Edit / تعديل
              </button>
              <button className="op-btn danger-btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleDeleteGlobal(product)}>
                Delete Globally / حذف نهائي
              </button>
              <button className="op-btn info-btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleDeleteStoreOnly(product)}>
                Delete from Store / حذف من المتجر
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Pagination Bar */}
    {totalElements > 0 && (
      <div className="dragonesl-pagination-bar glass-card">
        <div className="pagination-left">
          <span className="pagination-total">Total {totalElements} items / الإجمالي {totalElements} عناصر</span>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="pagination-size-select">
            <option value={5}>5/page</option>
            <option value={10}>10/page</option>
            <option value={20}>20/page</option>
            <option value={50}>50/page</option>
            <option value={100}>100/page</option>
            <option value={500}>500/page</option>
            <option value={1000}>1000/page</option>
          </select>
        </div>
        <div className="pagination-right">
          <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} className="pagination-arrow-btn">&lt;</button>
          {getPaginationRange(currentPage, totalPages, 1).map((pageNum, idx) => (
            pageNum === '...' ? (
              <span key={`dots-${idx}`} className="pagination-dots">...</span>
            ) : (
              <button key={pageNum} type="button" onClick={() => setCurrentPage(Number(pageNum))} className={`pagination-num-btn ${currentPage === pageNum ? 'active' : ''}`}>{pageNum}</button>
            )
          ))}
          <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} className="pagination-arrow-btn">&gt;</button>
          <div className="pagination-jump">
            <span>Go to / الذهاب إلى</span>
            <input type="number" min={1} max={totalPages} value={currentPage} onChange={(e) => { const val = Number(e.target.value); if (val >= 1 && val <= totalPages) setCurrentPage(val); }} className="pagination-jump-input" />
          </div>
        </div>
      </div>
    )}

    {/* ── CREATE MODAL — keep exactly as-is ── */}
    {isModalOpen && (
      <div className="modal-overlay">
        <div className="modal-content glass-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          <div className="modal-header">
            <h3>Create New Product / إنشاء منتج جديد</h3>
            <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
          </div>
          <form onSubmit={handleCreateProduct} className="create-form">
            <div className="form-row">
              <div className="form-group">
                <label>Commodity Code / كود السلعة</label>
                <input
                  type="text"
                  className="glass-input"
                  value={newProduct.productCode}
                  onChange={e => setNewProduct(prev => ({ ...prev, productCode: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Commodity Barcode <span className="required-asterisk">*</span> / باركود السلعة <span className="required-asterisk">*</span></label>
                <input
                  required
                  type="text"
                  className="glass-input"
                  value={newProduct.barCode}
                  onChange={e => setNewProduct(prev => ({ ...prev, barCode: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Commodity Name <span className="required-asterisk">*</span> / اسم السلعة <span className="required-asterisk">*</span></label>
              <input
                required
                type="text"
                className="glass-input"
                value={newProduct.itemTitle}
                onChange={e => setNewProduct(prev => ({ ...prev, itemTitle: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Selling Price (SAR) <span className="required-asterisk">*</span> / سعر البيع (ر.س) <span className="required-asterisk">*</span></label>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="glass-input"
                  value={newProduct.price}
                  onChange={e => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Original Price / السعر الأصلي</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="glass-input"
                  value={newProduct.originalPrice}
                  onChange={e => setNewProduct(prev => ({ ...prev, originalPrice: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>VIP Price / سعر VIP</label>
                <input
                  type="number"
                  step="0.01"
                  className="glass-input"
                  placeholder="0.00"
                  value={newProduct.vipPrice || ''}
                  onChange={e => setNewProduct(prev => ({ ...prev, vipPrice: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Unit / الوحدة</label>
                <input
                  type="text"
                  className="glass-input"
                  value={newProduct.unit}
                  onChange={e => setNewProduct(prev => ({ ...prev, unit: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <SearchableDropdown
                  required={true}
                  label={<span>Template Category / تصنيف القالب <span className="required-asterisk">*</span></span>}
                  value={newProduct.attrCategory || ''}
                  options={apiCategories}
                  loading={categoriesLoading}
                  error={categoriesError}
                  onChange={handleCategoryChange}
                  placeholder="Search template category... / ابحث عن تصنيف القالب..."
                />
              </div>
              <div className="form-group">
                <SearchableDropdown
                  required={true}
                  label={<span>Template Type / نوع القالب <span className="required-asterisk">*</span></span>}
                  value={newProduct.attrName || ''}
                  options={apiTemplateTypes}
                  loading={typesLoading}
                  error={typesError}
                  onChange={handleTemplateNameChange}
                  placeholder="Search template type... / ابحث عن نوع القالب..."
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Spec / المواصفات</label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. 500ml, 1kg / مثل: 500 مل، 1 كجم"
                  value={newProduct.spec || ''}
                  onChange={e => setNewProduct(prev => ({ ...prev, spec: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Product Label / تصنيف المنتج</label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. New, Sale, Hot / مثل: جديد، تخفيض"
                  value={newProduct.productLabel || ''}
                  onChange={e => setNewProduct(prev => ({ ...prev, productLabel: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Origin / المنشأ</label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. Saudi Arabia / المملكة العربية السعودية"
                value={newProduct.origin || ''}
                onChange={e => setNewProduct(prev => ({ ...prev, origin: e.target.value }))}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel / إلغاء</button>
              <button type="submit" className="btn-primary" disabled={isCreating}>
                {isCreating ? <Loader2 className="animate-spin" size={18} /> : 'Add Product / إنشاء منتج'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* ── EDIT MODAL — keep exactly as-is ── */}
    {isEditModalOpen && (
      <div className="modal-overlay">
        <div className="modal-content glass-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          <div className="modal-header">
            <h3>{isViewOnly ? 'View Product / عرض المنتج' : 'Edit Product / تعديل المنتج'}</h3>
            <button className="close-btn" onClick={() => { setIsEditModalOpen(false); setIsViewOnly(false); }}>&times;</button>
          </div>
          <form onSubmit={handleUpdateProduct} className="create-form">
            <div className="form-row">
              <div className="form-group">
                <label>Commodity Code / كود السلعة</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  value={editingProduct.productCode} 
                  onChange={e => setEditingProduct((prev: any) => ({ ...prev, productCode: e.target.value }))} 
                />
              </div>
              <div className="form-group">
                <label>Commodity Barcode <span className="required-asterisk">*</span> / باركود السلعة <span className="required-asterisk">*</span></label>
                <input 
                  required 
                  readOnly 
                  type="text" 
                  className="glass-input readonly-input" 
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                  value={editingProduct.barCode} 
                />
              </div>
            </div>
            <div className="form-group">
              <label>Commodity Name <span className="required-asterisk">*</span> / اسم السلعة <span className="required-asterisk">*</span></label>
              <input 
                required 
                type="text" 
                className="glass-input" 
                value={editingProduct.itemTitle} 
                onChange={e => setEditingProduct((prev: any) => ({ ...prev, itemTitle: e.target.value }))} 
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Selling Price (SAR) <span className="required-asterisk">*</span> / سعر البيع (ر.س) <span className="required-asterisk">*</span></label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  className="glass-input" 
                  value={editingProduct.price === 0 && !editingProduct.price ? '' : editingProduct.price} 
                  onChange={e => setEditingProduct((prev: any) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} 
                />
              </div>
              <div className="form-group">
                <label>Original Price / السعر الأصلي</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  className="glass-input" 
                  value={editingProduct.originalPrice === 0 && !editingProduct.originalPrice ? '' : editingProduct.originalPrice} 
                  onChange={e => setEditingProduct((prev: any) => ({ ...prev, originalPrice: parseFloat(e.target.value) || 0 }))} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>VIP Price / سعر VIP</label>
                <input
                  type="number"
                  step="0.01"
                  className="glass-input"
                  placeholder="0.00"
                  value={editingProduct.vipPrice || ''}
                  onChange={e => setEditingProduct((prev: any) => ({ ...prev, vipPrice: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Unit / الوحدة</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  value={editingProduct.unit} 
                  onChange={e => setEditingProduct((prev: any) => ({ ...prev, unit: e.target.value }))} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <SearchableDropdown
                  required={true}
                  label={<span>Template Category / تصنيف القالب <span className="required-asterisk">*</span></span>}
                  value={editingProduct.attrCategory || ''}
                  options={apiCategories}
                  loading={categoriesLoading}
                  error={categoriesError}
                  onChange={handleEditCategoryChange}
                  placeholder="Search template category... / ابحث عن تصنيف القالب..."
                />
              </div>
              <div className="form-group">
                <SearchableDropdown
                  required={true}
                  label={<span>Template Type / نوع القالب <span className="required-asterisk">*</span></span>}
                  value={editingProduct.attrName || ''}
                  options={apiTemplateTypes}
                  loading={typesLoading}
                  error={typesError}
                  onChange={handleEditTemplateNameChange}
                  placeholder="Search template type... / ابحث عن نوع القالب..."
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Spec / المواصفات</label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. 500ml, 1kg / مثل: 500 مل، 1 كجم"
                  value={editingProduct.spec || ''}
                  onChange={e => setEditingProduct((prev: any) => ({ ...prev, spec: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Product Label / تصنيف المنتج</label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. New, Sale, Hot / مثل: جديد، تخفيض"
                  value={editingProduct.productLabel || ''}
                  onChange={e => setEditingProduct((prev: any) => ({ ...prev, productLabel: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Origin / المنشأ</label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. Saudi Arabia / المملكة العربية السعودية"
                value={editingProduct.origin || ''}
                onChange={e => setEditingProduct((prev: any) => ({ ...prev, origin: e.target.value }))}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => { setIsEditModalOpen(false); setIsViewOnly(false); }}>Cancel / إلغاء</button>
              {!isViewOnly && (
                <button type="submit" className="btn-primary" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes / حفظ التغييرات'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    )}

      <style>{`
        .required-asterisk {
          color: #ef4444;
          margin-left: 3px;
          font-weight: 700;
        }

        .products-page {
          padding: 24px;
        }

        .store-selector-wrapper {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          gap: 10px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          box-shadow: var(--shadow-sm);
        }

        .store-selector-wrapper select {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 600;
          outline: none;
          cursor: pointer;
        }

        .store-selector-wrapper select option {
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .toast-notification {
          position: fixed;
          top: 24px;
          right: 24px;
          padding: 16px 24px;
          border-radius: 8px;
          z-index: 9999;
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

        .product-card-actions {
          display: flex;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid var(--glass-border);
          margin-top: auto;
        }

        .btn-text {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .btn-text:hover {
          background: rgba(59, 130, 246, 0.1);
        }

        .btn-text.edit-btn {
          color: var(--primary-color);
        }
        .btn-text.edit-btn:hover {
          background: rgba(59, 130, 246, 0.1);
        }

        .btn-text.disable-btn {
          color: #f59e0b;
        }
        .btn-text.disable-btn:hover {
          background: rgba(245, 158, 11, 0.1);
        }

        .btn-text.delete-btn {
          color: var(--danger-color);
        }
        .btn-text.delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
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

        /* Modal Styles with dynamic themes */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6) !important;
          backdrop-filter: blur(4px) !important;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          width: 100%;
          max-width: 500px;
          padding: 32px;
          background: var(--bg-secondary) !important;
          color: var(--text-primary) !important;
          border-radius: 12px !important;
          border: 1px solid var(--border-color) !important;
          box-shadow: var(--shadow-md) !important;
          backdrop-filter: none !important;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-header h3 {
          color: var(--text-primary) !important;
          font-weight: 700 !important;
          margin: 0 !important;
        }

        .close-btn {
          background: none !important;
          border: none !important;
          font-size: 24px !important;
          color: var(--text-muted) !important;
          cursor: pointer !important;
        }

        .close-btn:hover {
          color: var(--text-primary) !important;
        }

        .form-group label {
          font-size: 13px !important;
          color: var(--text-secondary) !important;
          font-weight: 600 !important;
        }

        /* Override glass-input inside modal */
        .modal-content .glass-input {
          background-color: var(--bg-primary) !important;
          border: 1px solid var(--border-color) !important;
          color: var(--text-primary) !important;
          padding: 12px !important;
          border-radius: 8px !important;
          width: 100%;
          box-sizing: border-box;
        }

        .modal-content .glass-input:focus {
          border-color: var(--primary-color) !important;
          outline: none !important;
        }

        /* Searchable dropdown options inside Products modal */
        .modal-content .dropdown-options-list {
          background: var(--bg-secondary) !important;
          border: 1px solid var(--border-color) !important;
          box-shadow: var(--shadow-sm) !important;
          backdrop-filter: none !important;
        }

        .modal-content .dropdown-option-item {
          color: var(--text-secondary) !important;
          border-bottom: 1px solid var(--border-color) !important;
          background: transparent !important;
        }

        .modal-content .dropdown-option-item:hover {
          background: var(--bg-accent) !important;
          color: var(--primary-color) !important;
        }

        .modal-content .dropdown-no-options {
          color: var(--text-muted) !important;
        }

        /* Buttons inside the modal action footer */
        .modal-content .btn-secondary {
          background: var(--bg-accent) !important;
          color: var(--text-secondary) !important;
          border: 1px solid var(--border-color) !important;
        }
        .modal-content .btn-secondary:hover {
          background: var(--glass-border) !important;
          color: var(--text-primary) !important;
        }
        
        .modal-content .confirm-dialog p {
          color: var(--text-secondary) !important;
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
          background-color: rgba(255, 255, 255, 0.05);
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

        .searchable-dropdown-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
        }

        .dropdown-input-wrapper {
          position: relative;
        }

        .dropdown-input {
          width: 100%;
          box-sizing: border-box;
          padding-right: 40px !important;
        }

        .dropdown-options-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1050;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
        }

        .dropdown-option-item {
          padding: 10px 16px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          color: var(--text-primary);
          font-size: 14px;
          text-align: left;
        }

        .dropdown-option-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--primary-color);
        }

        .dropdown-no-options {
          padding: 12px 16px;
          color: var(--text-muted);
          font-size: 14px;
          font-style: italic;
          text-align: center;
        }

        .edit-price-form input {
          width: 100px;
          padding: 6px;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .header-actions {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }
          .products-grid {
            grid-template-columns: 1fr;
          }
          .form-row {
            flex-direction: column;
          }
          .search-bar {
            flex-direction: column;
            align-items: stretch;
          }
        }

        /* ── Product Tabs Navigation — matches Devices ESL/AP tab style ── */
        .product-tabs-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          padding: 12px 16px;
          background: var(--glass-bg, rgba(255,255,255,0.04));
          border: 1px solid var(--glass-border, rgba(255,255,255,0.08));
          border-radius: 12px;
        }

        .product-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .product-tab-btn.active {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.4);
          color: var(--primary-color);
        }

        .product-tab-btn:hover:not(.active) {
          background: rgba(255,255,255,0.06);
          color: var(--text-primary);
          border-color: rgba(255,255,255,0.12);
        }

        /* ── Filter Bar ── */
        .product-filter-bar {
          display: flex;
          gap: 20px;
          align-items: center;
          padding: 16px 24px 20px 24px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--glass-border);
        }

        .filter-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filter-item label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
        }

        .filter-select {
          padding: 8px 14px !important;
          font-size: 13px !important;
          min-width: 160px !important;
          border-radius: 8px !important;
          border: 1px solid var(--glass-border) !important;
          background: rgba(255,255,255,0.04) !important;
          color: var(--text-primary) !important;
          cursor: pointer;
          outline: none;
        }

        .filter-select:focus {
          border-color: var(--primary-color) !important;
        }

        /* ── Table Container ── */
        .zkong-table-container {
          overflow-x: auto;
          overflow-y: visible;
          padding: 0;
          border-radius: 12px;
        }

        .zkong-table-wrapper {
          overflow-x: auto;
          width: 100%;
        }

        .zkong-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .zkong-table thead tr {
          background: rgba(255,255,255,0.025);
        }

        .zkong-table th {
          padding: 13px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          border-bottom: 1px solid var(--glass-border);
          white-space: nowrap;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .zkong-table td {
          padding: 13px 16px;
          color: var(--text-primary);
          border-bottom: 1px solid rgba(255,255,255,0.04);
          white-space: nowrap;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 13px;
        }

        .zkong-table tbody tr:hover td {
          background: rgba(255,255,255,0.03);
        }

        .zkong-table tbody tr:last-child td {
          border-bottom: none;
        }

        .zkong-table td:last-child {
          overflow: visible;
          max-width: none;
          white-space: nowrap;
        }

        .zkong-no-data {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          gap: 16px;
          color: var(--text-muted);
          font-size: 14px;
        }

        /* ── Operation Buttons ── */
        .op-buttons {
          display: flex;
          gap: 6px;
          align-items: center;
          min-width: max-content;
        }

        .op-btn {
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .op-btn:hover {
          filter: brightness(1.2);
          transform: translateY(-1px);
        }

        .op-btn.primary-btn {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .op-btn.danger-btn {
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }

        .op-btn.success-btn {
          background: rgba(16, 185, 129, 0.12);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        .op-btn.info-btn {
          background: rgba(99, 102, 241, 0.12);
          color: #a5b4fc;
          border: 1px solid rgba(99, 102, 241, 0.25);
        }

        /* ── Store Operation Layout ── */
        .store-operation-layout {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
        }

        .store-op-subtabs {
          display: flex;
          gap: 0;
          padding: 16px 24px 0 24px;
          border-bottom: 1px solid var(--glass-border);
          background: rgba(255,255,255,0.02);
        }

        .store-op-subtab-btn {
          padding: 10px 24px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          border-radius: 0;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: -1px;
        }

        .store-op-subtab-btn.active {
          color: var(--primary-color);
          border-bottom-color: var(--primary-color);
        }

        .store-op-subtab-btn:hover:not(.active) {
          color: var(--text-primary);
        }

        .store-op-split {
          display: flex;
          min-height: 500px;
        }

        .store-op-left-panel {
          width: 280px;
          min-width: 240px;
          padding: 16px;
          border-right: 1px solid var(--glass-border);
          overflow-y: auto;
          max-height: 600px;
          background: rgba(255,255,255,0.01);
        }

        .store-op-left-header {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .store-op-item-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .store-op-item-row {
          display: flex;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s;
          align-items: flex-start;
          border-left: 3px solid transparent;
        }

        .store-op-item-row:hover {
          background: rgba(255,255,255,0.05);
        }

        .store-op-item-row.selected {
          background: rgba(59,130,246,0.1);
          border-left-color: var(--primary-color);
        }

        .item-index {
          font-size: 11px;
          color: var(--text-muted);
          min-width: 18px;
          margin-top: 3px;
        }

        .item-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .item-barcode {
          font-size: 11px;
          color: var(--text-muted);
          font-family: monospace;
        }

        .item-name {
          font-size: 12px;
          color: var(--text-primary);
          font-weight: 500;
          line-height: 1.3;
          white-space: normal;
          word-break: break-word;
        }

        .store-op-right-panel {
          flex: 1;
          overflow-x: auto;
          padding: 20px 24px;
        }
      `}</style>
    </div>
  );
};

export default Products;
