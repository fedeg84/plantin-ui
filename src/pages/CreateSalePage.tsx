import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, useWatch, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saleApi } from '../api/endpoints';
import { ShoppingCart, Trash2, Calculator, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';
import MoneyInput from '../components/MoneyInput';
import PaymentMethodSelector from '../components/PaymentMethodSelector';
import ProductSelector from '../components/ProductSelector';
import PaymentMismatchAlert from '../components/PaymentMismatchAlert';
import SalePriceSummary from '../components/SalePriceSummary';
import { Product } from '../types/api';
import { useNavigate } from 'react-router-dom';
import { roundPeso, paymentsMatchSaleTotals, expectedPaymentsTotal } from '../utils/money';

const createSaleSchema = z
  .object({
    description: z.string().optional(),
    price: z.number().min(0, 'El precio no puede ser negativo'),
    payment_methods: z.array(
      z.object({
        payment_method_id: z.number(),
        amount: z.number().min(0),
        discount: z.number().min(0, 'El descuento no puede ser negativo').optional(),
      })
    ),
    sale_items: z.array(
      z.object({
        product_id: z.number(),
        quantity: z.number().min(1, 'La cantidad debe ser mayor a 0').optional(),
      })
    ),
  })
  .superRefine((data, ctx) => {
    const filledItems = data.sale_items.filter((item) => item.product_id > 0);
    const filledPayments = data.payment_methods.filter((pm) => pm.payment_method_id > 0);

    if (filledItems.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe agregar al menos un producto',
        path: ['sale_items'],
      });
    }

    if (filledPayments.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe agregar al menos un método de pago',
        path: ['payment_methods'],
      });
    }

    data.sale_items.forEach((item, index) => {
      if (item.product_id > 0 && (!item.quantity || item.quantity < 1)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La cantidad debe ser mayor a 0',
          path: ['sale_items', index, 'quantity'],
        });
      }
    });

    data.payment_methods.forEach((pm, index) => {
      if (pm.payment_method_id > 0 && (pm.amount || 0) < 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El monto debe ser mayor a 0',
          path: ['payment_methods', index, 'amount'],
        });
      }
    });
  });

type CreateSaleForm = z.infer<typeof createSaleSchema>;

