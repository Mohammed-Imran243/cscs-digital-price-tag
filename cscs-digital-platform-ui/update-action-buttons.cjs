const fs = require('fs');

const content = `import React from 'react';
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
          <Trash2 />
          <div className="btn-label">
            <span>Delete All</span>
            <span>حذف الكل</span>
          </div>
        </button>
      )}

      {onDeleteSelected && (
        <button 
          className="btn-action btn-action-delete" 
          disabled={loading}
          onClick={onDeleteSelected}
        >
          <Trash2 />
          <div className="btn-label">
            <span>{isSelectMode ? 'Confirm Delete' : 'Delete Selected'}</span>
            <span>{isSelectMode ? 'تأكيد الحذف' : 'حذف المحدد'}</span>
          </div>
        </button>
      )}

      {isSelectMode && onCancelSelectMode && (
        <button 
          className="btn-action btn-action-slate" 
          onClick={onCancelSelectMode}
        >
          <div className="btn-label">
            <span>Cancel</span>
            <span>إلغاء</span>
          </div>
        </button>
      )}
      
      {onBatchBind && (
        <button className="btn-action btn-action-batch" onClick={onBatchBind} disabled={loading}>
          <ListChecks />
          <div className="btn-label">
            <span>Batch Bind</span>
            <span>ربط مجمع</span>
          </div>
        </button>
      )}

      {onUnbind && (
        <button className="btn-action btn-action-unbind" onClick={onUnbind} disabled={loading}>
          <Unlink />
          <div className="btn-label">
            <span>Unbind</span>
            <span>فك الارتباط</span>
          </div>
        </button>
      )}

      {onBind && (
        <button className="btn-action btn-action-bind" onClick={onBind} disabled={loading}>
          <Link />
          <div className="btn-label">
            <span>Bind</span>
            <span>ربط</span>
          </div>
        </button>
      )}

      {onFilter && (
        <button className="btn-action btn-action-filter" onClick={onFilter} disabled={loading}>
          <Filter />
          <div className="btn-label">
            <span>Filter</span>
            <span>تصفية</span>
          </div>
        </button>
      )}

      {onRefresh && (
        <button className="btn-action btn-action-refresh" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={loading ? 'spinning' : ''} />
          <div className="btn-label">
            <span>Refresh</span>
            <span>تحديث</span>
          </div>
        </button>
      )}

      {onImport && (
        <button className="btn-action btn-action-import" onClick={onImport} disabled={loading}>
          <Upload />
          <div className="btn-label">
            <span>Import</span>
            <span>استيراد</span>
          </div>
        </button>
      )}

      {onExport && (
        <button className="btn-action btn-action-export" onClick={onExport} disabled={loading}>
          <Download />
          <div className="btn-label">
            <span>Export</span>
            <span>تصدير</span>
          </div>
        </button>
      )}

      {onAdd && (
        <button className="btn-action btn-action-add" onClick={onAdd} disabled={loading}>
          <Plus />
          <div className="btn-label">
            <span>{addLabel}</span>
            <span>{addLabelAr}</span>
          </div>
        </button>
      )}

      {children}
    </div>
  );
};
`;

fs.writeFileSync('src/components/common/ActionButtons.tsx', content);
