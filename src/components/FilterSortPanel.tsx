import { useState } from 'react';
import { ChevronDown, Filter, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { SearchableMultiSelect } from './SearchableMultiSelect';
import { DateRangePicker } from './DateRangePicker';

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'text' | 'boolean';
  options?: Array<{ value: any; label: string }>;
  placeholder?: string;
  min?: number;
  max?: number;
  startDateKey?: string; // Para daterange
  endDateKey?: string;   // Para daterange
}

interface FilterSortPanelProps {
  // Search
  searchValue: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  
  // Filtering
  filterFields: FilterField[];
  currentFilters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
}

export const FilterSortPanel: React.FC<FilterSortPanelProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filterFields,
  currentFilters,
  onFiltersChange,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  // Count active filters
  const activeFiltersCount = Object.values(currentFilters).filter(value => 
    value !== undefined && value !== null && value !== '' && 
    (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  const clearAllFilters = () => {
    const clearedFilters = Object.keys(currentFilters).reduce((acc, key) => {
      acc[key] = undefined;
      return acc;
    }, {} as Record<string, any>);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Search and Controls Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search */}
        {onSearchChange && (
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="input pl-10 w-full"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Filter Toggle */}
          {filterFields.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "btn-secondary flex items-center text-sm",
                activeFiltersCount > 0 && "bg-primary-50 text-primary-600 border-primary-300"
              )}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="ml-1 bg-primary-600 text-white text-xs rounded-full px-1.5 py-0.5">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && filterFields.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Filtros</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar todos
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterFields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                {/* Filter field rendering logic */}
                {field.type === 'text' && (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={currentFilters[field.key] || ''}
                    onChange={(e) => onFiltersChange({
                      ...currentFilters,
                      [field.key]: e.target.value || undefined
                    })}
                    className="input text-sm"
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    placeholder={field.placeholder}
                    value={currentFilters[field.key] || ''}
                    min={field.min}
                    max={field.max}
                    onChange={(e) => {
                      const newValue = e.target.value ? parseFloat(e.target.value) : undefined;
                      const newFilters = {
                        ...currentFilters,
                        [field.key]: newValue
                      };
                      console.log(`🔢 Number Change (${field.key}):`, e.target.value, '→', newValue, '→ New Filters:', newFilters);
                      onFiltersChange(newFilters);
                    }}
                    className="input text-sm"
                  />
                )}

                {field.type === 'date' && (
                  <input
                    type="date"
                    value={currentFilters[field.key] || ''}
                    onChange={(e) => onFiltersChange({
                      ...currentFilters,
                      [field.key]: e.target.value || undefined
                    })}
                    className="input text-sm"
                  />
                )}

                {field.type === 'select' && (
                  <select
                    value={currentFilters[field.key] || ''}
                    onChange={(e) => onFiltersChange({
                      ...currentFilters,
                      [field.key]: e.target.value || undefined
                    })}
                    className="input text-sm"
                  >
                    <option value="">Todos</option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'multiselect' && (
                  <SearchableMultiSelect
                    options={field.options || []}
                    selectedValues={currentFilters[field.key] || []}
                    onChange={(values) => {
                      const newFilters = {
                        ...currentFilters,
                        [field.key]: values.length > 0 ? values : undefined
                      };
                      console.log(`🏷️ MultiSelect Change (${field.key}):`, values, '→ New Filters:', newFilters);
                      onFiltersChange(newFilters);
                    }}
                    placeholder={field.placeholder || `Seleccionar ${field.label.toLowerCase()}`}
                  />
                )}

                {field.type === 'daterange' && (
                  <DateRangePicker
                    startDate={currentFilters[field.startDateKey || 'start_date']}
                    endDate={currentFilters[field.endDateKey || 'end_date']}
                    onChange={(startDate, endDate) => {
                      const newFilters = {
                        ...currentFilters,
                        [field.startDateKey || 'start_date']: startDate,
                        [field.endDateKey || 'end_date']: endDate
                      };
                      console.log(`📅 DateRange Change:`, { startDate, endDate }, '→ New Filters:', newFilters);
                      onFiltersChange(newFilters);
                    }}
                    placeholder={field.placeholder || "Seleccionar rango de fechas"}
                  />
                )}

                {field.type === 'boolean' && (
                  <select
                    value={currentFilters[field.key] !== undefined ? String(currentFilters[field.key]) : ''}
                    onChange={(e) => onFiltersChange({
                      ...currentFilters,
                      [field.key]: e.target.value === '' ? undefined : e.target.value === 'true'
                    })}
                    className="input text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 