import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  Store, 
  Activity,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import type { Store as StoreType } from '../../services/storeService';
import { getAuditLogs } from '../../services/auditLogService';
import type { AuditLog } from '../../services/auditLogService';

const getDatesForTimeFilter = (filter: 'today' | 'week' | 'all') => {
  const end = new Date();
  const start = new Date();
  if (filter === 'today') {
    // start and end are today
  } else if (filter === 'week') {
    start.setDate(end.getDate() - 7);
  } else {
    // ZKong limit is 90 days
    start.setDate(end.getDate() - 90);
  }
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
};

const getRelativeTime = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr.replace(' ', 'T'));
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 0) return 'Just now / للتو';
    if (diffInSeconds < 60) return 'Just now / للتو';
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60);
      return `${mins} min${mins > 1 ? 's' : ''} ago / منذ ${mins} دقيقة`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago / منذ ${hours} ساعة`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago / منذ ${days} يوم`;
  } catch {
    return dateStr;
  }
};

const formatPrice = (priceStr?: string) => {
  if (!priceStr) return 'N/A';
  const num = parseFloat(priceStr);
  if (isNaN(num)) return priceStr;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

const PriceChangeMonitor: React.FC = () => {
  const [stores, setStores] = useState<StoreType[]>([]);
  const [changes, setChanges] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPriceChanges = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch stores if not yet loaded
      let currentStores = stores;
      if (stores.length === 0) {
        currentStores = await storeService.getAllStores();
        setStores(currentStores || []);
      }
      
      const { startDate, endDate } = getDatesForTimeFilter('all');
      
      // Fetch only 5 records
      const response = await getAuditLogs('', startDate, endDate, 0, 5);
      setChanges(response.content || []);
    } catch (error) {
      console.error('Error fetching price changes from Dragon ESL log API', error);
    } finally {
      setLoading(false);
    }
  }, [stores]);

  useEffect(() => {
    fetchPriceChanges();
  }, []);

  // Interval for Live Updates (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPriceChanges();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchPriceChanges]);

  const getStoreName = (storeId?: string) => {
    if (!storeId) return 'Unknown Store / متجر غير معروف';
    const matched = stores.find(s => s.storeId === storeId || s.id === storeId);
    return matched ? matched.storeName : `Store #${storeId}`;
  };

  return (
    <div className="price-change-monitor">
      {/* Header */}
      <div className="dash-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 className="dash-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
          <Activity className="text-primary" size={22} />
          Price Change Monitor | مراقب تغيير الأسعار
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Static informational Live Updates status */}
          <div className="live-update-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.08)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '13px', fontWeight: '600' }}>
            <span className="pulse-dot" />
            <span>Live Updates / تحديثات مباشرة</span>
          </div>
          
          <button 
            onClick={fetchPriceChanges} 
            className={`refresh-btn ${loading ? 'spinning' : ''}`} 
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', cursor: 'pointer', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500', transition: 'background-color 0.2s' }}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            <span>Refresh / تحديث</span>
          </button>
        </div>
      </div>

      {/* Grid of Cards */}
      {loading && changes.length === 0 ? (
        <div className="loading-state" style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <RefreshCw className="spinning" size={32} style={{ margin: '0 auto 16px' }} />
          <p>Scanning ZKong ESL log history... / جاري جلب سجل العمليات...</p>
        </div>
      ) : changes.length === 0 ? (
        <div className="empty-state glass-card" style={{ padding: '60px 40px', textAlign: 'center', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '16px', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No Operation Logs Found / لا يوجد سجلات عمليات</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>No Dragon ESL logs found for this merchant.</p>
        </div>
      ) : (
        <div className="price-change-grid">
          {changes.map(record => (
            <div key={record.id} className="price-change-card glass-card">
              <div className="card-top">
                <h3 className="product-title">
                  {record.itemName || 'Unnamed Item / منتج غير مسمى'}
                </h3>
              </div>
              
              <div className="card-middle">
                <div className="price-row-item">
                  <span className="price-lbl">Offer Price / سعر العرض:</span>
                  <span className="price-val highlighted">{record.price ? `${formatPrice(record.price)} AED` : 'N/A'}</span>
                </div>
                <div className="price-row-item" style={{ marginTop: '10px' }}>
                  <span className="price-lbl">Discount Price / Discount Amount / قيمة الخصم:</span>
                  <span className="price-val">{record.discountAmount ? `${formatPrice(record.discountAmount)} AED` : '0.00 AED'}</span>
                </div>
              </div>
              
              <div className="card-bottom">
                <div className="meta-row">
                  <Store size={14} className="icon-store" />
                  <span className="meta-text">Store Name / المتجر: {getStoreName(record.storeId)}</span>
                </div>
                <div className="meta-row">
                  <Clock size={14} className="icon-clock" />
                  <span className="meta-text">Last Updated Time / آخر تحديث: {getRelativeTime(record.pushTime || record.createdTime)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .price-change-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          width: 100%;
        }

        .price-change-card {
          padding: 20px;
          border-radius: 16px;
          border: 1px solid var(--glass-border);
          box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: var(--glass-card);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .price-change-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px 0 rgba(0, 0, 0, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .product-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          min-height: 44px;
        }

        .card-middle {
          margin: 16px 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .price-row-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }

        .price-lbl {
          font-weight: 600;
          color: var(--text-secondary);
        }

        .price-val {
          font-weight: 700;
          color: var(--text-primary);
        }

        .price-val.highlighted {
          font-size: 18px;
          font-weight: 800;
          color: var(--primary-color);
        }

        .card-bottom {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px solid var(--glass-border);
          padding-top: 14px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .icon-store {
          color: var(--primary-color);
          opacity: 0.85;
          flex-shrink: 0;
        }

        .icon-clock {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .meta-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pulse-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }

        .refresh-btn:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
        }
      `}</style>
    </div>
  );
};

export default PriceChangeMonitor;
