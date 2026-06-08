import React from 'react';

import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import type { Store } from '../../services/storeService';
import { getEslModelSpecs, inferTemplateSize, renderEinkLayout } from '../../utils/eslModelUtils';

interface EslDetailModalProps {
  detailModalOpen: boolean;
  setDetailModalOpen: (open: boolean) => void;
  detailLoading: boolean;
  detailEsl: any;
  isAuthorized: boolean;
  handleForceRefresh: (barcode: string) => void;
  stores: Store[];
  selectedStoreId: string;
}

export const EslDetailModal: React.FC<EslDetailModalProps> = ({
  detailModalOpen,
  setDetailModalOpen,
  detailLoading,
  detailEsl,
  isAuthorized,
  handleForceRefresh,
  stores,
  selectedStoreId,
}) => {
  if (!detailModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setDetailModalOpen(false)}>
      <div className="modal-content glass-card bind-modal scale-up" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>ESL Device Telemetry & Operations / قياسات وإجراءات شاشة الأسعار</h3>
          <button className="close-btn" onClick={() => setDetailModalOpen(false)}>&times;</button>
        </div>

        {detailLoading ? (
          <div className="modal-loading-state">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p>Loading bind information... / جاري تحميل معلومات الربط...</p>
          </div>
        ) : detailEsl ? (
          <div className="bind-modal-body">

            {/* Section 1: Base Infomation */}
            <div className="bind-section">
              <div className="bind-section-title">Base Information / المعلومات الأساسية</div>
              <div className="bind-info-cards-grid">
                <div className="bind-info-card">
                  <div className="card-label">ESL Barcode / باركود الشاشة</div>
                  <div className="card-value font-mono">{detailEsl.tagBarCode || detailEsl.priceTagCode || detailEsl.barCode || detailEsl.barcode || 'N/A'}</div>
                </div>
                <div className="bind-info-card">
                  <div className="card-label">Firmware Version / إصدار البرمجيات</div>
                  <div className="card-value">{detailEsl.softVersion || 'N/A'}</div>
                </div>
                <div className="bind-info-card">
                  <div className="card-label">Status / الحالة</div>
                  {(() => {
                    const isOnline = detailEsl.state === 'ONLINE' || detailEsl.state === 1 || detailEsl.state === '1' || detailEsl.status === 1 || detailEsl.status === '1' || String(detailEsl.state).trim() === '在线';
                    const rawState = detailEsl.state !== undefined ? detailEsl.state : detailEsl.status;
                    const translatedState = rawState === 'ONLINE' || rawState === 1 || rawState === '1' || String(rawState).trim() === '在线' ? 'Online / متصل' : (rawState === 'OFFLINE' || rawState === 0 || rawState === '0' || String(rawState).trim() === '离线' ? 'Offline / غير متصل' : rawState);
                    return (
                      <div className={`card-value ${isOnline ? 'bind-status-online' : 'bind-status-offline'}`} style={{ color: isOnline ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                        {translatedState}
                      </div>
                    );
                  })()}
                </div>
                <div className="bind-info-card">
                  <div className="card-label">Model / الطراز</div>
                  <div className="card-value font-mono">{detailEsl.model || 'N/A'}</div>
                </div>
                <div className="bind-info-card">
                  <div className="card-label">Size / الحجم</div>
                  <div className="card-value font-mono">{detailEsl.size || 'N/A'}</div>
                </div>
                <div className="bind-info-card">
                  <div className="card-label">Battery Level / مستوى البطارية</div>
                  <div className="card-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{detailEsl.battery ?? 100}%</span>
                    {detailEsl.batteryLevel ? <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 'normal' }}>({detailEsl.batteryLevel}/5)</span> : null}
                    <div className="bind-battery-wrap" style={{ margin: 0, width: '40px', height: '10px' }}>
                      <div className="bind-battery-bar" style={{ height: '100%', width: '100%', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div className="bind-battery-fill" style={{
                          height: '100%',
                          width: `${Math.min(detailEsl.battery ?? 100, 100)}%`,
                          background: (detailEsl.battery ?? 100) > 50 ? '#22c55e' : (detailEsl.battery ?? 100) > 20 ? '#f59e0b' : '#ef4444'
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bind-info-card">
                  <div className="card-label">Shelf No. / رقم الرف</div>
                  <div className="card-value font-mono">{detailEsl.shelfNo || detailEsl.shelfNum || '—'}</div>
                </div>
                <div className="bind-info-card">
                  <div className="card-label">Color / اللون</div>
                  <div className="card-value">{detailEsl.colorType || detailEsl.colorTypeDesc || 'Black/White/Red/Yellow'}</div>
                </div>
                <div className="bind-info-card">
                  <div className="card-label">Invert Colors / عكس الألوان</div>
                  <div className="card-value">
                    {detailEsl.isReverse === 1 || detailEsl.turnOver === 1 || detailEsl.isReverse === '1' || detailEsl.turnOver === '1' ? 'Yes / نعم' : 'No / لا'}
                  </div>
                </div>
                <div className="bind-info-card">
                  <div className="card-label">Template Format / تنسيق القالب</div>
                  <div className="card-value" style={{ color: '#2563eb' }}>
                    {detailEsl.itemBindInfos?.[0]?.templateAttr || detailEsl.itemList?.[0]?.templateAttr || detailEsl.templateAttr || 'default'}
                  </div>
                </div>
                <div className="bind-info-card">
                  <div className="card-label">Last Comm. / آخر اتصال</div>
                  <div className="card-value">{detailEsl.lastCommuTime || 'N/A'}</div>
                </div>
                <div className="bind-info-card">
                  <div className="card-label">Update Time / وقت التحديث</div>
                  <div className="card-value">{detailEsl.updateTime || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Section 2: Item Infomation */}
            <div className="bind-section">
              <div className="bind-section-title">Item Information / معلومات الصنف</div>
              <table className="bind-item-table">
                <thead>
                  <tr>
                    <th>No. / الرقم</th>
                    <th>Item Barcode / باركود الصنف</th>
                    <th>Item Name / اسم الصنف</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const items = [];
                    if (detailEsl.itemList && detailEsl.itemList.length > 0) {
                      items.push(...detailEsl.itemList);
                    } else if (detailEsl.itemBindInfos && detailEsl.itemBindInfos.length > 0) {
                      items.push(...detailEsl.itemBindInfos);
                    } else if (detailEsl.boundProduct) {
                      items.push({
                        itemBarCode: detailEsl.boundProduct.barCode || detailEsl.boundProduct.barcode,
                        itemTitle: detailEsl.boundProduct.itemTitle || detailEsl.boundProduct.itemName
                      });
                    }
                    
                    if (items.length > 0) {
                      return items.map((item: any, idx: number) => (
                        <tr key={item.itemBarCode || item.itemBarcode || idx}>
                          <td>{idx + 1}</td>
                          <td>{item.itemBarCode || item.itemBarcode || 'N/A'}</td>
                          <td>{item.itemTitle || item.itemName || 'Unnamed Product / منتج غير مسمى'}</td>
                        </tr>
                      ));
                    }
                    
                    return (
                      <tr>
                        <td colSpan={3} style={{textAlign:'center', color:'var(--text-muted)', padding:'12px'}}>
                          No items bound / لا توجد عناصر مرتبطة
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Section 3: ESL Infomation — e-ink display */}
            <div className="bind-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="bind-section-title" style={{ width: '100%' }}>ESL Information / معلومات الشاشة</div>
              {(() => {
                const specs = getEslModelSpecs(detailEsl.size, detailEsl.model);
                const rawAttr = detailEsl.itemBindInfos?.[0]?.templateAttr || detailEsl.itemList?.[0]?.templateAttr || detailEsl.templateAttr || 'default';
                const productCategory = detailEsl.boundProduct?.category || '';
                const templateAttr = (rawAttr === 'default' || !rawAttr) && productCategory ? productCategory : rawAttr;
                const templateSize = inferTemplateSize(templateAttr);
                const hasMismatch = templateSize && specs.size && templateSize !== specs.size;

                return (
                  <div className="real-bezel-housing" style={{
                    background: '#1e293b',
                    borderRadius: '16px',
                    padding: '16px',
                    margin: '16px auto',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5), inset 0 1px 3px rgba(255,255,255,0.1)',
                    width: `${specs.width + 32}px`,
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease-in-out'
                  }}>
                    <div className="bind-eink-box" style={{
                      width: `${specs.width}px`,
                      height: `${specs.height}px`,
                      minHeight: 'auto',
                      aspectRatio: specs.aspectRatio,
                      border: '1.5px solid #c8c8c8',
                      borderRadius: '6px',
                      background: '#ffffff',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: 'inset 0 0 8px rgba(0,0,0,0.06)',
                      transition: 'all 0.3s ease-in-out'
                    }}>
                      {detailEsl.images && detailEsl.images.length > 0 ? (
                        /* TODO: If images are on local network/private URL, use a proxy endpoint if CORS issues arise */
                        <img
                          src={`data:image/bmp;base64,${detailEsl.images[0]}`}
                          alt="ESL Screen"
                          className="bind-eink-img"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : hasMismatch ? (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px',
                          textAlign: 'center',
                          height: '100%',
                          background: '#fff',
                          color: '#dc2626',
                          boxSizing: 'border-box',
                          gap: '8px',
                          width: '100%'
                        }}>
                          <AlertCircle size={specs.layoutType === 'square' || specs.layoutType === 'compact' ? 24 : 36} style={{ color: '#ef4444' }} />
                          <div style={{ fontSize: specs.layoutType === 'square' || specs.layoutType === 'compact' ? '11px' : '14px', fontWeight: '800', lineHeight: '1.3' }}>
                            TEMPLATE SIZE MISMATCH! / عدم تطابق حجم القالب!
                          </div>
                          <div style={{ fontSize: specs.layoutType === 'square' || specs.layoutType === 'compact' ? '9px' : '11px', color: '#4b5563', fontWeight: '600' }}>
                            Designed for <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{templateSize}"</span> but device is <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{specs.size}"</span>. / مصمم لـ {templateSize} بوصة ولكن الجهاز {specs.size} بوصة.
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const isComparison = templateAttr === 'K0001' || templateAttr === 'K0002' || templateAttr.includes('K0001') || templateAttr.includes('K0002') || templateAttr.includes('674') || templateAttr.includes('666');
                          const displayTitle = detailEsl.boundProduct?.itemTitle || detailEsl.itemBindInfos?.[0]?.itemTitle || detailEsl.itemList?.[0]?.itemTitle || 'No Item Bound / لا يوجد منتج مرتبط';
                          const displayPrice = detailEsl.boundProduct?.price || detailEsl.itemBindInfos?.[0]?.itemPrice || detailEsl.itemList?.[0]?.itemPrice || '—';
                          const displayOriginalPrice = detailEsl.boundProduct?.originalPrice || detailEsl.boundProduct?.original_price || '—';
                          const barcode = detailEsl.boundProduct?.barcode || detailEsl.boundProduct?.barCode || detailEsl.itemBindInfos?.[0]?.itemBarCode || detailEsl.itemBindInfos?.[0]?.itemBarcode || detailEsl.itemList?.[0]?.itemBarCode || detailEsl.itemList?.[0]?.itemBarcode || detailEsl.barCode || detailEsl.barcode || '';
                          const storeName = stores.find(s => s.storeId === selectedStoreId)?.storeName || 'Al Naseem Store';

                          return renderEinkLayout(
                            specs,
                            isComparison,
                            displayTitle,
                            displayPrice,
                            displayOriginalPrice,
                            barcode,
                            storeName
                          );
                        })()
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>
        ) : (
          <div className="modal-loading-state">
            <AlertCircle className="text-danger" size={40} />
            <p>Unable to retrieve equipment details. Tag status might be offline. / تعذر استرداد تفاصيل الجهاز. قد تكون الشاشة غير متصلة بالشبكة.</p>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setDetailModalOpen(false)}>Cancel / إلغاء</button>
          {detailEsl && isAuthorized && (
            <button
              className="btn-primary"
              onClick={() => {
                setDetailModalOpen(false);
                handleForceRefresh(detailEsl.barCode || detailEsl.barcode || detailEsl.priceTagCode);
              }}
            >
              <RefreshCw size={16} /> Force to Refresh / تحديث إجباري
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
