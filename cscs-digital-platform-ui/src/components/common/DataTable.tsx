import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface ColumnDef<T> {
  key: string;
  header: string | React.ReactNode;
  headerAr?: string | React.ReactNode;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyTitleAr?: string;
  emptySubtitle?: string;
  emptySubtitleAr?: string;
  emptyAction?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyIcon,
  emptyTitle = 'No Items Found',
  emptyTitleAr = 'لم يتم العثور على عناصر',
  emptySubtitle,
  emptySubtitleAr,
  emptyAction
}: DataTableProps<T>) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="table-loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-color)', marginBottom: '16px' }} />
        <p>{t('Loading data...', 'جاري تحميل البيانات...')}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-empty-state glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px', textAlign: 'center' }}>
        {emptyIcon && <div style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{emptyIcon}</div>}
        <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--text-primary)' }}>{t(emptyTitle, emptyTitleAr)}</h3>
        {emptySubtitle && <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{t(emptySubtitle, emptySubtitleAr || emptySubtitle)}</p>}
        {emptyAction && <div>{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="table-container" style={{ overflowX: 'auto', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
      <table className="glass-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={col.key || index} style={{ width: col.width, padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {col.headerAr ? (typeof col.header === 'string' && typeof col.headerAr === 'string' ? t(col.header, col.headerAr) : col.header) : col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' }}>
              {columns.map((col, colIndex) => (
                <td key={`${rowIndex}-${colIndex}`} style={{ padding: '16px', color: 'var(--text-primary)', fontSize: '14px' }}>
                  {col.render ? col.render(row) : String((row as any)[col.key] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
