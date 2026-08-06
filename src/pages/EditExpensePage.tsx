import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { expenseApi } from '../api/endpoints';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';
import MoneyInput from '../components/MoneyInput';
import PaymentMethodSelector from '../components/PaymentMethodSelector';
import ExpenseTypeSelector from '../components/ExpenseTypeSelector';

const updateExpenseSchema = z.object({
  description: z
    .string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional(),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  date: z.string().min(1, 'La fecha es requerida'),
  payment_method_id: z.number().min(1, 'El método de pago es requerido'),
  expense_type_id: z.number().min(1, 'El tipo de pago es requerido'),
});

type UpdateExpenseForm = z.infer<typeof updateExpenseSchema>;

export default function EditExpensePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const expenseId = parseInt(id!);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateExpenseForm>({
    resolver: zodResolver(updateExpenseSchema),
  });

  // Fetch expense data
  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => expenseApi.getById(expenseId),
    enabled: !!expenseId,
  });

  // Load expense data into form
  useEffect(() => {
    if (expense) {
      setValue('description', expense.description ?? '');
      setValue('amount', expense.amount);
      // Convert date to YYYY-MM-DD format for input type="date"
      const date = new Date(expense.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setValue('date', `${year}-${month}-${day}`);
      setValue('payment_method_id', expense.payment_method_id || 0);
      setValue('expense_type_id', expense.expense_type_id || 0);
    }
  }, [expense, setValue]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateExpenseForm) => {
      return expenseApi.update(expenseId, {
        ...data,
        description: data.description?.trim() || undefined,
        date: data.date,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', expenseId] });
      toast.success('Pago actualizado correctamente');
      navigate('/admin/payments');
    },
    onError: (error) => {
      console.error('Error updating expense:', error);
      toast.error('Error al actualizar el pago');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => expenseApi.delete(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Pago eliminado correctamente');
      navigate('/admin/payments');
    },
    onError: () => {
      toast.error('Error al eliminar el pago');
    },
  });

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este pago? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate();
    }
  };

  const onSubmit = (data: UpdateExpenseForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">Error al cargar el pago</p>
          <BackButton fallback="/admin/payments" className="mt-4 min-h-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BackButton fallback="/admin/payments" className="min-h-0" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Pago #{expense.id}</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
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

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending || updateMutation.isPending}
              className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar pago'}
            </button>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/admin/payments')}
                className="btn-secondary w-full sm:w-auto"
                disabled={updateMutation.isPending || deleteMutation.isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto"
                disabled={updateMutation.isPending || deleteMutation.isPending}
              >
                {updateMutation.isPending ? 'Actualizando...' : 'Actualizar Pago'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

