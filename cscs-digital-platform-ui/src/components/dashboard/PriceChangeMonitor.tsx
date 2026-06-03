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

  const formatTimeAgo = (dateStr: string): string => {
    const normalized = dateStr && dateStr.includes(' ') && !dateStr.includes('T') ? dateStr.replace(' ', 'T') : dateStr;
    const date = new Date(normalized);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) 
      return diffMins + ' mins ago / منذ ' + diffMins + ' دقائق';
    if (diffHours < 24) 
      return diffHours + ' hrs ago / منذ ' + diffHours + ' ساعات';
    return diffDays + ' days ago / منذ ' + diffDays + ' أيام';
  };

  const getStoreName = (storeId?: string, operator?: string) => {
    if (!storeId || storeId === 'null' || storeId.trim() === '') {
      return operator || 'System / النظام';
    }
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
          {changes.map(record => {
            const priceNum = parseFloat(record.price || '0');
            const origNum = parseFloat(record.originalPrice || '0');
            const isDecreased = priceNum < origNum;
            const isIncreased = priceNum > origNum;

            return (
              <div key={record.id} className="price-change-card">
                <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: '1.4' }}>
                  {record.itemName || 'Unnamed Item / منتج غير مسمى'}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>
                    {formatPrice(record.originalPrice)} AED
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span style={{ 
                    fontWeight: '700', 
                    color: isDecreased ? '#10b981' : (isIncreased ? '#ef4444' : 'var(--text-primary)') 
                  }}>
                    {formatPrice(record.price)} AED
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <span>📍</span>
                  <span>Store / المتجر: {getStoreName(record.storeId, record.operator)}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span>🕐</span>
                  <span>Time / الوقت: {formatTimeAgo(record.pushTime || record.createdTime)}</span>
                </div>
              </div>
            );
          })}
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
          padding: 16px;
          border-radius: 12px;
          border: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          background: #ffffff;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .price-change-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
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
