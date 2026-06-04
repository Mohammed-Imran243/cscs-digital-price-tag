import React from 'react';

interface PageToolbarProps {
  children: React.ReactNode;
}

export const PageToolbar: React.FC<PageToolbarProps> = ({ children }) => {
  return (
    <div className="page-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'nowrap', overflowX: 'visible' }}>
      {children}
    </div>
  );
};
