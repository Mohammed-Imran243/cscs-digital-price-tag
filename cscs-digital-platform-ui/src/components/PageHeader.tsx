import React from 'react';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  titleAr: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, titleAr, actions }) => {
  return (
    <div className="page-header-container">
      <div className="page-header-title">
        <h2>{title} / {titleAr}</h2>
      </div>
      {actions && (
        <div className="page-header-actions">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
