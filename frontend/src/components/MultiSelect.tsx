import { useState, useRef, useEffect } from 'react';
import '../styles/MultiSelect.css';

interface MultiSelectProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({ label, options, value, onChange, placeholder = 'Select...' }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter(v => v !== option)
      : [...value, option];
    onChange(newValue);
  };

  const selectAll = () => {
    onChange(options);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="multi-select" ref={containerRef}>
      <label className="multi-select__label">{label}</label>
      <div className="multi-select__trigger" onClick={() => setIsOpen(!isOpen)}>
        <span className="multi-select__value">
          {value.length === 0 && placeholder}
          {value.length > 0 && `${value.length} selected`}
        </span>
        <span className="multi-select__arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      
      {isOpen && (
        <div className="multi-select__dropdown">
          <div className="multi-select__actions">
            <button
              type="button"
              className="multi-select__action-btn"
              onClick={selectAll}
            >
              Select All
            </button>
            <button
              type="button"
              className="multi-select__action-btn"
              onClick={clearAll}
            >
              Clear
            </button>
          </div>
          <div className="multi-select__options">
            {options.map((option) => (
              <label key={option} className="multi-select__option">
                <input
                  type="checkbox"
                  checked={value.includes(option)}
                  onChange={() => toggleOption(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
