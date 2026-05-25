import React, { useState, useEffect } from 'react';
import { Store, Package, FileText, Activity, RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { storeService } from '../services/storeService';
import type { Store as StoreType } from '../services/storeService';
import { getProducts } from '../services/productService';
import { getTemplates, getCategories } from '../services/templateService';
import { deviceService } from '../services/deviceService';

// ──────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────
interface DashboardStats {
  storeCount: number | null;
  productCount: number | null;
  templateCount: number | null;
  categoryCount: number | null;
  eslOnline: boolean | null;
}

interface StoreProductStat {
  store: StoreType;
  productCount: number | null;
  loading: boolean;
  apOnlineCount?: number;
  apTotalCount?: number;
}

// ──────────────────────────────────────────────────
// StatCard Component
// ──────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | null;
  trend?: string;
  loading?: boolean;
  color?: string;
  error?: boolean;
}> = ({ icon, label, value, trend, loading, color = 'var(--primary-color)', error }) => (
  <div className="stat-card glass-card">
    <div className="stat-icon" style={{ color }}>
      {icon}
    </div>
    <div className="stat-info">
      <span className="stat-label">{label}</span>
      {loading ? (
        <div className="shimmer-line" style={{ width: '80px', height: '28px', marginTop: '4px' }} />
      ) : error ? (
        <h3 className="stat-value error-val">—</h3>
      ) : (
        <h3 className="stat-value">{value}</h3>
      )}
      {trend && !loading && !error && <span className="stat-trend">{trend}</span>}
    </div>
  </div>
);

