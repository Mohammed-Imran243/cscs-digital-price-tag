const fs = require('fs');

const componentCode = `import React, { useState, useRef, useEffect } from 'react';
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
            {loading ? 'Loading...' : selected ? \`\${selected.storeName} \${selected.externalStoreId ? '(' + selected.externalStoreId + ')' : ''}\` : 'Select a Store... / اختر متجراً...'}
          </span>
        </div>
        <ChevronDown size={16} className={\`chevron \${isOpen ? 'open' : ''}\`} />
      </button>

      {isOpen && !loading && (
        <div className="selector-dropdown glass-card">
          <div 
            className={\`selector-option \${!selectedStore ? 'selected' : ''}\`}
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
              className={\`selector-option \${selectedStore === store.storeId ? 'selected' : ''}\`}
              onClick={() => {
                onSelect(store.storeId);
                setIsOpen(false);
              }}
            >
              <div className="option-content">
                <StoreIcon size={14} className="store-option-icon" />
                <span className="option-text">
                  {store.storeName} {store.externalStoreId ? \`(\${store.externalStoreId})\` : ''}
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
`;

fs.writeFileSync('src/components/common/StoreSelector.tsx', componentCode);

const cssCode = `
/* Custom Store Selector UI */
.custom-store-selector {
  position: relative;
  min-width: var(--store-selector-width);
  height: var(--toolbar-control-height, 44px);
  z-index: 100;
}

.custom-store-selector .selector-button {
  width: 100%;
  height: 100%;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 8px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  font-size: 13px;
}

.custom-store-selector .selector-button:hover {
  border-color: var(--primary-color);
}

.custom-store-selector .selector-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0; /* Important for text truncation */
}

.custom-store-selector .chevron {
  color: var(--text-muted);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.custom-store-selector .chevron.open {
  transform: rotate(180deg);
}

.custom-store-selector .selector-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 250px;
  overflow-y: auto;
  background: var(--card-bg, #ffffff);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 4px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.custom-store-selector .selector-option {
  padding: 10px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background-color 0.2s;
}

.custom-store-selector .selector-option:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.dark-theme .custom-store-selector .selector-option:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.custom-store-selector .selector-option.selected {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--primary-color);
  font-weight: 500;
}

.custom-store-selector .option-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-store-selector .store-option-icon {
  color: var(--text-muted);
}

.custom-store-selector .selector-option.selected .store-option-icon {
  color: var(--primary-color);
}

.custom-store-selector .check-icon {
  color: var(--primary-color);
}
`;

let themeCss = fs.readFileSync('src/styles/theme.css', 'utf8');
if (!themeCss.includes('.custom-store-selector')) {
  themeCss += '\n' + cssCode;
  fs.writeFileSync('src/styles/theme.css', themeCss);
}

console.log('Created StoreSelector component and added CSS');