export default function CreateSalePage() {
  const navigate = useNavigate();
  const [selectedProducts, setSelectedProducts] = useState<{[key: number]: Product}>({});
  const queryClient = useQueryClient();



  const createMutation = useMutation({
    mutationFn: (data: any) => saleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Invalidate products to refresh stock
      queryClient.invalidateQueries({ queryKey: ['product'] }); // Invalidate individual product queries too
      toast.success('Venta creada correctamente');
      navigate('/sales');
    },
    onError: (error) => {
      console.error('Error creating sale:', error);
      toast.error('Error al crear la venta');
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateSaleForm>({
    resolver: zodResolver(createSaleSchema),
    defaultValues: {
      price: 0,
      payment_methods: [{ payment_method_id: 0, amount: 0, discount: 0 }],
      sale_items: [{ product_id: 0, quantity: 1 }],
    },
  });

  const { fields: saleItemFields, append: appendSaleItem, remove: removeSaleItem } = useFieldArray({
    control,
    name: 'sale_items',
  });

  const { fields: paymentMethodFields, append: appendPaymentMethod, remove: removePaymentMethod } = useFieldArray({
    control,
    name: 'payment_methods',
  });

  const saleItems = useWatch({ control, name: 'sale_items' });

  const getFilledPaymentMethods = () => {
    const paymentMethods = watch('payment_methods') || [];
    return paymentMethods
      .map((pm, index) => ({ pm, index }))
      .filter(({ pm }) => (pm.payment_method_id || 0) > 0);
  };

  const isProductPlaceholder = (index: number) => {
    const productId = watch(`sale_items.${index}.product_id`) || 0;
    return productId === 0 && index === saleItemFields.length - 1;
  };

  const isPaymentPlaceholder = (index: number) => {
    const pmId = watch(`payment_methods.${index}.payment_method_id`) || 0;
    return pmId === 0 && index === paymentMethodFields.length - 1;
  };

  const handleRemoveSaleItem = (index: number) => {
    removeSaleItem(index);
    setSelectedProducts((prev) => {
      const next: { [key: number]: Product } = {};
      Object.entries(prev).forEach(([key, product]) => {
        const i = Number(key);
        if (i < index) next[i] = product;
        else if (i > index) next[i - 1] = product;
      });
      return next;
    });
  };

  const handleProductSelect = (index: number, id: number, product?: Product) => {
    setValue(`sale_items.${index}.product_id`, id);
    if (product) {
      setSelectedProducts((prev) => ({ ...prev, [index]: product }));
      if (index === saleItemFields.length - 1) {
        appendSaleItem({ product_id: 0, quantity: 1 });
      }
    } else {
      setSelectedProducts((prev) => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    }
  };

  const handlePaymentMethodSelect = (index: number, id: number, paymentMethod?: { discount?: number }) => {
    setValue(`payment_methods.${index}.payment_method_id`, id);
    setValue(`payment_methods.${index}.discount`, paymentMethod?.discount ?? 0);
    if (paymentMethod && index === paymentMethodFields.length - 1) {
      appendPaymentMethod({ payment_method_id: 0, amount: 0, discount: 0 });
    }
    setTimeout(() => {
      distributePaymentMethods();
    }, 0);
  };

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
    return getFilledPaymentMethods().reduce((total, { pm }) => {
      const finalAmount = pm.amount || 0;
      const discountPercentage = pm.discount || 0;
      const originalAmount = discountPercentage > 0 ? finalAmount / (1 - discountPercentage / 100) : finalAmount;
      const discountAmount = originalAmount - finalAmount;
      return total + discountAmount;
    }, 0);
  };

  const calculateTotalPaymentMethods = () => {
    return getFilledPaymentMethods().reduce((total, { pm }) => total + (pm.amount || 0), 0);
  };

  const finalizePaymentAmountsPesos = () => {
    const filled = getFilledPaymentMethods();
    if (filled.length === 0) return;
    filled.forEach(({ index }) => {
      setValue(`payment_methods.${index}.amount`, roundPeso(watch(`payment_methods.${index}.amount`) || 0));
    });
    const target = roundPeso(calculateTotalPrice() - calculateTotalDiscounts());
    let sum = 0;
    for (let i = 0; i < filled.length - 1; i++) {
      sum += roundPeso(watch(`payment_methods.${filled[i].index}.amount`) || 0);
    }
    const lastIdx = filled[filled.length - 1].index;
    setValue(`payment_methods.${lastIdx}.amount`, Math.max(0, target - sum));
  };

  const distributePaymentMethods = () => {
    const totalPrice = calculateTotalPrice();
    const filled = getFilledPaymentMethods();

    if (filled.length === 0) return;

    if (filled.length === 1) {
      const { pm, index } = filled[0];
      const discountPercentage = pm.discount || 0;
      const finalAmount = totalPrice * (1 - discountPercentage / 100);
      setValue(`payment_methods.${index}.amount`, roundPeso(finalAmount));
      finalizePaymentAmountsPesos();
      return;
    }

    let remainingTotal = totalPrice;

    filled.forEach(({ pm, index }, filledIndex) => {
      const discountPercentage = pm.discount || 0;

      if (filledIndex === filled.length - 1) {
        const finalAmount = Math.max(0, remainingTotal * (1 - discountPercentage / 100));
        setValue(`payment_methods.${index}.amount`, roundPeso(finalAmount));
      } else {
        const avgAmount = remainingTotal / (filled.length - filledIndex);
        const finalAmount = avgAmount * (1 - discountPercentage / 100);
        const coverage = calculateMethodCoverage(finalAmount, discountPercentage);

        setValue(`payment_methods.${index}.amount`, roundPeso(Math.max(0, finalAmount)));
        remainingTotal -= coverage;
      }
    });
    finalizePaymentAmountsPesos();
  };

  const calculateMethodCoverage = (finalAmount: number, discountPercentage: number) => {
    if (discountPercentage > 0) {
      return finalAmount / (1 - discountPercentage / 100);
    }
    return finalAmount;
  };

  useEffect(() => {
    distributePaymentMethods();
    const finalTotal = Math.max(0, roundPeso(calculateTotalPaymentMethods()));
    setValue('price', finalTotal);
  }, [selectedProducts, saleItems, paymentMethodFields.length]);

  const onInvalid = (formErrors: FieldErrors<CreateSaleForm>) => {
    const saleItemsError = formErrors.sale_items?.message;
    const paymentMethodsError = formErrors.payment_methods?.message;
    if (typeof saleItemsError === 'string') {
      toast.error(saleItemsError);
      return;
    }
    if (typeof paymentMethodsError === 'string') {
      toast.error(paymentMethodsError);
      return;
    }
    toast.error('Revisá productos y métodos de pago antes de crear la venta');
  };

  const onSubmit = (data: CreateSaleForm) => {
    const filteredSaleItems = data.sale_items.filter(item => item.product_id > 0);
    
    if (filteredSaleItems.length === 0) {
      toast.error('Debe seleccionar al menos un producto');
      return;
    }

    const filteredPaymentMethods = data.payment_methods.filter(pm => pm.payment_method_id > 0);
    
    if (filteredPaymentMethods.length === 0) {
      toast.error('Debe seleccionar al menos un método de pago');
      return;
    }

    if (
      !paymentsMatchSaleTotals(
        calculateTotalPrice(),
        calculateTotalDiscounts(),
        calculateTotalPaymentMethods()
      )
    ) {
      const esperado = expectedPaymentsTotal(calculateTotalPrice(), calculateTotalDiscounts());
      toast.error(
        `Los montos de pago no coinciden con el total de la venta. Debe sumar $${esperado.toLocaleString('es-AR')} (pesos redondos). Ajuste las formas de pago.`
      );
      return;
    }

    const finalPrice = Math.max(0, roundPeso(calculateTotalPaymentMethods()));

    const submitData = {
      ...data,
      price: finalPrice,
      sale_items: filteredSaleItems,
      payment_methods: filteredPaymentMethods.map((pm) => ({
        payment_method_id: pm.payment_method_id,
        amount: roundPeso(pm.amount),
        discount: pm.discount ?? 0,
      })),
    };

    createMutation.mutate(submitData);
  };

  const paymentTotalsMismatch =
    getFilledPaymentMethods().length > 0 &&
    !paymentsMatchSaleTotals(
      calculateTotalPrice(),
      calculateTotalDiscounts(),
      calculateTotalPaymentMethods()
    );

  const filledProductsCount = (saleItems || []).filter((item) => (item.product_id || 0) > 0).length;
  const filledPaymentsCount = getFilledPaymentMethods().length;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex items-center">
        <BackButton fallback="/sales" className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-3 min-h-0" />
        <h1 className="text-2xl font-bold text-gray-900">Nueva Venta</h1>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          {/* Productos */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Productos</h2>
            </div>
            
            <div className="p-6 space-y-4">
              {saleItemFields.map((field, index) => {
                const isPlaceholder = isProductPlaceholder(index);

                if (isPlaceholder) {
                  return (
                    <div key={field.id} className="rounded-lg p-4 bg-gray-50 border border-dashed border-gray-300">
                      <ProductSelector
                        value={watch(`sale_items.${index}.product_id`) || 0}
                        onChange={(id, product) => handleProductSelect(index, id, product)}
                        placeholder={filledProductsCount === 0 ? 'Buscar producto' : 'Buscar otro producto...'}
                        variant="placeholder"
                      />
                    </div>
                  );
                }

                return (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-8">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Producto</label>
                      <ProductSelector
                        value={watch(`sale_items.${index}.product_id`) || 0}
                        onChange={(id, product) => handleProductSelect(index, id, product)}
                        placeholder="Seleccionar producto"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                      <input
                        {...register(`sale_items.${index}.quantity`, { 
                          valueAsNumber: true,
                          setValueAs: (value) => value === '' ? undefined : Number(value)
                        })}
                        type="number"
                        min="1"
                        max={selectedProducts[index]?.current_stock || 9999}
                        className="input"
                        placeholder="1"
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setValue(`sale_items.${index}.quantity`, undefined as any, { shouldValidate: false });
                          } else {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue) && numValue >= 1) {
                              setValue(`sale_items.${index}.quantity`, numValue);
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveSaleItem(index)}
                        className="btn-secondary p-2 text-red-600 hover:text-red-700 w-full"
                        title="Eliminar producto"
                      >
                        <Trash2 className="h-4 w-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                  
                  {selectedProducts[index] && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          Stock disponible: {selectedProducts[index].current_stock}
                        </span>
                        <span className="text-primary-600 font-medium">
                          Total: $
                          {roundPeso(
                            selectedProducts[index].current_price * (watch(`sale_items.${index}.quantity`) || 1)
                          ).toLocaleString('es-AR')}
                        </span>
                      </div>
                      
                      {(watch(`sale_items.${index}.quantity`) || 0) > selectedProducts[index].current_stock && (
                        <div className="mt-2 flex items-center p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
                          <Eye className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-yellow-800 font-medium">
                              No hay stock suficiente para este producto
                            </p>
                            <p className="text-xs text-yellow-700 mt-0.5">
                              Stock disponible: {selectedProducts[index].current_stock} | Cantidad solicitada: {watch(`sale_items.${index}.quantity`) || 0}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
              
              {errors.sale_items && (
                <p className="text-sm text-red-600">{errors.sale_items.message}</p>
              )}
            </div>
          </div>

          {/* Métodos de Pago */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Métodos de Pago</h2>
            </div>
            
            <div className="p-6 space-y-4">
              {paymentTotalsMismatch && (
                <PaymentMismatchAlert
                  productsSubtotal={calculateTotalPrice()}
                  paymentLines={getFilledPaymentMethods().map(({ pm }) => ({
                    payment_method_id: pm.payment_method_id,
                    amount: pm.amount || 0,
                    discount: pm.discount,
                  }))}
                />
              )}
              {paymentMethodFields.map((field, index) => {
                const isPlaceholder = isPaymentPlaceholder(index);

                if (isPlaceholder) {
                  return (
                    <div key={field.id} className="rounded-lg p-4 bg-gray-50 border border-dashed border-gray-300">
                      <PaymentMethodSelector
                        value={watch(`payment_methods.${index}.payment_method_id`) || 0}
                        onChange={(id, paymentMethod) => handlePaymentMethodSelect(index, id, paymentMethod)}
                        placeholder={filledPaymentsCount === 0 ? 'Buscar medio de pago' : 'Buscar otro método de pago...'}
                        variant="placeholder"
                        showDiscount
                      />
                    </div>
                  );
                }

                return (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Método</label>
                      <PaymentMethodSelector
                        value={watch(`payment_methods.${index}.payment_method_id`) || 0}
                        onChange={(id, paymentMethod) => handlePaymentMethodSelect(index, id, paymentMethod)}
                        placeholder="Seleccionar método"
                        showDiscount
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
                      <MoneyInput
                        {...register(`payment_methods.${index}.amount`, { valueAsNumber: true })}
                        value={watch(`payment_methods.${index}.amount`)}
                        placeholder="0"
                        onChange={(e) => {
                          const raw = e.target.value;
                          const newAmount =
                            raw === '' ? 0 : roundPeso(parseFloat(raw.replace(',', '.')) || 0);
                          setValue(`payment_methods.${index}.amount`, newAmount, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Original: $
                        {roundPeso(
                          (watch(`payment_methods.${index}.amount`) || 0) /
                            (1 - (watch(`payment_methods.${index}.discount`) || 0) / 100)
                        ).toLocaleString('es-AR')}
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium mb-2 invisible" aria-hidden="true">
                        &nbsp;
                      </label>
                      <button
                        type="button"
                        onClick={() => removePaymentMethod(index)}
                        className="btn-secondary p-2 text-red-600 hover:text-red-700 w-full"
                        title="Eliminar método de pago"
                      >
                        <Trash2 className="h-4 w-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
              
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
              <SalePriceSummary
                saleItems={watch('sale_items') || []}
                selectedProducts={selectedProducts}
                paymentMethods={watch('payment_methods') || []}
              />
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

          {/* Botón Crear Venta */}
          <div className="flex flex-col sm:flex-row sm:justify-end pt-4">
            <button
              type="submit"
              disabled={createMutation.isPending || paymentTotalsMismatch}
              className="btn-primary flex items-center justify-center px-6 py-3 text-base w-full sm:w-auto"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {createMutation.isPending ? 'Creando...' : 'Crear Venta'}
            </button>
          </div>

          {/* Campo oculto para el precio total */}
          <input
            type="hidden"
            {...register('price', { valueAsNumber: true })}
          />
        </form>
      </div>
    </div>
  );
} 