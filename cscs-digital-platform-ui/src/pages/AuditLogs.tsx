import React, { useState, useEffect } from 'react';
import { X, RefreshCw,
  ClipboardList,
  AlertTriangle,
  Store as StoreIcon,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Loader2,
  Search,
  Filter } from 'lucide-react';
import { storeService } from '../services/storeService';
import type { Store } from '../services/storeService';
import { getAuditLogs } from '../services/auditLogService';
import type { AuditLog } from '../services/auditLogService';
import { getPaginationRange } from '../utils/paginationUtils';
import { PageHeader, PageToolbar, ActionButtons } from '../components/common';
import { CustomSelect } from '../components/common/CustomSelect';

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
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Search state
  
  const [filterOperator, setFilterOperator] = useState('');
  const [filterBarcode, setFilterBarcode] = useState('');
  const [filterEslTag, setFilterEslTag] = useState('');
  const [filterProductName, setFilterProductName] = useState('');
  const [filterEslModel, setFilterEslModel] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');

  const activeFilterCount = [
    filterOperator,
    filterBarcode,
    filterEslTag,
    filterProductName,
    filterEslModel,
    filterPriceMin,
    filterPriceMax,
    selectedOperation !== '',
    selectedStatus !== ''
  ].filter(Boolean).length;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      setStoresLoading(true);
      setError('');
      try {
        const response = await storeService.getAllStores();
        setStores(response || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch stores list.');
        console.error(err);
      } finally {
        setStoresLoading(false);
      }
    };
    fetchStores();
  }, []);

  // Fetch logs whenever store, dates, operation, status changes
  const fetchLogs = async () => {
    setLogsLoading(true);
    setError('');
    try {
      // Fetch a large pool for local filtering instead of just the current page
      const response = await getAuditLogs(
        selectedStoreId,
        startDate,
        endDate,
        0,
        2000,
        selectedOperation === '' ? undefined : selectedOperation,
        selectedStatus === '' ? undefined : Number(selectedStatus)
      );
      setLogs(response.content || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve audit logs from Dragon ESL.');
      showNotification('Failed to fetch logs. Please try again. / فشل جلب السجلات. يرجى المحاولة مرة أخرى.', 'error');
      console.error(err);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedStoreId, startDate, endDate, selectedOperation, selectedStatus]);

  // Reset page to 1 when filters change
  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
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

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    setStartDate(d.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setSelectedOperation('');
    setSelectedStatus('');
    setFilterOperator('');
    setFilterBarcode('');
    setFilterEslTag('');
    setFilterProductName('');
    setFilterEslModel('');
    setFilterPriceMin('');
    setFilterPriceMax('');
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
    
    // Explicit override if the text indicates a failure
    if (translatedText.includes('Failed') || translatedText.includes('فشل')) {
      return (
        <span className="status-badge error">
          <XCircle size={14} />
          {translatedText}
        </span>
      );
    }

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

  const filteredLogs = React.useMemo(() => {
    let result = logs;
    
    if (filterOperator) {
      const v = filterOperator.toLowerCase();
      result = result.filter(log => (log.operator || 'System / النظام').toLowerCase().includes(v));
    }
    if (filterBarcode) {
      const v = filterBarcode.toLowerCase();
      result = result.filter(log => (log.itemBarCode || '').toLowerCase().includes(v));
    }
    if (filterEslTag) {
      const v = filterEslTag.toLowerCase();
      result = result.filter(log => (log.priceTagBarCode || '').toLowerCase().includes(v));
    }
    if (filterProductName) {
      const v = filterProductName.toLowerCase();
      result = result.filter(log => (log.itemName || '').toLowerCase().includes(v));
    }
    if (filterEslModel) {
      const v = filterEslModel.toLowerCase();
      result = result.filter(log => (log.model || '').toLowerCase().includes(v));
    }
    if (filterPriceMin !== '') {
      const min = parseFloat(filterPriceMin);
      if (!isNaN(min)) result = result.filter(log => parseFloat(log.price || '0') >= min);
    }
    if (filterPriceMax !== '') {
      const max = parseFloat(filterPriceMax);
      if (!isNaN(max)) result = result.filter(log => parseFloat(log.price || '0') <= max);
    }
    
    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      result = result.filter(log => {
        const operator = (log.operator || 'System / النظام').toLowerCase();
        const operationText = getOperationTranslation(log.operation, log.operationText).toLowerCase();
        const barcode = (log.itemBarCode || '').toLowerCase();
        const eslTag = (log.priceTagBarCode || '').toLowerCase();
        const itemDetails = `${log.itemName || ''} ${log.model || ''}`.toLowerCase();
        const price = (log.price || '').toLowerCase();
        const status = getStatusTranslation(log.statusText).toLowerCase();

        let matchesOperation = false;
        if (q === 'bind' || q === 'bind tag' || q === 'bind ' || q === 'ربط' || q === 'ربط الشاشة') {
          matchesOperation = operationText.includes(q) && !operationText.includes('unbind') && !operationText.includes('إلغاء');
        } else {
          matchesOperation = operationText.includes(q);
        }

        return operator.includes(q) || matchesOperation || barcode.includes(q) ||
               eslTag.includes(q) || itemDetails.includes(q) || price.includes(q) || status.includes(q);
      });
    }
    return result;
  }, [logs, debouncedSearchQuery]);

  useEffect(() => {
    setTotalCount(filteredLogs.length);
    const maxPage = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredLogs, pageSize, currentPage]);

  const paginatedLogs = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  return (
    <div className="audit-logs-container">
      <div className="sticky-page-header">
        <PageHeader
          title="Audit Logs"
          titleAr="سجلات التدقيق"
        />
        <PageToolbar>
          <div style={{ display: 'flex', gap: '16px', flex: 1, alignItems: 'center' }}>
              {storesLoading ? (
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading...</span>
              ) : (
                <CustomSelect
                  value={selectedStoreId}
                  onChange={(val: string | number) => handleStoreChange(String(val))}
                  options={[
                    { value: '', label: 'All Stores / جميع المتاجر' },
                    ...stores.map(s => ({ value: s.storeId, label: s.storeName }))
                  ]}
                  placeholder="All Stores / جميع المتاجر"
                />
              )}
  
            <button 
              className={`btn-action btn-action-slate ${showFilters ? 'active' : ''}`} 
              onClick={() => setShowFilters(!showFilters)}
              title="Filters / التصفية"
              style={{ position: 'relative' }}
            >
              <Filter size={18} />
              {(() => {
                const isFilterActive = selectedOperation !== '' || selectedStatus !== '';
                return isFilterActive && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    border: '1px solid var(--glass-border)'
                  }} />
                );
              })()}
            </button>
  
            <div className="global-search-bar">
              <Search size={16} className="text-muted" />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
              <input 
                type="text" 
                placeholder="Search logs... / بحث في السجلات..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none' }}
              />
                {searchQuery && (<button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '8px' }}><X size={14} /></button>)}
              </div>
            </div>
          </div>
  
          <ActionButtons
            onRefresh={() => fetchLogs()}
            loading={logsLoading}
          />
        </PageToolbar>
      </div>
      {/* Toast Notification */}
      {notification && (
        <div className={`toast-notification ${notification.type} glass-card`}>
          <span>{notification.message}</span>
        </div>
      )}

      

      
      {/* Advanced Filter Panel */}
      {showFilters && (
        <div className="glass-card" style={{ padding: '16px', marginBottom: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {/* Timestamp */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Date From / من تاريخ</label>
              <input type="date" value={startDate} onChange={handleStartDateChange} className="glass-input" style={{ height: '36px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Date To / إلى تاريخ</label>
              <input type="date" value={endDate} onChange={handleEndDateChange} className="glass-input" style={{ height: '36px' }} />
            </div>
            
            {/* Operator */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Operator / القائم بالإجراء</label>
              <input type="text" value={filterOperator} onChange={e => { setFilterOperator(e.target.value); setCurrentPage(1); }} placeholder="Search operator..." className="glass-input" style={{ height: '36px' }} />
            </div>

            {/* Operation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Operation / العملية</label>
              <select value={selectedOperation} onChange={handleOperationChange} className="glass-select" style={{ height: '36px' }}>
                <option value="">All Operations / كل العمليات</option>
                <option value="1">Bind Tag / ربط الشاشة</option>
                <option value="2">Unbind Tag / إلغاء ربط الشاشة</option>
                <option value="3">Force Refresh / تحديث الشاشة فوراً</option>
                <option value="4">Product Change / تغيير المنتج</option>
                <option value="5">Template Change / تغيير القالب</option>
                <option value="13">Force LED Flash / وميض إضاءة LED</option>
                <option value="14">Smart Reissue / إعادة إصدار ذكي</option>
              </select>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status / الحالة</label>
              <select value={selectedStatus} onChange={handleStatusChange} className="glass-select" style={{ height: '36px' }}>
                <option value="">All Status / كل الحالات</option>
                <option value="2">Success / ناجح</option>
                <option value="7">Manual Retry / إعادة المحاولة يدوياً</option>
                <option value="3">Failed / فشل</option>
              </select>
            </div>

            {/* Barcode */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Barcode / الباركود</label>
              <input type="text" value={filterBarcode} onChange={e => { setFilterBarcode(e.target.value); setCurrentPage(1); }} placeholder="Product barcode..." className="glass-input" style={{ height: '36px' }} />
            </div>

            {/* ESL Tag */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>ESL Tag / الشاشة</label>
              <input type="text" value={filterEslTag} onChange={e => { setFilterEslTag(e.target.value); setCurrentPage(1); }} placeholder="ESL MAC address..." className="glass-input" style={{ height: '36px' }} />
            </div>

            {/* Product Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Product Name / اسم المنتج</label>
              <input type="text" value={filterProductName} onChange={e => { setFilterProductName(e.target.value); setCurrentPage(1); }} placeholder="Product name..." className="glass-input" style={{ height: '36px' }} />
            </div>

            {/* ESL Model */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>ESL Model / الموديل</label>
              <input type="text" value={filterEslModel} onChange={e => { setFilterEslModel(e.target.value); setCurrentPage(1); }} placeholder="e.g. ZKC35V" className="glass-input" style={{ height: '36px' }} />
            </div>

            {/* Price Range */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Price Range / نطاق السعر</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" value={filterPriceMin} onChange={e => { setFilterPriceMin(e.target.value); setCurrentPage(1); }} placeholder="Min" className="glass-input" style={{ height: '36px', width: '50%' }} />
                <input type="number" value={filterPriceMax} onChange={e => { setFilterPriceMax(e.target.value); setCurrentPage(1); }} placeholder="Max" className="glass-input" style={{ height: '36px', width: '50%' }} />
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '12px' }}>
            <button onClick={handleResetFilters} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: '8px 12px' }}>
              Reset Filters / إعادة تعيين
            </button>
            <button className="btn-primary" onClick={() => fetchLogs()} style={{ padding: '8px 24px', height: '36px' }}>
              Apply Filters / تطبيق
            </button>
          </div>
        </div>
      )}

      {/* Main content display */}
      {logsLoading && logs.length === 0 ? (
        <div className="audit-logs-loading-state">
          <Loader2 className="animate-spin" size={40} />
          <p>Loading logs... / جاري تحميل السجلات...</p>
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
          <p>There are no recorded operation logs in the selected date range. / لا توجد سجلات عمليات مسجلة في النطاق الزمني المحدد.</p>
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
                  <th>Barcode / الباركود</th>
                  <th>ESL Tag / الشاشة</th>
                  <th>Item Details / تفاصيل الصنف</th>
                  <th>Price / السعر</th>
                  <th>Status / الحالة</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((logItem, index) => (
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
                    <td className="col-barcode">
                      <div className="monospace-id" title={logItem.itemBarCode || ''}>{logItem.itemBarCode || '-'}</div>
                    </td>
                    <td className="col-esl-tag">
                      <div className="monospace-id tag-value" title={logItem.priceTagBarCode || ''}>{logItem.priceTagBarCode || '-'}</div>
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
              <CustomSelect
                value={pageSize}
                onChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
                options={[
                  { value: 5, label: '5/page / ٥ للصفحة' },
                  { value: 10, label: '10/page / ١٠ للصفحة' },
                  { value: 20, label: '20/page / ٢٠ للصفحة' },
                  { value: 50, label: '50/page / ٥٠ للصفحة' }
                ]}
                className="pagination-size-select"
              />
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
        .store-selector-wrapper {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
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
          max-width: 280px;
          width: fit-content;
        }

        .store-selector-wrapper select option {
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .filter-icon-btn {
          position: relative;
          width: 42px !important;
          height: 42px !important;
          padding: 10px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

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

        .audit-logs-table th:last-child,
        .audit-logs-table td:last-child {
          padding-right: 32px;
          min-width: 160px;
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

        .monospace-id {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 13px;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }

        .monospace-id.tag-value {
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
          white-space: nowrap;
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