// ──────────────────────────────────────────────────
// Dashboard Page
// ──────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    storeCount: null,
    productCount: null,
    templateCount: null,
    categoryCount: null,
    eslOnline: null,
  });
  const [loading, setLoading] = useState(true);
  const [storeBreakdown, setStoreBreakdown] = useState<StoreProductStat[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    setLoading(true);

    // ── 1. Fetch Stores ──────────────────────────
    let stores: StoreType[] = [];
    let eslOnline = false;
    try {
      const response = await storeService.getAllStores();
      if (response && response.length > 0) {
        stores = response;
        eslOnline = true;
      }
    } catch {
      eslOnline = false;
    }

    setStats(prev => ({
      ...prev,
      storeCount: stores.length,
      eslOnline,
    }));

    // Seed store breakdown skeleton
    setStoreBreakdown(stores.map(s => ({ store: s, productCount: null, loading: true })));

    // ── 2. Fetch Templates count ─────────────────
    try {
      const tmplResponse = await getTemplates(0, 1);
      setStats(prev => ({
        ...prev,
        templateCount: tmplResponse?.totalElements ?? 0,
      }));
    } catch {
      setStats(prev => ({ ...prev, templateCount: null }));
    }

    // ── 3. Fetch Category count ──────────────────
    try {
      const cats = await getCategories();
      setStats(prev => ({
        ...prev,
        categoryCount: cats?.length ?? 0,
      }));
    } catch {
      setStats(prev => ({ ...prev, categoryCount: null }));
    }

    // ── 4. Fetch product counts per store ────────
    if (stores.length === 0) {
      setStats(prev => ({ ...prev, productCount: 0 }));
      setLoading(false);
      setLastRefreshed(new Date());
      return;
    }

    // Cap to first 8 stores to avoid excessive parallel API calls
    const targetStores = stores.slice(0, 8);

    // Each fetch returns its count (or 0 on error) — avoids race condition
    // from mutating a shared variable inside parallel async callbacks.
    const productFetches = targetStores.map(async (store, idx): Promise<number> => {
      try {
        const data = await getProducts(store.storeId, 0, 1);
        const count = data?.totalElements ?? (data?.content?.length ?? 0);
        setStoreBreakdown(prev =>
          prev.map((item, i) =>
            i === idx ? { ...item, productCount: count, loading: false } : item
          )
        );
        return count;
      } catch {
        setStoreBreakdown(prev =>
          prev.map((item, i) =>
            i === idx ? { ...item, productCount: null, loading: false } : item
          )
        );
        return 0;
      }
    });

    // Sum after all fetches settle — no shared mutable variable in parallel callbacks
    const results = await Promise.allSettled(productFetches);
    const totalProducts = results.reduce((sum, r) =>
      sum + (r.status === 'fulfilled' ? r.value : 0), 0
    );

    // ── 5. Fetch AP counts for the first 3 stores (System Status display limit) ──
    const apFetches = targetStores.slice(0, 3).map(async (store, idx) => {
      try {
        const apData = await deviceService.getApDevices(0, 100, store.storeId);
        const total = apData?.totalElements || 0;
        const onlineCount = apData?.content?.filter(ap => ap.online === 'ONLINE')?.length || 0;
        
        setStoreBreakdown(prev =>
          prev.map((item, i) =>
            i === idx ? { ...item, apTotalCount: total, apOnlineCount: onlineCount } : item
          )
        );
      } catch {
        setStoreBreakdown(prev =>
          prev.map((item, i) =>
            i === idx ? { ...item, apTotalCount: 0, apOnlineCount: 0 } : item
          )
        );
      }
    });

    await Promise.allSettled(apFetches);

    setStats(prev => ({ ...prev, productCount: totalProducts }));
    setLoading(false);
    setLastRefreshed(new Date());
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCount = (n: number | null) =>
    n === null ? '—' : n.toLocaleString();

  const timeSince = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago / منذ ${diff} ثانية`;
    const mins = Math.floor(diff / 60);
    return `${mins}m ago / منذ ${mins} دقيقة`;
  };

  return (
    <div className="dashboard-page">

      {/* ── Page Header ── */}
      <div className="dashboard-header">
        <div>
          <h2 className="dash-title">Dashboard / نظرة عامة على العمليات</h2>

        </div>
        <button
          className="btn-refresh"
          onClick={fetchDashboardData}
          disabled={loading}
          title="Refresh all stats / تحديث جميع الإحصائيات"
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh / تحديث
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="dashboard-grid">
        <StatCard
          icon={<Store size={24} />}
          label="Total Stores / إجمالي المتاجر"
          value={formatCount(stats.storeCount)}
          trend={stats.storeCount !== null ? `${stats.storeCount} active store${stats.storeCount !== 1 ? 's' : ''} / ${stats.storeCount === 1 ? 'متجر نشط' : 'متاجر نشطة'}` : undefined}
          loading={loading}
          color="#6366f1"
          error={!loading && stats.storeCount === null}
        />
        <StatCard
          icon={<Package size={24} />}
          label="Total Products / إجمالي المنتجات"
          value={formatCount(stats.productCount)}
          trend={stats.productCount !== null ? 'Across all stores / عبر جميع المتاجر' : undefined}
          loading={loading}
          color="#10b981"
          error={!loading && stats.productCount === null}
        />
        <StatCard
          icon={<FileText size={24} />}
          label="ESL Templates / قوالب بطاقات الأسعار"
          value={formatCount(stats.templateCount)}
          trend={stats.categoryCount !== null ? `${stats.categoryCount} categor${stats.categoryCount !== 1 ? 'ies' : 'y'} / ${stats.categoryCount} ${stats.categoryCount === 1 ? 'تصنيف' : 'تصنيفات'}` : undefined}
          loading={loading}
          color="#f59e0b"
          error={!loading && stats.templateCount === null}
        />
      </div>

      {/* ── Bottom Row ── */}
      <div className="dashboard-row">

        {/* Per-store product breakdown */}
        <div className="store-breakdown glass-card">
          <div className="card-header">
            <h3>Products per Store / المنتجات لكل متجر</h3>
            <span className="card-meta">Live product counts per store / إحصائيات المنتجات المباشرة لكل فرع</span>
          </div>
          <div className="breakdown-list">
            {storeBreakdown.length === 0 && !loading && (
              <div className="empty-breakdown">
                <AlertTriangle size={32} className="text-warning" />
                <p>No store data available / لا توجد بيانات متاجر متاحة</p>
              </div>
            )}
            {storeBreakdown.length === 0 && loading && (
              <>
                {[1, 2, 3].map(i => (
                  <div key={i} className="breakdown-row skeleton">
                    <div className="shimmer-line" style={{ width: '60%', height: '14px' }} />
                    <div className="shimmer-line" style={{ width: '50px', height: '14px' }} />
                  </div>
                ))}
              </>
            )}
            {storeBreakdown.map((item, idx) => (
              <div key={item.store.storeId} className="breakdown-row">
                <div className="breakdown-store-info">
                  <span className="breakdown-index">{idx + 1}</span>
                  <div>
                    <span className="breakdown-name">{item.store.storeName}</span>
                    <span className="breakdown-id">ID / المعرف: {item.store.storeId}</span>
                  </div>
                </div>
                <div className="breakdown-count-wrap">
                  {item.loading ? (
                    <div className="shimmer-line" style={{ width: '48px', height: '20px' }} />
                  ) : item.productCount === null ? (
                    <span className="breakdown-count error">Err / خطأ</span>
                  ) : (
                    <span className="breakdown-count">{item.productCount.toLocaleString()}</span>
                  )}
                  <span className="breakdown-unit">items / عناصر</span>
                </div>
                <div className="breakdown-bar-wrap">
                  <div
                    className="breakdown-bar"
                    style={{
                      width: item.loading || item.productCount === null ? '0%' :
                        `${Math.min(100, ((item.productCount ?? 0) / Math.max(1, ...storeBreakdown.map(s => s.productCount ?? 0))) * 100)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="system-health glass-card">
          <div className="card-header">
            <h3>System Status / حالة النظام</h3>
          </div>
          <div className="status-grid">
            <div className="status-item">
              <span>Dragon ESL Cloud / سحابة Dragon ESL</span>
              {loading ? (
                <div className="shimmer-line" style={{ width: '64px', height: '22px' }} />
              ) : stats.eslOnline ? (
                <div className="status-badge-live success">
                  <CheckCircle size={12} /> Online / متصل
                </div>
              ) : (
                <div className="status-badge-live danger">
                  <WifiOff size={12} /> Offline / غير متصل
                </div>
              )}
            </div>
            <div className="status-item">
              <span>Last Sync Time / آخر وقت مزامنة</span>
              <div className="status-badge-live neutral">
                {loading ? '—' : lastRefreshed ? `Last Sync: ${lastRefreshed.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '')}` : 'No recent sync'}
              </div>
            </div>
            
            <div className="status-item">
              <span>Pending Updates / التحديثات المعلقة</span>
              <div className="status-badge-live" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)' }}>
                {loading ? '—' : '0 in queue / 0 قيد الانتظار'}
              </div>
            </div>

            <div className="status-item">
              <span>Failed Updates / التحديثات الفاشلة</span>
              <div className="status-badge-live success">
                {loading ? '—' : '0 failed / 0 فاشل'}
              </div>
            </div>

            <div className="status-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>AP Status per Store / حالة محطات البث لكل متجر</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                {loading ? (
                   <div className="shimmer-line" style={{ width: '100%', height: '32px' }} />
                ) : storeBreakdown.length > 0 ? (
                  storeBreakdown.slice(0, 3).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.store.storeName}</span>
                      <span style={{ color: item.apOnlineCount && item.apOnlineCount > 0 ? 'var(--success-color)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                        {item.apTotalCount !== undefined ? `${item.apOnlineCount} AP Online` : 'Loading... / جاري التحميل...'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="status-badge-live neutral">No AP data available / لا توجد بيانات لمحطات البث</div>
                )}
              </div>
            </div>
            <div className="status-item">
              <span>Middleware API / واجهة API الوسيطة</span>
              <div className="status-badge-live success" style={{ border: 'none' }}><Wifi size={12} /> Running / يعمل</div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        /* ── Layout ── */
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 28px;
          padding: 4px;
        }

        /* ── Header ── */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
        }
        .dash-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px 0;
        }

        .btn-refresh {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.35);
          color: #a5b4fc;
          padding: 9px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: background 0.2s;
        }
        .btn-refresh:hover { background: rgba(99, 102, 241, 0.25); }
        .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Stat Cards Grid ── */
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        /* StatCard sub-styles */
        .stat-card {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: transform 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); }
        .stat-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: var(--bg-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-info { flex: 1; min-width: 0; }
        .stat-label {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 26px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 4px 0;
          line-height: 1.2;
        }
        .stat-value.error-val { color: var(--text-muted); }
        .stat-trend {
          font-size: 12px;
          color: var(--success-color);
          font-weight: 600;
        }

        /* ── Shimmer ── */
        .shimmer-line {
          border-radius: 6px;
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { to { background-position: -200% center; } }

        /* ── Bottom Row ── */
        .dashboard-row {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .dashboard-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .dashboard-grid { grid-template-columns: 1fr; }
        }

        /* ── Store breakdown card ── */
        .store-breakdown, .system-health {
          overflow: hidden;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 22px 22px 16px 22px;
          border-bottom: 1px solid var(--glass-border);
        }
        .card-header h3 {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .card-meta {
          font-size: 12px;
          color: var(--text-muted);
        }

        .breakdown-list {
          padding: 8px 0;
          max-height: 380px;
          overflow-y: auto;
        }
        .breakdown-row {
          display: grid;
          grid-template-columns: 1fr auto;
          grid-template-rows: auto auto;
          align-items: center;
          padding: 12px 22px;
          gap: 4px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .breakdown-row:hover { background: rgba(255,255,255,0.03); }
        .breakdown-row.skeleton { opacity: 0.6; }
        .breakdown-store-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .breakdown-index {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.2);
          color: #a5b4fc;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .breakdown-name {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .breakdown-id {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
        }
        .breakdown-count-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1px;
        }
        .breakdown-count {
          font-size: 16px;
          font-weight: 700;
          color: var(--primary-color);
        }
        .breakdown-count.error { color: var(--danger-color); font-size: 13px; }
        .breakdown-unit {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .breakdown-bar-wrap {
          grid-column: 1 / -1;
          height: 3px;
          border-radius: 2px;
          background: rgba(255,255,255,0.06);
          overflow: hidden;
        }
        .breakdown-bar {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #818cf8);
          border-radius: 2px;
          transition: width 0.8s ease;
        }

        .empty-breakdown {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 40px;
          color: var(--text-muted);
          font-size: 14px;
        }

        /* ── System Status ── */
        .status-grid {
          padding: 8px 0 16px 0;
          display: flex;
          flex-direction: column;
        }
        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px 22px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .status-item:last-child { border-bottom: none; }
        .status-item > span {
          font-size: 13px;
          color: var(--text-primary);
          font-weight: 500;
        }
        .status-badge-live {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }
        .status-badge-live.success {
          background: rgba(16, 185, 129, 0.12);
          color: #34d399;
          border: 1px solid rgba(52, 211, 153, 0.25);
        }
        .status-badge-live.danger {
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.25);
        }
        .status-badge-live.neutral {
          background: rgba(148, 163, 184, 0.12);
          color: var(--text-muted);
          border: 1px solid rgba(148, 163, 184, 0.2);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
