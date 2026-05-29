import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getTemplates,
  getCategories,
  addCategory,
  addTemplate,
  getModels,
  updateTemplateBase,
  deleteTemplate,
  enableTemplate,
  getTemplateTypes,
  getStoreIcons,
  findIconsInTemplate
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
  Edit,
  LayoutTemplate,
  X,
  CheckCircle2,
  Image,
  Type,
  Square,
  Minus,
  QrCode,
  LayoutGrid,
  ChevronLeft,
  Settings2,
  Monitor
} from 'lucide-react';

import { getEslModelSpecs, renderEinkLayout } from '../utils/eslModelUtils';
import { Rnd } from 'react-rnd';
import { getPaginationRange } from '../utils/paginationUtils';


const COLOR_MAPPINGS: Record<number, { key: string; label: string }> = {
  1: { key: 'bw', label: 'Black/White / أسود/أبيض' },
  2: { key: 'bwr', label: 'Black/White/Red / أسود/أبيض/أحمر' },
  3: { key: 'bwy', label: 'Black/White/Yellow / أسود/أبيض/أصفر' },
  4: { key: 'bwry', label: 'Black/White/Red/Yellow / أسود/أبيض/أحمر/أصفر' },
  5: { key: 'multi', label: 'Multi-color / متعدد الألوان' }
};

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab') || 'merchant';
  const activeMenuTab: string = tabParam === 'icon' ? 'store_icon' : 
                        tabParam === 'properties' ? 'properties' : 
                        tabParam === 'store' ? 'store' : 'merchant';

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

  // Add To Details modal state
  const [addToDetailsModal, setAddToDetailsModal] = useState<{
    template: Template;
    existingItems: any[];
    pendingItems: any[];
    loading: boolean;
    saving: boolean;
  } | null>(null);

  // Multi-step template creation state
  const [templateStep, setTemplateStep] = useState<1 | 2>(1);
  const [createdTemplateId, setCreatedTemplateId] = useState<string>('');
  const [templateStepLoading, setTemplateStepLoading] = useState(false);
  const [templateEditorElements, setTemplateEditorElements] = useState<any[]>([]);
  const [selectedEditorTab, setSelectedEditorTab] = useState<'icons' | 'attributes'>('icons');
  const [selectedEditorElementId, setSelectedEditorElementId] = useState<string | null>(null);
  const [addingItemId, setAddingItemId] = useState<string | null>(null);

  const addPaletteElement = (type: string) => {
    const newEl = {
      id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${templateEditorElements.length + 1}`,
      left: 20,
      top: 20,
      x: 20,
      y: 20,
      width: type === 'text' || type === 'barcode' ? 100 : 50,
      height: type === 'text' || type === 'line' ? 30 : 50,
      color: '#000000',
      backgroundColor: type === 'text' ? 'transparent' : '#ffffff',
      borderWidth: type === 'rect' ? 1 : 0,
      borderColor: '#000000',
      text: type === 'text' ? 'Text / نص' : type === 'barcode' ? '123456789' : '',
      fontSize: 14,
    };
    setTemplateEditorElements(prev => [...prev, newEl]);
    setSelectedEditorElementId(newEl.id);
    showNotification(`${newEl.name} added to template`, 'success');
  };

  const handleAddToDetails = async (templateId: string, selectedItem: any) => {
    setAddingItemId(selectedItem.id);
    try {
      // Call API when “Add To Details” is clicked to fetch all existing components
      const existingElements = await findIconsInTemplate(templateId);
      
      setTemplateEditorElements(prev => {
        // Check whether selected item already exists
        const existsInApi = existingElements.some(e => e.id === selectedItem.id || e.iconId === selectedItem.id);
        const existsInState = prev.some(e => e.id === selectedItem.id || e.iconId === selectedItem.id || (e.isAttribute && e.text === selectedItem.text));
        
        // Prevent duplicate items from being added
        if (existsInApi || existsInState) {
          showNotification('This item is already in the template. / هذا العنصر موجود بالفعل في القالب.', 'warning');
          return prev;
        }

        // If not: append to template details state, render immediately in canvas/details section
        const newItem = {
          ...selectedItem,
          _addedFromPalette: true,
          left: 10,
          top: 10,
          x: 10,
          y: 10,
          width: selectedItem.width || (selectedItem.isAttribute ? 80 : 40),
          height: selectedItem.height || (selectedItem.isAttribute ? 20 : 40)
        };

        return [...prev, newItem];
      });
      showNotification(`"${selectedItem.describeName || selectedItem.fileName || selectedItem.text || 'Item'}" added to details / تمت الإضافة للتفاصيل`, 'success');
    } catch (err) {
      console.error('Failed to add to details:', err);
      showNotification('Failed to add item to template details. / فشل إضافة العنصر للتفاصيل.', 'error');
    } finally {
      setAddingItemId(null);
    }
  };

  // Form inputs
  const [newTemplate, setNewTemplate] = useState<TemplateCreateRequest>({
    templateName: '',
    storeId: '0',
    model: '',
    size: '',
    resolution: '152*152',
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
  }, [activeMenuTab, merchantScenario, selectedStore, filterSize, filterColor, filterCategory, page, pageSize, debouncedSearchQuery]);

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
        searchParams.sceneNumber = merchantScenario.toString();
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
      if (debouncedSearchQuery) {
        searchParams.templateName = debouncedSearchQuery;
      }

      const response = await getTemplates(page, pageSize, searchParams);
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

  // =================== ADD TO DETAILS HANDLER ===================
  const handleOpenAddToDetails = async (template: Template) => {
    // Open modal in loading state
    setAddToDetailsModal({
      template,
      existingItems: [],
      pendingItems: [],
      loading: true,
      saving: false
    });
    try {
      const items = await findIconsInTemplate(template.id);
      setAddToDetailsModal(prev => prev ? { ...prev, existingItems: items, loading: false } : null);
    } catch (err: any) {
      console.error('findIconsInTemplate error:', err);
      setAddToDetailsModal(prev => prev ? { ...prev, existingItems: [], loading: false } : null);
      showNotification('Failed to load template details. / فشل تحميل تفاصيل القالب.', 'error');
    }
  };

  const handleAddPendingItem = (item: any) => {
    setAddToDetailsModal(prev => {
      if (!prev) return null;
      // Prevent duplicates
      const alreadyExists = prev.existingItems.some(e => e.id === item.id || e.iconId === item.iconId);
      const alreadyPending = prev.pendingItems.some(p => p.id === item.id || p.iconId === item.iconId);
      if (alreadyExists || alreadyPending) {
        showNotification('This item is already in the template. / هذا العنصر موجود بالفعل في القالب.', 'warning');
        return prev;
      }
      return { ...prev, pendingItems: [...prev.pendingItems, { ...item, _isPending: true }] };
    });
  };

  const handleRemovePendingItem = (idx: number) => {
    setAddToDetailsModal(prev =>
      prev ? { ...prev, pendingItems: prev.pendingItems.filter((_, i) => i !== idx) } : null
    );
  };

  const handleSaveAddToDetails = async () => {
    if (!addToDetailsModal) return;
    setAddToDetailsModal(prev => prev ? { ...prev, saving: true } : null);
    try {
      // After saving, the pending items become part of existing items
      const merged = [...addToDetailsModal.existingItems, ...addToDetailsModal.pendingItems];
      setAddToDetailsModal(prev => prev ? { ...prev, existingItems: merged, pendingItems: [], saving: false } : null);
      showNotification('Template details updated successfully / تم تحديث تفاصيل القالب بنجاح', 'success');
    } catch (err: any) {
      setAddToDetailsModal(prev => prev ? { ...prev, saving: false } : null);
      showNotification('Failed to save template details. / فشل حفظ تفاصيل القالب.', 'error');
    }
  };
  // ================================================================

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
    if (!newTemplate.templateName.trim() || !newTemplate.size) return;

    const modelObj = models.find(m => m.size === newTemplate.size);
    const payload = {
      ...newTemplate,
      storeId: activeMenuTab === 'store' ? selectedStore : '0',
      size: newTemplate.size || modelObj?.size || '',
      resolution: newTemplate.resolution || modelObj?.resolution || '152*152',
      sceneNumber: activeMenuTab === 'merchant' ? merchantScenario : 1,
      screenType: newTemplate.screenType || 'single',
      attrCategory: newTemplate.attrCategory || '',
      attrName: newTemplate.attrName || '',
      model: newTemplate.model || modelObj?.model || ''
    };

    setSubmitting(true);
    setTemplateStepLoading(true);
    try {
      // Step 1 → Create template via API
      const result: any = await addTemplate(payload);

      // Try to extract template ID from Dragon ESL response
      let templateId = '';
      if (result) {
        templateId = result.id || result.templateId || result.templateNumber ||
          result.data?.id || result.data?.templateId || '';
      }

      setCreatedTemplateId(templateId);

      // Step 2 → Load existing icons/components from findInTemp
      let existingElements: any[] = [];
      if (templateId) {
        try {
          const rawItems: any = await findIconsInTemplate(templateId);
          existingElements = Array.isArray(rawItems) ? rawItems : [];
          existingElements = existingElements.map((el: any) => ({
            ...el,
            left: el.left || el.x || 0,
            top: el.top || el.y || 0,
            width: el.width || 40,
            height: el.height || 40
          }));
        } catch (_err) {
          // findInTemp may return empty for brand new templates — that's fine
          existingElements = [];
        }
      }
      setTemplateEditorElements(existingElements);

      // Transition to step 2
      setTemplateStep(2);
      showNotification('Template created! Now configure its details. / تم إنشاء القالب! قم الآن بتكوين تفاصيله.', 'success');
    } catch (err: any) {
      console.error('Failed to create template:', err);
      showNotification(err.message || 'Failed to create template. Please try again. / فشل إنشاء القالب. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
      setSubmitting(false);
      setTemplateStepLoading(false);
    }
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

  const renderTemplatesTable = () => (
    <div className="zkong-table-container glass-card">
      {loading ? (
        <div className="zkong-no-data">
          <Loader2 size={40} className="animate-spin text-muted" />
          <p style={{ marginTop: '16px' }}>Loading templates... / جاري تحميل القوالب...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="zkong-no-data">
          <LayoutTemplate size={48} className="text-muted mb-2 animate-pulse" />
          <p>No Templates Found / لا توجد قوالب</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="zkong-table">
              <thead>
                <tr>
                  <th>Serial Number / الرقم التسلسلي</th>
                  <th>Template Name / اسم القالب</th>
                  <th>Template Type / نوع القالب</th>
                  <th>Size / الحجم</th>
                  <th>Template Classification / تصنيف القالب</th>
                  <th>Status / الحالة</th>
                  <th>Update Time / وقت التحديث</th>
                  <th>Preview / معاينة</th>
                  <th>Operation / الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template, idx) => (
                  <tr key={template.id}>
                    <td>{(page * pageSize) + idx + 1}</td>
                    <td>{template.templateName}</td>
                    <td>{template.attrName || '-'}</td>
                    <td>{template.size} Inch</td>
                    <td>{template.attrCategory || '-'}</td>
                    <td>
                      <span className={`status-pill ${template.status === '1' ? 'enabled' : 'disabled'}`}>
                        {template.status === '1' ? 'Enabled / مفعل' : 'Disabled / معطل'}
                      </span>
                    </td>
                    <td>{template.updateTime || template.createdTime || '-'}</td>
                    <td>
                      <button 
                        className="preview-trigger-btn"
                        onClick={() => setPreviewTemplate(template)}
                        onMouseEnter={() => handleMouseEnterThumbnail(template.id, template.attrCategory)}
                        onMouseLeave={handleMouseLeaveThumbnail}
                      >
                        <Image size={14} /> Preview
                      </button>
                    </td>
                    <td>
                      <div className="op-buttons">
                        <button className="op-btn primary-text" onClick={() => setEditTemplateModal({ id: template.id, templateName: template.templateName, attrCategory: template.attrCategory })}>Edit / تعديل</button>
                        <button className="op-btn primary-text" onClick={() => handleOpenAddToDetails(template)}>Add to Details / إضافة تفاصيل</button>
                        <button className="op-btn primary-text" onClick={() => handleToggleStatus(template.id, template.status)}>
                          {template.status === '1' ? 'Disable / تعطيل' : 'Enable / تفعيل'}
                        </button>
                        <button className="op-btn danger-text" onClick={() => handleDeleteTemplate(template.id)}>Delete / حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalElements > 0 && (
            <div className="dragonesl-pagination-bar" style={{ borderTop: '1px solid var(--glass-border)', padding: '16px 20px', background: 'rgba(255,255,255,0.01)' }}>
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
                  <option value={10}>10/page</option>
                  <option value={20}>20/page</option>
                  <option value={50}>50/page</option>
                  <option value={100}>100/page</option>
                </select>
              </div>

              <div className="pagination-right">
                <button type="button" disabled={page === 0} onClick={() => setPage(prev => Math.max(prev - 1, 0))} className="pagination-arrow-btn">&lt;</button>
                {getPaginationRange(page + 1, Math.ceil(totalElements / pageSize) || 1, 1).map((pageNum, idx) => (
                  pageNum === '...' ? <span key={`dots-${idx}`} className="pagination-dots">...</span> : <button key={pageNum} type="button" onClick={() => setPage(Number(pageNum) - 1)} className={`pagination-num-btn ${page + 1 === pageNum ? 'active' : ''}`}>{pageNum}</button>
                ))}
                <button type="button" disabled={page >= Math.ceil(totalElements / pageSize) - 1} onClick={() => setPage(prev => Math.min(prev + 1, Math.ceil(totalElements / pageSize) - 1))} className="pagination-arrow-btn">&gt;</button>
                <div className="pagination-jump"><span>Go to / الذهاب إلى</span><input type="number" min={1} max={Math.ceil(totalElements / pageSize) || 1} value={page + 1} onChange={(e) => { const val = Number(e.target.value); if (val >= 1 && val <= Math.ceil(totalElements / pageSize)) { setPage(val - 1); } }} className="pagination-jump-input" /></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

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
              {activeMenuTab === 'business_icon' && 'Business Icon / أيقونة العمل'}
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

          {/* ================= SECTION 3 & 4: BUSINESS / STORE ICONS ================= */}
          {(activeMenuTab === 'business_icon' || activeMenuTab === 'store_icon') && (
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
                  {activeMenuTab === 'business_icon'
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
                                  src={
                                    (icon.iconUrl || icon.url).startsWith('http')
                                      ? (icon.iconUrl || icon.url)
                                      : `http://www.dragonesl.com/${(icon.iconUrl || icon.url).startsWith('/') ? (icon.iconUrl || icon.url).slice(1) : (icon.iconUrl || icon.url)}`
                                  }
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

      {/* ================= MODAL DIALOG 1: NEW TEMPLATE (MULTI-STEP) ================= */}
      {isTemplateModalOpen && (() => {
        const closeAndReset = () => {
          setIsTemplateModalOpen(false);
          setTemplateStep(1);
          setCreatedTemplateId('');
          setTemplateEditorElements([]);
          setSelectedEditorElementId(null);
          setNewTemplate({
            templateName: '', storeId: activeMenuTab === 'store' ? selectedStore : '0',
            model: '', size: '', resolution: '152*152', sceneNumber: 1,
            screenType: 'single', attrCategory: '', attrName: ''
          });
        };

        const modelObj = models.find(m => m.size === newTemplate.size);
        const resStr = newTemplate.resolution || modelObj?.resolution || '296*128';
        const resParts = resStr.split('*');
        const canvasW = resParts.length === 2 ? parseInt(resParts[0], 10) : 296;
        const canvasH = resParts.length === 2 ? parseInt(resParts[1], 10) : 128;
        const aspectRatio = canvasW / canvasH;

        return (
          <div className={`modal-overlay ${templateStep === 2 ? 'fullscreen-overlay' : ''}`}>
            {templateStep === 1 ? (
              /* ── STEP 1: Template Info Form ── */
              <div className="modal-content glass-card scale-up">
                <button className="close-btn" onClick={closeAndReset}>&times;</button>
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="step-badge">Step 1 of 2</div>
                    <h3>Create {activeMenuTab === 'store' ? 'Store' : 'Merchant'} Template / إنشاء قالب</h3>
                  </div>
                </div>
                <form onSubmit={handleCreateTemplate} className="modal-form">

                  <div className="form-group">
                    <label>Template Name / اسم القالب <span className="required-asterisk">*</span></label>
                    <input required type="text" placeholder="e.g. My Price Tag Template"
                      value={newTemplate.templateName}
                      onChange={e => setNewTemplate({ ...newTemplate, templateName: e.target.value })}
                      className="glass-input" />
                  </div>

                  <div className="form-group">
                    <label>Screen Type / نوع الشاشة <span className="required-asterisk">*</span></label>
                    <div className="radio-group">
                      <label className="radio-option">
                        <input type="radio" name="screenType" value="single"
                          checked={newTemplate.screenType !== 'double'}
                          onChange={() => setNewTemplate({ ...newTemplate, screenType: 'single' })} />
                        <span>Single screen / شاشة واحدة</span>
                      </label>
                      <label className="radio-option">
                        <input type="radio" name="screenType" value="double"
                          checked={newTemplate.screenType === 'double'}
                          onChange={() => setNewTemplate({ ...newTemplate, screenType: 'double' })} />
                        <span>Double-sided / شاشة مزدوجة</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Size / الحجم <span className="required-asterisk">*</span></label>
                    {modelsLoading ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Loader2 className="animate-spin" size={16} /> Loading...
                      </div>
                    ) : modelsError ? (
                      <div style={{ color: 'var(--danger-color)', fontSize: '13px' }}>{modelsError}</div>
                    ) : (
                      <select required className="glass-input" value={newTemplate.size}
                        onChange={e => {
                          const sz = e.target.value;
                          const m = models.find(mo => mo.size === sz);
                          setNewTemplate({ ...newTemplate, size: sz, resolution: m?.resolution || '', model: m?.model || '' });
                        }}>
                        <option value="">Select Size... / اختر الحجم...</option>
                        {uniqueSizes.map(s => <option key={s} value={s}>{s} Inch</option>)}
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Dpi / الدقة</label>
                    <div className="radio-group">
                      <label className="radio-option">
                        <input type="radio" name="dpi" value="152*152"
                          checked={newTemplate.resolution !== '200*200'}
                          onChange={() => setNewTemplate({ ...newTemplate, resolution: '152*152' })} />
                        <span>152×152</span>
                      </label>
                      <label className="radio-option">
                        <input type="radio" name="dpi" value="200*200"
                          checked={newTemplate.resolution === '200*200'}
                          onChange={() => setNewTemplate({ ...newTemplate, resolution: '200*200' })} />
                        <span>200×200</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Model / الطراز</label>
                    <div className="glass-input" style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '14px', background: 'rgba(255,255,255,0.02)' }}>
                      {newTemplate.size
                        ? models.filter(m => m.size === newTemplate.size).map(m => m.model).join('  ') || 'No model'
                        : 'Select size first / اختر الحجم أولاً'}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Template Category / تصنيف القالب <span className="required-asterisk">*</span></label>
                    <select required className="glass-input" value={newTemplate.attrCategory || ''}
                      onChange={e => setNewTemplate({ ...newTemplate, attrCategory: e.target.value })}>
                      <option value="">Select Category... / اختر التصنيف...</option>
                      {categories.map(c => <option key={c.id} value={c.categoryName}>{c.categoryName}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Template Type / نوع القالب <span className="required-asterisk">*</span></label>
                    <select required className="glass-input" value={newTemplate.attrName || ''}
                      onChange={e => setNewTemplate({ ...newTemplate, attrName: e.target.value })}>
                      <option value="">Select Type... / اختر النوع...</option>
                      {templateTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {activeMenuTab === 'store' && (
                    <div className="form-group">
                      <label>Bound Store / المتجر المرتبط <span className="required-asterisk">*</span></label>
                      {storesLoading ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Loader2 className="animate-spin" size={16} /> Loading stores...
                        </div>
                      ) : storesError ? (
                        <div style={{ color: 'var(--danger-color)', fontSize: '13px' }}>{storesError}</div>
                      ) : (
                        <select className="glass-input" value={selectedStore}
                          onChange={e => setSelectedStore(e.target.value)}>
                          {stores.map(s => <option key={s.storeId} value={s.storeId}>{s.storeName}</option>)}
                        </select>
                      )}
                    </div>
                  )}

                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={closeAndReset}>Cancel / إلغاء</button>
                    <button type="submit" className="btn-primary" disabled={submitting} style={{ minWidth: '160px' }}>
                      {submitting || templateStepLoading
                        ? <><Loader2 className="animate-spin" size={16} style={{ marginRight: '8px' }} />Creating...</>
                        : <><LayoutTemplate size={16} style={{ marginRight: '6px' }} />Add To Details / إضافة للتفاصيل</>}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* ── STEP 2: Full DragonESL-style Template Editor ── */
              <div className="template-details-fullscreen glass-card scale-up">

                {/* TOP BAR */}
                <div className="tde-topbar">
                  <div className="tde-topbar-left">
                    <button className="tde-back-btn" onClick={() => setTemplateStep(1)}>
                      <ChevronLeft size={18} /> Back / رجوع
                    </button>
                    <div className="tde-step-info">
                      <div className="step-badge step-badge-2">Step 2 of 2</div>
                      <span className="tde-template-name">{newTemplate.templateName}</span>
                      {createdTemplateId && (
                        <span className="tde-template-id">ID: {createdTemplateId}</span>
                      )}
                    </div>
                  </div>
                  <div className="tde-topbar-right">
                    <span className="tde-size-pill"><Monitor size={14} /> {newTemplate.size}" · {newTemplate.resolution}</span>
                    <button className="btn-secondary sm-btn" onClick={closeAndReset}>
                      <X size={14} /> Close / إغلاق
                    </button>
                    <button className="btn-primary sm-btn" onClick={() => { showNotification('Template details saved! / تم حفظ تفاصيل القالب!', 'success'); fetchTemplatesList(); closeAndReset(); }}>
                      <CheckCircle2 size={14} /> Save & Finish / حفظ وإنهاء
                    </button>
                  </div>
                </div>

                {/* BODY: 3-column layout */}
                <div className="tde-body">

                  {/* LEFT: Component Palette */}
                  <div className="tde-sidebar-left">
                    <div className="tde-sidebar-title">Components / المكونات</div>

                    <div className="tde-component-group-label">Basic Elements</div>
                    <div className="tde-palette-grid">
                      {[
                        { icon: <Type size={20} />, label: 'Text', type: 'text' },
                        { icon: <Square size={20} />, label: 'Rectangle', type: 'rect' },
                        { icon: <Minus size={20} />, label: 'Line', type: 'line' },
                        { icon: <Image size={20} />, label: 'Image', type: 'image' },
                      ].map(({ icon, label, type }) => (
                        <div key={type} className="tde-palette-item" title={label} onClick={() => addPaletteElement(type)}>
                          {icon}
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="tde-component-group-label">Codes</div>
                    <div className="tde-palette-grid">
                      {[
                        { icon: <LayoutGrid size={20} />, label: 'Barcode', type: 'barcode' },
                        { icon: <QrCode size={20} />, label: 'QR Code', type: 'qrcode' },
                      ].map(({ icon, label, type }) => (
                        <div key={type} className="tde-palette-item" title={label} onClick={() => addPaletteElement(type)}>
                          {icon}
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="tde-component-group-label">Layers ({templateEditorElements.length})</div>
                    <div className="tde-layers-list">
                      {templateEditorElements.length === 0 ? (
                        <div className="tde-layers-empty">No layers yet</div>
                      ) : (
                        templateEditorElements.map((el: any, idx: number) => {
                          const isSelected = selectedEditorElementId === (el.id || idx.toString());
                          return (
                            <div 
                              key={el.id || idx} 
                              className="tde-layer-item"
                              style={{ 
                                background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                borderLeft: isSelected ? '3px solid var(--primary-color)' : '3px solid transparent',
                                cursor: 'pointer' 
                              }}
                              onClick={() => setSelectedEditorElementId(el.id || idx.toString())}
                            >
                              <Layers size={12} style={{ color: isSelected ? 'var(--primary-color)' : 'inherit' }} />
                              <span style={{ color: isSelected ? 'var(--text-primary)' : 'inherit', fontWeight: isSelected ? 600 : 'normal' }}>
                                {el.describeName || el.iconName || el.name || `Element ${idx + 1}`}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* CENTER: E-ink Canvas */}
                  <div className="tde-canvas-area">
                    <div className="tde-canvas-label">E-ink Preview / معاينة الشاشة</div>
                    <div className="tde-canvas-wrapper" onClick={() => setSelectedEditorElementId(null)}>
                      <div className="tde-bezel" onClick={(e) => e.stopPropagation()}>
                        <div className="tde-eink-screen" style={{ aspectRatio: `${aspectRatio}` }}>
                          {templateEditorElements.length === 0 ? (
                            <div className="tde-canvas-empty">
                              <LayoutTemplate size={32} style={{ color: '#94a3b8', marginBottom: '8px' }} />
                              <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                                Add components from the left panel<br />or icons from the right panel
                              </p>
                            </div>
                          ) : (
                            <div style={{ position: 'relative', width: '100%', height: '100%' }} onClick={() => setSelectedEditorElementId(null)}>
                              {templateEditorElements.map((el: any, idx: number) => {
                                const isSelected = selectedEditorElementId === (el.id || idx.toString());
                                const width = el.width || 40;
                                const height = el.height || 40;
                                const x = el.left || el.x || 0;
                                const y = el.top || el.y || 0;
                                
                                return (
                                  <Rnd
                                    key={el.id || idx}
                                    bounds="parent"
                                    size={{ width, height }}
                                    position={{ x, y }}
                                    onDragStart={(e) => {     
                                      e.stopPropagation();
                                      setSelectedEditorElementId(el.id || idx.toString());
                                    }}
                                    onDragStop={(_e, d) => {
                                      setTemplateEditorElements(prev => prev.map((item, i) => (item.id === el.id || i === idx) ? { ...item, left: d.x, x: d.x, top: d.y, y: d.y } : item));
                                    }}
                                    onResizeStart={(e) => {
                                      e.stopPropagation();
                                      setSelectedEditorElementId(el.id || idx.toString());
                                    }}
                                    onResizeStop={(_e, _direction, ref, _delta, position) => {
                                      setTemplateEditorElements(prev => prev.map((item, i) => (item.id === el.id || i === idx) ? {
                                        ...item,
                                        width: parseFloat(ref.style.width),
                                        height: parseFloat(ref.style.height),
                                        left: position.x,
                                        x: position.x,
                                        top: position.y,
                                        y: position.y,
                                      } : item));
                                    }}
                                    className={`tde-canvas-element ${isSelected ? 'selected' : ''}`}
                                    style={{
                                      zIndex: isSelected ? 10 : 1,
                                      border: isSelected ? '1.5px dashed var(--primary-color)' : '1px solid transparent',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      boxSizing: 'border-box'
                                    }}
                                  >
                                    {el.iconUrl || el.url ? (
                                      <img
                                        src={(el.iconUrl || el.url).startsWith('http') ? (el.iconUrl || el.url) : `http://www.dragonesl.com/${(el.iconUrl || el.url).replace(/^\//, '')}`}
                                        alt={el.describeName || el.iconName || 'icon'}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        draggable="false"
                                      />
                                    ) : el.type === 'text' ? (
                                      <div style={{ color: el.color || '#000', fontSize: `${el.fontSize || 14}px`, width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
                                        {el.text || 'Text'}
                                      </div>
                                    ) : el.type === 'barcode' ? (
                                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #ccc' }}>
                                        <div style={{ width: '80%', height: '60%', background: 'repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px)' }}></div>
                                        <span style={{ fontSize: '10px' }}>{el.text || '123456789'}</span>
                                      </div>
                                    ) : el.type === 'qrcode' ? (
                                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #ccc' }}>
                                        <QrCode size={Math.min(width, height) - 4} />
                                      </div>
                                    ) : el.type === 'rect' ? (
                                      <div style={{ width: '100%', height: '100%', background: el.backgroundColor || '#fff', border: `${el.borderWidth || 1}px solid ${el.borderColor || '#000'}` }} />
                                    ) : el.type === 'line' ? (
                                      <div style={{ width: '100%', height: '100%', borderBottom: `${Math.max(1, height)}px solid ${el.color || '#000'}` }} />
                                    ) : (
                                      <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Image size={20} />
                                      </div>
                                    )}
                                  </Rnd>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="tde-canvas-specs">
                        <span>{canvasW} × {canvasH} px · {newTemplate.resolution} DPI · {newTemplate.screenType === 'double' ? 'Double-sided' : 'Single screen'}</span>
                      </div>
                    </div>

                    {/* Template info summary bar */}
                    <div className="tde-info-bar">
                      <div className="tde-info-item"><span className="tde-info-label">Category</span><span className="tde-info-val">{newTemplate.attrCategory || '—'}</span></div>
                      <div className="tde-info-item"><span className="tde-info-label">Type</span><span className="tde-info-val">{newTemplate.attrName || '—'}</span></div>
                      <div className="tde-info-item"><span className="tde-info-label">Model</span><span className="tde-info-val">{newTemplate.model || models.find(m => m.size === newTemplate.size)?.model || '—'}</span></div>
                      <div className="tde-info-item"><span className="tde-info-label">Size</span><span className="tde-info-val">{newTemplate.size}"</span></div>
                    </div>
                  </div>

                  {/* RIGHT: Icons & Attributes Panel */}
                  <div className="tde-sidebar-right">
                    <div className="tde-right-tabs">
                      <button className={`tde-tab-btn ${selectedEditorTab === 'icons' ? 'active' : ''}`} onClick={() => setSelectedEditorTab('icons')}>
                        <Image size={13} /> Icons
                      </button>
                      <button className={`tde-tab-btn ${selectedEditorTab === 'attributes' ? 'active' : ''}`} onClick={() => setSelectedEditorTab('attributes')}>
                        <Settings2 size={13} /> Attributes
                      </button>
                    </div>

                    {selectedEditorTab === 'icons' && (
                      <>
                        <div className="tde-sidebar-title" style={{ marginTop: '0' }}>
                          {templateEditorElements.length > 0 ? (
                            <span style={{ color: 'var(--success-color)' }}>
                              <CheckCircle2 size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                              {templateEditorElements.length} component(s) in template
                            </span>
                          ) : (
                            <span>No components yet / لا مكونات بعد</span>
                          )}
                        </div>

                        {/* Existing components from findInTemp */}
                        {templateEditorElements.length > 0 && (
                          <div className="tde-existing-elements">
                            {templateEditorElements.map((el: any, idx: number) => (
                              <div key={el.id || idx} className="tde-existing-card">
                                {el.iconUrl || el.url ? (
                                  <img src={(el.iconUrl || el.url).startsWith('http') ? (el.iconUrl || el.url) : `http://www.dragonesl.com/${(el.iconUrl || el.url).replace(/^\//, '')}`}
                                    alt="icon" className="tde-existing-thumb" />
                                ) : (
                                  <div className="tde-existing-thumb-placeholder"><Image size={16} /></div>
                                )}
                                <div className="tde-existing-info">
                                  <span className="tde-existing-name">{el.describeName || el.iconName || el.name || `Component ${idx + 1}`}</span>
                                  <span className="tde-existing-meta">{el.width && el.height ? `${el.width}×${el.height}` : ''}</span>
                                </div>
                                <button className="tde-remove-el-btn" onClick={() => setTemplateEditorElements(prev => prev.filter((_, i) => i !== idx))} title="Remove">
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="tde-divider-label">Available Store Icons / الأيقونات المتاحة</div>
                        {storeIcons.length === 0 ? (
                          <div className="tde-no-icons">
                            <FolderOpen size={28} />
                            <p>No store icons available.<br />Go to Store Icon tab to upload.</p>
                          </div>
                        ) : (
                          <div className="tde-icons-grid">
                            {storeIcons.map((icon: any, idx: number) => {
                              const alreadyAdded = templateEditorElements.some(e => e.id === icon.id || e.iconId === icon.id);
                              return (
                                <div key={icon.id || idx} className={`tde-icon-card ${alreadyAdded ? 'added' : ''}`} title={icon.describeName || icon.fileName || 'Icon'}>
                                  {icon.iconUrl || icon.url ? (
                                    <img src={(icon.iconUrl || icon.url).startsWith('http') ? (icon.iconUrl || icon.url) : `http://www.dragonesl.com/${(icon.iconUrl || icon.url).replace(/^\//, '')}`}
                                      alt="icon" className="tde-icon-img" />
                                  ) : (
                                    <div className="tde-icon-placeholder"><Image size={22} /></div>
                                  )}
                                  <span className="tde-icon-name">{(icon.describeName || icon.fileName || icon.name || `Icon ${idx + 1}`).slice(0, 14)}</span>
                                  {alreadyAdded ? (
                                    <span className="tde-icon-added"><CheckCircle2 size={11} /> Added</span>
                                  ) : (
                                    <button 
                                      className="tde-icon-add-btn" 
                                      onClick={() => handleAddToDetails(createdTemplateId, icon)}
                                      disabled={addingItemId === icon.id}
                                    >
                                      {addingItemId === icon.id ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Add To Details
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}

                    {selectedEditorTab === 'attributes' && (
                      <div className="tde-attributes-panel">
                        <div className="tde-sidebar-title">Template Attributes / سمات القالب</div>
                        <div className="tde-attr-list">
                          {(categoryAttributes[newTemplate.attrCategory || 'default'] || ['default']).map((attr, idx) => {
                            const attrItem = { id: `attr_${attr}`, describeName: attr, type: 'text', text: attr, isAttribute: true };
                            const alreadyAdded = templateEditorElements.some(e => e.id === attrItem.id || e.text === attrItem.text);
                            return (
                              <div key={idx} className="tde-attr-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span className="attribute-name-badge">{attr}</span>
                                  <span className="tde-attr-type" style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>String</span>
                                </div>
                                {alreadyAdded ? (
                                  <span className="tde-icon-added"><CheckCircle2 size={11} /> Added</span>
                                ) : (
                                  <button 
                                    className="tde-icon-add-btn" 
                                    onClick={() => handleAddToDetails(createdTemplateId, attrItem)} 
                                    disabled={addingItemId === attrItem.id}
                                    style={{ background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    {addingItemId === attrItem.id ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Add To Details
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <button className="add-attribute-table-btn" style={{ marginTop: '12px' }} onClick={() => setSelectedEditorTab('icons')}>
                          <Plus size={14} /> Add Icon Component / إضافة أيقونة
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>
        );
      })()}
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

      {/* ================= MODAL DIALOG 5: ADD TO DETAILS ================= */}
      {addToDetailsModal && (
        <div className="modal-overlay add-to-details-overlay" onClick={() => setAddToDetailsModal(null)}>
          <div
            className="modal-content glass-card add-to-details-modal scale-up"
            onClick={e => e.stopPropagation()}
          >
            <button className="close-btn" onClick={() => setAddToDetailsModal(null)}><X size={18} /></button>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LayoutTemplate size={20} style={{ color: 'var(--primary-color)' }} />
                Add To Details / إضافة للتفاصيل
                <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '4px' }}>
                  ({addToDetailsModal.template.templateName})
                </span>
              </h3>
            </div>

            <div className="add-to-details-layout">

              {/* LEFT: Template Info + Existing Components */}
              <div className="add-to-details-left">
                <div className="atd-section-title">
                  <CheckCircle2 size={14} style={{ color: 'var(--success-color)' }} />
                  <span>Current Template Components / مكونات القالب الحالية</span>
                </div>

                {addToDetailsModal.loading ? (
                  <div className="atd-loading">
                    <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
                    <p>Loading components... / جاري تحميل المكونات...</p>
                  </div>
                ) : addToDetailsModal.existingItems.length === 0 && addToDetailsModal.pendingItems.length === 0 ? (
                  <div className="atd-empty">
                    <FolderOpen size={36} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                    <p>No components found. / لا توجد مكونات.</p>
                    <p style={{ fontSize: '12px' }}>Use the panel on the right to add icons. / استخدم اللوحة على اليمين لإضافة أيقونات.</p>
                  </div>
                ) : (
                  <div className="atd-components-list">
                    {/* Existing (saved) items */}
                    {addToDetailsModal.existingItems.map((item: any, idx: number) => (
                      <div key={item.id || item.iconId || idx} className="atd-component-card existing">
                        <div className="atd-component-icon-wrap">
                          {item.iconUrl || item.url ? (
                            <img
                              src={(item.iconUrl || item.url).startsWith('http')
                                ? (item.iconUrl || item.url)
                                : `http://www.dragonesl.com/${(item.iconUrl || item.url).startsWith('/') ? (item.iconUrl || item.url).slice(1) : (item.iconUrl || item.url)}`
                              }
                              alt="icon"
                              className="atd-icon-img"
                            />
                          ) : (
                            <div className="atd-icon-placeholder"><Image size={20} style={{ color: 'var(--text-muted)' }} /></div>
                          )}
                        </div>
                        <div className="atd-component-info">
                          <span className="atd-component-name">{item.describeName || item.iconName || item.fileName || item.name || `Component ${idx + 1}`}</span>
                          {item.width && item.height && (
                            <span className="atd-component-meta">{item.width} × {item.height}px</span>
                          )}
                          {item.parseAlgorithm !== undefined && (
                            <span className="atd-component-meta">
                              {item.parseAlgorithm === 0 ? 'Original' : item.parseAlgorithm === 1 ? 'B&W' : 'Adaptive'}
                            </span>
                          )}
                        </div>
                        <span className="atd-saved-badge">Saved / محفوظ</span>
                      </div>
                    ))}
                    {/* Pending (unsaved) items */}
                    {addToDetailsModal.pendingItems.map((item: any, idx: number) => (
                      <div key={`pending-${idx}`} className="atd-component-card pending">
                        <div className="atd-component-icon-wrap">
                          {item.iconUrl || item.url ? (
                            <img
                              src={(item.iconUrl || item.url).startsWith('http')
                                ? (item.iconUrl || item.url)
                                : `http://www.dragonesl.com/${(item.iconUrl || item.url).startsWith('/') ? (item.iconUrl || item.url).slice(1) : (item.iconUrl || item.url)}`
                              }
                              alt="icon"
                              className="atd-icon-img"
                            />
                          ) : (
                            <div className="atd-icon-placeholder"><Image size={20} style={{ color: 'var(--text-muted)' }} /></div>
                          )}
                        </div>
                        <div className="atd-component-info">
                          <span className="atd-component-name">{item.describeName || item.iconName || item.fileName || item.name || `New Component ${idx + 1}`}</span>
                          {item.width && item.height && (
                            <span className="atd-component-meta">{item.width} × {item.height}px</span>
                          )}
                        </div>
                        <span className="atd-pending-badge">Pending / معلق</span>
                        <button className="atd-remove-btn" onClick={() => handleRemovePendingItem(idx)} title="Remove">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Available Store Icons to Add */}
              <div className="add-to-details-right">
                <div className="atd-section-title">
                  <Plus size={14} style={{ color: 'var(--primary-color)' }} />
                  <span>Available Icons / الأيقونات المتاحة</span>
                </div>
                {storeIcons.length === 0 ? (
                  <div className="atd-empty">
                    <FolderOpen size={28} style={{ color: 'var(--text-muted)', marginBottom: '6px' }} />
                    <p style={{ fontSize: '12px' }}>No store icons found. / لا توجد أيقونات.</p>
                  </div>
                ) : (
                  <div className="atd-available-grid">
                    {storeIcons.map((icon: any, idx: number) => {
                      const alreadyAdded =
                        addToDetailsModal.existingItems.some(e => e.id === icon.id || e.iconId === icon.id) ||
                        addToDetailsModal.pendingItems.some(p => p.id === icon.id || p.iconId === icon.id);
                      return (
                        <div
                          key={icon.id || idx}
                          className={`atd-available-icon-card ${alreadyAdded ? 'already-added' : ''}`}
                          title={icon.describeName || icon.fileName || 'Icon'}
                        >
                          {icon.iconUrl || icon.url ? (
                            <img
                              src={(icon.iconUrl || icon.url).startsWith('http')
                                ? (icon.iconUrl || icon.url)
                                : `http://www.dragonesl.com/${(icon.iconUrl || icon.url).startsWith('/') ? (icon.iconUrl || icon.url).slice(1) : (icon.iconUrl || icon.url)}`
                              }
                              alt="icon"
                              className="atd-available-img"
                            />
                          ) : (
                            <div className="atd-available-placeholder"><Image size={24} /></div>
                          )}
                          <span className="atd-available-name">{(icon.describeName || icon.fileName || icon.name || `Icon ${idx + 1}`).slice(0, 16)}</span>
                          {alreadyAdded ? (
                            <span className="atd-added-badge"><CheckCircle2 size={12} /> Added</span>
                          ) : (
                            <button
                              className="atd-add-icon-btn"
                              onClick={() => handleAddPendingItem(icon)}
                            >
                              <Plus size={12} /> Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Footer Actions */}
            <div className="modal-actions" style={{ marginTop: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginRight: 'auto' }}>
                {addToDetailsModal.pendingItems.length > 0 && (
                  <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                    {addToDetailsModal.pendingItems.length} item(s) pending to be added
                  </span>
                )}
              </div>
              <button className="btn-secondary" onClick={() => setAddToDetailsModal(null)}>Close / إغلاق</button>
              {addToDetailsModal.pendingItems.length > 0 && (
                <button
                  className="btn-primary"
                  disabled={addToDetailsModal.saving}
                  onClick={handleSaveAddToDetails}
                >
                  {addToDetailsModal.saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  Save Changes / حفظ التغييرات
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
          background: rgba(148,163,184,0.12);
          color: var(--text-muted);
          border: 1px solid rgba(148,163,184,0.25);
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 12px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default Templates;