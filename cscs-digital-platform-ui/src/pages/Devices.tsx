import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Smartphone, 
  Cpu, 
  RefreshCw, 
  Loader2, 
  CheckCircle2, 
  MapPin,
  AlertCircle,
  Link2
} from 'lucide-react';
import { deviceService } from '../services/deviceService';
import type { EslDevice, ApDevice } from '../services/deviceService';
import { storeService } from '../services/storeService';
import type { Store } from '../services/storeService';
import { useAuth } from '../context/AuthContext';
import { getProducts } from '../services/productService';

import { EslTab } from '../components/devices/EslTab';
import { ApTab } from '../components/devices/ApTab';
import { BindModal } from '../components/devices/BindModal';
import { EslDetailModal } from '../components/devices/EslDetailModal';

const Devices: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'esl' | 'ap'>('esl');
  
  // Store context states
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [storesLoading, setStoresLoading] = useState(true);

  // Device states
  const [eslDevices, setEslDevices] = useState<EslDevice[]>([]);
  const [apDevices, setApDevices] = useState<ApDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Role validation
  const { user } = useAuth();
  const isAuthorized = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'SUPER_ADMIN';

  // Multi-select / checkboxes
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([]);

  // Detailed telemetry bind modal state
  const [detailEsl, setDetailEsl] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  // Individual action spinners
  const [refreshingBarcodes, setRefreshingBarcodes] = useState<{ [key: string]: boolean }>({});

  // Copy states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ── ESL Bind Workflow State ─────────────────────────────────────────────
  const [bindModalOpen, setBindModalOpen] = useState(false);
  const [bindLoading, setBindLoading] = useState(false);
  const [bindFormStoreId, setBindFormStoreId] = useState('');
  const [bindFormItemBarCode, setBindFormItemBarCode] = useState('');
  const [bindFormEslBarcode, setBindFormEslBarcode] = useState('');
  const [bindFormApMac, setBindFormApMac] = useState('');
  const [availableEsls, setAvailableEsls] = useState<any[]>([]);
  const [availableAps, setAvailableAps] = useState<any[]>([]);
  const [bindTab, setBindTab] = useState<'bind' | 'unbind'>('bind');
  const [unbindBarcodes, setUnbindBarcodes] = useState<string>(''); // comma-separated input

  // Fetch all stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      setStoresLoading(true);
      try {
        const response = await storeService.getAllStores();
        if (response && response.length > 0) {
          setStores(response);
          
          // Try to select Al Naseem store (1776682671415) by default if it exists
          const alNaseem = response.find((s: Store) => s.storeId === '1776682671415' || s.externalStoreId === '1776682671415');
          if (alNaseem) {
            setSelectedStoreId(alNaseem.storeId);
          } else {
            setSelectedStoreId(response[0].storeId);
          }
        } else {
          setError('No stores found in Dragon ESL. Please set up a store first.');
        }
      } catch (err: any) {
        console.error('Failed to load stores:', err);
        setError('Failed to fetch stores from Dragon ESL.');
      } finally {
        setStoresLoading(false);
      }
    };
    fetchStores();
  }, []);

  // Fetch device list when store, tab, page, or search changes
  const fetchDevices = async (isSilent = false) => {
    if (!selectedStoreId) return;
    if (!isSilent) setLoading(true);
    setError('');
    
    try {
      if (activeTab === 'esl') {
        const response = await deviceService.getEslDevices(page, pageSize, selectedStoreId, debouncedSearch);
        if (response) {
          setEslDevices(response.content || []);
          setTotalElements(response.totalElements || 0);
          setSelectedBarcodes([]); // Clear selection when page / criteria changes
        } else {
          setError('Failed to query ESL labels.');
        }
      } else {
        const response = await deviceService.getApDevices(page, pageSize, selectedStoreId, debouncedSearch);
        if (response) {
          setApDevices(response.content || []);
          setTotalElements(response.totalElements || 0);
        } else {
          setError('Failed to query AP base stations.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Connection failure. Could not fetch device telemetry.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0); // Reset page on tab or store switch
    setSelectedBarcodes([]);
  }, [activeTab, selectedStoreId]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchDevices();
  }, [activeTab, selectedStoreId, page, pageSize, debouncedSearch]);

  // Selection Handlers
  const handleSelectRow = (barcode: string) => {
    if (selectedBarcodes.includes(barcode)) {
      setSelectedBarcodes(prev => prev.filter(b => b !== barcode));
    } else {
      setSelectedBarcodes(prev => [...prev, barcode]);
    }
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      const activeBarcodes = eslDevices.map(d => d.priceTagCode);
      setSelectedBarcodes(activeBarcodes);
    } else {
      setSelectedBarcodes([]);
    }
  };

  // Fetch ESL detailed binding and live bitmap preview
  const handleViewDetails = async (barcode: string, rowData?: any) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    setDetailEsl(null);
    try {
      const response = await deviceService.getEslDetail(barcode);
      let eslData: any = response || null;

      if (!eslData && rowData) {
        // Fall back to row data — show dialog with local info
        eslData = {
          barCode: rowData.priceTagCode,
          softVersion: rowData.softVersion || 'N/A',
          state: rowData.state,
          status: rowData.status,
          model: rowData.oemModel || rowData.model,
          size: rowData.size,
          battery: rowData.battery,
          shelfNo: rowData.shelfNo || '',
          colorType: rowData.colorType || 'black and white red yellow',
          isReverse: rowData.isReverse ?? 0,
          itemList: rowData.itemBarCode ? [{ itemBarCode: rowData.itemBarCode, itemTitle: rowData.itemTitle || rowData.itemBarCode }] : [],
          images: []
        };
      }

      if (eslData) {
        // Extract the bound product barcode
        const boundBarcode = eslData.boundProduct?.barCode || 
                             eslData.boundProduct?.barcode || 
                             eslData.itemBindInfos?.[0]?.itemBarCode || 
                             eslData.itemBindInfos?.[0]?.itemBarcode || 
                             eslData.itemList?.[0]?.itemBarCode || 
                             eslData.itemList?.[0]?.itemBarcode || 
                             rowData?.itemBarCode;

        if (boundBarcode) {
          try {
            // Proactively query product catalog to get real name, price, original price, etc.
            const productsList = await getProducts(selectedStoreId, 0, 1, boundBarcode);
            if (productsList && productsList.content && productsList.content.length > 0) {
              const matchedProd = productsList.content[0];
              eslData.boundProduct = {
                ...eslData.boundProduct,
                itemTitle: matchedProd.itemName,
                price: matchedProd.price,
                barcode: matchedProd.barcode,
                originalPrice: (matchedProd as any).originalPrice || (matchedProd as any).custFeature2 || (parseFloat(matchedProd.price) * 1.2).toFixed(2),
                promotionText: 'PROMOTION',
                category: matchedProd.category
              };
              
              // Also sync the itemList/itemBindInfos so the details table shows the real product title instead of fallback barcode
              if (eslData.itemList && eslData.itemList.length > 0) {
                eslData.itemList[0].itemTitle = matchedProd.itemName;
                eslData.itemList[0].itemPrice = matchedProd.price;
              }
              if (eslData.itemBindInfos && eslData.itemBindInfos.length > 0) {
                eslData.itemBindInfos[0].itemTitle = matchedProd.itemName;
                eslData.itemBindInfos[0].itemPrice = matchedProd.price;
              }
            }
          } catch (prodErr) {
            console.error('Failed to enrich product details from catalog:', prodErr);
          }
        }
        setDetailEsl(eslData);
      }
    } catch (err: any) {
      // Network error — still show bind dialog with local row data
      const eslData: any = rowData ? {
        barCode: rowData.priceTagCode,
        softVersion: rowData.softVersion || 'N/A',
        state: rowData.state,
        status: rowData.status,
        model: rowData.model || rowData.oemModel,
        size: rowData.size,
        battery: rowData.battery,
        shelfNo: rowData.shelfNo || '',
        colorType: rowData.colorType || 'black and white red yellow',
        isReverse: rowData.isReverse ?? 0,
        itemList: rowData.itemBarCode ? [{ itemBarCode: rowData.itemBarCode, itemTitle: rowData.itemTitle || rowData.itemBarCode }] : [],
        images: []
      } : null;

      if (eslData) {
        const boundBarcode = rowData?.itemBarCode;
        if (boundBarcode) {
          try {
            const productsList = await getProducts(selectedStoreId, 0, 1, boundBarcode);
            if (productsList && productsList.content && productsList.content.length > 0) {
              const matchedProd = productsList.content[0];
              eslData.boundProduct = {
                itemTitle: matchedProd.itemName,
                price: matchedProd.price,
                barcode: matchedProd.barcode,
                originalPrice: (matchedProd as any).originalPrice || (matchedProd as any).custFeature2 || (parseFloat(matchedProd.price) * 1.2).toFixed(2),
                promotionText: 'PROMOTION',
                category: matchedProd.category
              };
              if (eslData.itemList && eslData.itemList.length > 0) {
                eslData.itemList[0].itemTitle = matchedProd.itemName;
                eslData.itemList[0].itemPrice = matchedProd.price;
              }
            }
          } catch (prodErr) {
            console.error('Failed to enrich product details from catalog after error:', prodErr);
          }
        }
        setDetailEsl(eslData);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  // Force Refresh / Reboot ESL (Single Device)
  const handleForceRefresh = async (barcode: string) => {
    if (!isAuthorized) {
      showNotification('error', 'Access Denied: Only Administrator roles can trigger ESL forced refresh. / تم رفض الوصول: الصلاحية للمدراء فقط لتحديث الشاشات.');
      return;
    }
    setRefreshingBarcodes(prev => ({ ...prev, [barcode]: true }));
    try {
      await deviceService.forceRefreshEsl(selectedStoreId, [barcode]);
      showNotification('success', 'Device refreshed successfully / تم تحديث الشاشة بنجاح');
      // Refresh grid silently
      fetchDevices(true);
    } catch (err: any) {
      showNotification('error', 'Failed to refresh device. Please try again. / فشل تحديث الشاشة. يرجى المحاولة مرة أخرى.');
    } finally {
      setRefreshingBarcodes(prev => ({ ...prev, [barcode]: false }));
    }
  };

  // Batch Force Refresh / Reboot ESL
  const handleBatchForceRefresh = async () => {
    if (!isAuthorized) {
      showNotification('error', 'Access Denied: Only Administrator roles can trigger ESL forced refresh. / تم رفض الوصول: الصلاحية للمدراء فقط لتحديث الشاشات.');
      return;
    }
    if (selectedBarcodes.length === 0) return;

    setLoading(true);
    try {
      await deviceService.forceRefreshEsl(selectedStoreId, selectedBarcodes);
      showNotification('success', 'Device refreshed successfully / تم تحديث الشاشة بنجاح');
      setSelectedBarcodes([]);
      fetchDevices(true);
    } catch (err: any) {
      showNotification('error', 'Failed to refresh device. Please try again. / فشل تحديث الشاشة. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── ESL Bind / Unbind Handlers ────────────────────────────────────────────

  /** Open the Bind modal and pre-load AP list and available ESLs for the selected store */
  const openBindModal = async () => {
    setBindModalOpen(true);
    setBindTab('bind');
    setBindFormStoreId(selectedStoreId);
    setBindFormItemBarCode('');
    setBindFormEslBarcode('');
    setBindFormApMac('');
    setUnbindBarcodes('');

    try {
      const [eslRes, apRes] = await Promise.all([
        deviceService.getAvailableEslDevices(selectedStoreId),
        deviceService.getApDevices(0, 200, selectedStoreId, '')
      ]);
      setAvailableEsls(eslRes || []);
      setAvailableAps(apRes?.content || []);
    } catch (e) {
      // Non-fatal — dropdowns will be empty but user can type manually
    }
  };

  /** Submit Bind: associate ESL barcode → item barcode + optional AP MAC */
  const handleBind = async () => {
    if (!bindFormStoreId || !bindFormItemBarCode.trim() || !bindFormEslBarcode.trim()) {
      showNotification('error', 'Store, Item Barcode, and ESL Barcode are all required. / اسم المتجر، باركود المنتج، وباركود الشاشة مطلوبة جميعها.');
      return;
    }
    setBindLoading(true);
    try {
      await deviceService.bindEsl({
        storeId: bindFormStoreId,
        itemBarCode: bindFormItemBarCode.trim(),
        eslBarcode: bindFormEslBarcode.trim(),
        apMac: bindFormApMac.trim() || undefined
      });
      showNotification('success', 'Device bound successfully / تم ربط الشاشة بنجاح');
      setBindModalOpen(false);
      fetchDevices(true);
    } catch (e: any) {
      showNotification('error', 'Failed to bind device. Please try again. / فشل ربط الشاشة. يرجى المحاولة مرة أخرى.');
    } finally {
      setBindLoading(false);
    }
  };

  /** Submit Unbind: release one or more ESL barcodes from their products */
  const handleUnbind = async () => {
    const barcodes = unbindBarcodes.split(/[,\n]+/).map(b => b.trim()).filter(Boolean);
    if (!bindFormStoreId || barcodes.length === 0) {
      showNotification('error', 'Store and at least one ESL Barcode are required. / اسم المتجر وباركود شاشة واحد على الأقل مطلوبة.');
      return;
    }
    setBindLoading(true);
    try {
      await deviceService.unbindEsl(bindFormStoreId, barcodes);
      showNotification('success', 'Device unbound successfully / تم إلغاء ربط الشاشة بنجاح');
      setBindModalOpen(false);
      fetchDevices(true);
    } catch (e: any) {
      showNotification('error', 'Failed to unbind device. Please try again. / فشل إلغاء ربط الشاشة. يرجى المحاولة مرة أخرى.');
    } finally {
      setBindLoading(false);
    }
  };

  return (
    <div className="devices-container">
      {/* Dynamic Toast Notifications */}
      {notification && (
        <div className={`notification-toast glass-card ${notification.type}`}>
          {notification.type === 'success' ? (
            <CheckCircle2 size={20} className="toast-icon-success" />
          ) : (
            <AlertCircle size={20} className="toast-icon-error" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="devices-page-header">
        <div>
          <h2>Equipment Management / إدارة الأجهزة</h2>
        </div>
        <div className="devices-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="global-search-bar">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Search devices... / ابحث عن الأجهزة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="store-selector-wrapper">
            <StoreIcon size={16} className="text-muted" />
            <select 
              value={selectedStoreId} 
              onChange={(e) => setSelectedStoreId(e.target.value)}
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

          {activeTab === 'esl' && (
            <button className="btn-primary" onClick={openBindModal} disabled={!selectedStoreId || storesLoading}>
              <Link2 size={18} /> Bind / ربط
            </button>
          )}

          <button className="btn-secondary" onClick={() => fetchDevices()} disabled={loading || storesLoading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh / تحديث
          </button>
        </div>
      </div>

      <div className="devices-tabs-wrapper">
        <div className="devices-tabs glass-card">
          <button 
            className={`tab-btn ${activeTab === 'esl' ? 'active' : ''}`}
            onClick={() => setActiveTab('esl')}
          >
            <Smartphone size={18} />
            <span>ESL Labels / شاشات الأسعار</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'ap' ? 'active' : ''}`}
            onClick={() => setActiveTab('ap')}
          >
            <Cpu size={18} />
            <span>AP Stations / محطات البث</span>
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <div className="devices-loading-state glass-card">
          <Loader2 className="animate-spin" size={40} />
          <p>Reading live equipment data from Zkong Cloud platform... / جاري قراءة بيانات الأجهزة المباشرة من منصة Zkong السحابية...</p>
        </div>
      ) : error ? (
        <div className="devices-error-state glass-card">
          <AlertCircle size={48} className="error-icon" />
          <h3>Connection Refused / تم رفض الاتصال</h3>
          <p>{error}</p>
          <button onClick={() => fetchDevices()} className="btn-primary">Try Again / أعد المحاولة</button>
        </div>
      ) : activeTab === 'esl' ? (
        <EslTab
          eslDevices={eslDevices}
          page={page}
          pageSize={pageSize}
          totalElements={totalElements}
          setPage={setPage}
          setPageSize={setPageSize}
          selectedBarcodes={selectedBarcodes}
          isAuthorized={isAuthorized}
          handleSelectRow={handleSelectRow}
          handleSelectAll={handleSelectAll}
          handleViewDetails={handleViewDetails}
          handleForceRefresh={handleForceRefresh}
          refreshingBarcodes={refreshingBarcodes}
          copyToClipboard={copyToClipboard}
          copiedId={copiedId}
        />
      ) : (
        <ApTab
          apDevices={apDevices}
          page={page}
          pageSize={pageSize}
          totalElements={totalElements}
          setPage={setPage}
          setPageSize={setPageSize}
          copyToClipboard={copyToClipboard}
          copiedId={copiedId}
        />
      )}

      {/* ================= BOTTOM STICKY BATCH OPERATIONS BAR ================= */}
      {selectedBarcodes.length > 0 && (
        <div className="batch-actions-bar glass-card scale-up">
          <div className="batch-info">
            <span className="count-badge">{selectedBarcodes.length}</span>
            <span>ESL labels selected for batch sync / بطاقات سعر محددة للتحديث الجماعي</span>
          </div>
          <div className="batch-buttons">
            <button 
              className={`btn-primary batch-refresh-btn ${!isAuthorized ? 'disabled' : ''}`} 
              onClick={handleBatchForceRefresh}
              disabled={!isAuthorized || loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              <span>Force Refresh Selected / تحديث البطاقات المحددة</span>
            </button>
            <button className="btn-secondary" onClick={() => setSelectedBarcodes([])}>
              Cancel / إلغاء
            </button>
          </div>
        </div>
      )}

      {/* ===== DRAGON ESL STYLE BIND / UNBIND MODAL ===== */}
      <BindModal
        bindModalOpen={bindModalOpen}
        setBindModalOpen={setBindModalOpen}
        stores={stores}
        bindLoading={bindLoading}
        bindFormStoreId={bindFormStoreId}
        setBindFormStoreId={setBindFormStoreId}
        bindFormItemBarCode={bindFormItemBarCode}
        setBindFormItemBarCode={setBindFormItemBarCode}
        bindFormEslBarcode={bindFormEslBarcode}
        setBindFormEslBarcode={setBindFormEslBarcode}
        bindFormApMac={bindFormApMac}
        setBindFormApMac={setBindFormApMac}
        availableEsls={availableEsls}
        setAvailableEsls={setAvailableEsls}
        availableAps={availableAps}
        setAvailableAps={setAvailableAps}
        bindTab={bindTab}
        setBindTab={setBindTab}
        unbindBarcodes={unbindBarcodes}
        setUnbindBarcodes={setUnbindBarcodes}
        selectedBarcodes={selectedBarcodes}
        handleBind={handleBind}
        handleUnbind={handleUnbind}
      />

      {/* ================= DRAGON ESL BIND DIALOG (DETAILS view) ================= */}
      <EslDetailModal
        detailModalOpen={detailModalOpen}
        setDetailModalOpen={setDetailModalOpen}
        detailLoading={detailLoading}
        detailEsl={detailEsl}
        isAuthorized={isAuthorized}
        handleForceRefresh={handleForceRefresh}
        stores={stores}
        selectedStoreId={selectedStoreId}
      />

      {/* Styled styles exactly embedded with maximum Premium Aesthetics */}
      <style>{`
        .devices-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: relative;
        }

        /* Notifications Toast */
        .notification-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 10000;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          border-left: 4px solid var(--primary-color);
        }

        .notification-toast.success {
          border-left-color: var(--success-color);
        }

        .notification-toast.error {
          border-left-color: var(--danger-color);
        }

        .toast-icon-success {
          color: var(--success-color);
        }

        .toast-icon-error {
          color: var(--danger-color);
        }

        @keyframes slideIn {
          from { transform: translateX(100%) translateY(-10px); opacity: 0; }
          to { transform: translateX(0) translateY(0); opacity: 1; }
        }

        .devices-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .devices-page-header h2 {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .devices-header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* Store context selector */
        .store-selector-wrapper {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          gap: 10px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
        }

        .selector-icon {
          color: var(--primary-color);
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

        /* Tabs and Searches Control bar */
        .devices-tabs-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .devices-tabs {
          display: flex;
          padding: 4px;
          background: rgba(0,0,0,0.05);
          gap: 4px;
        }

        [data-theme='dark'] .devices-tabs {
          background: rgba(255,255,255,0.05);
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          background: var(--bg-secondary);
          color: var(--primary-color);
          box-shadow: var(--shadow-sm);
        }

        .devices-search-form {
          display: flex;
          align-items: center;
          padding: 6px 12px;
          gap: 10px;
          flex: 1;
          max-width: 480px;
        }

        .devices-search-form input {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
        }

        .btn-primary-small {
          background: var(--primary-color);
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-primary-small:hover {
          background: var(--primary-hover);
        }

        /* Tables & Grids */
        .table-card {
          padding: 0;
          overflow: hidden;
        }

        .table-wrapper {
          overflow-x: auto;
          width: 100%;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        th {
          padding: 16px 24px;
          background: rgba(0,0,0,0.02);
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--glass-border);
        }

        [data-theme='dark'] th {
          background: rgba(255,255,255,0.02);
        }

        td {
          padding: 16px 24px;
          border-bottom: 1px solid var(--glass-border);
          font-size: 14px;
          color: var(--text-primary);
          vertical-align: middle;
        }

        tr:last-child td {
          border-bottom: none;
        }

        tr:hover td {
          background: rgba(0,0,0,0.01);
        }

        [data-theme='dark'] tr:hover td {
          background: rgba(255,255,255,0.01);
        }

        tr.row-selected td {
          background: rgba(59, 130, 246, 0.05);
        }

        /* Custom Checkbox */
        .custom-checkbox {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 1px solid var(--glass-border);
          cursor: pointer;
          accent-color: var(--primary-color);
        }

        /* Action buttons cell */
        .action-buttons-cell {
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        /* Barcode Cell copy styling */
        .barcode-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .copy-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .copy-btn:hover {
          color: var(--text-primary);
          background: rgba(0,0,0,0.05);
        }

        [data-theme='dark'] .copy-btn:hover {
          background: rgba(255,255,255,0.05);
        }

        .copy-btn svg.copied {
          color: var(--success-color);
        }

        /* Status Pills */
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .status-pill.online {
          background: rgba(16, 185, 129, 0.15);
          color: var(--success-color);
        }

        .status-pill.online .dot {
          width: 6px;
          height: 6px;
          background: var(--success-color);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--success-color);
        }

        .status-pill.offline {
          background: rgba(148, 163, 184, 0.15);
          color: var(--text-muted);
        }

        .status-pill.offline .dot {
          width: 6px;
          height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
        }

        .status-pill.warning {
          background: rgba(245, 158, 11, 0.15);
          color: var(--warning-color);
        }

        .status-pill.warning .dot {
          width: 6px;
          height: 6px;
          background: var(--warning-color);
          border-radius: 50%;
        }

        /* Battery meter */
        .battery-meter-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100px;
        }

        .battery-value {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          font-size: 12px;
        }

        .battery-bar-track {
          width: 100%;
          height: 4px;
          background: rgba(0,0,0,0.05);
          border-radius: 2px;
          overflow: hidden;
        }

        [data-theme='dark'] .battery-bar-track {
          background: rgba(255,255,255,0.05);
        }

        .battery-bar-fill {
          height: 100%;
          border-radius: 2px;
        }

        .battery-bar-fill.green { background: var(--success-color); }
        .battery-bar-fill.yellow { background: var(--warning-color); }
        .battery-bar-fill.red { background: var(--danger-color); }

        .battery-green { color: var(--success-color); }
        .battery-yellow { color: var(--warning-color); }
        .battery-red { color: var(--danger-color); }

        /* Signal Level cell */
        .signal-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 13px;
        }

        .signal-active {
          color: var(--primary-color);
        }

        .signal-inactive {
          color: var(--text-muted);
        }

        /* Bound Product Info */
        .bound-product-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .product-title {
          font-weight: 600;
          color: var(--text-primary);
        }

        .product-barcode {
          font-size: 11px;
          color: var(--text-muted);
        }

        .unbound-badge {
          font-size: 12px;
          font-style: italic;
          color: var(--text-muted);
          background: rgba(0,0,0,0.03);
          padding: 4px 8px;
          border-radius: 6px;
        }

        [data-theme='dark'] .unbound-badge {
          background: rgba(255,255,255,0.03);
        }

        .model-badge {
          background: rgba(59, 130, 246, 0.1);
          color: var(--primary-color);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
        }

        .ap-name-label {
          font-weight: 700;
          color: var(--text-primary);
        }

        .connections-badge {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
          padding: 4px 10px;
          border-radius: 8px;
          min-width: 60px;
        }

        .connections-badge .count {
          font-size: 14px;
          font-weight: 800;
        }

        .connections-badge .label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .ip-cell {
          color: var(--text-secondary);
          font-weight: 600;
        }

        .time-cell {
          font-size: 12px;
          color: var(--text-muted);
        }

        /* Action Buttons */
        .btn-secondary {
          background: rgba(148, 163, 184, 0.15);
          color: var(--text-primary);
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          transition: background 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(148, 163, 184, 0.25);
        }

        .btn-table-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1px solid var(--primary-color);
          color: var(--primary-color);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-table-action:hover {
          background: var(--primary-color);
          color: white;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
        }

        .view-btn {
          border-color: var(--success-color);
          color: var(--success-color);
        }

        .view-btn:hover {
          background: var(--success-color);
          color: white;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }

        .refresh-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          border-color: var(--text-muted);
          color: var(--text-muted);
        }

        .refresh-btn.disabled:hover {
          background: transparent;
          color: var(--text-muted);
          box-shadow: none;
        }

        /* Sticky bottom batch operations bar */
        .batch-actions-bar {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 900px;
          padding: 16px 32px;
          background: rgba(15, 23, 42, 0.85) !important;
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 9999;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .batch-info {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          color: #f8fafc;
        }

        .count-badge {
          background: var(--primary-color);
          color: white;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 14px;
          box-shadow: 0 0 10px var(--primary-color);
        }

        .batch-buttons {
          display: flex;
          gap: 12px;
        }

        .batch-refresh-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: var(--text-muted);
        }

        /* Modal Dialog: Detailed view */
        .esl-detail-modal {
          max-width: 950px;
          width: 90%;
          padding: 24px;
          background: #0f172a !important; /* Premium dark theme background */
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #f8fafc;
        }

        .modal-title-with-icon {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-title-with-icon h3 {
          font-size: 18px;
          font-weight: 800;
          color: #f8fafc;
        }

        .modal-loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          gap: 16px;
          color: #94a3b8;
        }

        .modal-grid-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }

        .screen-render-card {
          grid-column: span 2;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .modal-panel-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
        }

        .modal-panel-card h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--primary-color);
          margin-bottom: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-bottom: 8px;
        }

        .info-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }

        .info-row .label {
          color: #94a3b8;
          font-weight: 500;
        }

        .info-row .value {
          font-weight: 700;
          color: #f8fafc;
        }

        .info-row .value.highlight {
          color: var(--primary-color);
        }

        /* Modal bound table */
        .modal-bound-table {
          width: 100%;
          border-collapse: collapse;
        }

        .modal-bound-table th {
          background: rgba(0,0,0,0.3) !important;
          padding: 10px 12px;
          font-size: 11px;
          color: #94a3b8;
        }

        .modal-bound-table td {
          padding: 10px 12px;
          font-size: 13px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          color: #e2e8f0;
        }

        .modal-bound-table tbody tr:hover td {
          background: rgba(255,255,255,0.02);
        }

        /* Visual Eink canvas in bezel housing */
        .real-bezel-housing {
          background: #1e293b;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 1px 3px rgba(255,255,255,0.1);
          width: 100%;
          max-width: 450px;
          display: flex;
          justify-content: center;
        }

        /* ── Dragon ESL Bind Modal ── */
        .bind-modal {
          max-width: 680px;
          width: 96%;
          padding: 24px;
          max-height: 88vh;
          overflow-y: auto;
        }

        .bind-modal-body {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .bind-section {
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          padding: 18px 20px;
          margin-bottom: 16px;
          background: rgba(255,255,255,0.02);
        }

        .bind-section-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--glass-border);
        }

        /* Base info 3-column grid matching Dragon ESL */
        .bind-base-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .bind-base-row {
          display: grid;
          grid-template-columns: 140px 1fr 140px 1fr 120px 1fr;
          align-items: center;
          gap: 4px 8px;
          font-size: 13px;
        }

        .bind-base-label {
          color: var(--text-muted);
          font-weight: 500;
          white-space: nowrap;
        }

        .bind-base-value {
          color: var(--text-primary);
          font-weight: 600;
        }

        .bind-status-online {
          color: #22c55e;
          font-weight: 700;
        }

        /* Battery bar */
        .bind-battery-wrap { display: inline-flex; align-items: center; }
        .bind-battery-bar {
          width: 48px;
          height: 14px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
          border: 1px solid #d1d5db;
        }
        .bind-battery-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s;
        }

        /* Item table matching Dragon ESL */
        .bind-item-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .bind-item-table th {
          background: rgba(0,0,0,0.04);
          padding: 8px 12px;
          text-align: left;
          font-weight: 600;
          color: var(--text-muted);
          border-bottom: 1px solid var(--glass-border);
        }
        .bind-item-table td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--glass-border);
          color: var(--text-primary);
        }
        .bind-item-table tbody tr:last-child td { border-bottom: none; }

        /* ESL Information e-ink box — white bordered, Dragon ESL format */
        .bind-eink-box {
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: #ffffff;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          overflow: hidden;
        }

        .bind-eink-img {
          width: 100%;
          height: auto;
          display: block;
        }

        /* ── Enriched Premium Fallback E-ink Canvas ── */
        .bind-eink-canvas {
          width: 100%;
          padding: 16px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-sizing: border-box;
          font-family: 'Outfit', 'Inter', Arial, sans-serif;
          color: #000000;
        }

        .bind-eink-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #000000;
          padding-bottom: 4px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #000000;
        }

        .bind-eink-header .brand-logo {
          color: #e02020; /* E-ink Red logo */
          font-weight: 900;
        }

        .bind-eink-header .brand-store {
          color: #000000;
        }

        .bind-eink-promo-banner {
          background: #facc15; /* Pure golden yellow promotion background */
          color: #000000;
          font-size: 15px;
          font-weight: 900;
          text-align: center;
          padding: 6px 12px;
          border-radius: 4px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .bind-eink-price-section {
          display: flex;
          justify-content: space-around;
          align-items: center;
          margin: 8px 0;
          padding: 6px 0;
          border-bottom: 1px dashed #cccccc;
        }

        .bind-eink-main-price {
          display: flex;
          align-items: baseline;
          color: #e02020; /* Pure e-ink red price */
        }

        .bind-eink-main-price .price-currency {
          font-size: 14px;
          font-weight: 800;
          margin-right: 4px;
        }

        .bind-eink-main-price .price-value {
          font-size: 40px;
          font-weight: 900;
          line-height: 1;
        }

        .bind-eink-main-price .price-tag-now {
          font-size: 10px;
          text-transform: uppercase;
          background: #e02020;
          color: #ffffff;
          padding: 2px 5px;
          border-radius: 2px;
          margin-left: 6px;
          font-weight: 800;
        }

        .bind-eink-original-price {
          display: flex;
          align-items: baseline;
          color: #666666;
        }

        .bind-eink-original-price .orig-price-value {
          font-size: 18px;
          font-weight: 700;
          text-decoration: line-through;
          margin-right: 4px;
        }

        .bind-eink-original-price .price-tag-before {
          font-size: 10px;
          text-transform: uppercase;
          color: #666666;
          font-weight: 700;
        }

        .bind-eink-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
          margin-top: 4px;
        }

        .bind-eink-product-title {
          font-size: 16px;
          font-weight: 800;
          color: #000000;
          text-align: right;
          direction: rtl;
          flex-grow: 1;
          line-height: 1.4;
        }

        .bind-eink-product-barcode {
          font-size: 11px;
          font-weight: 700;
          color: #666666;
          white-space: nowrap;
        }

        .live-eink-canvas {
          width: 100%;
          background: #ffffff;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: inset 0 0 6px rgba(0,0,0,0.08);
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .zkong-rendered-img {
          width: 100%;
          height: auto;
          display: block;
        }

        /* Dragon ESL exact mock layout */
        .dragon-esl-mock {
          flex-direction: column;
          justify-content: flex-start;
          align-items: stretch;
          padding: 0;
          aspect-ratio: 16 / 10;
        }

        /* PROMOTION — exact Dragon ESL golden amber */
        .dragon-mock-promo {
          color: #d4a017;
          font-size: 26px;
          font-weight: 900;
          text-align: center;
          padding: 14px 8px 6px 8px;
          letter-spacing: 1px;
          font-family: 'Inter', Arial, sans-serif;
          background: #ffffff;
        }

        /* Price — exact Dragon ESL red, large centered */
        .dragon-mock-price {
          color: #e02020;
          font-size: 32px;
          font-weight: 900;
          text-align: center;
          padding: 4px 8px 10px 8px;
          font-family: 'Inter', Arial, sans-serif;
          letter-spacing: 0.5px;
        }

        /* Product name — exact Dragon ESL black small RTL bottom */
        .dragon-mock-product {
          color: #000000;
          font-size: 12px;
          font-weight: 500;
          text-align: right;
          direction: rtl;
          padding: 0 10px 8px 8px;
          margin-top: auto;
          font-family: 'Inter', Arial, sans-serif;
        }

        .live-eink-canvas.empty-eink .large-price-digits .unit {
          font-size: 14px;
          margin-right: 4px;
        }

        .live-eink-canvas.empty-eink .large-price-digits .val {
          font-size: 32px;
        }

        /* Empty & Loading states */
        .devices-loading-state, .devices-error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 40px;
          text-align: center;
          color: var(--text-secondary);
          gap: 16px;
        }

        .devices-loading-state p {
          font-weight: 600;
        }

        .empty-table-cell {
          text-align: center;
          padding: 64px 20px;
          color: var(--text-muted);
        }

        .empty-icon {
          margin-bottom: 12px;
          color: var(--text-muted);
          opacity: 0.5;
        }

        .empty-table-cell p {
          font-weight: 600;
        }

        /* Pagination style */
        .table-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-top: 1px solid var(--glass-border);
        }

        .pagination-info {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-page {
          background: var(--bg-accent);
          color: var(--text-primary);
          border: 1px solid var(--glass-border);
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-page:hover:not(:disabled) {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .btn-page:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-indicator {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Scale up animation */
        .scale-up {
          animation: scaleUpAnim 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes scaleUpAnim {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* ──────────────── Bind Workflow Modal CSS ──────────────── */

        .bind-workflow-modal {
          max-width: 560px;
          width: 96%;
          padding: 0 0 24px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .bind-workflow-modal .modal-header {
          padding: 18px 24px 14px;
          border-bottom: 1px solid var(--glass-border);
          margin-bottom: 0;
        }

        /* Bind / Unbind tab row */
        .bind-tab-row {
          display: flex;
          gap: 0;
          border-bottom: 1px solid var(--glass-border);
          padding: 0 24px;
          background: rgba(0,0,0,0.02);
        }

        .bind-tab-btn {
          padding: 10px 22px;
          font-size: 13px;
          font-weight: 600;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          border-bottom: 3px solid transparent;
          margin-bottom: -1px;
          transition: color 0.2s, border-color 0.2s;
        }
        .bind-tab-btn.active {
          color: var(--accent-primary);
          border-bottom-color: var(--accent-primary);
        }
        .bind-tab-btn:hover:not(.active) {
          color: var(--text-primary);
        }

        /* Form body */
        .bind-form-body {
          padding: 20px 24px 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .bind-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .bind-field-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .required-asterisk {
          color: var(--danger-color);
          margin-left: 2px;
        }

        .bind-input, .bind-select {
          padding: 9px 12px;
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          color: var(--text-primary);
          font-size: 13px;
          width: 100%;
          transition: border-color 0.2s;
        }
        .bind-input:focus, .bind-select:focus {
          outline: none;
          border-color: var(--accent-primary);
        }

        .bind-textarea {
          padding: 9px 12px;
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          color: var(--text-primary);
          font-size: 13px;
          width: 100%;
          resize: vertical;
          font-family: 'Inter', monospace;
          transition: border-color 0.2s;
        }
        .bind-textarea:focus {
          outline: none;
          border-color: var(--accent-primary);
        }

        .bind-hint {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .bind-input-with-hint {
          position: relative;
        }

        /* AP quick-select chips */
        .bind-ap-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }

        .bind-ap-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s;
        }
        .bind-ap-chip.online {
          background: rgba(34,197,94,0.1);
          color: #22c55e;
          border-color: rgba(34,197,94,0.3);
        }
        .bind-ap-chip.offline {
          background: rgba(107,114,128,0.1);
          color: var(--text-muted);
          border-color: var(--glass-border);
        }
        .bind-ap-chip.selected {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
        }
        .bind-ap-chip:hover { opacity: 0.85; }

        .ap-chip-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }

        /* Pre-fill button */
        .bind-prefill-btn {
          padding: 7px 14px;
          border-radius: 8px;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.3);
          color: var(--accent-primary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          width: fit-content;
          transition: background 0.2s;
        }
        .bind-prefill-btn:hover {
          background: rgba(59,130,246,0.14);
        }

        /* Info note */
        .bind-form-note {
          font-size: 12px;
          color: var(--text-muted);
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          padding: 10px 14px;
          line-height: 1.5;
        }

        /* Danger button for Unbind */
        .btn-danger {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(239,68,68,0.12);
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-danger:hover:not(:disabled) {
          background: rgba(239,68,68,0.2);
        }
        .btn-danger:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* Modal Overlay & Structure Styles with dynamic themes */
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
          max-width: 560px;
          padding: 24px;
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
          margin-bottom: 20px;
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

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        /* High-contrast overrides for details/telemetry inside detail modal */
        .modal-content .bind-section {
          border: 1px solid var(--border-color) !important;
          background: var(--bg-accent) !important;
        }

        .modal-content .bind-section-title {
          color: var(--text-primary) !important;
          border-bottom: 1.5px solid var(--border-color) !important;
        }

        .modal-content .bind-base-label {
          color: var(--text-secondary) !important;
        }

        .modal-content .bind-base-value {
          color: var(--text-primary) !important;
        }

        .modal-content .bind-item-table th {
          background: var(--bg-accent) !important;
          color: var(--text-secondary) !important;
          border-bottom: 1.5px solid var(--border-color) !important;
        }

        .modal-content .bind-item-table td {
          color: var(--text-primary) !important;
          border-bottom: 1px solid var(--border-color) !important;
        }

        /* Bind Workflow Modal fields */
        .modal-content .bind-field-label {
          color: var(--text-secondary) !important;
          font-weight: 600 !important;
        }

        .modal-content .bind-input,
        .modal-content .bind-select,
        .modal-content .bind-textarea {
          background: var(--bg-primary) !important;
          border: 1px solid var(--border-color) !important;
          color: var(--text-primary) !important;
          border-radius: 8px !important;
          padding: 10px 12px !important;
          font-size: 14px !important;
        }

        .modal-content .bind-input:focus,
        .modal-content .bind-select:focus,
        .modal-content .bind-textarea:focus {
          border-color: var(--primary-color) !important;
          outline: none !important;
        }

        /* Searchable dropdown inside Bind Modal */
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
        }

        .modal-content .dropdown-option-item:hover .option-item-name {
          color: var(--primary-color) !important;
        }

        .modal-content .option-item-name {
          color: var(--text-primary) !important;
        }

        .modal-content .option-item-barcode {
          color: var(--text-muted) !important;
        }

        .modal-content .dropdown-no-options,
        .modal-content .dropdown-loading {
          color: var(--text-muted) !important;
        }

        /* Tabs inside the bind modal */
        .modal-content .bind-tab-row {
          display: flex !important;
          gap: 8px !important;
          border-bottom: 1.5px solid var(--border-color) !important;
          margin-bottom: 20px !important;
        }

        .modal-content .bind-tab-btn {
          padding: 8px 16px !important;
          background: none !important;
          border: none !important;
          color: var(--text-muted) !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          border-bottom: 3px solid transparent !important;
          margin-bottom: -1.5px !important;
          transition: all 0.2s !important;
        }

        .modal-content .bind-tab-btn.active {
          color: var(--primary-color) !important;
          border-bottom-color: var(--primary-color) !important;
        }

        /* AP chips inside Bind modal */
        .modal-content .bind-ap-chip {
          background: var(--bg-accent) !important;
          border: 1px solid var(--border-color) !important;
          color: var(--text-secondary) !important;
        }

        .modal-content .bind-ap-chip:hover {
          background: var(--glass-border) !important;
        }

        .modal-content .bind-ap-chip.selected {
          border-color: var(--primary-color) !important;
          background: rgba(59, 130, 246, 0.1) !important;
          color: var(--primary-color) !important;
        }

        /* Form note inside modal */
        .modal-content .bind-form-note {
          color: var(--text-muted) !important;
          background: var(--bg-accent) !important;
          border-radius: 6px !important;
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

        /* Searchable dropdown inside Bind Modal */
        .searchable-dropdown-wrapper {
          position: relative;
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
          display: flex;
          flex-direction: column;
          gap: 2px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .dropdown-option-item:last-child {
          border-bottom: none;
        }

        .dropdown-option-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .dropdown-option-item:hover .option-item-name {
          color: var(--accent-primary);
        }

        .option-item-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 13px;
        }

        .option-item-barcode {
          font-size: 11px;
          color: var(--text-muted);
        }

        .dropdown-no-options, .dropdown-loading {
          padding: 12px 16px;
          color: var(--text-muted);
          font-size: 13px;
          font-style: italic;
          text-align: center;
        }

        @media (max-width: 768px) {
          .devices-page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .devices-header-actions {
            width: 100%;
            justify-content: space-between;
          }
          .devices-tabs-navigation {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .tabs-list {
            overflow-x: auto;
            padding-bottom: 4px;
          }
          .device-search-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .ap-grid {
            grid-template-columns: 1fr;
          }
          .devices-table-wrapper {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default Devices;
