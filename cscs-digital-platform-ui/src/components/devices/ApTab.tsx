import React from 'react';

import { Cpu, Copy, Check, Plus } from 'lucide-react';
import type { ApDevice } from '../../services/deviceService';
import { getPaginationRange } from '../../utils/paginationUtils';
import { DataTable, PagePagination, StatusBadge } from '../common';
import { useLanguage } from '../../context/LanguageContext';

interface ApTabProps {
  apDevices: ApDevice[];
  page: number;
  pageSize: number;
  totalElements: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  copyToClipboard: (text: string) => void;
  copiedId: string | null;
  onAddAp: () => void; // NEW — triggers add AP modal from parent
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
  onAddAp,
}) => {
  const { t } = useLanguage();
  const totalPages = Math.ceil(totalElements / pageSize) || 1;

  return (
    <div className="table-card glass-card animate-fade-in">

      <DataTable
        loading={false}
        data={apDevices}
        emptyIcon={<Cpu size={36} />}
        emptyTitle="No AP Base Stations registered in this store context."
        emptyTitleAr="لا توجد محطات بث مسجلة في هذا المتجر."
        columns={[
          {
            key: 'mac',
            header: 'Base Station MAC',
            headerAr: 'عنوان MAC للمحطة',
            render: (ap: ApDevice) => (
              <div className="barcode-cell font-mono">
                <span>{ap.mac}</span>
                <button 
                  className="copy-btn" 
                  onClick={() => copyToClipboard(ap.mac)}
                  title={t('Copy MAC Address', 'نسخ عنوان MAC')}
                >
                  {copiedId === ap.mac ? <Check size={14} className="copied" /> : <Copy size={14} />}
                </button>
              </div>
            )
          },
          {
            key: 'apName',
            header: 'AP Name',
            headerAr: 'اسم المحطة',
            render: (ap: ApDevice) => (
              <span className="ap-name-label">{ap.apName || t('Unregistered Station', 'محطة غير مسجلة')}</span>
            )
          },
          {
            key: 'model',
            header: 'Model / SN',
            headerAr: 'الطراز / الرقم التسلسلي',
            render: (ap: ApDevice) => (
              <div className="model-cell">
                <span className="model-badge">{ap.model || 'ZAP-CM'}</span>
              </div>
            )
          },
          {
            key: 'ip',
            header: 'IP Address',
            headerAr: 'عنوان IP',
            render: (ap: ApDevice) => (
              <span className="font-mono ip-cell">{ap.ip || '192.168.1.100'}</span>
            )
          },
          {
            key: 'connections',
            header: 'Connections',
            headerAr: 'الاتصالات',
            render: (ap: ApDevice) => (
              <div className="connections-badge" style={{ justifyContent: 'center' }}>
                <span className="count">{ap.eslCount}</span>
                <span className="label">{t('ESLs', 'شاشات')}</span>
              </div>
            )
          },
          {
            key: 'status',
            header: 'Status',
            headerAr: 'الحالة',
            render: (ap: ApDevice) => (
              <StatusBadge
                status={ap.online === 'ONLINE' ? 'ACTIVE' : ap.online === 'UPGRADING' ? 'WARNING' : 'INACTIVE'}
                label={ap.online === 'ONLINE' ? 'Online' : ap.online === 'UPGRADING' ? 'Upgrading' : (ap.online === 'OFFLINE' ? 'Offline' : ap.online)}
                labelAr={ap.online === 'ONLINE' ? 'متصل' : ap.online === 'UPGRADING' ? 'جاري الترقية' : (ap.online === 'OFFLINE' ? 'غير متصل' : ap.online)}
              />
            )
          },
          {
            key: 'firmware',
            header: 'Firmware Version',
            headerAr: 'إصدار البرمجيات',
            render: (ap: ApDevice) => (
              <span className="firmware-cell">{ap.softVersion || '3.1.017_Release'}</span>
            )
          },
          {
            key: 'lastOnline',
            header: 'Last Online Time',
            headerAr: 'آخر وقت اتصال',
            render: (ap: ApDevice) => (
              <span className="time-cell">{ap.joinTime || t('N/A', 'غير متوفر')}</span>
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
