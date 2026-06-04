import React from 'react';
import type { ReactNode } from 'react';
import { Plus, RefreshCw, Upload, Download, Trash2, Link, Unlink, Filter, ListChecks } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ActionButtonsProps {
  onRefresh?: () => void;
  onAdd?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onDeleteSelected?: () => void;
  onDeleteAll?: () => void;
  onBind?: () => void;
  onUnbind?: () => void;
  onBatchBind?: () => void;
  onFilter?: () => void;
  
  addLabel?: string;
  addLabelAr?: string;
  loading?: boolean;
  isSelectMode?: boolean;
  onCancelSelectMode?: () => void;
  showDeleteAll?: boolean;
  
  children?: ReactNode; // For any custom buttons
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onRefresh,
  onAdd,
  onImport,
  onExport,
  onDeleteSelected,
  onDeleteAll,
  onBind,
  onUnbind,
  onBatchBind,
  onFilter,
  addLabel = 'Add',
  addLabelAr = 'إضافة',
  loading = false,
  isSelectMode = false,
  onCancelSelectMode,
  showDeleteAll = false,
  children
}) => {
  const { t } = useLanguage();

  return (
    <div className="action-buttons" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      
      {showDeleteAll && onDeleteAll && (
        <button 
          className="btn-action btn-action-delete" 
          disabled={loading}
          onClick={onDeleteAll}
        >
          {t('Delete All', 'حذف الكل')}
        </button>
      )}

      {onDeleteSelected && (
        <button 
          className="btn-action btn-action-delete" 
          disabled={loading}
          onClick={onDeleteSelected}
        >
          <Trash2 />
          <span>{isSelectMode ? t('Confirm Delete', 'تأكيد الحذف') : t('Delete Selected', 'حذف المحدد')}</span>
        </button>
      )}

      {isSelectMode && onCancelSelectMode && (
        <button 
          className="btn-action btn-action-slate" 
          onClick={onCancelSelectMode}
        >
          {t('Cancel', 'إلغاء')}
        </button>
      )}
      
      {onBatchBind && (
        <button className="btn-action btn-action-batch" onClick={onBatchBind} disabled={loading}>
          <ListChecks /> {t('Batch Bind', 'ربط مجمع')}
        </button>
      )}

      {onUnbind && (
        <button className="btn-action btn-action-unbind" onClick={onUnbind} disabled={loading}>
          <Unlink /> {t('Unbind', 'فك الارتباط')}
        </button>
      )}

      {onBind && (
        <button className="btn-action btn-action-bind" onClick={onBind} disabled={loading}>
          <Link /> {t('Bind', 'ربط')}
        </button>
      )}

      {onFilter && (
        <button className="btn-action btn-action-filter" onClick={onFilter} disabled={loading}>
          <Filter /> {t('Filter', 'تصفية')}
        </button>
      )}

      {onRefresh && (
        <button className="btn-action btn-action-refresh" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} /> {t('Refresh', 'تحديث')}
        </button>
      )}
      
      {onImport && (
        <button className="btn-action btn-action-import" onClick={onImport} disabled={loading}>
          <Download /> {t('Import', 'استيراد')}
        </button>
      )}

      {onExport && (
        <button className="btn-action btn-action-export" onClick={onExport} disabled={loading}>
          <Upload /> {t('Export', 'تصدير')}
        </button>
      )}

      {onAdd && (
        <button className="btn-action btn-action-add" onClick={onAdd} disabled={loading}>
          <Plus /> {t(addLabel, addLabelAr)}
        </button>
      )}

      {children}
    </div>
  );
};
