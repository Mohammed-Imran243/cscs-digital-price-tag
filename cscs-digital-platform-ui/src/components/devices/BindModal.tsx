import React, { useState, useEffect, useRef } from 'react';

import { Loader2 } from 'lucide-react';
import type { Store } from '../../services/storeService';
import { deviceService } from '../../services/deviceService';
import { getProducts } from '../../services/productService';
import type { Product } from '../../services/productService';

interface BindModalProps {
  bindModalOpen: boolean;
  setBindModalOpen: (open: boolean) => void;
  mode: 'bind' | 'unbind';
  stores: Store[];
  bindLoading: boolean;
  bindFormStoreId: string;
  setBindFormStoreId: (storeId: string) => void;
  bindFormItemBarCode: string;
  setBindFormItemBarCode: (barcode: string) => void;
  bindFormEslBarcode: string;
  setBindFormEslBarcode: (barcode: string) => void;
  bindFormApMac: string;
  setBindFormApMac: (mac: string) => void;
  availableEsls: any[];
  setAvailableEsls: (esls: any[]) => void;
  availableAps: any[];
  setAvailableAps: (aps: any[]) => void;
  unbindBarcodes: string;
  setUnbindBarcodes: (barcodes: string) => void;
  selectedBarcodes: string[];
  handleBind: () => void;
  handleUnbind: () => void;
}

