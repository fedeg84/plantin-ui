import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { expenseTypeApi } from '../api/endpoints';
import { ExpenseType } from '../types/api';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '../utils/cn';

interface ExpenseTypeSelectorProps {
  value?: number;
  onChange: (expenseTypeId: number, expenseType?: ExpenseType) => void;
  placeholder?: string;
  error?: string;
}

export default function ExpenseTypeSelector({ value, onChange, placeholder = "Seleccionar tipo de pago", error }: ExpenseTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedExpenseType, setSelectedExpenseType] = useState<ExpenseType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const trimmedSearch = search.trim();

  const { data: expenseTypes, isLoading, isFetching } = useQuery({
    queryKey: ['expense-types', { search: trimmedSearch, size: 50 }],
    queryFn: () => expenseTypeApi.find({
      search: trimmedSearch || undefined,
      size: 50,
      sort_by: 'name',
      sort_order: 'asc',
    }),
  });

  // Query to get the selected expense type details
  const { data: selectedExpenseTypeData } = useQuery({
    queryKey: ['expense-type', value],
    queryFn: () => expenseTypeApi.getById(value!),
    enabled: !!value,
  });

  // Find selected expense type when value changes
  useEffect(() => {
    if (value) {
      if (selectedExpenseTypeData) {
        setSelectedExpenseType(selectedExpenseTypeData);
      }
    } else {
      setSelectedExpenseType(null);
    }
  }, [value, selectedExpenseTypeData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (expenseType: ExpenseType) => {
    setSelectedExpenseType(expenseType);
    onChange(expenseType.id, expenseType);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "input w-full text-left flex items-center justify-between",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500",
          !selectedExpenseType && "text-gray-500"
        )}
      >
        <span className="truncate">
          {selectedExpenseType ? selectedExpenseType.name : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tipos de pago..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-40 overflow-y-auto">
            {isLoading || isFetching ? (
              <div className="p-3 text-center text-sm text-gray-500">Buscando...</div>
            ) : expenseTypes?.items.length === 0 ? (
              <div className="p-3 text-center text-sm text-gray-500">
                {trimmedSearch ? 'No se encontraron tipos de pago' : 'No hay tipos de pago disponibles'}
              </div>
            ) : (
              expenseTypes?.items.map((expenseType) => (
                <button
                  key={expenseType.id}
                  type="button"
                  onClick={() => handleSelect(expenseType)}
                  className={cn(
                    'w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
                    value === expenseType.id && 'bg-primary-50 text-primary-900'
                  )}
                >
                  <span className="font-medium text-sm">{expenseType.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

