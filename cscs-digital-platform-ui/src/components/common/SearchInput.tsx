import React from 'react';
import { Search, X } from 'lucide-react';
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
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
        <input
          type="text"
          placeholder={t(placeholder, placeholderAr)}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', textAlign: language === 'ar' ? 'right' : 'left' }}
        />
        {value && (
          <button type="button" className="search-clear-btn" onClick={() => onChange('')} style={{ position: 'absolute', right: '4px' }}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
