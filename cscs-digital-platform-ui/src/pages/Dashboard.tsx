import React, { useState, useEffect } from 'react';
import { Store, Package, FileText, RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiCache } from '../services/apiCache';
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
  activeStoreCount: number | null;
  merchantCount: number | null;
  eslTagCount: number | null;
  eslBoundCount: number | null;
}

interface StoreProductStat {
  store: StoreType;
  productCount: number | null;
  loading: boolean;
}

interface StoreApStat {
  store: StoreType;
  apTotalCount: number | null;
  apOnlineCount: number | null;
  loading: boolean;
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
  bgColor?: string;
  error?: boolean;
}> = ({ icon, label, value, trend, loading, color = 'var(--primary-color)', bgColor = 'rgba(99,102,241,0.15)', error }) => (
  <div className="stat-card glass-card">
    <div className="stat-info">
      <span className="stat-label">{label}</span>
      {loading ? (
        <div className="shimmer-line" style={{ width: '80px', height: '28px', marginTop: '4px' }} />
      ) : error ? (
        <h3 className="stat-value error-val">—</h3>
      ) : (
        <h3 className="stat-value">{value || '0'}</h3>
      )}
      {trend && !loading && !error && <span className="stat-trend">{trend}</span>}
    </div>
    <div className="stat-icon" style={{ color, backgroundColor: bgColor }}>
      {icon}
    </div>
  </div>
);

