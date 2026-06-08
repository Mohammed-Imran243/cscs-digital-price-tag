import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Calendar,
  Store,
  Tag,
  Activity
} from 'lucide-react';
import '../styles/theme.css';
import PageHeader from '../components/PageHeader';
import { CustomSelect } from '../components/common/CustomSelect';
import SyncControlButton from '../components/dashboard/SyncControlButton';
import { storeService } from '../services/storeService';
import type { Store as StoreType } from '../services/storeService';
import { getAuditLogs } from '../services/auditLogService';
import type { AuditLog } from '../services/auditLogService';
import { getPaginationRange } from '../utils/paginationUtils';

const formatPrice = (priceStr?: string) => {
  if (!priceStr || priceStr === 'null' || priceStr === 'N/A') return 'N/A';
  const num = parseFloat(priceStr);
  if (isNaN(num)) return priceStr;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

const formatAbsoluteDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  // DragonESL timestamps are UTC+8, format: "2026-06-05 14:47:22"
  // Append +08:00 so browser parses it correctly as UTC+8
  const normalized = dateStr.includes('T')
    ? dateStr
    : dateStr.replace(' ', 'T') + '+08:00';
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return dateStr;
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};

const getLocalDateString = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const PriceMonitor: React.FC = () => {
  const [events, setEvents] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Filters
  const [storeFilter, setStoreFilter] = useState('All Stores');
  const [timeFilter, setTimeFilter] = useState('Last 7 Days');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // Load stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await storeService.getAllStores();
        if (response) {
          setStores(response);
        }
      } catch (err) {
        console.error('Failed to load stores:', err);
      }
    };
    fetchStores();
  }, []);

  const fetchHistory = async (
    currentStore: string,
    filterTime: string,
    customFrom: string,
    customTo: string,
    page: number,
    size: number
  ) => {
    setLoading(true);
    try {
      let start = '';
      let end = '';
      
      if (filterTime === 'Custom Range') {
        start = customFrom;
        end = customTo;
      } else {
        const today = new Date();
        end = getLocalDateString(today);
        
        if (filterTime === 'Today') {
          start = end;
        } else if (filterTime === 'Last 7 Days') {
          const prior = new Date();
          prior.setDate(today.getDate() - 7);
          start = getLocalDateString(prior);
        } else if (filterTime === 'Last 30 Days') {
          const prior = new Date();
          prior.setDate(today.getDate() - 30);
          start = getLocalDateString(prior);
        } else if (filterTime === 'All Time') {
          start = '2020-01-01';
        }
      }

      // Convert "All Stores" to empty string for backend
      const storeIdParam = currentStore === 'All Stores' ? '' : currentStore;

      // Call getAuditLogs(storeId, startDate, endDate, page - 1, size, 4)
      const response = await getAuditLogs(storeIdParam, start, end, page - 1, size, 4);
      
      setEvents(response.content || []);
      setTotalElements(response.totalElements || 0);
    } catch (err) {
      console.error("Failed to fetch price changes:", err);
      setEvents([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Determine if we should fetch
    if (timeFilter === 'Custom Range' && (!appliedFromDate || !appliedToDate)) {
      setLoading(false);
      return;
    }
    
    fetchHistory(storeFilter, timeFilter, appliedFromDate, appliedToDate, currentPage, pageSize);
  }, [storeFilter, timeFilter, appliedFromDate, appliedToDate, currentPage, pageSize]);

  const getStoreName = (storeId?: string, operator?: string) => {
    if (!storeId || storeId === 'null' || storeId.trim() === '') {
      return operator || 'System / النظام';
    }
    const matched = stores.find(s => s.storeId === storeId || s.id === storeId);
    return matched ? matched.storeName : `Store #${storeId}`;
  };

  const handleApply = () => {
    if (!fromDate || !toDate) {
      alert("Please select both From and To dates / يرجى تحديد تاريخي البدء والنهاية");
      return;
    }
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalElements / pageSize) || 1;

  const storeOptions = [
    { value: 'All Stores', label: 'All Stores / جميع المتاجر' },
    ...stores.map(s => ({ value: s.storeId, label: s.storeName }))
  ];

  const startResultIndex = totalElements > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endResultIndex = Math.min(currentPage * pageSize, totalElements);

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <PageHeader
        title="Price Change Monitor"
        titleAr="مراقب تغيير الأسعار"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <SyncControlButton />
            <button
              className="btn-action btn-action-refresh"
              onClick={() => fetchHistory(storeFilter, timeFilter, appliedFromDate, appliedToDate, currentPage, pageSize)}
              disabled={loading}
              style={{ width: '130px', maxWidth: '130px', height: '44px' }}
            >
              <RefreshCw className={loading ? 'spinning' : ''} />
              <div className="btn-label">
                <span>Refresh</span>
                <span>تحديث</span>
              </div>
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', position: 'relative', zIndex: 100 }}>
        <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Store size={14} /> Store Filter / فلتر المتجر
          </label>
          <CustomSelect
            value={storeFilter}
            onChange={val => {
              setStoreFilter(String(val));
              setCurrentPage(1);
            }}
            options={storeOptions}
          />
        </div>

        <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Calendar size={14} /> Time Filter / فلتر الوقت
          </label>
          <CustomSelect
            value={timeFilter}
            onChange={val => {
              const selected = String(val);
              setTimeFilter(selected);
              setCurrentPage(1);
              if (selected !== 'Custom Range') {
                setAppliedFromDate('');
                setAppliedToDate('');
                setFromDate('');
                setToDate('');
              }
            }}
            options={[
              { value: 'Today', label: 'Today / اليوم' },
              { value: 'Last 7 Days', label: 'Last 7 Days / آخر 7 أيام' },
              { value: 'Last 30 Days', label: 'Last 30 Days / آخر 30 يوم' },
              { value: 'All Time', label: 'All Time / كل الوقت' },
              { value: 'Custom Range', label: 'Custom Range / نطاق مخصص' }
            ]}
          />
        </div>

        {timeFilter === 'Custom Range' && (
          <>
            <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                From Date / من تاريخ
              </label>
              <input
                type="date"
                className="bind-input"
                style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                To Date / إلى تاريخ
              </label>
              <input
                type="date"
                className="bind-input"
                style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                value={toDate}
                onChange={e => setToDate(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn-primary"
                style={{ height: '42px', padding: '0 20px', borderRadius: '8px', fontWeight: 600 }}
                onClick={handleApply}
              >
                Apply / تطبيق
              </button>
            </div>
          </>
        )}
      </div>

      {/* Feed Container */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: 'var(--text-primary)' }}>
          <Activity className="text-primary" size={20} />
          Price Change Feed / موجز تغييرات الأسعار
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', color: 'var(--text-secondary)' }}>
            <RefreshCw className="spinning" size={32} style={{ margin: '0 auto 16px' }} />
            <p>Loading price changes... / جاري تحميل تغييرات الأسعار...</p>
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', color: 'var(--text-secondary)' }}>
            No price changes found matching the criteria. / لا توجد تغييرات أسعار تطابق المعايير.
          </div>
        ) : (
          <>
            <div className="price-change-grid">
              {events.map(record => {
                const priceNum = parseFloat(record.price || '0');
                const origNum = parseFloat(record.originalPrice || '0');
                const isDecreased = priceNum < origNum;
                const isIncreased = priceNum > origNum;

                const formattedOldPrice = formatPrice(record.originalPrice);
                const formattedNewPrice = formatPrice(record.price);

                return (
                  <div 
                    key={record.id} 
                    className="price-change-card"
                    style={{
                      borderLeft: isDecreased 
                        ? '4px solid #10B981' 
                        : (isIncreased ? '4px solid #EF4444' : 'none')
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: '1.4' }}>
                      {record.itemName || 'Unnamed Item / منتج غير مسمى'}
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      fontSize: '12px', 
                      color: '#6B7280',
                      marginBottom: '6px'
                    }}>
                      <Tag size={12} style={{ color: '#EF4444' }} />
                      <span>{record.itemBarCode}</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', marginBottom: '12px', gap: '8px' }}>
                      <span style={{ color: '#9CA3AF', textDecoration: 'line-through', fontSize: '14px' }}>
                        {formattedOldPrice} SAR
                      </span>
                      <span style={{ color: '#9CA3AF' }}>→</span>
                      {(!record.price || formattedNewPrice === 'N/A') ? (
                        <span style={{ color: '#9CA3AF', fontWeight: 'normal' }}>N/A SAR</span>
                      ) : (
                        <span style={{ 
                          fontWeight: 'bold', 
                          fontSize: '16px',
                          color: '#10B981'
                        }}>
                          {formattedNewPrice} SAR
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6B7280', marginTop: 'auto', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Store size={12} /> {getStoreName(record.storeId, record.operator)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {formatAbsoluteDate(record.createdTime || record.pushTime)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Bar */}
            {totalElements > 0 && (
              <div className="dragonesl-pagination-bar glass-card">
                <div className="pagination-left">
                  <span className="pagination-total">Total {totalElements} items / الإجمالي {totalElements} عناصر</span>
                  <CustomSelect
                    value={pageSize}
                    onChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}
                    options={[
                      { value: 5, label: '5/page' },
                      { value: 10, label: '10/page' },
                      { value: 12, label: '12/page' },
                      { value: 20, label: '20/page' },
                      { value: 50, label: '50/page' },
                      { value: 100, label: '100/page' },
                      { value: 500, label: '500/page' }
                    ]}
                  />
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
          </>
        )}
      </div>

      <style>{`
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .price-change-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          width: 100%;
        }
        @media (max-width: 1200px) {
          .price-change-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .price-change-grid {
            grid-template-columns: 1fr;
          }
        }

        .price-change-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        [data-theme='dark'] .price-change-card {
          background: var(--bg-secondary);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .price-change-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
      `}</style>
    </div>
  );
};

export default PriceMonitor;