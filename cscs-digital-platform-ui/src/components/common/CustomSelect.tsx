import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  placement?: 'bottom' | 'top';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select...', 
  disabled = false,
  icon,
  className = '',
  placement = 'bottom'
}) => {
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

  const selected = options.find(o => o.value === value);

  return (
    <div className={`custom-store-selector ${className}`} ref={wrapperRef}>
      <button 
        type="button"
        className="selector-button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div className="selector-content">
          {icon && <div className="text-muted" style={{ display: 'flex', alignItems: 'center' }}>{icon}</div>}
          <span className="selected-text" style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap'
          }}>
            {selected ? selected.label : placeholder}
          </span>
        </div>
        <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div 
          className="selector-dropdown glass-card"
          style={{
            top: placement === 'bottom' ? 'calc(100% + 4px)' : 'auto',
            bottom: placement === 'top' ? 'calc(100% + 4px)' : 'auto'
          }}
        >
          {options.map(option => (
            <div 
              key={option.value}
              className={`selector-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <div className="option-content">
                {option.icon && <div className="store-option-icon">{option.icon}</div>}
                <span className="option-text">{option.label}</span>
              </div>
              {value === option.value && <Check size={16} className="check-icon" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
