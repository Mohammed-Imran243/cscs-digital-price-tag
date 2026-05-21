import React from 'react';
import { Smartphone, Copy, Check, Eye, RefreshCw, Loader2, Signal, WifiOff } from 'lucide-react';
import type { EslDevice } from '../../services/deviceService';
import { getPaginationRange } from '../../utils/paginationUtils';

interface EslTabProps {
  eslDevices: EslDevice[];
  page: number;
  pageSize: number;
  totalElements: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  selectedBarcodes: string[];
  isAuthorized: boolean;
  handleSelectRow: (barcode: string) => void;
  handleSelectAll: (isChecked: boolean) => void;
  handleViewDetails: (barcode: string, rowData?: any) => void;
  handleForceRefresh: (barcode: string) => void;
  refreshingBarcodes: { [key: string]: boolean };
  copyToClipboard: (text: string) => void;
  copiedId: string | null;
}

export const EslTab: React.FC<EslTabProps> = ({
  eslDevices,
  page,
  pageSize,
  totalElements,
  setPage,
  setPageSize,
  selectedBarcodes,
  isAuthorized,
  handleSelectRow,
  handleSelectAll,
  handleViewDetails,
  handleForceRefresh,
  refreshingBarcodes,
  copyToClipboard,
  copiedId,
}) => {
  const totalPages = Math.ceil(totalElements / pageSize) || 1;

  // Helper to determine battery rendering
  const getBatteryIcon = (percentage: number) => {
    if (percentage <= 20) return <BatteryWarningComponent className="battery-red" />;
    return <BatteryIconComponent className={percentage >= 70 ? 'battery-green' : 'battery-yellow'} />;
  };

  const BatteryWarningComponent = ({ className }: { className: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect>
      <line x1="22" y1="11" x2="22" y2="13"></line>
      <line x1="10" y1="11" x2="10" y2="13"></line>
    </svg>
  );

  const BatteryIconComponent = ({ className }: { className: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect>
      <line x1="22" y1="11" x2="22" y2="13"></line>
    </svg>
  );

  return (
    <div className="table-card glass-card animate-fade-in">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px', padding: '16px 12px' }}>
                <input 
                  type="checkbox" 
                  className="custom-checkbox"
                  checked={eslDevices.length > 0 && selectedBarcodes.length === eslDevices.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th>ESL Barcode</th>
              <th>OEM Model</th>
              <th>Bound Product</th>
              <th>Status</th>
              <th>Battery</th>
              <th>Signal</th>
              <th>Last Update</th>
              <th style={{ textAlign: 'center' }}>Operation</th>
            </tr>
          </thead>
          <tbody>
            {eslDevices.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-table-cell">
                  <Smartphone size={36} className="empty-icon" />
                  <p>No ESL devices registered in this branch context.</p>
                </td>
              </tr>
            ) : (
              eslDevices.map((esl) => {
                const isSelected = selectedBarcodes.includes(esl.priceTagCode);
                return (
                  <tr key={esl.id || esl.priceTagCode} className={isSelected ? 'row-selected' : ''}>
                    {/* Checkbox */}
                    <td style={{ padding: '16px 12px' }}>
                      <input 
                        type="checkbox" 
                        className="custom-checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(esl.priceTagCode)}
                      />
                    </td>

                    {/* ESL Barcode */}
                    <td className="barcode-cell font-mono">
                      <span>{esl.priceTagCode}</span>
                      <button 
                        className="copy-btn" 
                        onClick={() => copyToClipboard(esl.priceTagCode)}
                        title="Copy Barcode"
                      >
                        {copiedId === esl.priceTagCode ? <Check size={14} className="copied" /> : <Copy size={14} />}
                      </button>
                    </td>

                    {/* OEM Model */}
                    <td>
                      <span className="model-badge">{esl.oemModel || 'ZKC21S'}</span>
                    </td>

                    {/* Bound Product */}
                    <td>
                      {esl.bindState === 1 && esl.itemBarCode ? (
                        <div className="bound-product-info">
                          <span className="product-title">{esl.itemTitle || 'Unnamed Product'}</span>
                          <span className="product-barcode font-mono">{esl.itemBarCode}</span>
                        </div>
                      ) : (
                        <span className="unbound-badge">Unbound / Idle</span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`status-pill ${esl.state === 'ONLINE' ? 'online' : 'offline'}`}>
                        <span className="dot" />
                        <span>{esl.state}</span>
                      </span>
                    </td>

                    {/* Battery */}
                    <td>
                      <div className="battery-meter-container">
                        <div className="battery-value">
                          {getBatteryIcon(esl.battery)}
                          <span>{esl.battery}%</span>
                        </div>
                        <div className="battery-bar-track">
                          <div 
                            className={`battery-bar-fill ${
                              esl.battery >= 70 ? 'green' : esl.battery >= 30 ? 'yellow' : 'red'
                            }`} 
                            style={{ width: `${esl.battery}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Signal */}
                    <td>
                      <div className="signal-cell" title={`Signal: ${esl.apSignal} dBm`}>
                        {esl.state === 'ONLINE' ? (
                          <>
                            <Signal size={16} className="signal-active" />
                            <span className="signal-text">{esl.apSignal || 45} dBm</span>
                          </>
                        ) : (
                          <>
                            <WifiOff size={16} className="signal-inactive" />
                            <span className="signal-text text-muted">—</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Last Update */}
                    <td className="time-cell">
                      {esl.updateTime || esl.lastCommuTime || 'Never'}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons-cell">
                        <button 
                          className="btn-table-action view-btn"
                          onClick={() => handleViewDetails(esl.priceTagCode, esl)}
                          title="View Binding Details & Screen Render"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        <button 
                          className={`btn-table-action refresh-btn ${!isAuthorized ? 'disabled' : ''}`}
                          onClick={() => handleForceRefresh(esl.priceTagCode)}
                          disabled={refreshingBarcodes[esl.priceTagCode]}
                          title={isAuthorized ? "Force Refresh & Reboot ESL" : "Admin privileges required"}
                        >
                          {refreshingBarcodes[esl.priceTagCode] ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <RefreshCw size={13} />
                          )}
                          <span>Refresh</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Premium Zkong/DragonESL Pagination */}
      {totalElements > 0 && (
        <div className="dragonesl-pagination-bar glass-card" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: '0 0 12px 12px' }}>
          <div className="pagination-left">
            <span className="pagination-total">Total {totalElements} items</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="pagination-size-select"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
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
              <span>Go to</span>
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
