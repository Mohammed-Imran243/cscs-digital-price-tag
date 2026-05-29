import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  ClipboardList,
  AlertTriangle,
  Calendar,
  Store as StoreIcon,
  Tag,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Loader2,
  Search
} from 'lucide-react';
import { storeService } from '../services/storeService';
import type { Store } from '../services/storeService';
import { getAuditLogs } from '../services/auditLogService';
import type { AuditLog } from '../services/auditLogService';
import { getPaginationRange } from '../utils/paginationUtils';

const AuditLogs: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };
  
  // Filter states
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Default to last 7 days
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedOperation, setSelectedOperation] = useState<number | ''>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch stores on mount, then immediately load logs for the first store
  useEffect(() => {
    const fetchStores = async () => {
      setStoresLoading(true);
      setError('');
      try {
        const response = await storeService.getAllStores();
        setStores(response || []);
        if (response && response.length > 0) {
          const firstStoreId = response[0].storeId || response[0].id || '';
          setSelectedStoreId(firstStoreId);
          // Directly fetch logs for the first store immediately after login
          // (useEffect may not re-fire if selectedStoreId was already the same value)
          if (firstStoreId) {
            setLogsLoading(true);
            try {
              const logsResponse = await getAuditLogs(firstStoreId, startDate, endDate, 0, pageSize, undefined);
              setLogs(logsResponse.content || []);
              setTotalCount(logsResponse.totalElements || 0);
            } catch (logErr: any) {
              setError(logErr.message || 'Failed to retrieve audit logs.');
              setLogs([]);
              setTotalCount(0);
            } finally {
              setLogsLoading(false);
            }
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch stores list.');
        console.error(err);
      } finally {
        setStoresLoading(false);
      }
    };
    fetchStores();
  }, []);

  // Fetch logs whenever store, dates, operation, page, or page size changes
  const fetchLogs = async () => {
    if (!selectedStoreId) return;
    setLogsLoading(true);
    setError('');
    try {
      const pageIndex = currentPage - 1; // Backend expects 0-based page
      const response = await getAuditLogs(
        selectedStoreId,
        startDate,
        endDate,
        pageIndex,
        pageSize,
        selectedOperation === '' ? undefined : selectedOperation
      );
      setLogs(response.content || []);
      setTotalCount(response.totalElements || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve audit logs from Dragon ESL.');
      showNotification('Failed to fetch logs. Please try again. / فشل جلب السجلات. يرجى المحاولة مرة أخرى.', 'error');
      console.error(err);
      setLogs([]);
      setTotalCount(0);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedStoreId, startDate, endDate, selectedOperation, currentPage, pageSize]);

  // Reset page to 1 when filters change
  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStoreId(e.target.value);
    setCurrentPage(1);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    setCurrentPage(1);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setCurrentPage(1);
  };

  const handleOperationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedOperation(val === '' ? '' : Number(val));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const getStatusTranslation = (statusText: string) => {
    const text = (statusText || '').trim().toLowerCase();
    if (text === 'success' || text === 'succeed') return 'Success / ناجح';
    if (text === 'fail' || text === 'failed' || text === 'error') return 'Failed / فشل';
    if (text === 'processing' || text === 'waiting' || text === 'sending') return 'Processing / جاري المعالجة';
    return statusText;
  };

  const getOperationTranslation = (opCode: number, opText: string) => {
    switch (opCode) {
      case 1: return 'Bind Tag / ربط الشاشة';
      case 2: return 'Unbind Tag / إلغاء ربط الشاشة';
      case 3: return 'Force Refresh / تحديث الشاشة فوراً';
      case 4: return 'Product Change / تغيير المنتج';
      case 5: return 'Template Change / تغيير القالب';
      case 13: return 'Force LED Flash / وميض إضاءة LED';
      case 14: return 'Smart Reissue / إعادة إصدار ذكي';
      default: {
        const text = (opText || '').trim().toLowerCase();
        if (text === 'bind tag' || text === 'bind') return 'Bind Tag / ربط الشاشة';
        if (text === 'unbind tag' || text === 'unbind') return 'Unbind Tag / إلغاء ربط الشاشة';
        if (text === 'force refresh' || text === 'refresh') return 'Force Refresh / تحديث الشاشة فوراً';
        if (text === 'product change' || text === 'change product') return 'Product Change / تغيير المنتج';
        if (text === 'template change' || text === 'change template') return 'Template Change / تغيير القالب';
        return opText;
      }
    }
  };

  const renderStatusBadge = (status: number, statusText: string) => {
    const translatedText = getStatusTranslation(statusText);
    // Green for success
    if (status === 2 || status === 14) {
      return (
        <span className="status-badge success">
          <CheckCircle2 size={14} />
          {translatedText}
        </span>
      );
    }
    // Orange/yellow for manual retry or unknown
    if (status === 7) {
      return (
        <span className="status-badge warning">
          <Clock size={14} />
          {translatedText}
        </span>
      );
    }
    // Red/Danger for others (failures)
    return (
      <span className="status-badge error">
        <XCircle size={14} />
        {translatedText}
      </span>
    );
  };

  return (
    <div className="audit-logs-container">
      <div className="audit-logs-page-header">
        <div>
          <h2>Audit Logs / سجلات المراجعة</h2>
        </div>
        <div className="audit-logs-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="global-search-bar">
            <Search size={16} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search logs... / بحث في السجلات..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          <button 
            className="btn-secondary" 
            onClick={fetchLogs} 
            disabled={logsLoading || !selectedStoreId}
          >
            <RefreshCw size={18} className={logsLoading ? 'animate-spin' : ''} /> Refresh / تحديث
          </button>
        </div>
      </div>
      {/* Toast Notification */}
      {notification && (
        <div className={`toast-notification ${notification.type} glass-card`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter panel */}
      <div className="audit-logs-filters glass-card">
        <div className="filter-group">
          <label>
            <StoreIcon size={16} /> Store Location <span className="required-asterisk">*</span> / موقع المتجر <span className="required-asterisk">*</span>
          </label>
          {storesLoading ? (
            <div className="filter-loader">
              <Loader2 className="animate-spin" size={16} /> Loading stores... / جاري تحميل المتاجر...
            </div>
          ) : (
            <select 
              value={selectedStoreId} 
              onChange={handleStoreChange}
              className="glass-select"
            >
              <option value="" disabled>-- Select a store / اختر فرعاً --</option>
              {stores.map(store => (
                <option key={store.storeId} value={store.storeId}>
                  {store.storeName} {store.externalStoreId ? `(${store.externalStoreId})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="filter-group">
          <label>
            <Calendar size={16} /> Start Date <span className="required-asterisk">*</span> / تاريخ البدء <span className="required-asterisk">*</span>
          </label>
          <input 
            type="date" 
            value={startDate} 
            onChange={handleStartDateChange}
            className="glass-input" 
          />
        </div>

        <div className="filter-group">
          <label>
            <Calendar size={16} /> End Date <span className="required-asterisk">*</span> / تاريخ الانتهاء <span className="required-asterisk">*</span>
          </label>
          <input 
            type="date" 
            value={endDate} 
            onChange={handleEndDateChange}
            className="glass-input" 
          />
        </div>

        <div className="filter-group">
          <label>
            <Tag size={16} /> Operation Type / نوع العملية
          </label>
          <select 
            value={selectedOperation} 
            onChange={handleOperationChange}
            className="glass-select"
          >
            <option value="">All Operations / جميع العمليات</option>
            <option value={1}>Bind Tag / ربط الشاشة</option>
            <option value={2}>Unbind Tag / إلغاء ربط الشاشة</option>
            <option value={3}>Force Refresh / تحديث الشاشة فوراً</option>
            <option value={4}>Product Change / تغيير المنتج</option>
            <option value={5}>Template Change / تغيير القالب</option>
            <option value={13}>Force LED Flash / وميض إضاءة LED</option>
            <option value={14}>Smart Reissue / إعادة إصدار ذكي</option>
          </select>
        </div>

      </div>

      {/* Main content display */}
      {!selectedStoreId ? (
        <div className="audit-logs-empty-state glass-card">
          <StoreIcon size={48} />
          <h3>No Store Selected / لم يتم اختيار فرع</h3>
          <p>Please select a store from the dropdown menu to fetch its audit logs. / يرجى اختيار فرع من القائمة المنسدلة لجلب سجلات المراجعة الخاصة به.</p>
        </div>
      ) : logsLoading && logs.length === 0 ? (
        <div className="audit-logs-loading-state">
          <Loader2 className="animate-spin" size={40} />
          <p>Loading audit logs from Dragon ESL... / جاري تحميل سجلات المراجعة من Dragon ESL...</p>
        </div>
      ) : error ? (
        <div className="audit-logs-error-state glass-card">
          <AlertTriangle size={36} className="text-danger" />
          <p>{error}</p>
          <button onClick={fetchLogs} className="btn-primary">Try Again / أعد المحاولة</button>
        </div>
      ) : logs.length === 0 ? (
        <div className="audit-logs-empty-state glass-card">
          <ClipboardList size={48} />
          <h3>No Logs Found / لم يتم العثور على سجلات</h3>
          <p>There are no recorded operation logs for this store in the selected date range. / لا توجد سجلات عمليات مسجلة لهذا المتجر في النطاق الزمني المحدد.</p>
        </div>
      ) : (
        <>
          <div className="audit-logs-table-wrapper glass-card">
            <table className="audit-logs-table">
              <thead>
                <tr>
                  <th>Timestamp / الطابع الزمني</th>
                  <th>Operator / القائم بالإجراء</th>
                  <th>Operation / العملية</th>
                  <th>Barcode & ESL / الباركود والشاشة</th>
                  <th>Item Details / تفاصيل الصنف</th>
                  <th>Price / السعر</th>
                  <th>Status / الحالة</th>
                </tr>
              </thead>
              <tbody>
                {logs
                  .filter(log => {
                    if (!debouncedSearchQuery) return true;
                    const searchLower = debouncedSearchQuery.toLowerCase();
                    return (
                      (log.itemName && log.itemName.toLowerCase().includes(searchLower)) ||
                      (log.itemBarCode && log.itemBarCode.toLowerCase().includes(searchLower)) ||
                      (log.priceTagBarCode && log.priceTagBarCode.toLowerCase().includes(searchLower)) ||
                      (log.operator && log.operator.toLowerCase().includes(searchLower)) ||
                      (log.operationText && log.operationText.toLowerCase().includes(searchLower))
                    );
                  })
                  .map((logItem, index) => (
                  <tr key={`${logItem.id}-${index}`}>
                    <td className="col-time">
                      <div className="time-primary">{logItem.createdTime || 'N/A / غير متوفر'}</div>
                      {logItem.feedbackTime && (
                        <div className="time-secondary">Feedback / الاستجابة: {logItem.feedbackTime}</div>
                      )}
                    </td>
                    <td className="col-operator">
                      <div className="operator-wrapper">
                        <User size={14} className="text-muted" />
                        <span>{logItem.operator || 'System / النظام'}</span>
                      </div>
                    </td>
                    <td className="col-operation">
                      <span className="operation-text">{getOperationTranslation(logItem.operation, logItem.operationText)}</span>
                    </td>
                    <td className="col-barcodes">
                      <div className="barcode-pair">
                        {logItem.itemBarCode && (
                          <div className="barcode-item">
                            <span className="label">Item / صنف:</span>
                            <span className="value">{logItem.itemBarCode}</span>
                          </div>
                        )}
                        {logItem.priceTagBarCode && (
                          <div className="barcode-item">
                            <span className="label">ESL / شاشة:</span>
                            <span className="value tag-value">{logItem.priceTagBarCode}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="col-item-details">
                      <div className="item-title" title={logItem.itemName || ''}>
                        {logItem.itemName || 'N/A / غير متوفر'}
                      </div>
                      {logItem.model && (
                        <div className="item-model">Model / الطراز: {logItem.model}</div>
                      )}
                    </td>
                    <td className="col-price">
                      {logItem.price ? (
                        <span className="price-tag">SAR / ر.س {parseFloat(logItem.price).toFixed(2)}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="col-status">
                      {renderStatusBadge(logItem.status, logItem.statusText)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="dragonesl-pagination-bar glass-card">
            <div className="pagination-left">
              <span className="pagination-total">Total {totalCount} items / الإجمالي {totalCount} عناصر</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="pagination-size-select"
              >
                <option value={5}>5/page / ٥ في الصفحة</option>
                <option value={10}>10/page / ١٠ في الصفحة</option>
                <option value={20}>20/page / ٢٠ في الصفحة</option>
                <option value={50}>50/page / ٥٠ في الصفحة</option>
              </select>
            </div>

            <div className="pagination-right">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="pagination-arrow-btn"
              >
                &gt;
              </button>

              <div className="pagination-jump">
                <span>Go to / الذهاب إلى</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages || 1}
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
        </>
      )}

      <style>{`
        .audit-logs-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .audit-logs-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .audit-logs-page-header h2 {
          font-size: 24px;
          font-weight: 700;
        }

        .audit-logs-header-actions {
          display: flex;
          gap: 12px;
        }

        /* Filter Panel Styles */
        .audit-logs-filters {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          padding: 20px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-group label {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .filter-loader {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text-secondary);
          height: 42px;
        }

        .glass-input, .glass-select {
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 10px 14px;
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          height: 42px;
          transition: border-color 0.2s, background-color 0.2s;
        }

        .glass-select option {
          background-color: #1e1b29; /* Fallback for dark theme options list */
          color: #fff;
        }

        .glass-input:focus, .glass-select:focus {
          border-color: var(--primary-color);
          background-color: rgba(255, 255, 255, 0.08);
        }

        /* Table Design */
        .audit-logs-table-wrapper {
          padding: 0;
          overflow-x: auto;
          border-radius: 12px;
        }

        .audit-logs-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 14px;
        }

        .audit-logs-table th {
          background: rgba(255, 255, 255, 0.02);
          padding: 16px 20px;
          color: var(--text-muted);
          font-weight: 600;
          border-bottom: 1px solid var(--glass-border);
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
        }

        .audit-logs-table td {
          padding: 16px 20px;
          border-bottom: 1px solid var(--glass-border);
          vertical-align: middle;
        }

        .audit-logs-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.01);
        }

        /* Cell Specific Styling */
        .col-time .time-primary {
          font-weight: 600;
          color: var(--text-primary);
        }

        .col-time .time-secondary {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .col-operator .operator-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
        }

        .col-operation .operation-text {
          font-weight: 600;
          color: #a78bfa;
          background: rgba(167, 139, 250, 0.1);
          padding: 4px 8px;
          border-radius: 6px;
          display: inline-block;
        }

        .col-barcodes .barcode-pair {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .col-barcodes .barcode-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: monospace;
          font-size: 12px;
        }

        .col-barcodes .barcode-item .label {
          color: var(--text-muted);
          width: 32px;
        }

        .col-barcodes .barcode-item .value {
          color: var(--text-secondary);
        }

        .col-barcodes .barcode-item .tag-value {
          color: #60a5fa;
        }

        .col-item-details .item-title {
          font-weight: 600;
          color: var(--text-primary);
          max-width: 250px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .col-item-details .item-model {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .col-price .price-tag {
          font-weight: 700;
          color: var(--success-color);
          background: rgba(16, 185, 129, 0.08);
          padding: 4px 8px;
          border-radius: 6px;
        }

        /* Status Badge Styling */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: capitalize;
        }

        .status-badge.success {
          background: rgba(16, 185, 129, 0.15);
          color: var(--success-color);
        }

        .status-badge.warning {
          background: rgba(245, 158, 11, 0.15);
          color: var(--warning-color);
        }

        .status-badge.error {
          background: rgba(239, 68, 68, 0.15);
          color: var(--danger-color);
        }

        /* States */
        .audit-logs-loading-state, .audit-logs-empty-state, .audit-logs-error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          text-align: center;
          color: var(--text-muted);
          gap: 16px;
        }

        .audit-logs-error-state {
          background: rgba(239, 68, 68, 0.03);
          border: 1px solid rgba(239, 68, 68, 0.1);
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        .text-danger {
          color: var(--danger-color);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .audit-logs-page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .audit-logs-filters {
            grid-template-columns: 1fr;
          }
          .audit-logs-table-wrapper {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default AuditLogs;
