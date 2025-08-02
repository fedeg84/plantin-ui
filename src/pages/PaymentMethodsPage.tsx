import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { paymentMethodApi } from '../api/endpoints';
import { Plus, CreditCard, Edit, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { FilterSortPanel } from '../components/FilterSortPanel';

const createPaymentMethodSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  discount: z.number().min(0, 'El descuento no puede ser negativo').max(100, 'El descuento no puede ser mayor a 100%').optional(),
  is_active: z.boolean().optional(),
});

type CreatePaymentMethodForm = z.infer<typeof createPaymentMethodSchema>;

export default function PaymentMethodsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy] = useState('name');
  const [sortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePaymentMethodForm>({
    resolver: zodResolver(createPaymentMethodSchema),
    defaultValues: {
      is_active: true,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    formState: { errors: errorsEdit },
  } = useForm<CreatePaymentMethodForm>({
    resolver: zodResolver(createPaymentMethodSchema),
  });

  const createMutation = useMutation({
    mutationFn: paymentMethodApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Método de pago creado exitosamente');
      reset();
      setShowCreateForm(false);
    },
    onError: () => {
      toast.error('Error al crear el método de pago');
    },
  });

  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ['payment-methods', { search, sortBy, sortOrder }],
    queryFn: () => paymentMethodApi.find({ 
      search, 
      sort_by: sortBy,
      sort_order: sortOrder,
      // NO filtrar por is_active - mostrar todos (activos e inactivos)
    }),
  });

  const { data: editPaymentMethodData } = useQuery({
    queryKey: ['payment-method', editingPaymentMethod],
    queryFn: () => paymentMethodApi.getById(editingPaymentMethod!),
    enabled: !!editingPaymentMethod,
  });

  useEffect(() => {
    if (editPaymentMethodData) {
      setValueEdit('name', editPaymentMethodData.name);
      setValueEdit('discount', editPaymentMethodData.discount);
      setValueEdit('is_active', editPaymentMethodData.is_active);
    }
  }, [editPaymentMethodData, setValueEdit]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreatePaymentMethodForm }) => 
      paymentMethodApi.update(id, data),
    onSuccess: (_, { id }) => {
      // Invalidar tanto la lista como el elemento individual
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['payment-method', id] });
      toast.success('Método de pago actualizado exitosamente');
      resetEdit();
      setShowEditForm(false);
      setEditingPaymentMethod(null);
    },
    onError: (error) => {
      toast.error('Error al actualizar el método de pago');
      console.error('Error updating payment method:', error);
    },
  });

  const onSubmit = (data: CreatePaymentMethodForm) => {
    createMutation.mutate(data);
  };

  const onSubmitEdit = (data: CreatePaymentMethodForm) => {
    if (editingPaymentMethod) {
      updateMutation.mutate({ id: editingPaymentMethod, data });
    }
  };

  const handleEdit = (paymentMethod: any) => {
    setEditingPaymentMethod(paymentMethod.id);
    setShowEditForm(true);
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Métodos de Pago</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configura los métodos de pago disponibles
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Método de Pago
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Crear Nuevo Método de Pago
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="label">Nombre *</label>
                      <input
                        {...register('name')}
                        type="text"
                        className="input"
                        placeholder="Efectivo, Tarjeta de Crédito, etc."
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Descuento (%) - Opcional</label>
                      <input
                        {...register('discount', { 
                          setValueAs: (value) => {
                            if (value === '') return undefined;
                            const parsed = parseFloat(value);
                            return isNaN(parsed) ? undefined : parsed;
                          }
                        })}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="input"
                        placeholder="Dejar vacío si no aplica descuento"
                      />
                      {errors.discount && (
                        <p className="mt-1 text-sm text-red-600">{errors.discount.message}</p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        Descuento aplicado automáticamente al usar este método de pago
                      </p>
                    </div>

                    <div className="flex items-center">
                      <input
                        {...register('is_active')}
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Método activo
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="btn-primary sm:ml-3 sm:w-auto w-full disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Creando...' : 'Crear Método'}
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

      {/* Filters and Search */}
      <FilterSortPanel
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar métodos de pago..."
        

        filterFields={[]}
        currentFilters={filters}
        onFiltersChange={setFilters}
      />

      {/* Payment Methods List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Cargando métodos de pago...</p>
            </div>
          ) : paymentMethods?.items.length === 0 ? (
            <div className="text-center">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay métodos de pago</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza creando tu primer método de pago.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {paymentMethods?.items.map((paymentMethod) => (
                <div
                  key={paymentMethod.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    paymentMethod.is_active
                      ? 'border-gray-200 hover:bg-gray-50'
                      : 'border-gray-300 bg-gray-50 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-lg font-medium ${
                          paymentMethod.is_active ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {paymentMethod.name}
                        </h4>
                        {!paymentMethod.is_active && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Inactivo
                          </span>
                        )}
                      </div>
                      {(paymentMethod.discount ?? 0) > 0 && (
                        <p className={`text-sm ${
                          paymentMethod.is_active ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          Descuento: {paymentMethod.discount}%
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Creado por {paymentMethod.created_by_username} el{' '}
                        {new Date(paymentMethod.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEdit(paymentMethod)}
                      className={`p-2 rounded-lg transition-colors ${
                        paymentMethod.is_active
                          ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          : 'text-gray-300 hover:text-gray-500 hover:bg-gray-200'
                      }`}
                      title="Editar método de pago"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Editar Método de Pago
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingPaymentMethod(null);
                      resetEdit();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div>
                  <label className="label">Nombre *</label>
                  <input
                    {...registerEdit('name')}
                    type="text"
                    className="input"
                    placeholder="Efectivo, Tarjeta de Crédito, etc."
                  />
                  {errorsEdit.name && (
                    <p className="mt-1 text-sm text-red-600">{errorsEdit.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Descuento (%) - Opcional</label>
                  <input
                    {...registerEdit('discount', { 
                      setValueAs: (value) => {
                        if (value === '') return undefined;
                        const parsed = parseFloat(value);
                        return isNaN(parsed) ? undefined : parsed;
                      }
                    })}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="input"
                    placeholder="Dejar vacío si no aplica descuento"
                  />
                  {errorsEdit.discount && (
                    <p className="mt-1 text-sm text-red-600">{errorsEdit.discount.message}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Descuento aplicado automáticamente al usar este método de pago
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    {...registerEdit('is_active')}
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-900">
                    Método activo
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingPaymentMethod(null);
                      resetEdit();
                    }}
                    className="btn-secondary flex-1"
                    disabled={updateMutation.isPending}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Actualizando...' : 'Actualizar Método'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 