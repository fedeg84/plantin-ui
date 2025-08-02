import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/endpoints';
import { Product } from '../types/api';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '../utils/cn';

interface ProductSelectorProps {
  value?: number;
  onChange: (productId: number, product?: Product) => void;
  placeholder?: string;
  error?: string;
}

export default function ProductSelector({ value, onChange, placeholder = "Seleccionar producto", error }: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', { search, size: 50 }],
    queryFn: () => productApi.find({ 
      search, 
      size: 50, 
      is_active: true,
      sort_by: 'name',
      sort_order: 'asc'
    }),
    enabled: isOpen || !!search,
  });

  // Find selected product when value changes
  useEffect(() => {
    if (value && value > 0 && products?.items) {
      const product = products.items.find(p => p.id === value);
      if (product) {
        setSelectedProduct(product);
      }
    } else if (!value || value === 0) {
      // Clear selected product when value is 0 or falsy
      setSelectedProduct(null);
    }
  }, [value, products]);

  const handleSelect = (product: Product) => {
    setSelectedProduct(product);
    onChange(product.id, product);
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
          !selectedProduct && "text-gray-500"
        )}
      >
        <span className="truncate">
          {selectedProduct ? `${selectedProduct.name}${selectedProduct.code ? ` (${selectedProduct.code})` : ''}` : placeholder}
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
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-40 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 text-center text-sm text-gray-500">Buscando...</div>
            ) : products?.items.length === 0 ? (
              <div className="p-3 text-center text-sm text-gray-500">No se encontraron productos</div>
            ) : (
              products?.items.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelect(product)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="font-medium text-sm">{product.name}</div>
                  <div className="text-xs text-gray-500">
                    {product.code && `${product.code} • `}
                    ${product.current_price.toFixed(2)} • Stock: {product.current_stock}
                  </div>
                  <div className="text-xs text-gray-400">
                    {product.type_name}
                    {product.description && ` • ${product.description}`}
                  </div>
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