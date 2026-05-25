import React from 'react';
import { Cpu, Copy, Check } from 'lucide-react';
import type { ApDevice } from '../../services/deviceService';
import { getPaginationRange } from '../../utils/paginationUtils';

interface ApTabProps {
  apDevices: ApDevice[];
  page: number;
  pageSize: number;
  totalElements: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  copyToClipboard: (text: string) => void;
  copiedId: string | null;
}

export const ApTab: React.FC<ApTabProps> = ({
  apDevices,
  page,
  pageSize,
  totalElements,
  setPage,
  setPageSize,
  copyToClipboard,
  copiedId,
}) => {
  const totalPages = Math.ceil(totalElements / pageSize) || 1;

  return (
    <div className="table-card glass-card animate-fade-in">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Base Station MAC / عنوان MAC للمحطة</th>
              <th>AP Name / اسم المحطة</th>
              <th>Model / SN / الطراز / الرقم التسلسلي</th>
              <th>IP Address / عنوان IP</th>
              <th>Connections / الاتصالات</th>
              <th>Status / الحالة</th>
              <th>Firmware Version / إصدار البرمجيات</th>
              <th>Last Online Time / آخر وقت اتصال</th>
            </tr>
          </thead>
          <tbody>
            {apDevices.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-table-cell">
                  <Cpu size={36} className="empty-icon" />
                  <p>No AP Base Stations registered in this store context. / لا توجد محطات بث مسجلة في هذا المتجر.</p>
                </td>
              </tr>
            ) : (
              apDevices.map((ap) => (
                <tr key={ap.id || ap.mac}>
                  {/* MAC */}
                  <td className="barcode-cell font-mono">
                    <span>{ap.mac}</span>
                    <button 
                      className="copy-btn" 
                      onClick={() => copyToClipboard(ap.mac)}
                      title="Copy MAC Address / نسخ عنوان MAC"
                    >
                      {copiedId === ap.mac ? <Check size={14} className="copied" /> : <Copy size={14} />}
                    </button>
                  </td>

                  {/* Name */}
                  <td>
                    <span className="ap-name-label">{ap.apName || 'Unregistered Station / محطة غير مسجلة'}</span>
                  </td>

                  {/* Model */}
                  <td>
                    <div className="model-cell">
                      <span className="model-badge">{ap.model || 'ZAP-CM'}</span>
                    </div>
                  </td>

                  {/* IP */}
                  <td className="font-mono ip-cell">{ap.ip || '192.168.1.100'}</td>

                  {/* Connections */}
                  <td>
                    <div className="connections-badge">
                      <span className="count">{ap.eslCount}</span>
                      <span className="label">ESLs / شاشات</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`status-pill ${
                      ap.online === 'ONLINE' ? 'online' : ap.online === 'UPGRADING' ? 'warning' : 'offline'
                    }`}>
                      <span className="dot" />
                      <span>{ap.online === 'ONLINE' ? 'Online / متصل' : ap.online === 'UPGRADING' ? 'Upgrading / جاري الترقية' : 'Offline / غير متصل'}</span>
                    </span>
                  </td>

                  {/* Firmware */}
                  <td className="firmware-cell">{ap.softVersion || '3.1.017_Release'}</td>

                  {/* Last Join */}
                  <td className="time-cell">
                    {ap.joinTime || 'N/A / غير متوفر'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Premium Zkong/DragonESL Pagination */}
      {totalElements > 0 && (
        <div className="dragonesl-pagination-bar glass-card" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: '0 0 12px 12px' }}>
          <div className="pagination-left">
            <span className="pagination-total">Total {totalElements} items / الإجمالي {totalElements} عناصر</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="pagination-size-select"
            >
              <option value={5}>5 / page / ٥ للصفحة</option>
              <option value={10}>10 / page / ١٠ للصفحة</option>
              <option value={20}>20 / page / ٢٠ للصفحة</option>
              <option value={50}>50 / page / ٥٠ للصفحة</option>
              <option value={100}>100 / page / ١٠٠ للصفحة</option>
            </select>
          </div>

          <div className="pagination-right">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(Math.max(page - 1, 0))}
              className="pagination-arrow-btn"
            >
              &lt;
            </button>

            {getPaginationRange(page + 1, totalPages, 1).map((pageNum, idx) => (
              pageNum === '...' ? (
                <span key={`dots-${idx}`} className="pagination-dots">...</span>
              ) : (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(Number(pageNum) - 1)}
                  className={`pagination-num-btn ${page === Number(pageNum) - 1 ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              )
            ))}

            <button
              type="button"
              disabled={page === totalPages - 1 || totalPages === 0}
              onClick={() => setPage(Math.min(page + 1, totalPages - 1))}
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
                value={page + 1}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 1 && val <= totalPages) {
                    setPage(val - 1);
                  }
                }}
                className="pagination-jump-input"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
