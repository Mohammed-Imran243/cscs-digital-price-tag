import React from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  placeholderAr?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder = 'Search...', placeholderAr = 'بحث...' }) => {
  const { t, language } = useLanguage();
  return (
    <div className="global-search-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', flex: 1, minWidth: '200px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
      <Search size={16} className="text-muted" />
      <input
        type="text"
        placeholder={t(placeholder, placeholderAr)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', textAlign: language === 'ar' ? 'right' : 'left' }}
      />
    </div>
  );
};
