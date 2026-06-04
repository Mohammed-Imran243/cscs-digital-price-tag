import React from 'react';
import { Loader, Inbox, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export type EmptyStateType = 'empty' | 'loading' | 'error';

interface EmptyStateProps {
  type?: EmptyStateType;
  message?: string;
  messageAr?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  type = 'empty', 
  message,
  messageAr
}) => {
  const { t, language } = useLanguage();

  const renderContent = () => {
    switch (type) {
      case 'loading':
        return (
          <>
            <Loader size={48} className="spinning" style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '18px', fontWeight: '500' }}>
              {message || t('Loading...', 'جاري التحميل...')}
            </h3>
          </>
        );
      case 'error':
        return (
          <>
            <AlertTriangle size={48} style={{ color: 'var(--status-danger)', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '18px', fontWeight: '500' }}>
              {message || t('Unable to load data', 'تعذر تحميل البيانات')}
            </h3>
          </>
        );
      case 'empty':
      default:
        return (
          <>
            <Inbox size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '18px', fontWeight: '500' }}>
              {message || t('No Records Found', 'لا توجد بيانات')}
            </h3>
          </>
        );
    }
  };

  return (
    <div className="empty-state-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '48px 24px',
      minHeight: '300px',
      background: 'var(--card-bg)',
      borderRadius: '12px',
      border: '1px solid var(--card-border)',
      width: '100%',
      textAlign: 'center'
    }}>
      {renderContent()}
    </div>
  );
};
