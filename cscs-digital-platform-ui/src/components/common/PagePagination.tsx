import React from 'react';
import { getPaginationRange } from '../../utils/paginationUtils';
import { useLanguage } from '../../context/LanguageContext';
import { CustomSelect } from './CustomSelect';

interface PagePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const PagePagination: React.FC<PagePaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange
}) => {
  const { t } = useLanguage();

  if (totalCount === 0) return null;

  return (
    <div className="dragonesl-pagination-bar glass-card" style={{ marginTop: '24px' }}>
      <div className="pagination-left">
        <span className="pagination-total">{t(`Total ${totalCount} items`, `الإجمالي ${totalCount} عناصر`)}</span>
        <CustomSelect
          value={pageSize}
          onChange={(val) => onPageSizeChange(Number(val))}
          placement="top"
          options={[
            { value: 5, label: `5 ${t('/ page', '/ للصفحة')}` },
            { value: 10, label: `10 ${t('/ page', '/ للصفحة')}` },
            { value: 20, label: `20 ${t('/ page', '/ للصفحة')}` },
            { value: 50, label: `50 ${t('/ page', '/ للصفحة')}` },
            { value: 100, label: `100 ${t('/ page', '/ للصفحة')}` }
          ]}
        />
      </div>

      <div className="pagination-right">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          className="pagination-arrow-btn"
        >
          &lt;
        </button>

        {getPaginationRange(currentPage, totalPages, 1).map((pageNum, idx) => (
          pageNum === '...' ? (
            <span key={`dots-${idx}`} className="pagination-dots">...</span>
          ) : (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(Number(pageNum))}
              className={`pagination-num-btn ${currentPage === pageNum ? 'active' : ''}`}
            >
              {pageNum}
            </button>
          )
        ))}

        <button
          type="button"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          className="pagination-arrow-btn"
        >
          &gt;
        </button>

        <div className="pagination-jump">
          <span>{t('Go to', 'الذهاب إلى')}</span>
          <input
            type="number"
            min={1}
            max={totalPages || 1}
            value={currentPage}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val >= 1 && val <= totalPages) {
                onPageChange(val);
              }
            }}
            className="pagination-jump-input"
          />
        </div>
      </div>
    </div>
  );
};
