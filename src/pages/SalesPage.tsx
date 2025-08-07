import { useState } from 'react';
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saleApi, productApi, paymentMethodApi } from '../api/endpoints';
import { Plus, ShoppingCart, Trash2, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductSelector from '../components/ProductSelector';
import PaymentMethodSelector from '../components/PaymentMethodSelector';
import { FilterSortPanel } from '../components/FilterSortPanel';
import { SortableTableHeader } from '../components/SortableTableHeader';
import { Product, PaymentMethod } from '../types/api';

const createSaleSchema = z.object({
  description: z.string().optional(),
  discount: z.number().min(0, 'El descuento no puede ser negativo').optional(),
  price: z.number().min(0, 'El precio no puede ser negativo').optional(),
  payment_method_id: z.number().min(1, 'El método de pago es requerido'),
  sale_items: z.array(z.object({
    product_id: z.number().min(1, 'El producto es requerido'),
    quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  })).min(1, 'Debe agregar al menos un producto'),
});

type CreateSaleForm = z.infer<typeof createSaleSchema>;

export default function SalesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState('');
  const [page] = useState(0);
  const [sortBy, setSortBy] = useState('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedProducts, setSelectedProducts] = useState<{[key: number]: Product}>({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isManualPrice, setIsManualPrice] = useState(false);
  const queryClient = useQueryClient();

  // Get filter options
  const { data: products } = useQuery({
    queryKey: ['products-filter'],
    queryFn: () => productApi.find({ size: 100, is_active: true }),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods-filter'],
    queryFn: () => paymentMethodApi.find({ size: 50, is_active: true }),
  });

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales', { search, page, sortBy, sortOrder, filters }],
    queryFn: () => {
      const queryParams = {
        search, 
        page, 
        size: 10,
        sort_by: sortBy,
        sort_order: sortOrder,
        created_by_ids: filters.created_by_ids,
        payment_method_ids: filters.payment_method_ids,
        product_ids: filters.product_ids,
        min_time: filters.min_time,
        max_time: filters.max_time,
        min_total_price: filters.min_total_price,
        max_total_price: filters.max_total_price
      };
      console.log('🔍 Sales Query Params:', queryParams);
      console.log('🎯 Current Filters State:', filters);
      return saleApi.find(queryParams);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateSaleForm>({
    resolver: zodResolver(createSaleSchema),
    defaultValues: {
      discount: 0,
      sale_items: [{ product_id: 0, quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sale_items',
  });

  const createMutation = useMutation({
    mutationFn: saleApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venta creada exitosamente');
      reset();
      setShowCreateForm(false);
    },
    onError: () => {
      toast.error('Error al crear la venta');
    },
  });

  // Calcular precio total automáticamente
  const calculateTotalPrice = () => {
    const saleItems = watch('sale_items') || [];
    let total = 0;
    
    saleItems.forEach((item: any, index: number) => {
      const product = selectedProducts[index];
      if (product && item.quantity) {
        total += product.current_price * item.quantity;
      }
    });
    
    return total;
  };

  // Actualizar descuento basado en método de pago (como porcentaje)
  const updatePaymentMethodDiscount = () => {
    if (selectedPaymentMethod?.discount) {
      setValue('discount', selectedPaymentMethod.discount);
    } else {
      setValue('discount', 0);
    }
  };

  // Calcular monto del descuento basado en porcentaje
  const calculateDiscountAmount = () => {
    const subtotal = calculateTotalPrice();
    const discountPercentage = watch('discount');
    // Manejar casos donde el descuento está vacío, es NaN, undefined o null
    const validDiscount = discountPercentage && !isNaN(discountPercentage) ? discountPercentage : 0;
    return (subtotal * validDiscount) / 100;
  };

  // Actualizar precio automáticamente si no es manual
  const updateAutomaticPrice = () => {
    if (!isManualPrice) {
      const subtotal = calculateTotalPrice();
      const discountAmount = calculateDiscountAmount();
      const finalPrice = subtotal - discountAmount;
      setValue('price', finalPrice);
    }
  };

  // Ejecutar cálculo de descuento cuando cambie método de pago o productos
  React.useEffect(() => {
    updatePaymentMethodDiscount();
  }, [selectedPaymentMethod, selectedProducts, watch('sale_items')]);

  // Ejecutar cálculo de precio cuando cambien productos, cantidades o descuento
  React.useEffect(() => {
    updateAutomaticPrice();
  }, [selectedProducts, watch('sale_items'), watch('discount')]);

  const onSubmit = (data: CreateSaleForm) => {
    // Filter out items with product_id 0 (not selected)
    const filteredSaleItems = data.sale_items.filter(item => item.product_id > 0);
    
    if (filteredSaleItems.length === 0) {
      toast.error('Debe seleccionar al menos un producto');
      return;
    }

    const submitData = {
      ...data,
      sale_items: filteredSaleItems
    };
    
    createMutation.mutate(submitData);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when clicking delete button
    if (!confirm(`¿Estás seguro de que quieres eliminar la venta #${id}?`)) {
      return;
    }

    try {
      await saleApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venta eliminada correctamente');
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error('Error al eliminar la venta');
    }
  };

  const handleRowClick = (saleId: number) => {
    // Navigate to sale detail page
    window.location.href = `/sales/${saleId}`;
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Administra las ventas de tu negocio
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Venta
        </button>
      </div>

      {/* Filters and Search */}
      <FilterSortPanel
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar ventas por producto, vendedor..."
        

        filterFields={[
          {
            key: 'payment_method_ids',
            label: 'Método de Pago',
            type: 'multiselect',
            placeholder: 'Buscar métodos de pago...',
            options: (() => {
              const pmOptions = paymentMethods?.items.map(pm => ({
                value: pm.id,
                label: pm.name
              })) || [];
              console.log('💳 Payment Methods Options:', pmOptions);
              return pmOptions;
            })()
          },
          {
            key: 'product_ids',
            label: 'Productos',
            type: 'multiselect',
            placeholder: 'Buscar productos...',
            options: (() => {
              const prodOptions = products?.items.map(product => ({
                value: product.id,
                label: product.name
              })) || [];
              console.log('📦 Products Options:', prodOptions);
              return prodOptions;
            })()
          },
          {
            key: 'date_range',
            label: 'Rango de Fechas y Horas',
            type: 'daterange',
            startDateKey: 'min_time',
            endDateKey: 'max_time',
            placeholder: 'Seleccionar rango de fechas y horas'
          },
          {
            key: 'min_total_price',
            label: 'Precio mínimo',
            type: 'number',
            placeholder: '0.00',
            min: 0
          },
          {
            key: 'max_total_price',
            label: 'Precio máximo',
            type: 'number',
            placeholder: '9999.99',
            min: 0
          }
        ]}
        currentFilters={filters}
        onFiltersChange={setFilters}
      />

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Crear Nueva Venta
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="label">Descripción</label>
                      <textarea
                        {...register('description')}
                        rows={2}
                        className="input"
                        placeholder="Descripción de la venta"
                      />
                    </div>

                    {/* Cálculo automático de precios */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <Calculator className="h-4 w-4 mr-2" />
                        Resumen de Precios
                      </h4>
                      
                                             <div className="space-y-2 text-sm">
                         <div className="flex justify-between">
                           <span>Subtotal:</span>
                           <span>${calculateTotalPrice().toFixed(2)}</span>
                         </div>
                         {calculateDiscountAmount() > 0 && (
                           <div className="flex justify-between text-green-600">
                             <span>Descuento aplicado ({(watch('discount') || 0)}%):</span>
                             <span>-${calculateDiscountAmount().toFixed(2)}</span>
                           </div>
                         )}
                         <div className="flex justify-between font-semibold text-base border-t pt-2">
                           <span>Total:</span>
                           <span>${(calculateTotalPrice() - calculateDiscountAmount()).toFixed(2)}</span>
                         </div>
                       </div>
                    </div>

                                         <div className="grid grid-cols-2 gap-4">
                                                <div>
                           <div className="flex items-center justify-between mb-1">
                             <label className="label">Descuento (%)</label>
                             {selectedPaymentMethod?.discount && (
                               <span className="text-xs text-blue-600">
                                 {selectedPaymentMethod.name}: {selectedPaymentMethod.discount}%
                               </span>
                             )}
                           </div>
                           <div className="relative">
                             <input
                               {...register('discount', { valueAsNumber: true })}
                               type="number"
                               step="0.1"
                               min="0"
                               max="100"
                               className="input pr-8"
                               placeholder="0"
                               onChange={(e) => {
                                 const value = e.target.value;
                                 // Si el campo está vacío, establecer como 0, sino parsear el valor
                                 setValue('discount', value === '' ? 0 : parseFloat(value) || 0);
                               }}
                             />
                             <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                               %
                             </span>
                           </div>
                           {errors.discount && (
                             <p className="mt-1 text-sm text-red-600">{errors.discount.message}</p>
                           )}
                           <p className="text-xs text-gray-500 mt-1">
                             Se pre-llena con % del método de pago. Opcional - deja vacío o en 0 para sin descuento.
                           </p>
                         </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label">Precio Final</label>
                          <button
                            type="button"
                            onClick={() => {
                              setIsManualPrice(!isManualPrice);
                              if (!isManualPrice) {
                                updateAutomaticPrice();
                              }
                            }}
                            className="text-xs text-primary-600 hover:text-primary-700"
                          >
                            {isManualPrice ? 'Auto' : 'Manual'}
                          </button>
                        </div>
                        <input
                          {...register('price', { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          className={`input ${isManualPrice ? '' : 'bg-gray-50'}`}
                          placeholder="0.00"
                          readOnly={!isManualPrice}
                          onChange={(e) => {
                            if (isManualPrice) {
                              setValue('price', parseFloat(e.target.value) || 0);
                            }
                          }}
                        />
                        {errors.price && (
                          <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {isManualPrice ? 'Editando manualmente' : 'Calculado automáticamente'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="label">Método de Pago *</label>
                      <PaymentMethodSelector
                        value={watch('payment_method_id')}
                        onChange={(id, paymentMethod) => {
                          setValue('payment_method_id', id);
                          setSelectedPaymentMethod(paymentMethod || null);
                        }}
                        error={errors.payment_method_id?.message}
                      />
                    </div>

                    {/* Sale Items */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="label">Productos *</label>
                        <button
                          type="button"
                          onClick={() => append({ product_id: 0, quantity: 1 })}
                          className="btn-secondary text-sm py-1 px-2"
                        >
                          Agregar Producto
                        </button>
                      </div>
                      
                      {fields.map((field, index) => (
                        <div key={field.id} className="border border-gray-200 rounded-lg p-3 mb-3">
                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-6">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Producto</label>
                                                             <ProductSelector
                                 value={watch(`sale_items.${index}.product_id`) || 0}
                                 onChange={(id, product) => {
                                   setValue(`sale_items.${index}.product_id`, id);
                                   if (product) {
                                     setSelectedProducts(prev => ({
                                       ...prev,
                                       [index]: product
                                     }));
                                   } else {
                                     // Remove product from selected products if cleared
                                     setSelectedProducts(prev => {
                                       const newState = { ...prev };
                                       delete newState[index];
                                       return newState;
                                     });
                                   }
                                 }}
                                 placeholder="Seleccionar producto"
                               />
                            </div>
                            <div className="col-span-4">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad</label>
                              <input
                                {...register(`sale_items.${index}.quantity`, { valueAsNumber: true })}
                                type="number"
                                min="1"
                                max={selectedProducts[index]?.current_stock || 9999}
                                className="input"
                                placeholder="1"
                                onChange={(e) => {
                                  setValue(`sale_items.${index}.quantity`, parseInt(e.target.value) || 1);
                                }}
                              />
                              {selectedProducts[index] && (
                                <div className="mt-1">
                                  <p className="text-xs text-gray-500">
                                    Stock disponible: {selectedProducts[index].current_stock}
                                    {selectedProducts[index] && watch(`sale_items.${index}.quantity`) && (
                                      <span className="ml-2 text-primary-600">
                                        Total: ${(selectedProducts[index].current_price * (watch(`sale_items.${index}.quantity`) || 1)).toFixed(2)}
                                      </span>
                                    )}
                                  </p>
                                  {/* Alerta de stock insuficiente */}
                                  {selectedProducts[index] && 
                                   watch(`sale_items.${index}.quantity`) && 
                                   watch(`sale_items.${index}.quantity`) > selectedProducts[index].current_stock && (
                                    <div className="flex items-center mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                      <svg className="h-4 w-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                      <span className="text-xs text-yellow-800 font-medium">
                                        ⚠️ Cuidado: En sistema figura que no hay más existencia 
                                        (Stock: {selectedProducts[index].current_stock}, 
                                        Solicitado: {watch(`sale_items.${index}.quantity`)})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="col-span-2 flex items-end">
                              {fields.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="btn-secondary p-2 text-red-600 hover:text-red-700 w-full"
                                  title="Eliminar producto"
                                >
                                  <Trash2 className="h-4 w-4 mx-auto" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {errors.sale_items && (
                        <p className="mt-1 text-sm text-red-600">{errors.sale_items.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="btn-primary sm:ml-3 sm:w-auto w-full disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Creando...' : 'Crear Venta'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn-secondary sm:w-auto w-full mt-3 sm:mt-0"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sales List */}
      <div className="bg-white shadow rounded-lg">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando ventas...</p>
          </div>
        ) : sales?.items.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin ventas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza registrando tu primera venta.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortableTableHeader
                    field="id"
                    currentSort={sortBy}
                    currentSortOrder={sortOrder}
                    onSortChange={(field, order) => {
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                  >
                    ID
                  </SortableTableHeader>
                  <SortableTableHeader
                    field="time"
                    currentSort={sortBy}
                    currentSortOrder={sortOrder}
                    onSortChange={(field, order) => {
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                  >
                    Fecha
                  </SortableTableHeader>
                  <SortableTableHeader
                    field="created_by"
                    currentSort={sortBy}
                    currentSortOrder={sortOrder}
                    onSortChange={(field, order) => {
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                  >
                    Vendedor
                  </SortableTableHeader>
                  <SortableTableHeader
                    field="payment_method"
                    currentSort={sortBy}
                    currentSortOrder={sortOrder}
                    onSortChange={(field, order) => {
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                  >
                    Método de Pago
                  </SortableTableHeader>
                  <SortableTableHeader
                    field="total_price"
                    currentSort={sortBy}
                    currentSortOrder={sortOrder}
                    onSortChange={(field, order) => {
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                  >
                    Total
                  </SortableTableHeader>
                  <SortableTableHeader
                    field="discount"
                    currentSort={sortBy}
                    currentSortOrder={sortOrder}
                    onSortChange={(field, order) => {
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                  >
                    Descuento
                  </SortableTableHeader>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Productos
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales?.items.map((sale) => (
                  <tr 
                    key={sale.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    onClick={() => handleRowClick(sale.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{sale.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.time).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.created_by_username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.payment_method_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-semibold text-green-600">
                        ${sale.total_price.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.discount > 0 ? (
                        <span className="font-medium text-orange-600">
                          {sale.discount}%
                        </span>
                      ) : (
                        <span className="text-gray-400">0%</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        {sale.items?.map((item, index) => (
                          <div key={index} className="text-xs">
                            {item.quantity}x {item.product.name} (${item.price.toFixed(2)})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => handleDelete(sale.id, e)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors duration-150"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 