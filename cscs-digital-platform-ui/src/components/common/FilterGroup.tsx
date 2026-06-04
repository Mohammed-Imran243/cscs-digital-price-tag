import React from 'react';

interface FilterGroupProps {
  children: React.ReactNode;
}

export const FilterGroup: React.FC<FilterGroupProps> = ({ children }) => {
  return (
    <div className="filter-group" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
      {children}
    </div>
  );
};
