import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  RefreshCw, 
  Calendar,
  Store,
  Tag,
  Activity
} from 'lucide-react';
import api from '../services/api';
import '../styles/theme.css';
import PageHeader from '../components/PageHeader';
import { CustomSelect } from '../components/common/CustomSelect';
import SyncControlButton from '../components/dashboard/SyncControlButton';

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
      <PageHeader
        title="Price Change Monitor"
        titleAr="مراقب تغيير الأسعار"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            {/* ── Sync Control Button ───────────────────────────────────────
                Shows current sync status (Running / Stopped) with a live dot.
                Allows admin to start or stop TL's price sync scheduler.
                Calls: GET /api/sync/status on mount
                       POST /api/sync/start or /api/sync/stop on button click
            ──────────────────────────────────────────────────────────────── */}
            <SyncControlButton />

            {/* ── Refresh Button ────────────────────────────────────────── */}
            <button
              className="btn-action btn-action-refresh"
              onClick={fetchHistory}
              disabled={loading}
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
            <Store size={14} /> Store Filter
          </label>
          <CustomSelect
            value={storeFilter}
            onChange={val => setStoreFilter(String(val))}
            options={[
              { value: 'All Stores', label: 'All Stores' },
              { value: '1', label: 'Main Store (1)' }
            ]}
          />
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Filter size={14} /> Change Type
          </label>
          <CustomSelect
            value={typeFilter}
            onChange={val => setTypeFilter(String(val))}
            options={[
              { value: 'All Types', label: 'All Types' },
              { value: 'PRICE_INCREASED', label: 'Increase Only' },
              { value: 'PRICE_DECREASED', label: 'Decrease Only' }
            ]}
          />
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Calendar size={14} /> Time Filter
          </label>
          <CustomSelect
            value={timeFilter}
            onChange={val => setTimeFilter(String(val))}
            options={[
              { value: 'Today', label: 'Today' },
              { value: 'Last 7 Days', label: 'Last 7 Days' },
              { value: 'Last 30 Days', label: 'Last 30 Days' },
              { value: 'All Time', label: 'All Time' }
            ]}
          />
        </div>
      </div>

      {/* Feed */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '20px' }}>Price Change Feed</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Loading history...
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No price changes found matching the criteria.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {events.map(ev => {
              const isInc = ev.eventType === 'PRICE_INCREASED';
              return (
                <div
                  key={ev.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{ev.productName}</div>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Tag size={14} /> {ev.barcode}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Store size={14} /> Store ID: {ev.storeId}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} /> {getTimeAgo(ev.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 'bold' }}>
                        <span style={{ color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                          AED {ev.oldPrice}
                        </span>
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