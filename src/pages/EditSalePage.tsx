import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { roundPeso, paymentsMatchSaleTotals, expectedPaymentsTotal } from '../utils/money';

const editSaleSchema = z
  .object({
    description: z.string().optional(),
    price: z.number().min(0, 'El precio no puede ser negativo').optional(),
    payment_methods: z.array(
      z.object({
        id: z.number().optional().nullable(),
        payment_method_id: z.number(),
        amount: z.number().min(0),
        discount: z.number().min(0, 'El descuento no puede ser negativo').optional(),
      })
    ),
    sale_items: z.array(
      z.object({
        id: z.number().optional(),
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

type EditSaleForm = z.infer<typeof editSaleSchema>;

type OriginalSaleItem = {
  quantity: number;
  product_id: number;
};

export default function EditSalePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const saleId = parseInt(id!);
  const [selectedProducts, setSelectedProducts] = useState<{[key: number]: Product}>({});
  const originalSaleItemsRef = useRef<Map<number, OriginalSaleItem>>(new Map());

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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success('Venta actualizada correctamente');
      navigate('/sales');
    },
    onError: (error) => {
      console.error('Error updating sale:', error);
      toast.error('Error al actualizar la venta');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => saleApi.delete(saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venta eliminada correctamente');
      navigate('/sales');
    },
    onError: () => {
      toast.error('Error al eliminar la venta');
    },
  });

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta venta? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate();
    }
  };

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
      payment_methods: [{ id: undefined, payment_method_id: 0, amount: 0, discount: 0 }],
      sale_items: [{ id: undefined, product_id: 0, quantity: 1 }],
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

  const saleItems = useWatch({ control, name: 'sale_items' });

  const getOriginalSaleItem = (index: number): OriginalSaleItem | undefined => {
    const saleItemId = saleItems?.[index]?.id;
    return saleItemId ? originalSaleItemsRef.current.get(saleItemId) : undefined;
  };

  const getMaxAllowedQuantity = (index: number): number => {
    const product = selectedProducts[index];
    if (!product) return 9999;
    const productId = saleItems?.[index]?.product_id;
    const original = getOriginalSaleItem(index);
    const stockBonus =
      original && original.product_id === productId ? original.quantity : 0;
    return product.current_stock + stockBonus;
  };

  const showStockWarning = (index: number): boolean => {
    const product = selectedProducts[index];
    if (!product) return false;

    const item = saleItems?.[index];
    const currentQty = item?.quantity || 0;
    const original = getOriginalSaleItem(index);

    if (
      original &&
      original.product_id === item?.product_id &&
      currentQty === original.quantity
    ) {
      return false;
    }

    return currentQty > getMaxAllowedQuantity(index);
  };

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

  const syncPaymentsAndPrice = () => {
    distributePaymentMethods();
    const finalTotal = Math.max(0, roundPeso(calculateTotalPaymentMethods()));
    setValue('price', finalTotal);
  };

  const handleProductSelect = (index: number, id: number, product?: Product) => {
    setValue(`sale_items.${index}.product_id`, id);
    if (product) {
      setSelectedProducts((prev) => ({ ...prev, [index]: product }));
      if (index === saleItemFields.length - 1) {
        appendSaleItem({ id: undefined, product_id: 0, quantity: 1 });
      }
    } else {
      setSelectedProducts((prev) => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    }
    setTimeout(() => syncPaymentsAndPrice(), 0);
  };

  const handlePaymentMethodSelect = (index: number, id: number, paymentMethod?: { discount?: number }) => {
    setValue(`payment_methods.${index}.payment_method_id`, id);
    setValue(`payment_methods.${index}.discount`, paymentMethod?.discount ?? 0);
    if (paymentMethod && index === paymentMethodFields.length - 1) {
      appendPaymentMethod({ id: undefined, payment_method_id: 0, amount: 0, discount: 0 });
    }
    setTimeout(() => syncPaymentsAndPrice(), 0);
  };

  // Initialize form data when sale is loaded
  useEffect(() => {
    if (sale) {
      originalSaleItemsRef.current.clear();
      sale.items.forEach((item) => {
        if (item.id) {
          originalSaleItemsRef.current.set(item.id, {
            quantity: item.quantity,
            product_id: item.product.id,
          });
        }
      });

      const items = sale.items.map(item => ({
        id: item.id,
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const payments = sale.payment_methods.map((payment) => ({
        id: payment.id,
        payment_method_id: payment.payment_method_id,
        amount: roundPeso(Number(payment.amount)),
        discount: Number(payment.discount_percentage ?? 0),
      }));

             // Set form values
       setValue('description', '');
       setValue('price', sale.total_price || 0);
       
       // Replace fields with useFieldArray (append empty placeholder rows)
       replaceSaleItems([...items, { id: undefined, product_id: 0, quantity: 1 }]);
       replacePaymentMethods([...payments, { id: undefined, payment_method_id: 0, amount: 0, discount: 0 }]);

      // Set selected products for display
      const productsMap: {[key: number]: Product} = {};
      sale.items.forEach((item, index) => {
        productsMap[index] = item.product;
      });
      setSelectedProducts(productsMap);
      
      // Ensure form values are set correctly after replace
      setTimeout(() => {
        items.forEach((item, index) => {
          setValue(`sale_items.${index}.id`, item.id);
          setValue(`sale_items.${index}.product_id`, item.product_id);
          setValue(`sale_items.${index}.quantity`, item.quantity);
        });
        
        payments.forEach((payment, index) => {
          setValue(`payment_methods.${index}.id`, payment.id);
          setValue(`payment_methods.${index}.payment_method_id`, payment.payment_method_id);
          setValue(`payment_methods.${index}.amount`, payment.amount);
          setValue(`payment_methods.${index}.discount`, payment.discount);
        });
        setValue('price', roundPeso(sale.total_price || payments.reduce((t, p) => t + p.amount, 0)));
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

  /** Ajusta montos a pesos enteros y cierra la suma con el total esperado (productos − descuentos por método). */
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

    const totalDiscountAmount = calculateTotalDiscounts();
    const remainingAmount = totalPrice - totalDiscountAmount;

    if (remainingAmount <= 0) {
      filled.forEach(({ index }) => setValue(`payment_methods.${index}.amount`, 0));
      finalizePaymentAmountsPesos();
      return;
    }

    const totalDiscountPercentage = filled.reduce((sum, { pm }) => sum + (pm.discount || 0), 0);

    if (totalDiscountPercentage >= 100) {
      filled.forEach(({ index }) => setValue(`payment_methods.${index}.amount`, 0));
      finalizePaymentAmountsPesos();
      return;
    }

    const totalCoverage = filled.reduce((sum, { pm }) => {
      const discountPercentage = pm.discount || 0;
      return sum + calculateMethodCoverage(remainingAmount, discountPercentage);
    }, 0);

    filled.forEach(({ pm, index }) => {
      const discountPercentage = pm.discount || 0;
      const coverage = calculateMethodCoverage(remainingAmount, discountPercentage);
      const proportion = totalCoverage > 0 ? coverage / totalCoverage : 1 / filled.length;
      const amount = remainingAmount * proportion;
      setValue(`payment_methods.${index}.amount`, roundPeso(amount));
    });
    finalizePaymentAmountsPesos();
  };

  const calculateMethodCoverage = (finalAmount: number, discountPercentage: number) => {
    if (discountPercentage >= 100) return 0;
    return finalAmount / (1 - discountPercentage / 100);
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

  const onInvalid = (formErrors: FieldErrors<EditSaleForm>) => {
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
    toast.error('Revisá productos y métodos de pago antes de actualizar la venta');
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
    setValue('price', finalPrice);

    const submitData = {
      description: data.description,
      total_price: finalPrice,
      items: filteredSaleItems.map((item) => {
        const row: { id?: number; product_id: number; quantity: number } = {
          product_id: item.product_id,
          quantity: item.quantity,
        };
        if (item.id != null) row.id = item.id;
        return row;
      }),
      payment_methods: filteredPaymentMethods.map((pm) => ({
        id: pm.id ?? null,
        payment_method_id: pm.payment_method_id,
        amount: roundPeso(pm.amount),
        discount: pm.discount ?? 0,
      })),
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
          <BackButton fallback="/sales" className="mt-4 min-h-0" />
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
               <BackButton
                 fallback="/sales"
                 className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-3 min-h-0"
               />
               <h1 className="text-xl font-semibold text-gray-900">Editar Venta #{sale.id}</h1>
             </div>
           </div>
         </div>
       </div>

       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                        value={selectedProducts[index]?.id || watch(`sale_items.${index}.product_id`)}
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
                        max={getMaxAllowedQuantity(index)}
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
                              setTimeout(() => syncPaymentsAndPrice(), 0);
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
                          Stock disponible: {getMaxAllowedQuantity(index)}
                        </span>
                        <span className="text-primary-600 font-medium">
                          Total: $
                          {roundPeso(
                            selectedProducts[index].current_price * (watch(`sale_items.${index}.quantity`) || 1)
                          ).toLocaleString('es-AR')}
                        </span>
                      </div>
                      
                      {showStockWarning(index) && (
                        <div className="mt-2 flex items-center p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
                          <Eye className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-yellow-800 font-medium">
                              No hay stock suficiente para este producto
                            </p>
                            <p className="text-xs text-yellow-700 mt-0.5">
                              Stock disponible: {getMaxAllowedQuantity(index)} | Cantidad solicitada: {watch(`sale_items.${index}.quantity`) || 0}
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
                    name: sale?.payment_methods.find((p) => p.payment_method_id === pm.payment_method_id)
                      ?.payment_method_name,
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
                          
                          setTimeout(() => syncPaymentsAndPrice(), 0);
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

                                {/* Botón de actualizar */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending || updateMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar venta'}
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending || paymentTotalsMismatch || deleteMutation.isPending}
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
