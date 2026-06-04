import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface CardGridLayoutProps {
  children: React.ReactNode;
  loading?: boolean;
  isEmpty?: boolean;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyTitleAr?: string;
  emptySubtitle?: string;
  emptySubtitleAr?: string;
  emptyAction?: React.ReactNode;
}

export const CardGridLayout: React.FC<CardGridLayoutProps> = ({
  children,
  loading,
  isEmpty,
  emptyIcon,
  emptyTitle = 'No Items Found',
  emptyTitleAr = 'لم يتم العثور على عناصر',
  emptySubtitle,
  emptySubtitleAr,
  emptyAction
}) => {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="stores-loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-color)', marginBottom: '16px' }} />
        <p>{t('Loading data...', 'جاري تحميل البيانات...')}</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="stores-empty-state glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px', textAlign: 'center' }}>
        {emptyIcon && <div style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{emptyIcon}</div>}
        <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--text-primary)' }}>{t(emptyTitle, emptyTitleAr)}</h3>
        {emptySubtitle && <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{t(emptySubtitle, emptySubtitleAr || emptySubtitle)}</p>}
        {emptyAction && <div>{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="stores-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
      {children}
    </div>
  );
};
