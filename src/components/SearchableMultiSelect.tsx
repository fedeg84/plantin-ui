import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { cn } from '../utils/cn';

interface Option {
  value: any;
  label: string;
}

interface SearchableMultiSelectProps {
  options: Option[];
  selectedValues: any[];
  onChange: (values: any[]) => void;
  placeholder?: string;
  className?: string;
}

export const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Seleccionar...",
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar opciones basado en la búsqueda
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener labels de valores seleccionados
  const selectedLabels = selectedValues.map(value => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  });

  // Manejar selección/deselección
  const handleToggleOption = (value: any) => {
    const isSelected = selectedValues.includes(value);
    if (isSelected) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  // Remover una opción seleccionada
  const handleRemoveOption = (value: any) => {
    onChange(selectedValues.filter(v => v !== value));
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full input text-left flex items-center justify-between min-h-[38px]"
      >
        <div className="flex-1 flex flex-wrap gap-1">
          {selectedValues.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            selectedLabels.map((label, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-md"
              >
                {label}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveOption(selectedValues[index]);
                  }}
                  className="ml-1 hover:text-primary-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-400 transition-transform",
          isOpen && "transform rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No se encontraron opciones
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggleOption(option.value)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between",
                      isSelected && "bg-primary-50 text-primary-600"
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 