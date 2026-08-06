import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productTypeApi } from '../api/endpoints';
import { ProductType } from '../types/api';
import { Plus } from 'lucide-react';
import { cn } from '../utils/cn';
import { navigateWithReturn } from '../utils/navigation';

interface ProductTypeSelectorProps {
  value?: number;
  onChange: (productTypeId: number, productType?: ProductType) => void;
  placeholder?: string;
  error?: string;
  allowNone?: boolean;
  /** Etiqueta cuando el tipo ya está cargado pero aún no está en los resultados de búsqueda */
  displayName?: string;
  showCreateOption?: boolean;
}

export default function ProductTypeSelector({
  value,
  onChange,
  placeholder = 'Buscar tipo de producto…',
  error,
  allowNone = false,
  displayName,
  showCreateOption = false,
}: ProductTypeSelectorProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasSelection = (value ?? 0) > 0;
  const isNone = allowNone && !hasSelection;

  const { data: productTypes, isLoading } = useQuery({
    queryKey: ['product-types', { search, size: 50 }],
    queryFn: () =>
      productTypeApi.find({
        search,
        size: 50,
        sort_by: 'name',
        sort_order: 'asc',
      }),
    enabled: isOpen || !!search,
  });

  useEffect(() => {
    if (value && value > 0) {
      const fromResults = productTypes?.items.find((pt) => pt.id === value);
      if (fromResults) {
        setSelectedProductType(fromResults);
      } else if (displayName) {
        setSelectedProductType({
          id: value,
          name: displayName,
          created_by_id: 0,
          created_by_username: '',
          created_at: '',
        });
      }
    } else {
      setSelectedProductType(null);
    }
  }, [value, productTypes, displayName]);

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

  const selectedLabel = hasSelection
    ? selectedProductType?.name ?? displayName ?? placeholder
    : isNone
      ? 'Sin tipo'
      : '';

  const inputValue = isOpen ? search : selectedLabel;

  const handleSelect = (productType: ProductType) => {
    setSelectedProductType(productType);
    onChange(productType.id, productType);
    setIsOpen(false);
    setSearch('');
  };

  const handleSelectNone = () => {
    setSelectedProductType(null);
    onChange(0, undefined);
    setIsOpen(false);
    setSearch('');
  };

  const handleFocus = () => {
    setIsOpen(true);
    setSearch('');
  };

  const handleInputChange = (next: string) => {
    setSearch(next);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <input
        type="text"
        value={inputValue}
        placeholder={placeholder}
        onFocus={handleFocus}
        onChange={(e) => handleInputChange(e.target.value)}
        className={cn(
          'input w-full text-base',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          isOpen && 'ring-2 ring-primary-500 border-primary-500'
        )}
      />

      {isOpen && (
        <div className="absolute z-[9999] mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden">
          <div className="max-h-48 overflow-auto py-1">
            {allowNone && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSelectNone}
                className={cn(
                  'w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
                  isNone && 'bg-primary-50'
                )}
              >
                <div className="font-medium text-sm text-gray-900">Sin tipo</div>
                <div className="text-xs text-gray-500">El producto no tendrá tipo asignado</div>
              </button>
            )}

            {isLoading ? (
              <div className="px-3 py-2 text-sm text-gray-500">Buscando…</div>
            ) : productTypes?.items.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                {search.trim() ? 'No se encontraron tipos' : 'Escribí para buscar tipos de producto'}
              </div>
            ) : (
              productTypes?.items.map((productType) => (
                <button
                  key={productType.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(productType)}
                  className={cn(
                    'w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
                    value === productType.id && 'bg-primary-50'
                  )}
                >
                  <div className="font-medium text-sm">{productType.name}</div>
                  {productType.description && (
                    <div className="text-xs text-gray-500">{productType.description}</div>
                  )}
                  {productType.parent_name && (
                    <div className="text-xs text-gray-400">Categoría: {productType.parent_name}</div>
                  )}
                </button>
              ))
            )}
          </div>

          {showCreateOption && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setIsOpen(false);
                setSearch('');
                navigateWithReturn(navigate, location, '/product-types/create');
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-t border-gray-200 text-sm font-medium text-primary-600 hover:bg-primary-50"
            >
              <Plus className="h-4 w-4" />
              Nuevo tipo de producto
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
