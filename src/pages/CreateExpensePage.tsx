import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { expenseApi, paymentMethodApi } from '../api/endpoints';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';
import MoneyInput from '../components/MoneyInput';
import PaymentMethodSelector from '../components/PaymentMethodSelector';
import ExpenseTypeSelector from '../components/ExpenseTypeSelector';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const createExpenseSchema = z.object({
  description: z
    .string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional(),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  date: z.string().min(1, 'La fecha es requerida'),
  payment_method_id: z.number().min(1, 'El método de pago es requerido'),
  expense_type_id: z.number().min(1, 'El tipo de pago es requerido'),
});

type CreateExpenseForm = z.infer<typeof createExpenseSchema>;

export default function CreateExpensePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get payment methods to find "Efectivo" default
  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods', { size: 100, is_active: true }],
    queryFn: () => paymentMethodApi.find({ 
      search: '',
      size: 100,
      is_active: true,
      sort_by: 'name',
      sort_order: 'asc'
    }),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateExpenseForm>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
    },
  });

  // Set default payment method to "Efectivo" when available
  useEffect(() => {
    const currentValue = watch('payment_method_id');
    if (paymentMethods?.items && !currentValue) {
      const efectivo = paymentMethods.items.find(
        (pm) => pm.name.toLowerCase() === 'efectivo'
      );
      if (efectivo && efectivo.is_active) {
        setValue('payment_method_id', efectivo.id);
      }
    }
  }, [paymentMethods, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: CreateExpenseForm) => {
      // date already comes as YYYY-MM-DD format from input type="date"
      // Send it directly as is, the backend will parse it as date
      return expenseApi.create({
        ...data,
        description: data.description?.trim() || undefined,
        date: data.date, // Already in YYYY-MM-DD format
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Pago creado correctamente');
      navigate('/admin/payments');
    },
    onError: (error) => {
      console.error('Error creating expense:', error);
      toast.error('Error al crear el pago');
    },
  });

  const onSubmit = (data: CreateExpenseForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BackButton fallback="/admin/payments" className="min-h-0" />
          <div>
            <h1 className="page-title">Nuevo Pago</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Expense Type */}
          <div>
            <label className="label">Tipo de Pago *</label>
            <ExpenseTypeSelector
              value={watch('expense_type_id')}
              onChange={(id) => setValue('expense_type_id', id)}
              placeholder="Seleccionar tipo de pago"
              error={errors.expense_type_id?.message}
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Descripción</label>
            <textarea
              {...register('description')}
              rows={3}
              className="input"
              placeholder="Ingresa una descripción del pago..."
              maxLength={1000}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {watch('description')?.length || 0}/1000 caracteres
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="label">Monto *</label>
            <MoneyInput
              {...register('amount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="label">Fecha de Pago *</label>
            <input
              {...register('date')}
              type="date"
              className="input"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="label">Método de Pago *</label>
            <PaymentMethodSelector
              value={watch('payment_method_id')}
              onChange={(id) => setValue('payment_method_id', id)}
              placeholder="Seleccionar método de pago"
              error={errors.payment_method_id?.message}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/payments')}
              className="btn-secondary w-full sm:w-auto"
              disabled={createMutation.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary w-full sm:w-auto"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

