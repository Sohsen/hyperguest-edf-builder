import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

interface Option {
  label: string;
  value: string;
  searchKeys?: string[];
}

interface SearchableMultiSelectProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  label: string;
  isMobile?: boolean;
  staticMode?: boolean;
}

export const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({ 
  options, 
  selectedValues, 
  onChange, 
  placeholder, 
  label,
  isMobile = false,
  staticMode = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredOptions = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase().trim();
    if (!term) return options || [];

    return (options || [])
      .map(opt => {
        let score = 0;
        const label = (opt.label || '').toLowerCase();
        const value = (opt.value || '').toLowerCase();
        const keys = (opt.searchKeys || []).map(k => k.toLowerCase());

        // Exact matches
        if (value === term) score += 100;
        if (label === term) score += 90;
        if (keys.includes(term)) score += 80;

        // Starts with
        if (label.startsWith(term)) score += 60;
        if (value.startsWith(term)) score += 50;
        if (keys.some(k => k.startsWith(term))) score += 40;

        // Contains
        if (label.includes(term)) score += 30;
        if (keys.some(k => k.includes(term))) score += 20;

        return { ...opt, score };
      })
      .filter(opt => opt.score > 0)
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
      .slice(0, 20); // Max 20 results
  }, [options, debouncedSearchTerm]);

  const toggleOption = (value: string) => {
    if ((selectedValues || []).includes(value)) {
      onChange((selectedValues || []).filter(v => v !== value));
    } else {
      onChange([...(selectedValues || []), value]);
    }
  };

  const removeValue = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    onChange((selectedValues || []).filter(v => v !== value));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className={`flex flex-col gap-1.5 flex-1 ${isMobile ? 'min-w-0' : 'min-w-[160px]'}`} ref={containerRef}>
      {label && <label className="text-[9px] font-bold text-hg-muted uppercase tracking-wider">{label}</label>}
      <div className="relative">
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full bg-[#11161C] border transition-all cursor-pointer flex items-center justify-between gap-2 ${
            isMobile ? 'h-[44px] rounded-[10px] px-4' : 'h-[36px] rounded-md px-3'
          } ${isOpen ? 'border-hg-accent ring-1 ring-hg-accent/20' : 'border-hg-border/50 hover:border-hg-muted/50'}`}
        >
          <div className="flex flex-wrap gap-1 flex-1 overflow-hidden">
            {(selectedValues || []).length === 0 ? (
              <span className="text-hg-muted text-[12px] opacity-50 truncate">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {(() => {
                  const selectedItems = (selectedValues || []).slice(0, isMobile ? 1 : 2);
                  const keys = selectedItems.map((val, idx) => `searchable-multi-selected-${label}-${val}-${idx}`);
                  return selectedItems.map((val, idx) => (
                    <span 
                      key={keys[idx]} 
                      className="bg-hg-accent/10 border border-hg-accent/20 text-hg-accent text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"
                    >
                      <span className="truncate max-w-[80px]">
                        {(options || []).find(o => o.value === val)?.label || val}
                      </span>
                      <X 
                        size={10} 
                        className="hover:text-white cursor-pointer" 
                        onClick={(e) => removeValue(e, val)}
                      />
                    </span>
                  ));
                })()}
                {(selectedValues || []).length > (isMobile ? 1 : 2) && (
                  <span className="text-hg-accent text-[10px] font-black px-1 flex items-center">
                    +{(selectedValues || []).length - (isMobile ? 1 : 2)}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {(selectedValues || []).length > 0 && (
              <X 
                size={12} 
                className="text-hg-muted hover:text-hg-text" 
                onClick={clearAll}
              />
            )}
            <ChevronDown 
              size={14} 
              className={`text-hg-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
          </div>
        </div>

        {isOpen && (
          <div className={`${(isMobile || !staticMode) ? 'absolute top-full' : 'relative'} left-0 right-0 mt-1 bg-hg-panel border border-hg-border rounded-md shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150`}>
            <div className="p-2 border-b border-hg-border bg-black/20">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-hg-muted" size={12} />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-hg-bg border border-hg-border rounded pl-8 pr-3 py-1.5 text-[11px] focus:outline-none focus:border-hg-accent transition-colors"
                />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto no-scrollbar py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-center flex flex-col items-center">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-3 text-hg-muted">
                    <Search size={18} />
                  </div>
                  <div className="text-[11px] font-bold text-white mb-1 uppercase tracking-tight">No results for "{searchTerm}"</div>
                  <div className="text-[9px] text-hg-muted font-medium mb-4 uppercase tracking-widest px-4">
                    Try searching by IATA code, city, region or country name.
                  </div>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="text-[10px] font-black text-hg-accent uppercase tracking-widest hover:brightness-110"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                (() => {
                  const keys = filteredOptions.map((opt, idx) => `searchable-option-${label}-${opt.value}-${idx}`);
                  return filteredOptions.map((opt, idx) => {
                    const isSelected = (selectedValues || []).includes(opt.value);
                    return (
                      <div 
                        key={keys[idx]}
                        onClick={() => toggleOption(opt.value)}
                        className={`px-3 py-2 text-[11px] cursor-pointer flex items-center justify-between transition-colors group ${isSelected ? 'bg-hg-accent/10 text-hg-accent font-bold' : 'text-hg-muted hover:bg-white/5 hover:text-hg-text'}`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected ? (
                          <Check size={12} />
                        ) : (
                          <div className="w-3 h-3 border border-hg-border rounded-[2px] group-hover:border-hg-muted" />
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>
            {(selectedValues || []).length > 0 && (
              <div className="p-1 border-t border-hg-border bg-black/10 flex justify-end">
                <button 
                  onClick={() => onChange([])}
                  className="text-[9px] font-bold uppercase text-hg-muted hover:text-hg-accent px-2 py-1 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
