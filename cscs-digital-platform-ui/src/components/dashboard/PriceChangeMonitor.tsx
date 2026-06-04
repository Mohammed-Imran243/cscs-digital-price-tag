import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Activity,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import type { Store as StoreType } from '../../services/storeService';
import { getAuditLogs } from '../../services/auditLogService';
import type { AuditLog } from '../../services/auditLogService';

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
  const storesRef = useRef<StoreType[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [changes, setChanges] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPriceChanges = useCallback(async () => {
    try {
      setLoading(true);
      
      if (storesRef.current.length === 0) {
        const loadedStores = await storeService.getAllStores();
        storesRef.current = loadedStores || [];
        setStores(loadedStores || []);
      }
      
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);
      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];
      
      const response = await getAuditLogs('', startDate, endDate, 0, 5, 4);
      setChanges(response.content || []);
    } catch (error) {
      console.error('Error fetching price changes', error);
    } finally {
      setLoading(false);
    }
  }, []); // ← empty dependency array — never recreated

  // Initial load
  useEffect(() => {
    fetchPriceChanges();
  }, [fetchPriceChanges]);

  // Interval - stable now because fetchPriceChanges never changes
  useEffect(() => {
    const interval = setInterval(fetchPriceChanges, 60000);
    return () => clearInterval(interval);
  }, [fetchPriceChanges]);

  const formatTimeAgo = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'just now / الآن';
    if (diffMins < 60)
      return diffMins + ' mins ago / منذ ' + diffMins + ' دقيقة';
    if (diffHours < 24)
      return diffHours + ' hrs ago / منذ ' + diffHours + ' ساعة';
    return diffDays + ' days ago / منذ ' + diffDays + ' يوم';
  };

  const getStoreName = (storeId?: string, operator?: string) => {
    if (stores.length >= 0) {
      // Access stores to ensure component re-renders when stores state updates
    }
    if (!storeId || storeId === 'null' || storeId.trim() === '') {
      return operator || 'System / النظام';
    }
    const matched = storesRef.current.find(s => s.storeId === storeId || s.id === storeId);
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
            className="refresh-btn" 
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
          <p>Loading price changes... / جاري تحميل تغييرات الأسعار...</p>
        </div>
      ) : changes.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', color: '#9CA3AF' }}>
          <TrendingUp size={48} style={{ marginBottom: '16px' }} />
          <div style={{ fontSize: '15px', fontWeight: '500', textAlign: 'center' }}>
            No price changes found / لا توجد تغييرات في الأسعار
          </div>
        </div>
      ) : (
        <div className="price-change-grid">
          {changes.map(record => {
            const priceNum = parseFloat(record.price || '0');
            const origNum = parseFloat(record.originalPrice || '0');
            const isDecreased = priceNum < origNum;
            const isIncreased = priceNum > origNum;

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
                
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', marginBottom: '12px' }}>
                  <span style={{ color: '#9CA3AF', textDecoration: 'line-through', fontSize: '14px' }}>
                    {formatPrice(record.originalPrice)} SAR
                  </span>
                  <span style={{ color: '#9CA3AF', margin: '0 8px' }}>→</span>
                  <span style={{ 
                    fontWeight: 'bold', 
                    fontSize: '16px',
                    color: isDecreased ? '#10B981' : (isIncreased ? '#EF4444' : 'var(--text-primary)') 
                  }}>
                    {formatPrice(record.price)} SAR
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6B7280', marginTop: 'auto' }}>
                  <span>🏪 {getStoreName(record.storeId, record.operator)}</span>
                  <span>🕐 {formatTimeAgo(record.pushTime || record.createdTime)}</span>
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
