import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Store, 
  Filter,
  Activity,
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import type { Store as StoreType } from '../../services/storeService';
import { getAuditLogs } from '../../services/auditLogService';
import type { AuditLog } from '../../services/auditLogService';

export interface PriceChangeRecord {
  id: string;
  barcode: string;
  productName: string;
  storeId: string;
  storeName: string;
  oldPrice: number;
  newPrice: number;
  percentageChange: number;
  timestamp: string;
  isIncrease: boolean;
}

const getRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
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
};

const isToday = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

const isThisWeek = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays <= 7;
};

const PriceChangeMonitor: React.FC = () => {
  const [stores, setStores] = useState<StoreType[]>([]);
  const [changes, setChanges] = useState<PriceChangeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'increased' | 'decreased'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week'>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');

  const fetchPriceChanges = useCallback(async () => {
    try {
      setLoading(true);
      const storesData = await storeService.getAllStores();
      setStores(storesData || []);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      const allChanges: PriceChangeRecord[] = [];

      // Fetch logs for all stores in parallel (limited to latest 500 product updates per store to find changes)
      const promises = (storesData || []).map(async (store) => {
        try {
          const storeIdStr = store.storeId || store.id || '';
          if (!storeIdStr) return;
          
          // Fetch logs for all operations to ensure we capture initial prices (e.g. from Bind Tag)
          const response = await getAuditLogs(storeIdStr, startDate, endDate, 0, 500, undefined);
          const logs = response.content || [];
          
          // Group by barcode
          const groupedLogs: Record<string, AuditLog[]> = {};
          logs.forEach(log => {
            if (!log.itemBarCode) return;
            if (!groupedLogs[log.itemBarCode]) groupedLogs[log.itemBarCode] = [];
            groupedLogs[log.itemBarCode].push(log);
          });
          
          Object.values(groupedLogs).forEach(productLogs => {
            if (productLogs.length < 2) return; // Need at least 2 logs to see a change
            
            // Sort descending by createdTime
            productLogs.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());
            
            // Find a price change
            let latestPriceStr = productLogs[0].price;
            let previousPriceStr = null;
            let changeTimestamp = productLogs[0].createdTime;
            
            for (let i = 1; i < productLogs.length; i++) {
              if (productLogs[i].price !== latestPriceStr && productLogs[i].price != null) {
                previousPriceStr = productLogs[i].price;
                break;
              }
            }
            
            if (latestPriceStr && previousPriceStr && latestPriceStr !== previousPriceStr) {
              const newPrice = parseFloat(latestPriceStr);
              const oldPrice = parseFloat(previousPriceStr);
              
              if (!isNaN(newPrice) && !isNaN(oldPrice) && oldPrice > 0) {
                const percentageChange = ((newPrice - oldPrice) / oldPrice) * 100;
                
                allChanges.push({
                  id: productLogs[0].id.toString(),
                  barcode: productLogs[0].itemBarCode,
                  productName: productLogs[0].itemName || 'Unknown Product',
                  storeId: storeIdStr,
                  storeName: store.storeName || `Store #${storeIdStr}`,
                  oldPrice,
                  newPrice,
                  percentageChange,
                  timestamp: changeTimestamp,
                  isIncrease: newPrice > oldPrice
                });
              }
            }
          });
          
        } catch (err) {
          console.error(`Failed to fetch logs for store ${store.storeName}`, err);
        }
      });
      
      await Promise.all(promises);
      
      // Sort all changes descending by time
      allChanges.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setChanges(allChanges);
    } catch (error) {
      console.error('Error fetching price changes', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPriceChanges();
    // Refresh every 60 seconds
    const interval = setInterval(() => {
      fetchPriceChanges();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchPriceChanges]);

  // Apply Filters
  const filteredChanges = useMemo(() => {
    return changes.filter(c => {
      if (filterType === 'increased' && !c.isIncrease) return false;
      if (filterType === 'decreased' && c.isIncrease) return false;
      
      if (timeFilter === 'today' && !isToday(c.timestamp)) return false;
      if (timeFilter === 'week' && !isThisWeek(c.timestamp)) return false;
      
      if (storeFilter !== 'all' && c.storeId !== storeFilter) return false;
      
      return true;
    });
  }, [changes, filterType, timeFilter, storeFilter]);

  // Summary Metrics (derived from filtered data)
  const todayChanges = changes.filter(c => isToday(c.timestamp));
  const metrics = useMemo(() => {
    const increases = todayChanges.filter(c => c.isIncrease);
    const decreases = todayChanges.filter(c => !c.isIncrease);
    
    let maxIncrease = 0;
    let maxDecrease = 0;
    
    increases.forEach(c => {
      if (c.percentageChange > maxIncrease) maxIncrease = c.percentageChange;
    });
    
    decreases.forEach(c => {
      if (c.percentageChange < maxDecrease) maxDecrease = c.percentageChange;
    });

    return {
      total: todayChanges.length,
      increases: increases.length,
      decreases: decreases.length,
      maxIncrease,
      maxDecrease
    };
  }, [todayChanges]);

  return (
    <div className="price-change-monitor">
      {/* Header */}
      <div className="dash-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="dash-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Activity className="text-primary" size={24} />
          Price Change Monitor | مراقب تغيير الأسعار
        </h2>
        <div className="refresh-status" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <Clock size={14} />
          <span>Live Updates | تحديثات مباشرة</span>
          <button onClick={fetchPriceChanges} className={`refresh-btn ${loading ? 'spinning' : ''}`} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-form glass-card" style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '20px' }}>
        <div className="filter-group">
          <label><Store size={16} /> Store Filter / تصفية المتاجر</label>
          <select className="glass-select" value={storeFilter} onChange={e => setStoreFilter(e.target.value)}>
            <option value="all">All Stores / جميع المتاجر</option>
            {stores.map(s => (
              <option key={s.storeId || s.id} value={s.storeId || s.id}>
                {s.storeName || `Store #${s.storeId}`}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label><Filter size={16} /> Type Filter / نوع التغيير</label>
          <select className="glass-select" value={filterType} onChange={e => setFilterType(e.target.value as any)}>
            <option value="all">All Types / كل الأنواع</option>
            <option value="increased">Increased / زيادة</option>
            <option value="decreased">Decreased / تخفيض</option>
          </select>
        </div>

        <div className="filter-group">
          <label><Clock size={16} /> Time Filter / تصفية الوقت</label>
          <select className="glass-select" value={timeFilter} onChange={e => setTimeFilter(e.target.value as any)}>
            <option value="all">All Time / كل الوقت</option>
            <option value="today">Today / اليوم</option>
            <option value="week">This Week / هذا الأسبوع</option>
          </select>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card glass-card">
          <div className="stat-info">
            <span className="stat-label">Total Today | الإجمالي اليوم</span>
            <h3 className="stat-value">{metrics.total}</h3>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-info">
            <span className="stat-label">Increases | الزيادات</span>
            <h3 className="stat-value text-danger" style={{ color: '#ef4444' }}>{metrics.increases}</h3>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-info">
            <span className="stat-label">Decreases | التخفيضات</span>
            <h3 className="stat-value text-success" style={{ color: '#10b981' }}>{metrics.decreases}</h3>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-info">
            <span className="stat-label">Largest Inc. | أكبر زيادة</span>
            <h3 className="stat-value" style={{ color: '#ef4444' }}>+{metrics.maxIncrease.toFixed(1)}%</h3>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-info">
            <span className="stat-label">Largest Dec. | أكبر تخفيض</span>
            <h3 className="stat-value" style={{ color: '#10b981' }}>{metrics.maxDecrease.toFixed(1)}%</h3>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="price-changes-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
        {loading && filteredChanges.length === 0 ? (
          <div className="loading-state" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw className="spinning" size={32} style={{ margin: '0 auto 16px' }} />
            <p>Scanning price history... / جاري فحص سجل الأسعار...</p>
          </div>
        ) : filteredChanges.length === 0 ? (
          <div className="empty-state glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
            <h3>No Price Changes Found / لا يوجد تغييرات في الأسعار</h3>
            <p style={{ color: 'var(--text-secondary)' }}>No price changes match your current filters.</p>
          </div>
        ) : (
          filteredChanges.map(record => (
            <div key={record.id} className="price-change-card glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div className="record-details" style={{ flex: '1 1 300px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {record.productName}
                </h4>
                <div className="price-flow" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)', textDecoration: 'line-through' }}>{record.oldPrice} AED</span>
                  <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: record.isIncrease ? '#ef4444' : '#10b981' }}>{record.newPrice} AED</span>
                </div>
                <div className="store-info" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <Store size={14} />
                  <span>{record.storeName}</span>
                </div>
              </div>

              <div className="record-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                <div className="trend-badge" style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', 
                  padding: '6px 12px', borderRadius: '20px',
                  fontWeight: '600', fontSize: '14px',
                  backgroundColor: record.isIncrease ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: record.isIncrease ? '#ef4444' : '#10b981'
                }}>
                  {record.isIncrease ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {record.percentageChange > 0 ? '+' : ''}{record.percentageChange.toFixed(1)}%
                </div>
                <div className="time-info" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: record.isIncrease ? '#ef4444' : '#10b981' }} />
                  {getRelativeTime(record.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .price-changes-list::-webkit-scrollbar {
          width: 8px;
        }
        .price-changes-list::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
          border-radius: 4px;
        }
        .price-changes-list::-webkit-scrollbar-thumb {
          background: var(--glass-border);
          border-radius: 4px;
        }

        .filter-group {
          flex: 1 1 200px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-group label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .glass-select {
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 10px 14px;
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 14px;
          width: 100%;
          outline: none;
          transition: border-color 0.2s, background-color 0.2s;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px;
        }

        .glass-select option {
          background-color: #1e1b29;
          color: #fff;
        }

        .glass-select:focus {
          border-color: var(--primary-color);
          background-color: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
};

export default PriceChangeMonitor;
