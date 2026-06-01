import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  getTemplates,
  getCategories,
  addCategory,
  getModels,
  updateTemplateBase,
  deleteTemplate,
  enableTemplate,
  getTemplateTypes,
  getStoreIcons
} from '../services/templateService';
import type {
  Template,
  TemplateCategory,
  PriceTagModel,
  TemplateCreateRequest
} from '../services/templateService';
import { storeService } from '../services/storeService';
import type { Store } from '../services/storeService';
import { getProducts } from '../services/productService';
import {
  Plus,
  Loader2,
  RefreshCw,
  Search,
  Layers,
  Trash2,
  FolderOpen,
  Edit
} from 'lucide-react';

import { getEslModelSpecs, renderEinkLayout } from '../utils/eslModelUtils';
import { getPaginationRange } from '../utils/paginationUtils';


const COLOR_MAPPINGS: Record<number, { key: string; label: string }> = {
  1: { key: 'bw', label: 'Black/White / أسود/أبيض' },
  2: { key: 'bwr', label: 'Black/White/Red / أسود/أبيض/أحمر' },
  3: { key: 'bwy', label: 'Black/White/Yellow / أسود/أبيض/أصفر' },
  4: { key: 'bwry', label: 'Black/White/Red/Yellow / أسود/أبيض/أحمر/أصفر' },
  5: { key: 'multi', label: 'Multi-color / متعدد الألوان' }
};

