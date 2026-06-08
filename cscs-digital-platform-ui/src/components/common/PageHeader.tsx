import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface PageHeaderProps {
  title: string;
  titleAr: string;
  breadcrumbs?: { label: string; labelAr: string; onClick?: () => void }[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, titleAr, breadcrumbs }) => {
  const { t } = useLanguage();
  return (
    <div className="page-header-container" style={{ marginBottom: '16px' }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="breadcrumbs" style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <span 
                style={{ cursor: crumb.onClick ? 'pointer' : 'default', color: crumb.onClick ? 'var(--primary-color)' : 'inherit' }}
                onClick={crumb.onClick}
              >
                {t(crumb.label, crumb.labelAr)}
              </span>
              {index < breadcrumbs.length - 1 && <span>/</span>}
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="page-header-title">
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{title}{titleAr ? ` / ${titleAr}` : ''}</h2>
      </div>
    </div>
  );
};
