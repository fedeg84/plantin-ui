import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentMethodApi } from '../api/endpoints';
import { PaymentMethod } from '../types/api';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '../utils/cn';

interface PaymentMethodSelectorProps {
  value?: number;
  onChange: (paymentMethodId: number, paymentMethod?: PaymentMethod) => void;
  placeholder?: string;
  error?: string;
}

export default function PaymentMethodSelector({ value, onChange, placeholder = "Seleccionar método de pago", error }: PaymentMethodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ['payment-methods', { search, size: 50 }],
    queryFn: () => paymentMethodApi.find({ 
      search, 
      size: 50, 
      is_active: true,
      sort_by: 'name',
      sort_order: 'asc'
    }),
    enabled: isOpen || !!search,
  });

  // Query to get the selected payment method details
  const { data: selectedPaymentMethodData } = useQuery({
    queryKey: ['payment-method', value],
    queryFn: () => paymentMethodApi.getById(value!),
    enabled: !!value,
  });

  // Find selected payment method when value changes
  useEffect(() => {
    if (value) {
      if (selectedPaymentMethodData && selectedPaymentMethodData.is_active) {
        // Solo mostrar si el método está activo
        setSelectedPaymentMethod(selectedPaymentMethodData);
      } else if (selectedPaymentMethodData && !selectedPaymentMethodData.is_active) {
        // Si el método está inactivo, limpiar la selección
        setSelectedPaymentMethod(null);
        onChange(0, undefined);
      }
    } else {
      setSelectedPaymentMethod(null);
    }
  }, [value, selectedPaymentMethodData, onChange]);

  const handleSelect = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    onChange(paymentMethod.id, paymentMethod);
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
          !selectedPaymentMethod && "text-gray-500"
        )}
      >
        <span className="truncate">
          {selectedPaymentMethod ? (
            <span>
              {selectedPaymentMethod.name}
              {(selectedPaymentMethod.discount ?? 0) > 0 && (
                <span className="text-green-600 ml-1">(-{selectedPaymentMethod.discount}%)</span>
              )}
            </span>
          ) : placeholder}
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
                placeholder="Buscar métodos de pago..."
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
            ) : paymentMethods?.items.length === 0 ? (
              <div className="p-3 text-center text-sm text-gray-500">No se encontraron métodos de pago</div>
            ) : (
              paymentMethods?.items.map((paymentMethod) => (
                <button
                  key={paymentMethod.id}
                  type="button"
                  onClick={() => handleSelect(paymentMethod)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{paymentMethod.name}</span>
                    {(paymentMethod.discount ?? 0) > 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        -{paymentMethod.discount}%
                      </span>
                    )}
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