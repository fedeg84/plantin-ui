import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { expenseTypeApi } from '../api/endpoints';
import { Plus, Tag, X, ChevronRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../hooks/useConfirm';
import { FilterSortPanel } from '../components/FilterSortPanel';
import type { ExpenseType } from '../types/api';
import {
  buildExpenseTypeHierarchy,
  filterExpenseTypesBySearch,
  flattenExpenseTypeOptions,
  type HierarchicalExpenseType,
} from '../utils/expenseTypeHierarchy';
import { formatDateLocal } from '../utils/datetime';

const createExpenseTypeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre no puede exceder 255 caracteres'),
  parent_id: z.string().optional(),
});

const editExpenseTypeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre no puede exceder 255 caracteres'),
});

type CreateExpenseTypeForm = z.infer<typeof createExpenseTypeSchema>;
type EditExpenseTypeForm = z.infer<typeof editExpenseTypeSchema>;

export default function ExpenseTypesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingType, setEditingType] = useState<ExpenseType | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirm();

  const createForm = useForm<CreateExpenseTypeForm>({
    resolver: zodResolver(createExpenseTypeSchema),
    defaultValues: { parent_id: '' },
  });

  const editForm = useForm<EditExpenseTypeForm>({
    resolver: zodResolver(editExpenseTypeSchema),
  });

  const { data: expenseTypes, isLoading } = useQuery({
    queryKey: ['expense-types', { search: '', size: 1000 }],
    queryFn: () =>
      expenseTypeApi.find({
        size: 1000,
        sort_by: 'name',
        sort_order: 'asc',
      }),
  });

  const hierarchicalTypes = useMemo(
    () => (expenseTypes ? buildExpenseTypeHierarchy(expenseTypes.items) : []),
    [expenseTypes]
  );

  const visibleHierarchy = useMemo(
    () => filterExpenseTypesBySearch(hierarchicalTypes, search),
    [hierarchicalTypes, search]
  );

  const parentOptions = useMemo(
    () => flattenExpenseTypeOptions(hierarchicalTypes),
    [hierarchicalTypes]
  );

  const createMutation = useMutation({
    mutationFn: expenseTypeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-types'] });
      toast.success('Tipo de pago creado exitosamente');
      createForm.reset({ parent_id: '' });
      setShowCreateForm(false);
    },
    onError: () => {
      toast.error('Error al crear el tipo de pago');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditExpenseTypeForm }) =>
      expenseTypeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-types'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Tipo de pago actualizado exitosamente');
      setEditingType(null);
    },
    onError: () => {
      toast.error('Error al actualizar el tipo de pago');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expenseTypeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-types'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Tipo de pago eliminado exitosamente');
      setEditingType(null);
    },
    onError: () => {
      toast.error('Error al eliminar el tipo de pago');
    },
  });

  const openCreateForm = (parentId: number | null = null) => {
    createForm.reset({
      name: '',
      parent_id: parentId ? String(parentId) : '',
    });
    setShowCreateForm(true);
  };

  const openEditForm = (type: HierarchicalExpenseType) => {
    editForm.reset({ name: type.name });
    setEditingType({
      id: type.id,
      name: type.name,
      parent_id: type.parent_id,
      parent_name: type.parent_name,
      created_at: type.created_at,
      created_by_username: type.created_by_username,
    });
  };

  const toggleExpanded = (typeId: number) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) next.delete(typeId);
      else next.add(typeId);
      return next;
    });
  };

  const onCreateSubmit = (data: CreateExpenseTypeForm) => {
    const parentId = data.parent_id ? parseInt(data.parent_id, 10) : undefined;
    createMutation.mutate({
      name: data.name,
      parent_id: parentId && !Number.isNaN(parentId) ? parentId : null,
    });
  };

  const onEditSubmit = (data: EditExpenseTypeForm) => {
    if (!editingType) return;
    updateMutation.mutate({ id: editingType.id, data });
  };

  const handleDelete = async () => {
    if (!editingType) return;
    const confirmed = await confirm({
      title: 'Eliminar tipo de pago',
      message:
        '¿Estás seguro de que quieres eliminar este tipo de pago? Los subtipos quedarán como tipos raíz.',
      confirmLabel: 'Eliminar',
    });
    if (confirmed) {
      deleteMutation.mutate(editingType.id);
    }
  };

  const renderTypeItem = (type: HierarchicalExpenseType, level = 0) => {
    const isExpanded = expandedTypes.has(type.id);
    const hasChildren = type.children.length > 0;

    return (
      <div key={type.id}>
        <div
          className={`flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 min-h-[56px] hover:bg-gray-50 ${
            level > 0 ? 'bg-gray-50/50' : ''
          }`}
          style={{ paddingLeft: `${16 + level * 20}px` }}
        >
          <button
            type="button"
            onClick={() => openEditForm(type)}
            className="flex-1 text-left min-w-0"
          >
            <div className="text-sm font-medium text-gray-900 truncate">{type.name}</div>
            <div className="text-xs text-gray-500 truncate">
              Creado por {type.created_by_username || 'N/A'} el{' '}
              {formatDateLocal(type.created_at)}
            </div>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => openCreateForm(type.id)}
              className="p-2 text-gray-400 hover:text-primary-600 rounded-md"
              title="Agregar subtipo"
            >
              <Plus className="h-4 w-4" />
            </button>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpanded(type.id)}
                className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-gray-200 rounded-md"
                aria-label={isExpanded ? 'Contraer' : 'Expandir'}
              >
                <ChevronRight
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
            ) : (
              <div className="w-11" />
            )}
          </div>
        </div>

        {hasChildren && isExpanded && type.children.map((child) => renderTypeItem(child, level + 1))}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-end">
        <button onClick={() => openCreateForm(null)} className="btn-primary flex items-center justify-center w-full sm:w-auto">
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Tipo de Pago
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowCreateForm(false);
                createForm.reset({ parent_id: '' });
              }}
            />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Crear Nuevo Tipo de Pago</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        createForm.reset({ parent_id: '' });
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="label">Tipo padre</label>
                      <select {...createForm.register('parent_id')} className="input">
                        <option value="">Sin padre (tipo raíz)</option>
                        {parentOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label">Nombre *</label>
                      <input
                        {...createForm.register('name')}
                        type="text"
                        className="input"
                        placeholder="Ej: Sueldo, Compra plantas, etc."
                        maxLength={255}
                        autoFocus
                      />
                      {createForm.formState.errors.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {createForm.formState.errors.name.message}
                        </p>
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
                    {createMutation.isPending ? 'Creando...' : 'Crear Tipo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      createForm.reset({ parent_id: '' });
                    }}
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

      {editingType && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setEditingType(null)}
            />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Editar Tipo de Pago</h3>
                    <button
                      type="button"
                      onClick={() => setEditingType(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div>
                    <label className="label">Nombre *</label>
                    <input
                      {...editForm.register('name')}
                      type="text"
                      className="input"
                      maxLength={255}
                      autoFocus
                    />
                    {editForm.formState.errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {editForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending || updateMutation.isPending}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                  </button>
                  <div className="flex flex-col-reverse sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingType(null)}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending || deleteMutation.isPending}
                      className="btn-primary disabled:opacity-50"
                    >
                      {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <FilterSortPanel
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar tipos de pagos..."
        filterFields={[]}
        currentFilters={filters}
        onFiltersChange={setFilters}
      />

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Cargando tipos de pagos...</p>
          </div>
        ) : visibleHierarchy.length === 0 ? (
          <div className="p-8 text-center">
            <Tag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tipos de pagos</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search.trim()
                ? 'No se encontraron tipos que coincidan con la búsqueda.'
                : 'Comienza creando tu primer tipo de pago.'}
            </p>
          </div>
        ) : (
          <div>{visibleHierarchy.map((type) => renderTypeItem(type))}</div>
        )}
      </div>
      {ConfirmDialog}
    </div>
  );
}
