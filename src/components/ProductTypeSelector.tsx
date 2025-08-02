import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productTypeApi } from '../api/endpoints';
import { ProductType } from '../types/api';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '../utils/cn';

interface ProductTypeSelectorProps {
  value?: number;
  onChange: (productTypeId: number, productType?: ProductType) => void;
  placeholder?: string;
  error?: string;
}

export default function ProductTypeSelector({ value, onChange, placeholder = "Seleccionar tipo de producto", error }: ProductTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);

  const { data: productTypes, isLoading } = useQuery({
    queryKey: ['product-types', { search, size: 50 }],
    queryFn: () => productTypeApi.find({ 
      search, 
      size: 50,
      sort_by: 'name',
      sort_order: 'asc'
    }),
    enabled: isOpen || !!search,
  });

  // Find selected product type when value changes
  useEffect(() => {
    if (value && value > 0 && productTypes?.items) {
      const productType = productTypes.items.find(pt => pt.id === value);
      if (productType) {
        setSelectedProductType(productType);
      }
    } else if (!value || value === 0) {
      // Clear selected product type when value is 0 or falsy
      setSelectedProductType(null);
    }
  }, [value, productTypes]);

  const handleSelect = (productType: ProductType) => {
    setSelectedProductType(productType);
    onChange(productType.id, productType);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "input w-full text-left flex items-center justify-between",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500",
          isOpen && "ring-2 ring-primary-500 border-primary-500"
        )}
      >
        <span className="truncate">
          {selectedProductType ? (
            <span>
              {selectedProductType.name}
              {selectedProductType.description && (
                <span className="text-gray-500 ml-1">- {selectedProductType.description}</span>
              )}
            </span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-400 transition-transform",
          isOpen && "transform rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar tipos de producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>
          </div>

          <div className="py-1">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-gray-500">Cargando...</div>
            ) : productTypes?.items.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No se encontraron tipos de producto</div>
            ) : (
              productTypes?.items.map((productType) => (
                <button
                  key={productType.id}
                  type="button"
                  onClick={() => handleSelect(productType)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
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
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
} 