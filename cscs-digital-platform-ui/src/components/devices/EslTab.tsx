import React from 'react';

import { Smartphone, Copy, Check, Eye, RefreshCw, Loader2, Signal, WifiOff } from 'lucide-react';
import type { EslDevice } from '../../services/deviceService';
import { getPaginationRange } from '../../utils/paginationUtils';
import { DataTable, PagePagination, StatusBadge } from '../common';
import { useLanguage } from '../../context/LanguageContext';

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
  const { t } = useLanguage();
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
      <DataTable
        loading={false}
        data={eslDevices}
        emptyIcon={<Smartphone size={36} />}
        emptyTitle="No ESL devices registered in this store context."
        emptyTitleAr="لا توجد أجهزة شاشات مسجلة في هذا المتجر."
        columns={[
          {
            key: 'selection',
            header: <input 
              type="checkbox" 
              className="custom-checkbox"
              checked={eslDevices.length > 0 && selectedBarcodes.length === eslDevices.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />,
            headerAr: <input 
              type="checkbox" 
              className="custom-checkbox"
              checked={eslDevices.length > 0 && selectedBarcodes.length === eslDevices.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />,
            render: (esl: EslDevice) => (
              <input 
                type="checkbox" 
                className="custom-checkbox"
                checked={selectedBarcodes.includes(esl.priceTagCode)}
                onChange={() => handleSelectRow(esl.priceTagCode)}
              />
            )
          },
          {
            key: 'barcode',
            header: 'ESL Barcode',
            headerAr: 'باركود الشاشة',
            render: (esl: EslDevice) => (
              <div className="barcode-cell font-mono">
                <span>{esl.priceTagCode}</span>
                <button 
                  className="copy-btn" 
                  onClick={() => copyToClipboard(esl.priceTagCode)}
                  title={t('Copy Barcode', 'نسخ الباركود')}
                >
                  {copiedId === esl.priceTagCode ? <Check size={14} className="copied" /> : <Copy size={14} />}
                </button>
              </div>
            )
          },
          {
            key: 'model',
            header: 'OEM Model',
            headerAr: 'طراز الجهاز',
            render: (esl: EslDevice) => <span className="model-badge">{esl.oemModel || 'ZKC21S'}</span>
          },
          {
            key: 'boundProduct',
            header: 'Bound Product',
            headerAr: 'المنتج المرتبط',
            render: (esl: EslDevice) => esl.bindState === 1 && esl.itemBarCode ? (
              <div className="bound-product-info">
                <span className="product-title">{esl.itemTitle || t('Unnamed Product', 'منتج غير مسمى')}</span>
                <span className="product-barcode font-mono">{esl.itemBarCode}</span>
              </div>
            ) : (
              <span className="unbound-badge">{t('Unbound / Idle', 'غير مرتبط / خامل')}</span>
            )
          },
          {
            key: 'status',
            header: 'Status',
            headerAr: 'الحالة',
            render: (esl: EslDevice) => (
              <StatusBadge
                status={esl.state === 'ONLINE' ? 'ACTIVE' : 'INACTIVE'}
                label={esl.state === 'ONLINE' ? 'Online' : (esl.state === 'OFFLINE' ? 'Offline' : esl.state)}
                labelAr={esl.state === 'ONLINE' ? 'متصل' : (esl.state === 'OFFLINE' ? 'غير متصل' : esl.state)}
              />
            )
          },
          {
            key: 'battery',
            header: 'Battery',
            headerAr: 'البطارية',
            render: (esl: EslDevice) => (
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
            )
          },
          {
            key: 'signal',
            header: 'Signal',
            headerAr: 'الإشارة',
            render: (esl: EslDevice) => (
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
            )
          },
          {
            key: 'lastUpdate',
            header: 'Last Update',
            headerAr: 'آخر تحديث',
            render: (esl: EslDevice) => esl.updateTime || esl.lastCommuTime || t('Never', 'أبداً')
          },
          {
            key: 'actions',
            header: 'Operation',
            headerAr: 'الإجراءات',
            render: (esl: EslDevice) => (
              <div className="action-buttons-cell">
                <button 
                  className="btn-table-action view-btn"
                  onClick={() => handleViewDetails(esl.priceTagCode, esl)}
                  title={t('View Binding Details & Screen Render', 'عرض تفاصيل الربط ومعاينة الشاشة')}
                >
                  <Eye size={16} />
                </button>
                <button 
                  className={`btn-table-action refresh-btn ${!isAuthorized ? 'disabled' : ''}`}
                  onClick={() => handleForceRefresh(esl.priceTagCode)}
                  disabled={refreshingBarcodes[esl.priceTagCode]}
                  title={isAuthorized ? t("Force Refresh & Reboot ESL", "تحديث إجباري وإعادة تشغيل الشاشة") : t("Admin privileges required", "مطلوب صلاحيات المسؤول")}
                >
                  {refreshingBarcodes[esl.priceTagCode] ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                </button>
              </div>
            )
          }
        ]}
      />

      {totalElements > 0 && (
        <PagePagination
          currentPage={page + 1}
          totalPages={totalPages}
          totalCount={totalElements}
          pageSize={pageSize}
          onPageChange={(p) => setPage(p - 1)}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(0);
          }}
        />
      )}
    </div>
  );
};