// Pagination Controls Component
const PaginationControls: React.FC<{
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <div className="dash-pagination">
      <button 
        disabled={currentPage === 1} 
        onClick={() => onPageChange(currentPage - 1)}
        className="dash-page-btn"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="dash-page-info">{currentPage} / {totalPages}</span>
      <button 
        disabled={currentPage === totalPages} 
        onClick={() => onPageChange(currentPage + 1)}
        className="dash-page-btn"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

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
    activeStoreCount: null,
    merchantCount: null,
    eslTagCount: null,
    eslBoundCount: null,
  });
  const [loading, setLoading] = useState(true);
  
  const [allStores, setAllStores] = useState<StoreType[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const ITEMS_PER_PAGE = 5;
  const [productPage, setProductPage] = useState(1);
  const [apPage, setApPage] = useState(1);
  
  const [productBreakdown, setProductBreakdown] = useState<StoreProductStat[]>([]);
  const [apBreakdown, setApBreakdown] = useState<StoreApStat[]>([]);

  const fetchGlobalStats = async () => {
    setLoading(true);

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

    setAllStores(stores);
    setStats(prev => ({
      ...prev,
      storeCount: stores.length,
      eslOnline,
    }));

    const [tmplResult, catsResult, activeCountResult, merchantResult, eslResult] =
      await Promise.allSettled([
        getTemplates(0, 1),
        getCategories(),
        storeService.getActiveStoreCount(),
        storeService.getMerchantInfo(),
        stores.length > 0
          ? deviceService.getEslDevices(0, 500, stores[0].storeId)
          : Promise.resolve(null),
      ]);

    const templateCount = tmplResult.status === 'fulfilled' ? (tmplResult.value?.totalElements ?? 0) : null;
    const categoryCount = catsResult.status === 'fulfilled' ? (catsResult.value?.length ?? 0) : null;
    const activeStoreCount = activeCountResult.status === 'fulfilled' ? activeCountResult.value : null;
    const merchantCount = merchantResult.status === 'fulfilled' ? (merchantResult.value?.merchantCount ?? (merchantResult.value?.merchantName ? 1 : null)) : null;
    const eslAll = eslResult.status === 'fulfilled' ? eslResult.value : null;
    const eslTagCount = eslAll?.totalElements ?? null;
    const eslBoundCount = eslAll?.content?.filter((esl: any) => esl.bindState === 1).length ?? null;

    setStats(prev => ({
      ...prev,
      templateCount,
      categoryCount,
      activeStoreCount,
      merchantCount,
      eslTagCount,
      eslBoundCount
    }));

    setLoading(false);
    setLastRefreshed(new Date());
  };

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      if (allStores.length === 0) return;
      const startIndex = (productPage - 1) * ITEMS_PER_PAGE;
      const targetStores = allStores.slice(startIndex, startIndex + ITEMS_PER_PAGE);
      
      setProductBreakdown(targetStores.map(s => ({ store: s, productCount: null, loading: true })));
      
      const fetches = targetStores.map(async (store) => {
        try {
          const data = await getProducts(store.storeId, 0, 1);
          const count = data?.totalElements ?? (data?.content?.length ?? 0);
          setProductBreakdown(prev => prev.map(item => item.store.storeId === store.storeId ? { ...item, productCount: count, loading: false } : item));
        } catch {
          setProductBreakdown(prev => prev.map(item => item.store.storeId === store.storeId ? { ...item, productCount: null, loading: false } : item));
        }
      });
      await Promise.allSettled(fetches);
    };
    loadProducts();
  }, [allStores, productPage]);

  useEffect(() => {
    const loadAps = async () => {
      if (allStores.length === 0) return;
      const startIndex = (apPage - 1) * ITEMS_PER_PAGE;
      const targetStores = allStores.slice(startIndex, startIndex + ITEMS_PER_PAGE);
      
      setApBreakdown(targetStores.map(s => ({ store: s, apTotalCount: null, apOnlineCount: null, loading: true })));
      
      const fetches = targetStores.map(async (store) => {
        try {
          const apData = await deviceService.getApDevices(0, 100, store.storeId);
          const total = apData?.totalElements || 0;
          const onlineCount = apData?.content?.filter(ap => ap.online === 'ONLINE')?.length || 0;
          setApBreakdown(prev => prev.map(item => item.store.storeId === store.storeId ? { ...item, apTotalCount: total, apOnlineCount: onlineCount, loading: false } : item));
        } catch {
          setApBreakdown(prev => prev.map(item => item.store.storeId === store.storeId ? { ...item, apTotalCount: 0, apOnlineCount: 0, loading: false } : item));
        }
      });
      await Promise.allSettled(fetches);
    };
    loadAps();
  }, [allStores, apPage]);

  const formatCount = (n: number | null) =>
    n === null ? '—' : n.toLocaleString();

  // Compute sum for total products roughly based on all loaded product break downs or we just leave product stats loading
  const currentTotalAP = apBreakdown.reduce((sum, i) => sum + (i.apOnlineCount ?? 0), 0);

  return (
    <div className="dashboard-page">

      {/* ── Page Header ── */}
      <div className="dashboard-header">
        <div>
          <h2 className="dash-title">Dashboard / نظرة عامة على العمليات</h2>
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={() => {
              apiCache.clear();
              setProductPage(1);
              setApPage(1);
              fetchGlobalStats();
            }}
            disabled={loading}
            title="Refresh all stats / تحديث جميع الإحصائيات"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh / تحديث
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="dashboard-grid">
        <StatCard
          icon={<Store size={24} />}
          label="Merchants / التجار"
          value={formatCount(stats.merchantCount)}
          trend={stats.merchantCount !== null ? `${formatCount(stats.merchantCount)} active merchants / تاجر نشط` : undefined}
          loading={loading}
          color="#6366f1"
          bgColor="rgba(99,102,241,0.15)"
          error={!loading && stats.merchantCount === null}
        />
        <StatCard
          icon={<Store size={24} />}
          label="Stores / المتاجر"
          value={formatCount(stats.storeCount)}
          trend={stats.activeStoreCount !== null ? `${formatCount(stats.activeStoreCount)} active stores / متاجر نشطة` : undefined}
          loading={loading}
          color="#0ea5e9"
          bgColor="rgba(14,165,233,0.15)"
          error={!loading && stats.storeCount === null}
        />
        <StatCard
          icon={<Wifi size={24} />}
          label="Access Points / نقاط الوصول"
          value={String(currentTotalAP)}
          trend={`${currentTotalAP} active AP (visible) / نقاط وصول نشطة`}
          loading={loading}
          color="#8b5cf6"
          bgColor="rgba(139,92,246,0.15)"
          error={!loading && apBreakdown.length === 0}
        />
        <StatCard
          icon={<FileText size={24} />}
          label="Templates / القوالب"
          value={formatCount(stats.templateCount)}
          trend={stats.templateCount !== null ? `${formatCount(stats.templateCount)} active templates / قوالب نشطة` : undefined}
          loading={loading}
          color="#f59e0b"
          bgColor="rgba(245,158,11,0.15)"
          error={!loading && stats.templateCount === null}
        />
        <StatCard
          icon={<Package size={24} />}
          label="Products / المنتجات"
          value={formatCount(productBreakdown.reduce((s, i) => s + (i.productCount ?? 0), 0))}
          trend={`Products in visible stores / إجمالي المنتجات`}
          loading={loading}
          color="#f97316"
          bgColor="rgba(249,115,22,0.15)"
          error={!loading && productBreakdown.length === 0}
        />
        <StatCard
          icon={<Wifi size={24} />}
          label="ESL Tags / علامات ESL"
          value={formatCount(stats.eslTagCount)}
          trend={stats.eslBoundCount !== null ? `${formatCount(stats.eslBoundCount)} bound tags / بطاقات مرتبطة` : undefined}
          loading={loading}
          color="#10b981"
          bgColor="rgba(16,185,129,0.15)"
          error={!loading && stats.eslTagCount === null}
        />
      </div>

      {/* ── Bottom Row ── */}
      <div className="dashboard-row">

        {/* Per-store product breakdown */}
        <div className="store-breakdown glass-card">
          <div className="card-header">
            <div>
              <h3>Product per Store / المنتجات لكل متجر</h3>
              <span className="card-meta">Live product counts / إحصائيات المنتجات</span>
            </div>
            <PaginationControls 
              currentPage={productPage} 
              totalItems={allStores.length} 
              itemsPerPage={ITEMS_PER_PAGE} 
              onPageChange={setProductPage} 
            />
          </div>
          <div className="breakdown-list">
            {productBreakdown.length === 0 && !loading && (
              <div className="empty-breakdown">
                <AlertTriangle size={32} className="text-warning" />
                <p>No store data available / لا توجد بيانات متاجر متاحة</p>
              </div>
            )}
            {productBreakdown.map((item, idx) => (
              <div key={item.store.storeId} className="breakdown-row">
                <div className="breakdown-store-info">
                  <span className="breakdown-index">{(productPage - 1) * ITEMS_PER_PAGE + idx + 1}</span>
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
                        `${Math.min(100, ((item.productCount ?? 0) / Math.max(1, ...productBreakdown.map(s => s.productCount ?? 0))) * 100)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-store AP breakdown */}
        <div className="store-breakdown glass-card">
          <div className="card-header">
            <div>
              <h3>AP Status per Store / حالة نقاط الوصول لكل متجر</h3>
              <span className="card-meta">Access Point coverage / تغطية نقاط الوصول</span>
            </div>
            <PaginationControls 
              currentPage={apPage} 
              totalItems={allStores.length} 
              itemsPerPage={ITEMS_PER_PAGE} 
              onPageChange={setApPage} 
            />
          </div>
          <div className="breakdown-list">
            {apBreakdown.length === 0 && !loading && (
              <div className="empty-breakdown">
                <AlertTriangle size={32} className="text-warning" />
                <p>No store data available / لا توجد بيانات متاجر متاحة</p>
              </div>
            )}
            {apBreakdown.map((item, idx) => (
              <div key={item.store.storeId} className="breakdown-row">
                <div className="breakdown-store-info">
                  <span className="breakdown-index">{(apPage - 1) * ITEMS_PER_PAGE + idx + 1}</span>
                  <div>
                    <span className="breakdown-name">{item.store.storeName}</span>
                    <span className="breakdown-id">
                      {item.loading ? 'Loading...' : `AP: ${item.apTotalCount} Total, ${item.apOnlineCount} Active`}
                    </span>
                  </div>
                </div>
                <div className="breakdown-count-wrap">
                  {item.loading ? (
                    <div className="shimmer-line" style={{ width: '48px', height: '20px' }} />
                  ) : item.apTotalCount === null ? (
                    <span className="breakdown-count error">Err / خطأ</span>
                  ) : (
                    <div className={`status-badge-live ${item.apOnlineCount && item.apOnlineCount > 0 ? 'success' : 'neutral'}`}>
                      {item.apOnlineCount && item.apOnlineCount > 0 ? 'Online' : 'Offline'}
                    </div>
                  )}
                </div>
                <div className="breakdown-bar-wrap">
                  <div
                    className="breakdown-bar"
                    style={{
                      background: item.apOnlineCount && item.apOnlineCount > 0 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
                      width: item.loading || item.apTotalCount === null || item.apTotalCount === 0 ? '0%' :
                        `${Math.min(100, ((item.apOnlineCount ?? 0) / item.apTotalCount) * 100)}%`
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

            <div className="status-item">
              <span>Middleware API / واجهة API الوسيطة</span>
              <div className="status-badge-live success" style={{ border: 'none' }}><Wifi size={12} /> Running / يعمل</div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        /* Layout */
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg, 24px);
          padding: var(--space-xs, 4px);
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

        /* Stat Cards Grid */
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-lg, 24px);
          align-items: stretch;
        }
        @media (max-width: 1024px) {
          .dashboard-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .dashboard-grid { grid-template-columns: 1fr; }
        }

        /* StatCard sub-styles */
        .stat-card {
          padding: var(--space-lg, 24px) 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-md, 16px);
          transition: transform 0.2s, box-shadow 0.2s;
          border-radius: 12px;
          cursor: default;
          height: 100%;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.15);
        }
        .stat-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .stat-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }
        .stat-value {
          font-size: 32px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.1;
        }
        .stat-value.error-val { color: var(--text-muted); }
        .stat-trend {
          font-size: 13px;
          font-weight: 600;
          color: var(--success-color);
        }
        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
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
          grid-template-columns: 1fr 1fr 320px;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 1200px) {
          .dashboard-row { grid-template-columns: 1fr 1fr; }
          .system-health { grid-column: 1 / -1; }
        }
        @media (max-width: 768px) {
          .dashboard-row { grid-template-columns: 1fr; }
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

        .dash-pagination {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dash-page-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .dash-page-btn:hover:not(:disabled) {
          background: rgba(99,102,241,0.2);
          border-color: rgba(99,102,241,0.4);
          color: #a5b4fc;
        }
        .dash-page-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .dash-page-info {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .breakdown-list {
          padding: 8px 0;
          max-height: 480px;
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
