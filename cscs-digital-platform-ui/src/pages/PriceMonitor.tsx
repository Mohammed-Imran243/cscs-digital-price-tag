import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  RefreshCcw, 
  Calendar,
  Store,
  Tag,
  Activity
} from 'lucide-react';
import api from '../services/api';
import '../styles/theme.css';

interface PriceHistoryEvent {
  id: string;
  eventType: 'PRICE_INCREASED' | 'PRICE_DECREASED';
  timestamp: string;
  storeId: string;
  productId: string;
  barcode: string;
  productName: string;
  oldPrice: string;
  newPrice: string;
  changePercentage: string;
}

const PriceMonitor: React.FC = () => {
  const [events, setEvents] = useState<PriceHistoryEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [storeFilter, setStoreFilter] = useState('All Stores');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [timeFilter, setTimeFilter] = useState('Last 7 Days');

  // Stats
  const [totalChanges, setTotalChanges] = useState(0);
  const [increasesCount, setIncreasesCount] = useState(0);
  const [decreasesCount, setDecreasesCount] = useState(0);
  const [maxIncrease, setMaxIncrease] = useState('0%');
  const [maxDecrease, setMaxDecrease] = useState('0%');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let queryParams = `?timeRange=${encodeURIComponent(timeFilter)}`;
      if (storeFilter !== 'All Stores') queryParams += `&storeId=${encodeURIComponent(storeFilter)}`;
      if (typeFilter !== 'All Types') queryParams += `&filterType=${encodeURIComponent(typeFilter)}`;

      const res = await api.get(`/api/v1/price-history${queryParams}`);
      if (res.data && res.data.success) {
        const data: PriceHistoryEvent[] = res.data.data;
        // Sort newest first
        const sorted = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setEvents(sorted);
        calculateStats(sorted);
      }
    } catch (err) {
      console.error("Failed to fetch price history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [storeFilter, typeFilter, timeFilter]);

  const calculateStats = (data: PriceHistoryEvent[]) => {
    setTotalChanges(data.length);
    let inc = 0;
    let dec = 0;
    let maxIncNum = 0;
    let maxDecNum = 0;

    data.forEach(e => {
      if (e.eventType === 'PRICE_INCREASED') inc++;
      if (e.eventType === 'PRICE_DECREASED') dec++;

      const pctNum = parseFloat(e.changePercentage.replace('+', '').replace('%', ''));
      if (pctNum > 0 && pctNum > maxIncNum) maxIncNum = pctNum;
      if (pctNum < 0 && pctNum < maxDecNum) maxDecNum = pctNum;
    });

    setIncreasesCount(inc);
    setDecreasesCount(dec);
    setMaxIncrease(maxIncNum > 0 ? `+${maxIncNum.toFixed(1)}%` : '0%');
    setMaxDecrease(maxDecNum < 0 ? `${maxDecNum.toFixed(1)}%` : '0%');
  };

  const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity className="text-primary" /> Price Change Monitor
          </h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)' }}>Track and analyze chronological product price movements.</p>
        </div>
        <button className="primary-btn" onClick={fetchHistory} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={16} /> Total Changes
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{totalChanges}</div>
        </div>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} className="text-success" /> Price Increases
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--success-color)' }}>{increasesCount}</div>
        </div>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingDown size={16} className="text-danger" /> Price Decreases
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--danger-color)' }}>{decreasesCount}</div>
        </div>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} className="text-success" /> Largest Increase
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--success-color)' }}>{maxIncrease}</div>
        </div>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingDown size={16} className="text-danger" /> Largest Decrease
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--danger-color)' }}>{maxDecrease}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}><Store size={14} /> Store Filter</label>
          <select className="glass-input" value={storeFilter} onChange={e => setStoreFilter(e.target.value)}>
            <option value="All Stores">All Stores</option>
            {/* Ideally this would be populated from a store list endpoint */}
            <option value="1">Main Store (1)</option>
          </select>
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}><Filter size={14} /> Change Type</label>
          <select className="glass-input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="All Types">All Types</option>
            <option value="PRICE_INCREASED">Increase Only</option>
            <option value="PRICE_DECREASED">Decrease Only</option>
          </select>
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}><Calendar size={14} /> Time Filter</label>
          <select className="glass-input" value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
            <option value="Today">Today</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="All Time">All Time</option>
          </select>
        </div>
      </div>

      {/* Feed */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '20px' }}>Price Change Feed</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading history...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No price changes found matching the criteria.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {events.map(ev => {
              const isInc = ev.eventType === 'PRICE_INCREASED';
              return (
                <div key={ev.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '16px', 
                  borderRadius: '12px', 
                  background: 'var(--glass-bg)', 
                  border: '1px solid var(--glass-border)' 
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{ev.productName}</div>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Tag size={14} /> {ev.barcode}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Store size={14} /> Store ID: {ev.storeId}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {getTimeAgo(ev.timestamp)}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 'bold' }}>
                        <span style={{ color: 'var(--text-secondary)', textDecoration: 'line-through' }}>AED {ev.oldPrice}</span>
                        <span>→</span>
                        <span>AED {ev.newPrice}</span>
                      </div>
                      <div style={{ 
                        color: isInc ? 'var(--success-color)' : 'var(--danger-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        {isInc ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {ev.changePercentage}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceMonitor;