export const BindModal: React.FC<BindModalProps> = ({
  bindModalOpen,
  setBindModalOpen,
  mode,
  stores,
  bindLoading,
  bindFormStoreId,
  setBindFormStoreId,
  bindFormItemBarCode,
  setBindFormItemBarCode,
  bindFormEslBarcode,
  setBindFormEslBarcode,
  bindFormApMac,
  setBindFormApMac,
  availableEsls,
  setAvailableEsls,
  availableAps,
  setAvailableAps,
  unbindBarcodes,
  setUnbindBarcodes,
  selectedBarcodes,
  handleBind,
  handleUnbind,
}) => {
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [hasTypedProduct, setHasTypedProduct] = useState(false);

  const [eslSearchQuery, setEslSearchQuery] = useState('');
  const [isEslDropdownOpen, setIsEslDropdownOpen] = useState(false);
  const eslDropdownRef = useRef<HTMLDivElement>(null);
  const [hasTypedEsl, setHasTypedEsl] = useState(false);



  useEffect(() => {
    if (bindModalOpen && bindFormStoreId) {
      const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
          const response = await getProducts(bindFormStoreId, 0, 1000);
          if (response && response.content) {
            setStoreProducts(response.content);
          } else {
            setStoreProducts([]);
          }
        } catch (err) {
          console.error('Failed to fetch products for store in BindModal', err);
          setStoreProducts([]);
        } finally {
          setLoadingProducts(false);
        }
      };
      fetchProducts();
    } else {
      setStoreProducts([]);
    }
  }, [bindModalOpen, bindFormStoreId]);

  useEffect(() => {
    if (!bindFormItemBarCode) {
      setSearchQuery('');
      setHasTypedProduct(false);
    } else {
      const matched = storeProducts.find(p => p.barcode === bindFormItemBarCode);
      const displayVal = matched ? `${matched.itemName || 'Unnamed Item'} (${matched.barcode || ''})` : bindFormItemBarCode;
      if (displayVal !== searchQuery) {
        setSearchQuery(displayVal);
        setHasTypedProduct(false);
      }
    }
  }, [bindFormItemBarCode, storeProducts]);

  useEffect(() => {
    if (!bindFormEslBarcode) {
      setEslSearchQuery('');
      setHasTypedEsl(false);
    } else {
      const matched = availableEsls.find(e => e.priceTagCode === bindFormEslBarcode);
      const displayVal = matched ? `${matched.priceTagCode} (${matched.oemModel || 'N/A'})` : bindFormEslBarcode;
      if (displayVal !== eslSearchQuery) {
        setEslSearchQuery(displayVal);
        setHasTypedEsl(false);
      }
    }
  }, [bindFormEslBarcode, availableEsls]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setHasTypedProduct(false);
      }
      if (eslDropdownRef.current && !eslDropdownRef.current.contains(event.target as Node)) {
        setIsEslDropdownOpen(false);
        setHasTypedEsl(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = storeProducts.filter(p => {
    if (!hasTypedProduct) return true;
    const term = (searchQuery || '').toLowerCase();
    const itemName = (p.itemName || '').toLowerCase();
    const barcode = (p.barcode || '').toLowerCase();
    return itemName.includes(term) || barcode.includes(term);
  });

  const filteredEsls = availableEsls.filter(e => {
    if (!hasTypedEsl) return true;
    const term = (eslSearchQuery || '').toLowerCase();
    const tagCode = (e.priceTagCode || '').toLowerCase();
    const model = (e.oemModel || '').toLowerCase();
    return tagCode.includes(term) || model.includes(term);
  });

  if (!bindModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setBindModalOpen(false)}>
      {/* Scoped style to forcefully remove SVG arrow from bind-select dropdowns */}
      <style>{`
        select.bind-select,
        .modal-content select.bind-select,
        .bind-field-group select.bind-select,
        .bind-form-body select.bind-select {
          background-image: none !important;
          -webkit-appearance: auto !important;
          -moz-appearance: auto !important;
          appearance: auto !important;
          padding-right: 12px !important;
        }
        .modal-actions .btn-danger {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          background-color: #ef4444 !important;
          color: white !important;
          border: 1px solid #ef4444 !important;
          padding: 10px 20px !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: var(--shadow-sm) !important;
        }
        .modal-actions .btn-danger:hover:not(:disabled) {
          background-color: #dc2626 !important;
          border-color: #dc2626 !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3) !important;
          transform: translateY(-1px) !important;
        }
        .modal-actions .btn-danger:active:not(:disabled) {
          transform: translateY(1px) !important;
        }
        .modal-actions .btn-danger:disabled {
          background-color: rgba(239, 68, 68, 0.45) !important;
          border-color: rgba(239, 68, 68, 0.45) !important;
          color: rgba(255, 255, 255, 0.6) !important;
          cursor: not-allowed !important;
          box-shadow: none !important;
          transform: none !important;
        }
        .bind-workflow-modal {
          display: flex !important;
          flex-direction: column !important;
          max-height: 90vh !important;
          overflow: hidden !important;
          padding: 0 !important;
        }
        .bind-workflow-modal .modal-header {
          flex-shrink: 0 !important;
        }
        .bind-workflow-modal .bind-form-body {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          overflow: hidden !important;
          padding: 0 !important;
          gap: 0 !important;
        }
        .bind-fields-wrapper {
          display: flex !important;
          flex-direction: column !important;
          gap: 16px !important;
          flex: 1 !important;
          overflow-y: auto !important;
          padding: 20px 24px 24px 24px !important;
        }
        .bind-workflow-modal .modal-actions {
          flex-shrink: 0 !important;
          margin-top: 0 !important;
          padding: 16px 24px 20px 24px !important;
          border-top: 1px solid var(--glass-border) !important;
          background: transparent !important;
        }
      `}</style>

      <div className="modal-content glass-card bind-workflow-modal scale-up" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <h3>
            {mode === 'bind' ? 'Bind / ربط' : 'Unbind / إلغاء الربط'}
          </h3>
          <button className="close-btn" onClick={() => setBindModalOpen(false)}>&times;</button>
        </div>

        {/* ── BIND FORM ── */}
        {mode === 'bind' && (
          <div className="bind-form-body">
            <div className="bind-fields-wrapper">

            {/* Store Select */}
            <div className="bind-field-group">
              <label className="bind-field-label">Store Select / اختيار المتجر</label>
              <select
                className="bind-select"
                value={bindFormStoreId}
                onChange={e => {
                  const newStoreId = e.target.value;
                  setBindFormStoreId(newStoreId);
                  setAvailableEsls([]);
                  setAvailableAps([]);
                  setBindFormEslBarcode('');
                  setBindFormApMac('');
                  deviceService.getAvailableEslDevices(newStoreId)
                    .then(r => setAvailableEsls(r || []))
                    .catch(() => {});
                  deviceService.getApDevices(0, 200, newStoreId, '')
                    .then(r => setAvailableAps(r?.content || []))
                    .catch(() => {});
                }}
              >
                {stores.map(s => (
                  <option key={s.storeId} value={s.storeId}>{s.storeName}</option>
                ))}
              </select>
            </div>

            {/* Item / Product Searchable Dropdown */}
            <div className="bind-field-group" ref={dropdownRef}>
              <label className="bind-field-label">Item / Product <span className="required-asterisk">*</span> / المنتج</label>
              <div className="searchable-dropdown-wrapper">
                <input
                  className="bind-input dropdown-input"
                  type="text"
                  placeholder="Search item by name or barcode... / ابحث عن الصنف بالاسم أو الباركود..."
                  value={searchQuery}
                  onChange={e => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    setBindFormItemBarCode(val);
                    setIsDropdownOpen(true);
                    setHasTypedProduct(true);
                  }}
                  onFocus={() => {
                    setIsDropdownOpen(true);
                    setHasTypedProduct(false);
                  }}
                />
                {isDropdownOpen && (
                  <div className="dropdown-options-list">
                    {loadingProducts ? (
                      <div className="dropdown-loading">Loading items... / جاري تحميل العناصر...</div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="dropdown-no-options">No items found / لم يتم العثور على عناصر</div>
                    ) : (
                      filteredProducts.map(p => (
                        <div
                          key={p.id}
                          className="dropdown-option-item"
                          onClick={() => {
                            setBindFormItemBarCode(p.barcode);
                            setSearchQuery(`${p.itemName} (${p.barcode})`);
                            setIsDropdownOpen(false);
                            setHasTypedProduct(false);
                          }}
                        >
                          <div className="option-item-name">{p.itemName}</div>
                          <div className="option-item-barcode">Barcode / الباركود: {p.barcode}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ESL Barcode Searchable Dropdown */}
            <div className="bind-field-group" ref={eslDropdownRef}>
              <label className="bind-field-label">ESL Barcode <span className="required-asterisk">*</span> / باركود الشاشة</label>
              <div className="searchable-dropdown-wrapper">
                <input
                  className="bind-input dropdown-input"
                  type="text"
                  placeholder="Search ESL barcode or model... / ابحث عن باركود أو طراز الشاشة..."
                  value={eslSearchQuery}
                  onChange={e => {
                    const val = e.target.value;
                    setEslSearchQuery(val);
                    setBindFormEslBarcode(val);
                    setIsEslDropdownOpen(true);
                    setHasTypedEsl(true);
                  }}
                  onFocus={() => {
                    setIsEslDropdownOpen(true);
                    setHasTypedEsl(false);
                  }}
                />
                {isEslDropdownOpen && (
                  <div className="dropdown-options-list">
                    {availableEsls.length === 0 ? (
                      <div className="dropdown-no-options">No available ESLs found / لم يتم العثور على شاشات متاحة</div>
                    ) : filteredEsls.length === 0 ? (
                      <div className="dropdown-no-options">No matching ESLs found / لم يتم العثور على شاشات مطابقة</div>
                    ) : (
                      filteredEsls.map(e => (
                        <div
                          key={e.priceTagCode}
                          className="dropdown-option-item"
                          onClick={() => {
                            setBindFormEslBarcode(e.priceTagCode);
                            setEslSearchQuery(`${e.priceTagCode} (${e.oemModel || 'N/A'})`);
                            setIsEslDropdownOpen(false);
                            setHasTypedEsl(false);
                          }}
                        >
                          <div className="option-item-name">{e.priceTagCode}</div>
                          <div className="option-item-barcode">Model / الطراز: {e.oemModel || 'N/A'} — {e.state === 'ONLINE' ? 'Online / متصل' : 'Offline / غير متصل'}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {availableEsls.length > 0 && (
                <span className="bind-hint">{availableEsls.length} unbound ESL(s) available / {availableEsls.length} شاشة (شاشات) غير مرتبطة متاحة</span>
              )}
            </div>

            {/* AP MAC */}
            <div className="bind-field-group">
              <label className="bind-field-label">AP MAC (optional) / عنوان MAC للمحطة (اختياري)</label>
              <div className="bind-input-with-hint">
                <input
                  className="bind-input"
                  type="text"
                  placeholder="e.g. AA:BB:CC:DD:EE:FF / مثال AA:BB:CC:DD:EE:FF"
                  value={bindFormApMac}
                  onChange={e => setBindFormApMac(e.target.value)}
                  list="available-ap-list"
                />
                <datalist id="available-ap-list">
                  {availableAps.map(ap => (
                    <option key={ap.mac} value={ap.mac}>
                      {ap.apName || ap.mac} — {ap.online === 'ONLINE' ? 'Online / متصل' : 'Offline / غير متصل'}
                    </option>
                  ))}
                </datalist>
              </div>
              {availableAps.length > 0 && (
                <div className="bind-ap-chips">
                  {availableAps.slice(0, 4).map(ap => (
                    <span
                      key={ap.mac}
                      className={`bind-ap-chip ${ap.online === 'ONLINE' ? 'online' : 'offline'} ${bindFormApMac === ap.mac ? 'selected' : ''}`}
                      onClick={() => setBindFormApMac(ap.mac)}
                      title={`${ap.apName} — ${ap.ip || 'N/A'} — ${ap.online}`}
                    >
                      <span className="ap-chip-dot" />
                      {ap.apName || ap.mac}
                    </span>
                  ))}
                </div>
              )}
            </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setBindModalOpen(false)}>Cancel / إلغاء</button>
              <button
                className="btn-primary"
                onClick={handleBind}
                disabled={bindLoading || !bindFormItemBarCode.trim() || !bindFormEslBarcode.trim()}
              >
                {bindLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Binding... / جاري الربط...</span>
                  </>
                ) : (
                  <span>Bind / ربط</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── UNBIND FORM ── */}
        {mode === 'unbind' && (
          <div className="bind-form-body">
            <div className="bind-fields-wrapper">

            {/* Store Select */}
            <div className="bind-field-group">
              <label className="bind-field-label">Store Select / اختيار المتجر</label>
              <select
                className="bind-select"
                value={bindFormStoreId}
                onChange={e => setBindFormStoreId(e.target.value)}
              >
                {stores.map(s => (
                  <option key={s.storeId} value={s.storeId}>{s.storeName}</option>
                ))}
              </select>
            </div>

            {/* ESL Barcode(s) */}
            <div className="bind-field-group">
              <label className="bind-field-label">ESL Barcode(s) <span className="required-asterisk">*</span> / باركود الشاشة (الشاشات)</label>
              <textarea
                className="bind-textarea"
                rows={4}
                placeholder="Enter one or more ESL barcodes, separated by commas or new lines / أدخل باركود شاشة واحد أو أكثر، مفصولة بفواصل أو سطور جديدة"
                value={unbindBarcodes}
                onChange={e => setUnbindBarcodes(e.target.value)}
              />
            </div>

            {selectedBarcodes.length > 0 && (
              <button
                className="bind-prefill-btn"
                onClick={() => setUnbindBarcodes(selectedBarcodes.join('\n'))}
              >
                Use {selectedBarcodes.length} selected barcode(s) from table / استخدام {selectedBarcodes.length} باركود محدد من الجدول
              </button>
            )}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setBindModalOpen(false)}>Cancel / إلغاء</button>
              <button
                className="btn-danger"
                onClick={handleUnbind}
                disabled={bindLoading || !unbindBarcodes.trim()}
              >
                {bindLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Unbinding... / جاري إلغاء الربط...</span>
                  </>
                ) : (
                  <span>Unbind / إلغاء الربط</span>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};