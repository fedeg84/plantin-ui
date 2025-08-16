import { useState, useEffect } from 'react';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saleApi } from '../api/endpoints';
import { Plus, ShoppingCart, Trash2, Calculator, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductSelector from '../components/ProductSelector';
import PaymentMethodSelector from '../components/PaymentMethodSelector';
import { Product, Sale } from '../types/api';

const editSaleSchema = z.object({
  description: z.string().optional(),
  price: z.number().min(0, 'El precio no puede ser negativo').optional(),
  payment_methods: z.array(z.object({
    payment_method_id: z.number().min(1, 'El método de pago es requerido'),
    amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
    discount: z.number().min(0, 'El descuento no puede ser negativo').optional(),
  })).min(1, 'Debe agregar al menos un método de pago'),
  sale_items: z.array(z.object({
    product_id: z.number().min(1, 'El producto es requerido'),
    quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  })).min(1, 'Debe agregar al menos un producto'),
});

type EditSaleForm = z.infer<typeof editSaleSchema>;

export default function EditSalePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const saleId = parseInt(id!);
  const [selectedProducts, setSelectedProducts] = useState<{[key: number]: Product}>({});

  // Fetch sale details
  const { data: sale, isLoading: isLoadingSale } = useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => saleApi.getById(saleId),
    enabled: !!saleId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => saleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale', saleId] });
      toast.success('Venta actualizada correctamente');
      navigate(`/sales/${saleId}`);
    },
    onError: (error) => {
      console.error('Error updating sale:', error);
      toast.error('Error al actualizar la venta');
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditSaleForm>({
    resolver: zodResolver(editSaleSchema),
    defaultValues: {
      price: 0,
      payment_methods: [{ payment_method_id: 0, amount: 0, discount: 0 }],
      sale_items: [{ product_id: 0, quantity: 1 }],
    },
  });



  const { fields: saleItemFields, append: appendSaleItem, remove: removeSaleItem, replace: replaceSaleItems } = useFieldArray({
    control,
    name: 'sale_items',
  });

  const { fields: paymentMethodFields, append: appendPaymentMethod, remove: removePaymentMethod, replace: replacePaymentMethods } = useFieldArray({
    control,
    name: 'payment_methods',
  });

  // Initialize form data when sale is loaded
  useEffect(() => {
    if (sale) {
      const items = sale.items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const payments = sale.payment_methods.map(payment => ({
        payment_method_id: payment.payment_method_id,
        amount: payment.amount,
        discount: payment.discount_percentage || 0,
      }));

             // Set form values
       setValue('description', sale.description || '');
       setValue('price', sale.total_price || 0);
       
       // Replace fields with useFieldArray
       replaceSaleItems(items);
       replacePaymentMethods(payments);

      // Set selected products for display
      const productsMap: {[key: number]: Product} = {};
      sale.items.forEach((item, index) => {
        productsMap[index] = item.product;
      });
      setSelectedProducts(productsMap);
      
      // Ensure form values are set correctly after replace
      setTimeout(() => {
        items.forEach((item, index) => {
          setValue(`sale_items.${index}.product_id`, item.product_id);
          setValue(`sale_items.${index}.quantity`, item.quantity);
        });
        
        payments.forEach((payment, index) => {
          setValue(`payment_methods.${index}.payment_method_id`, payment.payment_method_id);
          setValue(`payment_methods.${index}.amount`, payment.amount);
          setValue(`payment_methods.${index}.discount`, payment.discount);
        });
      }, 100);
    }
  }, [sale, setValue, replaceSaleItems, replacePaymentMethods]);

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

  const calculateTotalDiscounts = () => {
    const paymentMethods = watch('payment_methods') || [];
    return paymentMethods.reduce((total, pm) => {
      const finalAmount = pm.amount || 0;
      const discountPercentage = pm.discount || 0;
      const originalAmount = discountPercentage > 0 ? finalAmount / (1 - discountPercentage / 100) : finalAmount;
      const discountAmount = originalAmount - finalAmount;
      return total + discountAmount;
    }, 0);
  };

  const calculateTotalPaymentMethods = () => {
    const paymentMethods = watch('payment_methods') || [];
    return paymentMethods.reduce((total, pm) => total + (pm.amount || 0), 0);
  };

  const distributePaymentMethods = () => {
    const totalPrice = calculateTotalPrice();
    const paymentMethods = watch('payment_methods') || [];
    
    if (paymentMethods.length === 0) return;

    // Calculate total discount amount
    const totalDiscountAmount = calculateTotalDiscounts();
    const remainingAmount = totalPrice - totalDiscountAmount;

    if (remainingAmount <= 0) {
      // If total discount covers the entire price, set first payment method to 0
      setValue('payment_methods.0.amount', 0);
      return;
    }

    // Distribute remaining amount among payment methods
    const totalDiscountPercentage = paymentMethods.reduce((sum, pm) => sum + (pm.discount || 0), 0);
    
    if (totalDiscountPercentage >= 100) {
      // If total discount is 100% or more, set all amounts to 0
      paymentMethods.forEach((_, index) => {
        setValue(`payment_methods.${index}.amount`, 0);
      });
      return;
    }

    // Calculate how much each payment method should cover
    const totalCoverage = paymentMethods.reduce((sum, pm) => {
      const discountPercentage = pm.discount || 0;
      return sum + calculateMethodCoverage(remainingAmount, discountPercentage);
    }, 0);

    // Distribute proportionally
    paymentMethods.forEach((pm, index) => {
      const discountPercentage = pm.discount || 0;
      const coverage = calculateMethodCoverage(remainingAmount, discountPercentage);
      const proportion = totalCoverage > 0 ? coverage / totalCoverage : 1 / paymentMethods.length;
      const amount = remainingAmount * proportion;
      setValue(`payment_methods.${index}.amount`, Math.round(amount * 100) / 100);
    });
  };

  const calculateMethodCoverage = (finalAmount: number, discountPercentage: number) => {
    if (discountPercentage >= 100) return 0;
    return finalAmount / (1 - discountPercentage / 100);
  };

  const redistributeRemainingAmounts = (modifiedIndex: number, newAmount: number) => {
    const paymentMethods = watch('payment_methods') || [];
    const totalPrice = calculateTotalPrice();
    const totalDiscountAmount = calculateTotalDiscounts();
    const remainingAmount = totalPrice - totalDiscountAmount;

    if (remainingAmount <= 0) {
      // If total discount covers the entire price, set all amounts to 0 except the modified one
      paymentMethods.forEach((_, index) => {
        if (index !== modifiedIndex) {
          setValue(`payment_methods.${index}.amount`, 0);
        }
      });
      return;
    }

    // Calculate the total amount covered by other payment methods
    let otherMethodsTotal = 0;
    paymentMethods.forEach((pm, index) => {
      if (index !== modifiedIndex) {
        otherMethodsTotal += pm.amount || 0;
      }
    });

    // Calculate how much the modified payment method should cover
    const modifiedDiscountPercentage = paymentMethods[modifiedIndex]?.discount || 0;
    const modifiedCoverage = calculateMethodCoverage(remainingAmount, modifiedDiscountPercentage);
    
    // Calculate the total coverage needed
    let totalCoverage = modifiedCoverage;
    paymentMethods.forEach((pm, index) => {
      if (index !== modifiedIndex) {
        const discountPercentage = pm.discount || 0;
        totalCoverage += calculateMethodCoverage(remainingAmount, discountPercentage);
      }
    });

    // Redistribute the remaining amount among other payment methods
    const remainingForOthers = remainingAmount - newAmount;
    
    if (remainingForOthers <= 0) {
      // If the modified amount covers everything, set others to 0
      paymentMethods.forEach((_, index) => {
        if (index !== modifiedIndex) {
          setValue(`payment_methods.${index}.amount`, 0);
        }
      });
      return;
    }

    // Calculate how much each other payment method should cover
    let otherMethodsCoverage = 0;
    paymentMethods.forEach((pm, index) => {
      if (index !== modifiedIndex) {
        const discountPercentage = pm.discount || 0;
        otherMethodsCoverage += calculateMethodCoverage(remainingAmount, discountPercentage);
      }
    });

    // Distribute remaining amount proportionally among other methods
    paymentMethods.forEach((pm, index) => {
      if (index !== modifiedIndex) {
        const discountPercentage = pm.discount || 0;
        const coverage = calculateMethodCoverage(remainingAmount, discountPercentage);
        const proportion = otherMethodsCoverage > 0 ? coverage / otherMethodsCoverage : 1 / (paymentMethods.length - 1);
        const amount = remainingForOthers * proportion;
        setValue(`payment_methods.${index}.amount`, Math.round(amount * 100) / 100);
      }
    });
  };

  const onSubmit = (data: EditSaleForm) => {
    const saleItems = watch('sale_items') || [];
    const paymentMethods = watch('payment_methods') || [];

    // Filter out empty items
    const filteredSaleItems = saleItems.filter(item => item.product_id > 0);
    const filteredPaymentMethods = paymentMethods.filter(pm => pm.payment_method_id > 0);

    if (filteredSaleItems.length === 0) {
      toast.error('Debe seleccionar al menos un producto');
      return;
    }

    if (filteredPaymentMethods.length === 0) {
      toast.error('Debe seleccionar al menos un método de pago');
      return;
    }

    const finalPrice = Math.max(0, calculateTotalPaymentMethods());

    // Set the price field before submitting
    setValue('price', finalPrice);

    const submitData = {
      description: data.description,
      total_price: finalPrice,
      items: filteredSaleItems,
      payment_methods: filteredPaymentMethods
    };
    
    updateMutation.mutate({ id: saleId, data: submitData });
  };

  if (isLoadingSale) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">Venta no encontrada</p>
          <button
            onClick={() => navigate('/sales')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Volver a ventas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
             {/* Header */}
       <div className="bg-white shadow-sm border-b">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex items-center justify-between h-16">
             <div className="flex items-center">
               <button
                 onClick={() => navigate(`/sales/${saleId}`)}
                 className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-3"
               >
                 <ArrowLeft className="h-5 w-5" />
               </button>
               <h1 className="text-xl font-semibold text-gray-900">Editar Venta #{sale.id}</h1>
             </div>
           </div>
         </div>
       </div>

       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Productos */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Productos</h2>
                <button
                  type="button"
                  onClick={() => appendSaleItem({ product_id: 0, quantity: 1 })}
                  className="btn-secondary text-sm py-1 px-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {saleItemFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-8">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Producto</label>
                      <ProductSelector
                        value={selectedProducts[index]?.id || watch(`sale_items.${index}.product_id`)}
                                                 onChange={(id, product) => {
                           setValue(`sale_items.${index}.product_id`, id);
                           if (product) {
                             setSelectedProducts(prev => ({
                               ...prev,
                               [index]: product
                             }));
                           } else {
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
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
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
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      {saleItemFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSaleItem(index)}
                          className="btn-secondary p-2 text-red-600 hover:text-red-700 w-full"
                          title="Eliminar producto"
                        >
                          <Trash2 className="h-4 w-4 mx-auto" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {selectedProducts[index] && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          Stock disponible: {selectedProducts[index].current_stock}
                        </span>
                        <span className="text-primary-600 font-medium">
                          Total: ${(selectedProducts[index].current_price * (watch(`sale_items.${index}.quantity`) || 1)).toFixed(2)}
                        </span>
                      </div>
                      
                      {watch(`sale_items.${index}.quantity`) > selectedProducts[index].current_stock && (
                        <div className="mt-2 flex items-center p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                          <svg className="h-4 w-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-yellow-800 font-medium">
                            ⚠️ Stock insuficiente
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {errors.sale_items && (
                <p className="text-sm text-red-600">{errors.sale_items.message}</p>
              )}
            </div>
          </div>

          {/* Métodos de Pago */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Métodos de Pago</h2>
                <button
                  type="button"
                  onClick={() => appendPaymentMethod({ payment_method_id: 0, amount: 0, discount: 0 })}
                  className="btn-secondary text-sm py-1 px-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {paymentMethodFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Método</label>
                      <PaymentMethodSelector
                        value={watch(`payment_methods.${index}.payment_method_id`) || 0}
                        onChange={(id, paymentMethod) => {
                          setValue(`payment_methods.${index}.payment_method_id`, id);
                          if (paymentMethod?.discount) {
                            setValue(`payment_methods.${index}.discount`, paymentMethod.discount);
                          }
                          
                          setTimeout(() => {
                            distributePaymentMethods();
                          }, 0);
                        }}
                        placeholder="Seleccionar método"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Descuento %</label>
                      <input
                        {...register(`payment_methods.${index}.discount`, { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="input"
                        placeholder="0"
                        onChange={(e) => {
                          const discountPercentage = parseFloat(e.target.value) || 0;
                          setValue(`payment_methods.${index}.discount`, discountPercentage);
                          
                          setTimeout(() => {
                            distributePaymentMethods();
                          }, 0);
                        }}
                      />
                    </div>
                    <div className="md:col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Monto a Pagar</label>
                      <input
                        {...register(`payment_methods.${index}.amount`, { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0"
                        className="input"
                        placeholder="0.00"
                        onChange={(e) => {
                          const newAmount = parseFloat(e.target.value) || 0;
                          setValue(`payment_methods.${index}.amount`, newAmount);
                          
                          setTimeout(() => {
                            redistributeRemainingAmounts(index, newAmount);
                          }, 0);
                        }}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Original: ${((watch(`payment_methods.${index}.amount`) || 0) / (1 - (watch(`payment_methods.${index}.discount`) || 0) / 100)).toFixed(2)}
                      </div>
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      {paymentMethodFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePaymentMethod(index)}
                          className="btn-secondary p-2 text-red-600 hover:text-red-700 w-full"
                          title="Eliminar método de pago"
                        >
                          <Trash2 className="h-4 w-4 mx-auto" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {errors.payment_methods && (
                <p className="text-sm text-red-600">{errors.payment_methods.message}</p>
              )}
            </div>
          </div>

          {/* Resumen de Precios */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">Resumen de Precios</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${calculateTotalPrice().toFixed(2)}</span>
                </div>
                {calculateTotalDiscounts() > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuentos aplicados:</span>
                    <span>-${calculateTotalDiscounts().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t pt-3">
                  <span>Total Final:</span>
                  <span className="text-green-600">
                    ${Math.max(0, calculateTotalPaymentMethods()).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Descripción (Opcional)</h2>
            </div>
            
            <div className="p-6">
              <textarea
                {...register('description')}
                rows={3}
                className="input w-full"
                placeholder="Descripción de la venta"
              />
            </div>
          </div>

                                {/* Botón de actualizar */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-primary flex items-center"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? 'Actualizando...' : 'Actualizar Venta'}
              </button>
            </div>
         </form>
       </div>
     </div>
   );
 }
