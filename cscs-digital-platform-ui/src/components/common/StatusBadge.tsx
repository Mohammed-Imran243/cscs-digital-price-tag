import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export type BadgeStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'DEFAULT';

interface StatusBadgeProps {
  status: string;
  type?: BadgeStatus;
  label?: string;
  labelAr?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type, label, labelAr }) => {
  const { t } = useLanguage();
  
  let badgeType = type || 'DEFAULT';
  if (!type) {
    const s = status.toUpperCase();
    if (s === 'ACTIVE' || s === 'SUCCESS' || s === 'ENABLED' || s === 'NORMAL') badgeType = 'ACTIVE';
    else if (s === 'INACTIVE' || s === 'DISABLED') badgeType = 'INACTIVE';
    else if (s === 'ERROR' || s === 'FAILED') badgeType = 'ERROR';
    else if (s === 'WARNING') badgeType = 'WARNING';
    else if (s === 'PENDING') badgeType = 'PENDING';
  }

  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'ACTIVE':
      case 'SUCCESS':
        return { background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-color)' };
      case 'INACTIVE':
        return { background: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)' };
      case 'ERROR':
        return { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger-color)' };
      case 'WARNING':
        return { background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning-color)' };
      case 'PENDING':
        return { background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary-color)' };
      default:
        return { background: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)' };
    }
  };

  return (
    <div style={{
      ...getBadgeStyle(),
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      display: 'inline-block'
    }}>
      {label && labelAr ? t(label, labelAr) : status}
    </div>
  );
};
