import React, { useState, useRef, useEffect } from 'react';
import { Store as StoreIcon, ChevronDown, Check } from 'lucide-react';

interface Store {
  storeId: string;
  storeName: string;
  externalStoreId?: string;
}

interface StoreSelectorProps {
  stores: Store[];
  selectedStore: string;
  onSelect: (storeId: string) => void;
  loading?: boolean;
}

export const StoreSelector: React.FC<StoreSelectorProps> = ({ stores, selectedStore, onSelect, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selected = stores.find(s => s.storeId === selectedStore);

  return (
    <div className="custom-store-selector" ref={wrapperRef}>
      <button 
        className="selector-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
      >
        <div className="selector-content">
          <StoreIcon size={16} className="text-muted" />
          <span className="selected-text" style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap'
          }}>
            {loading ? 'Loading...' : selected ? `${selected.storeName} ${selected.externalStoreId ? '(' + selected.externalStoreId + ')' : ''}` : 'Select a Store... / اختر متجراً...'}
          </span>
        </div>
        <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && !loading && (
        <div className="selector-dropdown glass-card">
          <div 
            className={`selector-option ${!selectedStore ? 'selected' : ''}`}
            onClick={() => {
              onSelect('');
              setIsOpen(false);
            }}
          >
            <div className="option-content">
              <span className="option-text">Select a Store... / اختر متجراً...</span>
            </div>
            {!selectedStore && <Check size={16} className="check-icon" />}
          </div>
          
          {stores.map(store => (
            <div 
              key={store.storeId}
              className={`selector-option ${selectedStore === store.storeId ? 'selected' : ''}`}
              onClick={() => {
                onSelect(store.storeId);
                setIsOpen(false);
              }}
            >
              <div className="option-content">
                <StoreIcon size={14} className="store-option-icon" />
                <span className="option-text">
                  {store.storeName} {store.externalStoreId ? `(${store.externalStoreId})` : ''}
                </span>
              </div>
              {selectedStore === store.storeId && <Check size={16} className="check-icon" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
