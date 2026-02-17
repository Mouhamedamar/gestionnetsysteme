import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

/**
 * Sélection avec recherche sur le même champ.
 * options: [{ value, label }, ...]
 * value: valeur sélectionnée
 * onChange: (value, option) => void
 */
const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Rechercher ou sélectionner…',
  className = '',
  listClassName = '',
  disabled = false,
  required = false,
  'data-testid': dataTestId,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find((o) => String(o.value) === String(value));
  const rawLabel = selectedOption ? selectedOption.label : '';
  const displayValue = typeof rawLabel === 'string' || typeof rawLabel === 'number' ? String(rawLabel) : '';

  // Filtrer les options par le texte de recherche (sur le label)
  const filteredOptions = search.trim()
    ? options.filter((o) =>
        (o.label || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .includes(
            search
              .toLowerCase()
              .normalize('NFD')
              .replace(/\p{Diacritic}/gu, '')
          )
      )
    : options;

  const handleSelect = (option) => {
    onChange(option.value, option);
    setSearch('');
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    if (!open) setOpen(true);
    // Si on vide et qu'il y avait une sélection, on peut la garder ou la retirer
    if (!e.target.value.trim() && value) {
      onChange('', null);
    }
  };

  const handleFocus = () => {
    setOpen(true);
    if (displayValue) setSearch(displayValue);
    else setSearch('');
  };

  const handleBlur = () => {
    // Délai pour laisser le temps au clic sur une option de s'exécuter avant de fermer
    setTimeout(() => setOpen(false), 220);
  };

  // Utiliser mousedown au lieu de click pour que la sélection soit prise en compte
  // avant que le blur ne ferme le dropdown (évite que le clic ne soit "perdu")
  const handleOptionMouseDown = (e, option) => {
    e.preventDefault();
    e.stopPropagation();
    handleSelect(option);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const inputValue = open ? search : displayValue;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required && !value}
          data-testid={dataTestId}
          className="w-full pl-10 pr-10 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {open && (
        <ul
          className={`absolute z-50 left-0 right-0 mt-2 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl py-2 ${listClassName}`}
          role="listbox"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-4 py-4 text-slate-500 text-sm">Aucun résultat</li>
          ) : (
            filteredOptions.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={String(option.value) === String(value)}
                onMouseDown={(e) => handleOptionMouseDown(e, option)}
                className={`px-4 py-3 cursor-pointer text-sm font-medium transition-colors border-b border-slate-100 last:border-b-0 ${
                  String(option.value) === String(value)
                    ? 'bg-primary-100 text-primary-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {typeof option.label === 'string' || typeof option.label === 'number' ? option.label : String(option.label ?? '')}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect;