const Templates: React.FC = () => {
  const { t: translate } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab') || 'merchant';
  const activeMenuTab = tabParam === 'icon' ? 'store_icon' : 
                        tabParam === 'properties' ? 'properties' : 
                        tabParam === 'store' ? 'store' :
                        tabParam === 'business_icon' ? 'business_icon' : 'merchant';

  // Sub-navigation State for Merchant Template Tab (Zkong Scenario tabs)
  const [merchantScenario, setMerchantScenario] = useState<number>(1); // 1: Single, 4: Multi, 3: Segment, 2: Unbind

  // Live Lookups
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [templateTypes, setTemplateTypes] = useState<string[]>([]);
  const [models, setModels] = useState<PriceTagModel[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // Filtering States for Merchant / Store Templates
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [filterSize, setFilterSize] = useState<string>('All');
  const [filterColor, setFilterColor] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  // Main Templates Data

  const [templates, setTemplates] = useState<Template[]>([]);
  const fetchRequestId = useRef(0);

  const filteredTemplates = useMemo(() => {
    let result = templates;
    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      result = result.filter(t => 
        (t.templateName && t.templateName.toLowerCase().includes(q)) ||
        (t.attrName && t.attrName.toLowerCase().includes(q)) ||
        (t.templateNumber && t.templateNumber.toLowerCase().includes(q)) ||
        (t.id && String(t.id).includes(q))
      );
    }
    return result;
  }, [templates, debouncedSearchQuery]);
  const [storeIcons, setStoreIcons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Custom confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Template Properties (Tab 5) State
  const [selectedPropertyCat, setSelectedPropertyCat] = useState<string>('default');
  const [categoryAttributes, setCategoryAttributes] = useState<Record<string, string[]>>({
    default: ['default'],
    Thobe: ['size', 'color', 'fabric', 'custFeature1'],
    ALL: ['price', 'originalPrice', 'itemName', 'barcode'],
    K0001: ['price', 'itemName', 'barcode', 'storeName'],
    K0002: ['itemCode', 'price', 'originalPrice']
  });
  const [newAttributeName, setNewAttributeName] = useState('');
  const [isAddAttrOpen, setIsAddAttrOpen] = useState(false);

  // Creation Modals & Submitting States
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [sampleProducts, setSampleProducts] = useState<any[]>([]);
  const [selectedSampleProductId, setSelectedSampleProductId] = useState<string>('');
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  const [popoverProduct, setPopoverProduct] = useState<any>(null);
  const [popoverLoading, setPopoverLoading] = useState<boolean>(false);

  // Edit template modal state
  const [editTemplateModal, setEditTemplateModal] = useState<{ id: string; templateName: string; attrCategory: string } | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Form inputs
  const [newTemplate, setNewTemplate] = useState<TemplateCreateRequest>({
    templateName: '',
    storeId: '0',
    model: '',
    size: '',
    resolution: '152*152',
    color: '',
    sceneNumber: 1,
    screenType: 'single',
    attrCategory: '',
    attrName: ''
  });
  const [newCategoryName, setNewCategoryName] = useState('');

  // Notification Toast Banner
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Fetch lookups on mount
  useEffect(() => {
    fetchLookups();
  }, []);

  // Check for navigation toast messages
  useEffect(() => {
    if (location.state && location.state.toastMessage) {
      showNotification(location.state.toastMessage, location.state.toastType || 'success');
      // Clear state so refresh doesn't trigger it again
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync templates list based on filters/tabs
  useEffect(() => {
    if (activeMenuTab === 'merchant' || activeMenuTab === 'store') {
      fetchTemplatesList();
    } else if (activeMenuTab === 'store_icon') {
      fetchStoreIconsList();
    }
  }, [activeMenuTab, merchantScenario, selectedStore, filterSize, filterColor, filterCategory, page, pageSize]);

  // Fetch sample products when opening a preview template
  useEffect(() => {
    if (previewTemplate) {
      const loadSampleProducts = async () => {
        try {
          const storeIdToUse = (activeMenuTab === 'store' && selectedStore) ? selectedStore : (selectedStore || (stores.length > 0 ? stores[0].storeId : ''));
          const response = await getProducts(storeIdToUse, 0, 20);
          if (response && response.content && response.content.length > 0) {
            setSampleProducts(response.content);
            setSelectedSampleProductId(response.content[0].id);
          }
        } catch (err) {
          console.error('Failed to load sample products for template preview:', err);
        }
      };
      loadSampleProducts();
    } else {
      setSampleProducts([]);
      setSelectedSampleProductId('');
    }
  }, [previewTemplate]);

  const handleMouseEnterThumbnail = async (templateId: string, attrCategory: string) => {
    setActivePopoverId(templateId);
    setPopoverLoading(true);
    setPopoverProduct(null);
    try {
      const storeIdToUse = (activeMenuTab === 'store' && selectedStore) ? selectedStore : (selectedStore || (stores.length > 0 ? stores[0].storeId : ''));
      const response = await getProducts(storeIdToUse, 0, 20);
      if (response && response.content && response.content.length > 0) {
        const matched = response.content.find((p: any) => 
          p.categoryName?.toLowerCase() === attrCategory?.toLowerCase() ||
          p.itemName?.toLowerCase().includes(attrCategory?.toLowerCase())
        ) || response.content[0];
        setPopoverProduct(matched);
      }
    } catch (err) {
      console.error('Failed to fetch product for popover:', err);
    } finally {
      setPopoverLoading(false);
    }
  };

  const handleMouseLeaveThumbnail = () => {
    setActivePopoverId(null);
    setPopoverProduct(null);
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const fetchLookups = async () => {
    try {
      // 1. Fetch Categories
      const catData = await getCategories();
      if (catData && Array.isArray(catData)) {
        const mappedCats = catData.map((c: any, index: number) => {
          let name = '';
          if (c && typeof c === 'object') {
            name = c.categoryName || '';
          } else {
            name = String(c);
          }
          return {
            id: index,
            categoryName: name
          };
        }).filter(item => item.categoryName);
        setCategories(mappedCats);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }

    try {
      // 2. Fetch Template Types
      const typesData = await getTemplateTypes();
      if (typesData && Array.isArray(typesData)) {
        const mapped = typesData.map((t: any) => {
          if (typeof t === 'string') return t;
          if (t && typeof t === 'object') return t.attrName || t.name || t.typeName || String(t);
          return String(t);
        }).filter(Boolean);
        setTemplateTypes(mapped);
      } else {
        setTemplateTypes([]);
      }
    } catch (err) {
      console.error('Failed to load template types', err);
    }

    setModelsLoading(true);
    setModelsError(null);
    try {
      // 3. Fetch tag models
      const modelData = await getModels();
      setModels(modelData || []);
    } catch (err) {
      console.error('Failed to load hardware models', err);
      setModelsError('Failed to load hardware models. / فشل تحميل طرز الأجهزة.');
    } finally {
      setModelsLoading(false);
    }

    setStoresLoading(true);
    setStoresError(null);
    try {
      // 4. Fetch stores
      const response = await storeService.getAllStores();
      if (response && response.length > 0) {
        setStores(response);
        setSelectedStore(response[0].storeId);
      }
    } catch (err) {
      console.error('Failed to load active stores', err);
      setStoresError('Failed to load active stores. / فشل تحميل المتاجر النشطة.');
    } finally {
      setStoresLoading(false);
    }
  };

  const fetchTemplatesList = async () => {
    setLoading(true);
    try {
      const searchParams: Record<string, any> = {};

      // In store template tab, filter by selected storeId. In merchant tab, storeId is empty.
      if (activeMenuTab === 'store') {
        searchParams.storeId = selectedStore;
      } else if (activeMenuTab === 'merchant') {
        // Merchant Tab - no storeId, scene number maps to sub-tabs
        searchParams.sceneNumber = merchantScenario;
      }

      if (filterSize !== 'All') {
        searchParams.size = filterSize;
      }
      if (filterCategory !== 'All') {
        searchParams.attrCategory = filterCategory;
      }
      if (filterColor !== 'All') {
        const colorMap: Record<string, number> = {
          'bw': 1,
          'bwr': 2,
          'bwy': 3,
          'bwry': 4,
          'multi': 5
        };
        searchParams.color = colorMap[filterColor] || filterColor;
      }
      if (filterType !== 'All') {
        searchParams.attrName = filterType;
      }
      // removed debouncedSearchQuery from backend search to avoid clearing local array incorrectly
      const reqId = ++fetchRequestId.current;
      const response = await getTemplates(page, pageSize, searchParams);
      if (reqId !== fetchRequestId.current) return;
      
      if (response) {
        let content = response.content || [];
        setTemplates(content);

        setTotalElements(response.totalElements || 0);
      }
    } catch (err: any) {
      console.error('Failed to query templates', err);
      showNotification('Failed to fetch template list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreIconsList = async () => {
    setLoading(true);
    try {
      const response = await getStoreIcons(page, pageSize, { storeId: selectedStore });
      if (response && (response.content || response.list || response.data)) {
        setStoreIcons(response.content || response.list || response.data || []);
        setTotalElements(response.totalElements || response.total || 0);
      } else if (response && Array.isArray(response)) {
        setStoreIcons(response);
        setTotalElements(response.length);
      } else {
        setStoreIcons([]);
        setTotalElements(0);
      }
    } catch (err: any) {
      console.error('Failed to query store icons', err);
      showNotification('Failed to fetch store icons list.', 'error');
      setStoreIcons([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string | undefined) => {
    const nextStatus = currentStatus === '1' ? '0' : '1';
    try {
      await enableTemplate(id, nextStatus);
      showNotification('Template updated successfully / تم تحديث القالب بنجاح', 'success');
      fetchTemplatesList();
    } catch (err: any) {
      showNotification('Failed to update template. Please try again. / فشل تحديث القالب. يرجى المحاولة مرة أخرى.', 'error');
    }
  };

  const handleDeleteTemplate = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Template / حذف القالب',
      message: 'Are you sure you want to delete this template from Zkong Cloud? / هل أنت متأكد أنك تريد حذف هذا القالب من سحابة Zkong؟',
      onConfirm: async () => {
        try {
          await deleteTemplate(id, '0', true);
          showNotification('Template deleted successfully / تم حذف القالب بنجاح', 'success');
          fetchTemplatesList();
        } catch (err: any) {
          showNotification('Failed to delete template. Please try again. / فشل حذف القالب. يرجى المحاولة مرة أخرى.', 'error');
        }
      }
    });
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setSubmitting(true);
    try {
      await addCategory(newCategoryName);
      showNotification('Category added successfully / تمت إضافة الفئة بنجاح', 'success');
      
      // Seed attributes record for properties tab
      setCategoryAttributes(prev => ({
        ...prev,
        [newCategoryName]: ['price', 'itemName', 'barcode']
      }));

      setNewCategoryName('');
      setIsCategoryModalOpen(false);
      fetchLookups();
    } catch (err: any) {
      console.error('Failed to add category', err);
      showNotification('Failed to add category. Please try again. / فشل إضافة الفئة. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.templateName.trim() || !newTemplate.model) return;
    
    const modelObj = models.find(m => m.model === newTemplate.model);
    const payload = {
      ...newTemplate,
      storeId: activeMenuTab === 'store' ? selectedStore : '0',
      size: newTemplate.size || modelObj?.size || '',
      resolution: newTemplate.resolution || modelObj?.resolution || '152*152',
      modelId: modelObj?.id ? `[${modelObj.id}]` : '[65]',
      sceneNumber: activeMenuTab === 'merchant' ? merchantScenario : 1,
      screenType: newTemplate.screenType || 'single',
      attrCategory: newTemplate.attrCategory || '',
      attrName: newTemplate.attrName || ''
    };

    // Redirect to the canvas editor with the template configuration
    navigate('/template/editor/new', { state: { config: payload } });
  };

  // Add attribute property under category (Tab 5 properties)
  const handleAddAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttributeName.trim()) return;
    setCategoryAttributes(prev => ({
      ...prev,
      [selectedPropertyCat]: [...(prev[selectedPropertyCat] || []), newAttributeName.trim()]
    }));
    showNotification(`Property attribute "${newAttributeName}" successfully appended!`, 'success');
    setNewAttributeName('');
    setIsAddAttrOpen(false);
  };

  // Delete attribute property
  const handleDeleteAttribute = (attr: string) => {
    setCategoryAttributes(prev => ({
      ...prev,
      [selectedPropertyCat]: prev[selectedPropertyCat].filter(a => a !== attr)
    }));
    showNotification('Property attribute deleted / تم حذف خاصية السمة', 'success');
  };

  // Update template base info (rename / category change)
  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTemplateModal) return;
    setEditSubmitting(true);
    try {
      await updateTemplateBase(editTemplateModal.id, {
        templateName: editTemplateModal.templateName,
        attrCategory: editTemplateModal.attrCategory
      } as any);
      showNotification('Template updated successfully / تم تحديث القالب بنجاح', 'success');
      setEditTemplateModal(null);
      fetchTemplatesList();
    } catch (err: any) {
      showNotification('Failed to update template. Please try again. / فشل تحديث القالب. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  const uniqueSizes = Array.from(new Set(models.map(m => m.size))).filter(Boolean);
  const uniqueColors = Array.from(new Set(models.map(m => m.color))).filter(Boolean);

  // Dynamic modal options based on selected size
  const selectedSizeModels = models.filter(m => m.size === newTemplate.size);
  const availableResolutions = Array.from(new Set(selectedSizeModels.map(m => m.resolution))).filter(Boolean);
  const selectedResModels = selectedSizeModels.filter(m => m.resolution === newTemplate.resolution);
  const availableModalColors = Array.from(new Set(selectedResModels.map(m => m.color))).filter(Boolean);

  return (
    <div className="templates-dashboard">
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
              <button className="btn-secondary" onClick={() => setConfirmDialog(null)}>Cancel / إلغاء</button>
              <button className="btn-primary danger" onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(null);
              }}>Confirm / تأكيد</button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumbs & Navigation Section */}
      <div className="top-breadcrumb" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            Template Management / إدارة القوالب
          </h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Templates &gt; <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
              {activeMenuTab === 'merchant' && 'Merchant Template / قوالب التاجر'}
              {activeMenuTab === 'store' && 'Store Template / قوالب المتجر'}
              {activeMenuTab === 'store_icon' && 'Store Icon / أيقونة المتجر'}
              {activeMenuTab === 'properties' && 'Template Properties / خصائص القالب'}
            </span>
          </div>
        </div>
        <div className="templates-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="global-search-bar">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Search templates... / ابحث عن القوالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn-secondary" onClick={fetchTemplatesList} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh / تحديث
          </button>
        </div>
      </div>

      <div className="layout-split">


        {/* Right Content Workspace */}
        <main className="content-workspace">
          
          {/* ================= SECTION 1: MERCHANT TEMPLATES ================= */}
          {activeMenuTab === 'merchant' && (
            <div className="workspace-tab-content">
              {/* Zkong Scenario Sub-tabs */}
              <div className="scenario-nav glass-card">
                <button className={`scenario-btn ${merchantScenario === 1 ? 'active' : ''}`} onClick={() => setMerchantScenario(1)}>
                  Single Item Template / قالب صنف واحد
                </button>
                {/* 
                <button className={`scenario-btn ${merchantScenario === 4 ? 'active' : ''}`} onClick={() => setMerchantScenario(4)}>
                  Multi-Item Template / قالب أصناف متعددة
                </button>
                <button className={`scenario-btn ${merchantScenario === 3 ? 'active' : ''}`} onClick={() => setMerchantScenario(3)}>
                  Segment Code Screen Template / قالب شاشة رمز القطعة
                </button>
                <button className={`scenario-btn ${merchantScenario === 2 ? 'active' : ''}`} onClick={() => setMerchantScenario(2)}>
                  Unbind Template / قالب إلغاء الربط
                </button>
                */}
              </div>

              {/* Zkong styled Filter Bar */}
              <div className="filters-form glass-card">
                <div className="filter-input-group">
                  <label>Size / الحجم</label>
                  <select value={filterSize} onChange={e => setFilterSize(e.target.value)}>
                    <option value="All">Select All / تحديد الكل</option>
                    {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="filter-input-group">
                  <label>Color / اللون</label>
                  <select value={filterColor} onChange={e => setFilterColor(e.target.value)}>
                    <option value="All">All / الكل</option>
                    {uniqueColors.map(colorCode => {
                      const config = COLOR_MAPPINGS[colorCode];
                      if (!config) return null;
                      return (
                        <option key={colorCode} value={config.key}>
                          {config.label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="filter-input-group">
                  <label>Template Category / تصنيف القالب</label>
                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="All">Select All / تحديد الكل</option>
                    {categories.map(c => <option key={c.id} value={c.categoryName}>{c.categoryName}</option>)}
                  </select>
                </div>

                <div className="filter-input-group">
                  <label>Template Type / نوع القالب</label>
                  <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="All">Select All / تحديد الكل</option>
                    {templateTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="actions-row">
                <button className="btn-primary sm-btn" onClick={() => setIsTemplateModalOpen(true)}>
                  <Plus size={16} /> New Merchant Template / قالب تاجر جديد
                </button>
                {/* 
                <button className="btn-secondary sm-btn">Import Template / استيراد قالب</button>
                <button className="btn-secondary sm-btn" onClick={fetchTemplatesList}><RefreshCw size={14} /> Refresh ESL / تحديث الشاشات</button>
                <button className="btn-secondary sm-btn">Import Template File / استيراد ملف قالب</button>
                <button className="btn-secondary sm-btn" disabled>Export Template File / تصدير ملف قالب</button>
                */}
              </div>

              {/* Data Table */}
              {renderTemplatesTable()}
            </div>
          )}

          {/* ================= SECTION 2: STORE TEMPLATES ================= */}
          {activeMenuTab === 'store' && (
            <div className="workspace-tab-content">
              {/* Store Filter Bar */}
              <div className="filters-form glass-card store-filters-layout">
                <div className="filter-input-group flex-row-item">
                  <label className="bold-label">Store Select / اختيار المتجر</label>
                  <select 
                    className="styled-select" 
                    value={selectedStore} 
                    onChange={e => setSelectedStore(e.target.value)}
                  >
                    {stores.map(s => <option key={s.storeId} value={s.storeId}>{s.storeName} {s.externalStoreId ? `(${s.externalStoreId})` : ''}</option>)}
                  </select>
                </div>

                <div className="filter-input-group">
                  <label>Size / الحجم</label>
                  <select value={filterSize} onChange={e => setFilterSize(e.target.value)}>
                    <option value="All">Select All / تحديد الكل</option>
                    {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="filter-input-group">
                  <label>Color / اللون</label>
                  <select value={filterColor} onChange={e => setFilterColor(e.target.value)}>
                    <option value="All">All / الكل</option>
                    {uniqueColors.map(colorCode => {
                      const config = COLOR_MAPPINGS[colorCode];
                      if (!config) return null;
                      return (
                        <option key={colorCode} value={config.key}>
                          {config.label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="filter-input-group">
                  <label>Template Category / تصنيف القالب</label>
                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="All">Select All / تحديد الكل</option>
                    {categories.map(c => <option key={c.id} value={c.categoryName}>{c.categoryName}</option>)}
                  </select>
                </div>

                <div className="filter-input-group">
                  <label>Template Type / نوع القالب</label>
                  <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="All">Select All / تحديد الكل</option>
                    {templateTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="actions-row">
                <button className="btn-primary sm-btn" onClick={() => setIsTemplateModalOpen(true)}>
                  <Plus size={16} /> New Store Template / قالب متجر جديد
                </button>
                {/*
                <button className="btn-secondary sm-btn">Import Merchant Template / استيراد قالب التاجر</button>
                <button className="btn-secondary sm-btn" onClick={fetchTemplatesList}><RefreshCw size={14} /> Refresh ESL / تحديث الشاشات</button>
                <button className="btn-secondary sm-btn">Import Template File / استيراد ملف قالب</button>
                <button className="btn-secondary sm-btn" disabled>Export Template File / تصدير ملف قالب</button>
                */}
              </div>

              {/* Data Table */}
              {renderTemplatesTable()}
            </div>
          )}

          {/* ================= SECTION 3: STORE ICONS ================= */}
          {activeMenuTab === 'store_icon' && (
            <div className="workspace-tab-content">
              <div className="icon-actions-bar">
                {activeMenuTab === 'store_icon' && (
                  <div className="store-selector-row">
                    <label>Store Select / اختيار المتجر: </label>
                    <select 
                      value={selectedStore} 
                      onChange={e => setSelectedStore(e.target.value)}
                      className="glass-input sm-input"
                    >
                      {stores.map(s => <option key={s.storeId} value={s.storeId}>{s.storeName} {s.externalStoreId ? `(${s.externalStoreId})` : ''}</option>)}
                    </select>
                  </div>
                )}
                <button className="btn-primary sm-btn">
                  <Plus size={16} />
                  {(activeMenuTab as string) === 'business_icon'
                    ? 'Add Merchant Icon / إضافة أيقونة التاجر'
                    : 'Add Store Icon / إضافة أيقونة المتجر'}
                </button>
              </div>

              {/* Custom Folder Empty State Table */}
              <div className="zkong-table-container glass-card">
                {loading ? (
                  <div className="zkong-no-data">
                    <Loader2 size={48} className="text-muted mb-2 animate-spin" />
                    <p>Loading Icons... / جاري تحميل الأيقونات...</p>
                  </div>
                ) : activeMenuTab === 'store_icon' && storeIcons && storeIcons.length > 0 ? (
                  <>
                    <table className="zkong-table">
                      <thead>
                        <tr>
                          <th>Serial Number / الرقم التسلسلي</th>
                          <th>Descriptive Name / الاسم الوصفي</th>
                          <th>Picture Processing Method / طريقة معالجة الصورة</th>
                          <th>Resolution / الدقة</th>
                          <th>Upload Time / وقت الرفع</th>
                          <th>Preview / معاينة</th>
                          <th>Operation / الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storeIcons.map((icon, idx) => (
                          <tr key={icon.id || idx}>
                            <td>{page * pageSize + idx + 1}</td>
                            <td>{icon.describeName || icon.fileName || icon.iconName || icon.name || '-'}</td>
                            <td>
                              {icon.parseAlgorithm === 0
                                ? 'Original / الأصلي'
                                : icon.parseAlgorithm === 1
                                ? 'Black & White / أبيض وأسود'
                                : 'Adaptive / متكيف'}
                            </td>
                            <td>{icon.width && icon.height ? `${icon.width} * ${icon.height}` : icon.resolution || '-'}</td>
                            <td>{icon.createdTime || icon.uploadTime || icon.createTime || '-'}</td>
                            <td>
                              {icon.iconUrl || icon.url ? (
                                <img
                                  src={icon.iconUrl || icon.url}
                                  alt="Store Icon"
                                  style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--glass-border)' }}
                                />
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No preview / لا معاينة</span>
                              )}
                            </td>
                            <td>
                              <div className="op-buttons">
                                <button className="op-btn danger-text" title="Delete / حذف">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <>
                    <table className="zkong-table">
                      <thead>
                        <tr>
                          <th>Serial Number / الرقم التسلسلي</th>
                          <th>Descriptive Name / الاسم الوصفي</th>
                          <th>Picture Processing Method / طريقة معالجة الصورة</th>
                          <th>Resolution / الدقة</th>
                          <th>Upload Time / وقت الرفع</th>
                          <th>Preview / معاينة</th>
                          <th>Operation / الإجراءات</th>
                        </tr>
                      </thead>
                    </table>
                    <div className="zkong-no-data">
                      <FolderOpen size={48} className="text-muted mb-2 animate-pulse" />
                      <p>No Data / لا توجد بيانات</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ================= SECTION 5: TEMPLATE PROPERTIES ================= */}
          {activeMenuTab === 'properties' && (
            <div className="workspace-tab-content properties-workspace glass-card">
              <div className="properties-layout-split">
                {/* Category Sidebar List */}
                <div className="category-properties-list">
                  <div className="list-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={16} style={{ color: 'var(--primary-color)' }} />
                    <span>Template Classifications / تصنيفات القوالب</span>
                  </div>
                  <div className="category-scroll-list">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        className={`properties-cat-btn ${selectedPropertyCat === cat.categoryName ? 'active' : ''}`}
                        onClick={() => setSelectedPropertyCat(cat.categoryName)}
                      >
                        <span>{cat.categoryName}</span>
                      </button>
                    ))}
                    {/* Hardcoded system classifications to guarantee fallback data list matching Screenshot 5 */}
                    {['default', 'Thobe', 'ALL', 'K0001', 'K0002'].map(sysName => {
                      if (categories.some(c => c.categoryName === sysName)) return null;
                      return (
                        <button
                          key={sysName}
                          className={`properties-cat-btn ${selectedPropertyCat === sysName ? 'active' : ''}`}
                          onClick={() => setSelectedPropertyCat(sysName)}
                        >
                          <span>{sysName}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button className="add-new-cat-btn" onClick={() => setIsCategoryModalOpen(true)}>
                    <Plus size={14} /> Add New Template Category / إضافة تصنيف قالب جديد
                  </button>
                </div>

                {/* Right Attributes Editor Panel */}
                <div className="properties-attributes-panel">
                  <div className="panel-header">
                    <span className="panel-title">Template Category Name / اسم تصنيف القالب: <strong>{selectedPropertyCat}</strong></span>
                    <button className="icon-edit-btn" title="Edit Category / تعديل التصنيف"><Edit size={14} /></button>
                  </div>

                  <table className="zkong-table">
                    <thead>
                      <tr>
                        <th>Serial Number / الرقم التسلسلي</th>
                        <th>Name / الاسم</th>
                        <th>Default / افتراضي</th>
                        <th>Operation / الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(categoryAttributes[selectedPropertyCat] || ['default']).map((attr, idx) => {
                        const isDefault = attr.toLowerCase() === 'default';
                        return (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>
                              <span className="attribute-name-badge">{attr}</span>
                            </td>
                            <td>
                              <span className={isDefault ? 'default-badge-yes' : 'default-badge-no'}>
                                {isDefault ? 'Yes / نعم' : 'No / لا'}
                              </span>
                            </td>
                            <td>
                              <div className="op-buttons">
                                <button 
                                  className="op-btn danger-text" 
                                  onClick={() => handleDeleteAttribute(attr)}
                                  title="Delete / حذف"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Add Attribute Properties inline form */}
                  {isAddAttrOpen ? (
                    <form onSubmit={handleAddAttribute} className="add-attribute-inline-form">
                      <input
                        required
                        type="text"
                        placeholder="Please enter attribute property name... / يرجى إدخال اسم خاصية السمة..."
                        value={newAttributeName}
                        onChange={e => setNewAttributeName(e.target.value)}
                        className="glass-input sm-input"
                        autoFocus
                      />
                      <button type="submit" className="btn-primary sm-btn">Save / حفظ</button>
                      <button type="button" className="btn-secondary sm-btn" onClick={() => setIsAddAttrOpen(false)}>Cancel / إلغاء</button>
                    </form>
                  ) : (
                    <button className="add-attribute-table-btn" onClick={() => setIsAddAttrOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Plus size={18} />
                      <span>Add Attribute / إضافة سمة</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ================= MODAL DIALOG 1: NEW TEMPLATE ================= */}
      {isTemplateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card scale-up">
            <button 
              className="close-btn" 
              onClick={() => { 
                setIsTemplateModalOpen(false); 
                setNewTemplate({
                  templateName: '',
                  storeId: activeMenuTab === 'store' ? selectedStore : '0',
                  model: '',
                  size: '',
                  resolution: '152*152',
                  color: '',
                  sceneNumber: 1,
                  screenType: 'single',
                  attrCategory: '',
                  attrName: ''
                }); 
              }}
            >
              &times;
            </button>
            <div className="modal-header">
              <h3>Create {activeMenuTab === 'store' ? 'Store / متجر' : 'Merchant / تاجر'} ESL Template / إنشاء قالب شاشة الأسعار</h3>
            </div>
            <form onSubmit={handleCreateTemplate} className="modal-form">

              {/* Row 1: Template Name — mandatory */}
              <div className="form-group">
                <label>Template Name / اسم القالب <span className="required-asterisk">*</span></label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 1779862316907"
                  value={newTemplate.templateName}
                  onChange={e => setNewTemplate({ ...newTemplate, templateName: e.target.value })}
                  className="glass-input"
                />
              </div>

              {/* Row 2: Screen Type — radio buttons */}
              <div className="form-group">
                <label>Screen Type / نوع الشاشة <span className="required-asterisk">*</span></label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="screenType"
                      value="single"
                      checked={newTemplate.screenType !== 'double'}
                      onChange={() => setNewTemplate({ ...newTemplate, screenType: 'single' })}
                    />
                    <span>Single screen / شاشة واحدة</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="screenType"
                      value="double"
                      checked={newTemplate.screenType === 'double'}
                      onChange={() => setNewTemplate({ ...newTemplate, screenType: 'double' })}
                    />
                    <span>Double-sided screen / شاشة مزدوجة</span>
                  </label>
                </div>
              </div>

              {/* Row 3: Size — dropdown from models */}
              <div className="form-group">
                <label>Size / الحجم <span className="required-asterisk">*</span></label>
                {modelsLoading ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 className="animate-spin" size={16} /> Loading sizes... / جاري التحميل...
                  </div>
                ) : modelsError ? (
                  <div style={{ color: 'var(--danger-color)', fontSize: '14px', padding: '8px 0' }}>
                    {modelsError}
                  </div>
                ) : (
                  <select
                    required
                    className="glass-input"
                    value={newTemplate.size}
                    onChange={e => {
                      const selectedSize = e.target.value;
                      const sizeModelsList = models.filter(m => m.size === selectedSize);
                      const matchedModel = sizeModelsList[0];
                      setNewTemplate({
                        ...newTemplate,
                        size: selectedSize,
                        resolution: matchedModel?.resolution || '',
                        color: matchedModel?.color as any,
                        model: matchedModel?.model || newTemplate.model
                      });
                    }}
                  >
                    <option value="">Select Size... / اختر الحجم...</option>
                    {uniqueSizes.map(s => (
                      <option key={s} value={s}>{s} Inch</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Row 4: DPI — dynamic radio buttons */}
              <div className="form-group">
                <label>Dpi / الدقة <span className="required-asterisk">*</span></label>
                <div className="radio-group">
                  {availableResolutions.length > 0 ? availableResolutions.map(res => (
                    <label key={res} className="radio-option">
                      <input
                        type="radio"
                        name="dpi"
                        value={res}
                        checked={newTemplate.resolution === res}
                        onChange={() => {
                           const sizeResModelsList = selectedSizeModels.filter(m => m.resolution === res);
                           const matchedModel = sizeResModelsList[0];
                           setNewTemplate({ 
                             ...newTemplate, 
                             resolution: res,
                             color: matchedModel?.color as any,
                             model: matchedModel?.model || ''
                           });
                        }}
                      />
                      <span>{res}</span>
                    </label>
                  )) : (
                    <span style={{ color: 'var(--text-muted)' }}>Select size first / اختر الحجم أولاً</span>
                  )}
                </div>
              </div>

              {/* Row 5: Color — dynamic radio buttons */}
              <div className="form-group">
                <label>Color / اللون <span className="required-asterisk">*</span></label>
                <div className="radio-group">
                  {availableModalColors.length > 0 ? availableModalColors.map((col: any) => {
                     const config = COLOR_MAPPINGS[col] || { label: String(col) };
                     return (
                      <label key={col} className="radio-option">
                        <input 
                          type="radio" 
                          name="color" 
                          value={col}
                          checked={newTemplate.color === col}
                          onChange={() => {
                            const exactModel = selectedResModels.find(m => m.color === col);
                            setNewTemplate({
                               ...newTemplate,
                               color: col as any,
                               model: exactModel?.model || ''
                            });
                          }}
                        />
                        <span>{config.label.split(' / ')[0]}</span>
                      </label>
                     );
                  }) : (
                    <span style={{ color: 'var(--text-muted)' }}>Select size first / اختر الحجم أولاً</span>
                  )}
                </div>
              </div>

              {/* Row 6: Model — auto filled based on size (read-only display) */}
              <div className="form-group">
                <label>Model / الطراز</label>
                <div className="glass-input" style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '14px', background: 'rgba(255,255,255,0.02)' }}>
                  {newTemplate.size
                    ? models.filter(m => m.size === newTemplate.size).map(m => m.model).join('  ') || 'No model available'
                    : 'Select size first / اختر الحجم أولاً'}
                </div>
              </div>

              {/* Row 7: Template Category — mandatory dropdown */}
              <div className="form-group">
                <label>Template Category / تصنيف القالب <span className="required-asterisk">*</span></label>
                <select
                  required
                  className="glass-input"
                  value={newTemplate.attrCategory || ''}
                  onChange={e => setNewTemplate({ ...newTemplate, attrCategory: e.target.value })}
                >
                  <option value="">Select Category... / اختر التصنيف...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.categoryName}>{c.categoryName}</option>
                  ))}
                </select>
              </div>

              {/* Row 8: Template Type — mandatory dropdown */}
              <div className="form-group">
                <label>Template Type / نوع القالب <span className="required-asterisk">*</span></label>
                <select
                  required
                  className="glass-input"
                  value={newTemplate.attrName || ''}
                  onChange={e => setNewTemplate({ ...newTemplate, attrName: e.target.value })}
                >
                  <option value="">Select Type... / اختر النوع...</option>
                  {templateTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Row 9: Bound Store — only for store tab */}
              {activeMenuTab === 'store' && (
                <div className="form-group">
                  <label>Bound Store / المتجر المرتبط <span className="required-asterisk">*</span></label>
                  {storesLoading ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Loader2 className="animate-spin" size={16} /> Loading stores... / جاري تحميل المتاجر...
                    </div>
                  ) : storesError ? (
                    <div style={{ color: 'var(--danger-color)', fontSize: '14px', padding: '8px 0' }}>
                      {storesError}
                    </div>
                  ) : (
                    <select
                      className="glass-input"
                      value={selectedStore}
                      onChange={e => setSelectedStore(e.target.value)}
                    >
                      {stores.map(s => <option key={s.storeId} value={s.storeId}>{s.storeName}</option>)}
                    </select>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => { 
                    setIsTemplateModalOpen(false); 
                    setNewTemplate({
                      templateName: '',
                      storeId: activeMenuTab === 'store' ? selectedStore : '0',
                      model: '',
                      size: '',
                      resolution: '152*152',
                      sceneNumber: 1,
                      screenType: 'single',
                      attrCategory: '',
                      attrName: ''
                    }); 
                  }}
                >
                  Cancel / إلغاء
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Add to details / إضافة للتفاصيل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DIALOG 2: NEW CATEGORY ================= */}
      {isCategoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card scale-up">
            <button className="close-btn" onClick={() => setIsCategoryModalOpen(false)}>&times;</button>
            <div className="modal-header">
              <h3>Create Template Classification / إنشاء تصنيف قالب</h3>
            </div>
            <form onSubmit={handleCreateCategory} className="modal-form">
              <div className="form-group">
                <label>Classification Name / اسم التصنيف</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Pharmacy, Thobe, Grocery / مثال: صيدلية، ثوب، بقالة"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="glass-input"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsCategoryModalOpen(false)}>Cancel / إلغاء</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Add Category / إضافة تصنيف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DIALOG 3: EDIT TEMPLATE ================= */}
      {editTemplateModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card scale-up">
            <button className="close-btn" onClick={() => setEditTemplateModal(null)}>&times;</button>
            <div className="modal-header">
              <h3>Edit Template / تعديل القالب</h3>
            </div>
            <form onSubmit={handleUpdateTemplate} className="modal-form">
              <div className="form-group">
                <label>Template Type / نوع القالب <span className="required-asterisk">*</span></label>
                <input
                  required
                  type="text"
                  value={editTemplateModal.templateName}
                  onChange={e => setEditTemplateModal({ ...editTemplateModal, templateName: e.target.value })}
                  className="glass-input"
                />
              </div>
              <div className="form-group">
                <label>Template Category / تصنيف القالب <span className="required-asterisk">*</span></label>
                <select
                  className="glass-input"
                  value={editTemplateModal.attrCategory}
                  onChange={e => setEditTemplateModal({ ...editTemplateModal, attrCategory: e.target.value })}
                >
                  <option value="">-- Select Category / اختر تصنيفاً --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.categoryName}>{c.categoryName}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditTemplateModal(null)}>Cancel / إلغاء</button>
                <button type="submit" className="btn-primary" disabled={editSubmitting}>
                  {editSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Save Changes / حفظ التغييرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DIALOG 4: TEMPLATE PREVIEW (Dragon ESL style — e-ink panel only) ================= */}
      {previewTemplate && (() => {
        const specs = getEslModelSpecs(previewTemplate.size, previewTemplate.modelList?.[0] || (previewTemplate as any).model);
        return (
          <div className="modal-overlay" onClick={() => setPreviewTemplate(null)}>
            <div className="modal-content glass-card preview-modal-simple scale-up" onClick={e => e.stopPropagation()} style={{ maxWidth: `${specs.width + 80}px` }}>
              <button className="close-btn" onClick={() => setPreviewTemplate(null)}>&times;</button>
              <div className="modal-header">
                <h3>Template Preview / معاينة القالب ({previewTemplate.templateName})</h3>
              </div>

              {/* Dragon ESL: template display, centered */}
              <div className="preview-eink-only">
                <div className="bezel-housing" style={{ width: '100%', maxWidth: `${specs.width + 32}px`, margin: '0 auto 16px auto', padding: '16px', background: '#1e293b', borderRadius: '16px' }}>
                  <div className="eink-panel dragon-esl-format" style={{ background: '#ffffff', width: '100%', aspectRatio: specs.aspectRatio, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: '1.5px solid #c8c8c8', borderRadius: '6px' }}>
                    {previewTemplate.tempPicUrl ? (
                      <img 
                        src={`http://www.dragonesl.com/${previewTemplate.tempPicUrl}`}
                        alt="Zkong Template Live Layout"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      />
                    ) : (() => {
                      const selectedProductObj = sampleProducts.find(p => p.id === selectedSampleProductId);
                      const displayTitle = selectedProductObj?.itemName || 'ثوب نوم الصفوة';
                      const displayPrice = selectedProductObj?.price || '75.00';
                      const displayOriginalPrice = selectedProductObj?.custFeature2 || (parseFloat(displayPrice) * 1.2).toFixed(2);
                      
                      const isComparison = previewTemplate.attrCategory === 'K0001' || previewTemplate.attrCategory === 'K0002' || previewTemplate.templateName.includes('K0001') || previewTemplate.templateName.includes('K0002') || previewTemplate.templateName.includes('674') || previewTemplate.templateName.includes('666');
                      
                      return renderEinkLayout(
                        specs,
                        isComparison,
                        displayTitle,
                        displayPrice,
                        displayOriginalPrice,
                        selectedProductObj?.barcode || '6281100012345',
                        stores.find(s => s.storeId === selectedStore)?.storeName
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-primary" onClick={() => setPreviewTemplate(null)}>Close / إغلاق</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Global CSS Layout styles matching dragonesl.com portal layout */}
      <style>{`
        .required-asterisk {
          color: #ef4444;
          margin-left: 3px;
          font-weight: 700;
        }

        .templates-dashboard {
          padding: 24px;
          min-height: 100vh;
        }

        .top-breadcrumb {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 20px;
          font-weight: 500;
        }

        .top-breadcrumb span:last-child {
          color: var(--primary-color);
          font-weight: 600;
        }

        .layout-split {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .left-menu-bar {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
        }

        .menu-item-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          color: var(--text-muted);
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          text-align: left;
          transition: all 0.25s ease;
        }

        .menu-item-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }

        .menu-item-btn.active {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.12);
          color: var(--primary-color);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .content-workspace {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Scenario Tabs (Sub-tabs) */
        .scenario-nav {
          display: flex;
          gap: 12px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .scenario-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .scenario-btn:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.03);
        }

        .scenario-btn.active {
          color: var(--primary-color);
          background: rgba(255,255,255,0.06);
        }

        /* Filters Layout Bar */
        .filters-form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .store-filters-layout {
          grid-template-columns: 280px repeat(auto-fit, minmax(180px, 1fr)) 200px;
          align-items: end;
        }

        .filter-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-input-group label {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-input-group select, .styled-select {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 10px 14px;
          color: var(--text-primary);
          outline: none;
          cursor: pointer;
          font-size: 14px;
        }

        .filter-input-group select:focus {
          border-color: var(--primary-color);
        }

        .form-submit-buttons {
          display: flex;
          gap: 10px;
        }

        .form-submit-buttons button {
          flex: 1;
          padding: 10px;
        }

        .flex-row-item {
          grid-column: span 1;
        }

        .bold-label {
          color: var(--primary-color) !important;
          font-weight: 700 !important;
        }

        .actions-row {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .sm-btn {
          padding: 8px 16px;
          font-size: 13px;
        }

        /* Tables styling */
        .zkong-table-container {
          overflow-x: auto;
          width: 100%;
        }

        .zkong-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .zkong-table th {
          background: rgba(59,130,246,0.1);
          color: var(--primary-color);
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.8px;
          font-weight: 700;
          padding: 12px 16px;
          border-bottom: 1px solid var(--glass-border);
        }

        .zkong-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--glass-border);
          font-size: 14px;
          color: var(--text-primary);
        }

        .zkong-table tbody tr {
          transition: background 0.2s;
        }

        .zkong-table tbody tr:nth-child(even) {
          background: rgba(255,255,255,0.02);
        }

        .zkong-table tbody tr:hover {
          background: rgba(59,130,246,0.05);
          transition: background 0.15s;
        }

        /* Status colors */
        .color-dots-indicator {
          display: flex;
          gap: 6px;
        }

        .color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .color-dot.black { background: #000; }
        .color-dot.white { background: #fff; }
        .color-dot.red { background: #e11d48; }

        .status-pill {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 600;
        }

        .status-pill.enabled {
          background: rgba(16, 185, 129, 0.12);
          color: var(--success-color);
        }

        .status-pill.disabled {
          background: rgba(148, 163, 184, 0.12);
          color: var(--text-muted);
        }

        .preview-trigger-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          transition: all 0.2s;
        }

        .preview-trigger-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--primary-color);
        }

        .op-buttons {
          display: flex;
          gap: 12px;
        }

        .op-btn {
          background: transparent;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px;
        }

        .op-btn.primary-text { color: var(--primary-color); }
        .op-btn.danger-text { 
          color: var(--danger-color); 
          font-weight: 600;
          border-radius: 6px;
          padding: 4px 8px;
          transition: all 0.2s;
        }
        .op-btn.danger-text:hover { background: rgba(239,68,68,0.1); }
        .op-btn.disabled-text { color: var(--text-muted); }

        /* Empty states */
        .empty-state-table {
          padding-bottom: 40px;
        }

        .zkong-no-data {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          color: var(--text-muted);
          font-size: 14px;
        }

        /* Properties splits */
        .properties-workspace {
          padding: 24px;
        }

        .properties-layout-split {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 28px;
        }

        .category-properties-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-right: 1px solid var(--glass-border);
          padding-right: 24px;
          border-top: 3px solid var(--primary-color);
          padding-top: 16px;
        }

        .list-title {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .category-scroll-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 400px;
          overflow-y: auto;
        }

        .properties-cat-btn {
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
          border-radius: 8px;
          padding: 10px 14px;
          text-align: left;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .properties-cat-btn.active {
          background: linear-gradient(135deg, var(--primary-color), #6366f1);
          color: #fff;
          border-left: 3px solid #fff;
          font-weight: 700;
          box-shadow: 0 4px 15px rgba(59,130,246,0.3);
        }

        .properties-cat-btn:not(.active):hover {
          background: rgba(59,130,246,0.08);
          border-left: 3px solid var(--primary-color);
          color: var(--text-primary);
        }

        .add-new-cat-btn {
          margin-top: 12px;
          font-size: 12px;
          padding: 10px;
          width: 100%;
          background: transparent;
          color: var(--primary-color);
          border: 1px dashed var(--primary-color);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .add-new-cat-btn:hover {
          background: rgba(59,130,246,0.08);
          color: var(--primary-color);
        }

        .properties-attributes-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          margin-bottom: 16px;
          border-bottom: 2px solid var(--primary-color);
        }

        .panel-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          border-left: 4px solid var(--primary-color);
          padding-left: 12px;
        }

        .icon-edit-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }

        .icon-edit-btn:hover { color: var(--primary-color); }

        .attribute-name-badge {
          background: rgba(59,130,246,0.12);
          color: var(--primary-color);
          border: 1px solid rgba(59,130,246,0.25);
          border-radius: 20px;
          padding: 4px 12px;
          font-weight: 600;
          font-size: 13px;
          display: inline-block;
        }

        .default-badge-yes {
          background: rgba(34,197,94,0.12);
          color: var(--success-color);
          border: 1px solid rgba(34,197,94,0.25);
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 12px;
          font-weight: 600;
        }

        .default-badge-no {
          background: rgba(148,163,184,0.1);
          color: var(--text-muted);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 12px;
        }

        .op-btn.danger-text {
          color: var(--danger-color);
          background: transparent;
          border-radius: 8px;
          padding: 6px 10px;
          transition: background 0.2s;
        }

        .op-btn.danger-text:hover {
          background: rgba(239,68,68,0.12);
        }

        .add-attribute-table-btn {
          width: 100%;
          border: 1px dashed var(--primary-color);
          color: var(--primary-color);
          background: rgba(59,130,246,0.04);
          border-radius: 8px;
          padding: 10px;
          font-weight: 600;
          transition: background 0.2s;
        }

        .add-attribute-table-btn:hover {
          background: rgba(59,130,246,0.1);
        }

        .add-attribute-inline-form {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-top: 16px;
          padding: 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
        }

        .sm-input {
          padding: 8px 12px;
          font-size: 13px;
        }

        /* E-Ink Visualizer Modal — Dragon ESL style (panel only) */
        .preview-modal {
          max-width: 600px;
          padding: 24px;
        }

        /* Simple centered preview — only the e-ink panel, no details */
        .preview-modal-simple {
          max-width: 520px;
          width: 90%;
          padding: 24px;
        }

        /* Center the bezel housing alone */
        .preview-eink-only {
          display: flex;
          justify-content: center;
          margin: 16px 0;
        }

        .preview-eink-only .bezel-housing {
          width: 100%;
          max-width: 480px;
          margin: 0;
        }

        .preview-modal-wide {
          max-width: 920px;
          width: 92%;
          padding: 24px;
        }

        /* Two-column layout: e-ink left, details right */
        .preview-modal-body {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 28px;
          margin: 20px 0 16px;
          align-items: start;
        }

        .preview-eink-column {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .preview-eink-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--text-muted);
        }

        /* Details column */
        .preview-details-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .detail-section-title {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--primary-color);
          padding-bottom: 8px;
          border-bottom: 1px solid var(--glass-border);
        }

        .detail-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }

        [data-theme='dark'] .detail-row {
          border-bottom-color: rgba(255,255,255,0.04);
        }

        .detail-label {
          color: var(--text-muted);
          font-weight: 500;
          flex-shrink: 0;
          min-width: 140px;
        }

        .detail-value {
          font-weight: 600;
          color: var(--text-primary);
          text-align: right;
        }

        /* Color dots row */
        .color-dots-preview {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-right: 8px;
        }

        .cdot {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.15);
        }

        .color-label-text {
          font-size: 12px;
          color: var(--text-secondary);
        }

        /* Status badge inside preview */
        .status-badge-preview {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
        }

        .status-badge-preview.enabled {
          background: rgba(16, 185, 129, 0.12);
          color: var(--success-color);
        }

        .status-badge-preview.disabled {
          background: rgba(148, 163, 184, 0.12);
          color: var(--text-muted);
        }

        .bezel-housing {
          background: #1e293b;
          border-radius: 16px;
          padding: 16px;
          margin: 16px 0;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5), inset 0 1px 3px rgba(255,255,255,0.1);
        }

        .eink-panel {
          background: #ffffff;
          border: 1.5px solid #c8c8c8;
          color: #000000;
          border-radius: 6px;
          padding: 0;
          aspect-ratio: 16 / 10;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', Arial, sans-serif;
          box-shadow: inset 0 0 8px rgba(0,0,0,0.06);
          overflow: hidden;
        }

        /* Dragon ESL exact format layout */
        .dragon-esl-format {
          justify-content: flex-start;
          padding: 0;
        }

        /* PROMOTION header — exact Dragon ESL golden yellow */
        .dragon-promo-header {
          background: #ffffff;
          color: #d4a017;
          font-size: 28px;
          font-weight: 900;
          text-align: center;
          padding: 16px 8px 8px 8px;
          letter-spacing: 1px;
          font-family: 'Inter', Arial, sans-serif;
        }

        /* Price — exact Dragon ESL red, large centered */
        .dragon-price-center {
          color: #e02020;
          font-size: 36px;
          font-weight: 900;
          text-align: center;
          padding: 4px 8px 12px 8px;
          font-family: 'Inter', Arial, sans-serif;
          letter-spacing: 0.5px;
        }

        /* Product name — exact Dragon ESL black, small, bottom-left, RTL */
        .dragon-product-name {
          color: #000000;
          font-size: 13px;
          font-weight: 500;
          text-align: left;
          direction: rtl;
          padding: 0 10px 10px 10px;
          margin-top: auto;
          font-family: 'Inter', Arial, sans-serif;
        }

        .eink-panel-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 6px;
          font-size: 10px;
          font-weight: 800;
        }

        .specs-pill {
          background: #0f172a;
          color: #fff;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 9px;
        }

        .eink-promo-banner {
          background: #facc15;
          color: #0f172a;
          font-weight: 900;
          font-size: 11px;
          text-align: center;
          padding: 4px;
          border-radius: 4px;
          margin-top: 6px;
          letter-spacing: 0.5px;
          border: 1px solid #eab308;
          font-family: 'Inter', sans-serif;
        }

        .eink-panel-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 8px 0;
        }

        .arabic-product-desc {
          font-size: 18px;
          font-weight: 900;
          color: #dc2626;
          direction: rtl;
          margin-bottom: 4px;
        }

        .english-product-desc {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
        }

        .eink-panel-price-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 8px;
        }

        .large-price-digits {
          color: #dc2626;
          font-family: 'Outfit', 'Inter', sans-serif;
          font-weight: 800;
        }

        .large-price-digits .unit {
          font-size: 14px;
          margin-right: 4px;
        }

        .large-price-digits .val {
          font-size: 32px;
        }

        .crossed-original-price {
          font-size: 11px;
          color: #64748b;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .crossed-original-price .strike {
          text-decoration: line-through;
          font-weight: bold;
        }

        .eink-panel-footer {
          border-top: 2px solid #0f172a;
          padding-top: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .barcode-bars-draw {
          display: flex;
          height: 18px;
          gap: 2px;
          align-items: flex-end;
        }

        .b-line { background: #000; height: 100%; }
        .b-line.xs { width: 1px; }
        .b-line.sm { width: 2px; }
        .b-line.md { width: 3px; }
        .b-line.lg { width: 5px; }

        .eink-mac-val {
          font-size: 9px;
          font-weight: 800;
          color: #64748b;
        }

        .preview-meta-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          font-size: 13px;
          color: var(--text-muted);
          border-top: 1px solid var(--glass-border);
          padding-top: 16px;
        }

        .meta-item {
          display: flex;
          justify-content: space-between;
        }

        /* Modal scale up animation */
        .scale-up {
          animation: scaleUpAnim 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes scaleUpAnim {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 768px) {
          .templates-page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .templates-header-actions {
            width: 100%;
            justify-content: space-between;
          }
          .properties-layout-split {
            grid-template-columns: 1fr;
          }
          .category-properties-list {
            border-right: none;
            border-bottom: 1px solid var(--glass-border);
            padding-right: 0;
            padding-bottom: 24px;
          }
          .zkong-table-container {
            overflow-x: auto;
          }
        }

        .modal-content {
          position: relative;
          padding: 28px 32px 24px 32px;
          max-height: 90vh;
          overflow-y: auto;
          width: 100%;
          max-width: 560px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-right: 32px;
        }

        .modal-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.4;
          margin: 0;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
        }

        /* Radio group styling */
        .radio-group {
          display: flex;
          gap: 32px;
          align-items: center;
          flex-wrap: wrap;
          padding: 4px 0;
        }

        .radio-option {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: var(--text-primary);
          font-weight: 500;
        }

        .radio-option input[type="radio"] {
          accent-color: var(--primary-color);
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
          padding-top: 16px;
          border-top: 1px solid var(--glass-border);
        }

        .close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 1px solid var(--glass-border);
          color: var(--text-muted);
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          line-height: 1;
          z-index: 10;
        }

        .close-btn:hover {
          background: rgba(239,68,68,0.15);
          color: var(--danger-color);
          border-color: var(--danger-color);
        }
      `}</style>
    </div>
  );

  // Modular Template Table renderer to prevent redundancy
  function renderTemplatesTable() {
    return (
      <div className="zkong-table-container glass-card">
        {loading ? (
          <div className="zkong-no-data">
            <Loader2 className="animate-spin text-primary mb-2" size={40} />
            <p>Loading ESL Templates... / جاري تحميل قوالب بطاقات الأسعار...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="zkong-no-data">
            <FolderOpen size={48} className="text-muted mb-2" />
            <p>No Data / لا توجد بيانات</p>
          </div>
        ) : (
          <table className="zkong-table">
            <thead>
              <tr>
                <th>Template Type / نوع القالب</th>
                <th>Template Code / رمز القالب</th>
                <th>Size / الحجم</th>
                <th>Dpi / الدقة</th>
                <th>Color / اللون</th>
                <th>ESL Model / طراز الشاشة</th>
                <th>Template Category / تصنيف القالب</th>
                <th>Status / الحالة</th>
                <th>Latest Update Time / آخر وقت تحديث</th>
                <th>Template Preview / معاينة القالب</th>
                <th>Operation / الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map(t => {
                const isEnabled = t.status === '1';
                const specs = getEslModelSpecs(t.size, t.modelList?.[0]);
                return (
                  <tr key={t.id}>
                    <td><strong>{t.templateName}</strong></td>
                    <td>{t.id}</td>
                    <td>{t.size}"</td>
                    <td>{t.resolution || '296*128'}</td>
                    <td>
                      <div className="color-dots-indicator">
                        <div className="color-dot black" title="Black"></div>
                        <div className="color-dot white" title="White"></div>
                        <div className="color-dot red" title="Red"></div>
                      </div>
                    </td>
                    <td>{t.modelList?.join(', ') || 'ZKC29S'}</td>
                    <td>
                      {(() => {
                        const rawCat = (t.attrCategory as any) && typeof t.attrCategory === 'object' 
                          ? ((t.attrCategory as any).categoryName || String(t.attrCategory)) 
                          : (t.attrCategory || 'General / عام');
                        return translate(rawCat);
                      })()}
                    </td>
                    <td>
                      <span className={`status-pill ${isEnabled ? 'enabled' : 'disabled'}`}>
                        {isEnabled ? 'Enabled / مفعل' : 'Disabled / معطل'}
                      </span>
                    </td>
                    <td>{t.updateTime || t.createdTime || 'N/A / غير متوفر'}</td>
                    <td>
                      <div className="zkong-thumbnail-container" style={{ position: 'relative' }}>
                        {/* Interactive Thumbnail */}
                        <div 
                          className="zkong-mini-preview-thumbnail"
                          onMouseEnter={() => handleMouseEnterThumbnail(t.id, ((t.attrCategory as any) && typeof t.attrCategory === 'object' ? ((t.attrCategory as any).categoryName || String(t.attrCategory)) : (t.attrCategory || '')))}
                          onMouseLeave={handleMouseLeaveThumbnail}
                          onClick={() => setPreviewTemplate(t)}
                          style={{
                            width: specs.layoutType === 'square' ? '38px' : '54px',
                            height: '38px',
                            background: '#ffffff',
                            border: '1.5px solid #d1d5db',
                            borderRadius: '4px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            transition: 'all 0.2s',
                            overflow: 'hidden'
                          }}
                        >
                          {t.tempPicUrl ? (
                            <img 
                              src={`http://www.dragonesl.com/${t.tempPicUrl}`}
                              alt="Template Mini"
                              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                            />
                          ) : (() => {
                            const isComparison = t.attrCategory === 'K0001' || t.attrCategory === 'K0002' || t.templateName.includes('K0001') || t.templateName.includes('K0002') || t.templateName.includes('674') || t.templateName.includes('666');
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', padding: '3px' }}>
                                <div className="mini-promo" style={{ fontSize: '5px', color: '#eab308', fontWeight: '800', textAlign: 'center', transform: 'scale(0.8)' }}>PROMO</div>
                                {isComparison ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', alignItems: 'center' }}>
                                    <div className="mini-price" style={{ fontSize: '7px', color: '#dc2626', fontWeight: '900', lineHeight: '1' }}>75</div>
                                  </div>
                                ) : (
                                  <div className="mini-price" style={{ fontSize: '8px', color: '#dc2626', fontWeight: '900', textAlign: 'center' }}>75.00</div>
                                )}
                                <div className="mini-product" style={{ fontSize: '4px', color: '#1e293b', fontWeight: '700', textAlign: 'center' }}>TAG</div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Floating Popover Portal Card (Aligned exactly like Screenshot 1) */}
                        {activePopoverId === t.id && (
                          <div 
                            className="zkong-hover-popover-card scale-up"
                            style={{
                              position: 'absolute',
                              bottom: '50%',
                              right: specs.layoutType === 'square' ? '56px' : '72px',
                              transform: 'translateY(50%)',
                              width: specs.layoutType === 'square' ? '240px' : specs.layoutType === 'compact' ? '290px' : specs.layoutType === 'large' ? '340px' : '280px',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              padding: '12px',
                              boxShadow: 'var(--shadow-md)',
                              zIndex: 9999,
                              color: 'var(--text-primary)',
                              fontFamily: "'Inter', sans-serif"
                            }}
                          >
                            {/* Popover Arrow pointing to thumbnail on the right */}
                            <div style={{
                              position: 'absolute',
                              top: '50%',
                              right: '-12px',
                              marginTop: '-6px',
                              borderWidth: '6px',
                              borderStyle: 'solid',
                              borderColor: 'transparent transparent transparent var(--bg-secondary)',
                              filter: 'drop-shadow(1px 0px 1px rgba(0,0,0,0.05))'
                            }}></div>

                            {popoverLoading ? (
                              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px', color: '#64748b' }}>
                                <Loader2 className="animate-spin" size={24} />
                              </div>
                            ) : t.tempPicUrl ? (
                              <img 
                                src={`http://www.dragonesl.com/${t.tempPicUrl}`}
                                alt="Live Template Preview"
                                style={{ width: '100%', height: 'auto', maxHeight: '180px', borderRadius: '4px', objectFit: 'contain', display: 'block' }}
                              />
                            ) : (() => {
                              const displayTitle = popoverProduct?.itemName || 'ثوب الصفوة 117A ولادي';
                              const displayPrice = popoverProduct?.price || '75';
                              const displayOriginalPrice = popoverProduct?.originalPrice || popoverProduct?.custFeature2 || '150';
                              
                              const isComparison = t.attrCategory === 'K0001' || t.attrCategory === 'K0002' || t.templateName.includes('K0001') || t.templateName.includes('K0002') || t.templateName.includes('674') || t.templateName.includes('666');

                              return (
                                <div style={{ width: '100%', height: '100%', aspectRatio: specs.aspectRatio, overflow: 'hidden', borderRadius: '4px', border: '1px solid #eee' }}>
                                  {renderEinkLayout(
                                    specs,
                                    isComparison,
                                    displayTitle,
                                    displayPrice,
                                    displayOriginalPrice,
                                    popoverProduct?.barcode || '6281100012345',
                                    stores.find(s => s.storeId === selectedStore)?.storeName
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="op-buttons">
                        <button className="op-btn primary-text" onClick={() => setEditTemplateModal({ id: t.id, templateName: t.templateName, attrCategory: t.attrCategory || '' })}>
                          Edit / تعديل
                        </button>
                        <button className="op-btn primary-text" onClick={() => handleToggleStatus(t.id, t.status)}>
                          {isEnabled ? 'Disable / تعطيل' : 'Enable / تفعيل'}
                        </button>
                        <button className="op-btn danger-text" onClick={() => handleDeleteTemplate(t.id)}>
                          Delete / حذف
                        </button>
                        {activeMenuTab === 'store' && <button className="op-btn disabled-text">Copy / نسخ</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Premium Zkong/DragonESL Pagination */}
        {totalElements > 0 && (
          <div className="dragonesl-pagination-bar glass-card" style={{ marginTop: '16px' }}>
            <div className="pagination-left">
              <span className="pagination-total">Total {totalElements} items / الإجمالي {totalElements} عناصر</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className="pagination-size-select"
              >
                <option value={5}>5 / page / ٥ للصفحة</option>
                <option value={10}>10 / page / ١٠ للصفحة</option>
                <option value={20}>20 / page / ٢٠ للصفحة</option>
                <option value={50}>50 / page / ٥٠ للصفحة</option>
                <option value={100}>100 / page / ١٠٠ للصفحة</option>
              </select>
            </div>

            <div className="pagination-right">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage(prev => Math.max(prev - 1, 0))}
                className="pagination-arrow-btn"
              >
                &lt;
              </button>

              {getPaginationRange(page + 1, Math.ceil(totalElements / pageSize), 1).map((pageNum, idx) => (
                pageNum === '...' ? (
                  <span key={`dots-${idx}`} className="pagination-dots">...</span>
                ) : (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(Number(pageNum) - 1)}
                    className={`pagination-num-btn ${page === Number(pageNum) - 1 ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                )
              ))}

              <button
                type="button"
                disabled={page === Math.ceil(totalElements / pageSize) - 1 || Math.ceil(totalElements / pageSize) === 0}
                onClick={() => setPage(prev => Math.min(prev + 1, Math.ceil(totalElements / pageSize) - 1))}
                className="pagination-arrow-btn"
              >
                &gt;
              </button>

              <div className="pagination-jump">
                <span>Go to / الذهاب إلى</span>
                <input
                  type="number"
                  min={1}
                  max={Math.ceil(totalElements / pageSize) || 1}
                  value={page + 1}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const totalP = Math.ceil(totalElements / pageSize);
                    if (val >= 1 && val <= totalP) {
                      setPage(val - 1);
                    }
                  }}
                  className="pagination-jump-input"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
};

export default Templates;
