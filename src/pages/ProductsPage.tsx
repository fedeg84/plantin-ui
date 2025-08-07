import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productApi, productTypeApi } from '../api/endpoints';
import { Plus, Package, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductTypeSelector from '../components/ProductTypeSelector';
import { FilterSortPanel } from '../components/FilterSortPanel';
import { SortableTableHeader } from '../components/SortableTableHeader';

const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  code: z.string().optional(),
  type_id: z.number().min(1, 'El tipo es requerido'),
  price: z.number().min(0, 'El precio debe ser mayor a 0').optional(),
  stock: z.number().min(0, 'El stock no puede ser negativo').optional(),
  current_price: z.number().min(0, 'El precio debe ser mayor a 0').optional(),
  current_stock: z.number().min(0, 'El stock no puede ser negativo').optional(),
  is_active: z.boolean().optional(),
});

type CreateProductForm = z.infer<typeof createProductSchema>;

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [page] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedEditProductType, setSelectedEditProductType] = useState<any>(null);
  const queryClient = useQueryClient();

  // Get product types for filter options
  const { data: productTypes } = useQuery({
    queryKey: ['product-types'],
    queryFn: () => productTypeApi.find({ size: 100 }),
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', { search, page, sortBy, sortOrder, filters }],
    queryFn: () => productApi.find({ 
      search, 
      page, 
      size: 10, 
      sort_by: sortBy,
      sort_order: sortOrder,
      type_ids: filters.type_ids,
      is_active: true  // Siempre mostrar solo productos activos
    }),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    formState: { errors: errorsEdit },
  } = useForm<CreateProductForm>({
    resolver: zodResolver(createProductSchema),
  });

  const { data: editProductData } = useQuery({
    queryKey: ['product', editingProduct],
    queryFn: () => productApi.getById(editingProduct!),
    enabled: !!editingProduct,
  });

  // Read URL parameters and apply filters on component mount
  useEffect(() => {
    const typeIdsParam = searchParams.get('type_ids');
    if (typeIdsParam) {
      const typeIds = typeIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (typeIds.length > 0) {
        setFilters(prev => ({
          ...prev,
          type_ids: typeIds
        }));
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (editProductData) {
      setValueEdit('name', editProductData.name);
      setValueEdit('description', editProductData.description || '');
      setValueEdit('code', editProductData.code || '');
      setValueEdit('type_id', editProductData.type_id);
      setValueEdit('current_price', editProductData.current_price);
      setValueEdit('current_stock', editProductData.current_stock);
      setValueEdit('is_active', editProductData.is_active);
      setSelectedEditProductType({ id: editProductData.type_id, name: editProductData.type_name });
    }
  }, [editProductData, setValueEdit]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateProductForm }) => 
      productApi.update(id, data),
    onSuccess: (_, { id }) => {
      // Invalidar tanto la lista como el elemento individual
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast.success('Producto actualizado exitosamente');
      resetEdit();
      setShowEditForm(false);
      setEditingProduct(null);
      setSelectedEditProductType(null);
    },
    onError: (error) => {
      toast.error('Error al actualizar el producto');
      console.error('Error updating product:', error);
    },
  });

  const onSubmitEdit = (data: CreateProductForm) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct, data });
    }
  };



  const handleDelete = async (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when clicking delete button
    if (!confirm(`¿Estás seguro de que quieres eliminar el producto "${name}"?`)) {
      return;
    }

    try {
      await productApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto eliminado correctamente');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const handleRowClick = (productId: number) => {
    // Navigate to product detail page
    window.location.href = `/products/${productId}`;
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Administra tu inventario de productos
          </p>
        </div>
        <button
          onClick={() => navigate('/products/create')}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Producto
        </button>
      </div>

      {/* Filters and Search */}
      <FilterSortPanel
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar productos por nombre, código o descripción..."
        filterFields={[
          {
            key: 'type_ids',
            label: 'Tipo de Producto',
            type: 'multiselect',
            options: productTypes?.items.map(type => ({
              value: type.id,
              label: type.name
            })) || []
          }
        ]}
        currentFilters={filters}
        onFiltersChange={setFilters}
      />

      {/* Products List */}
      <div className="bg-white shadow rounded-lg">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando productos...</p>
          </div>
        ) : products?.items.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin productos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando tu primer producto.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortableTableHeader
                    field="name"
                    currentSort={sortBy}
                    currentSortOrder={sortOrder}
                    onSortChange={(field, order) => {
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                  >
                    Producto
                  </SortableTableHeader>
                  <SortableTableHeader
                    field="code"
                    currentSort={sortBy}
                    currentSortOrder={sortOrder}
                    onSortChange={(field, order) => {
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                  >
                    Código
                  </SortableTableHeader>
                  <SortableTableHeader
                    field="current_price"
                    currentSort={sortBy}
                    currentSortOrder={sortOrder}
                    onSortChange={(field, order) => {
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                  >
                    Precio
                  </SortableTableHeader>
                  <SortableTableHeader
                    field="current_stock"
                    currentSort={sortBy}
                    currentSortOrder={sortOrder}
                    onSortChange={(field, order) => {
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                  >
                    Stock
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
                    Creado Por
                  </SortableTableHeader>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products?.items.map((product) => (
                  <tr 
                    key={product.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    onClick={() => handleRowClick(product.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.type_name}
                        </div>
                        {product.description && (
                          <div className="text-xs text-gray-400">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.current_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.current_stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.created_by_username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => handleDelete(product.id, product.name, e)}
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

      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Editar Producto
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingProduct(null);
                      setSelectedEditProductType(null);
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
                    placeholder="Nombre del producto"
                  />
                  {errorsEdit.name && (
                    <p className="mt-1 text-sm text-red-600">{errorsEdit.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Descripción</label>
                  <textarea
                    {...registerEdit('description')}
                    className="input"
                    rows={3}
                    placeholder="Descripción del producto"
                  />
                  {errorsEdit.description && (
                    <p className="mt-1 text-sm text-red-600">{errorsEdit.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Código</label>
                  <input
                    {...registerEdit('code')}
                    type="text"
                    className="input"
                    placeholder="Código del producto"
                  />
                  {errorsEdit.code && (
                    <p className="mt-1 text-sm text-red-600">{errorsEdit.code.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Tipo de Producto *</label>
                  <ProductTypeSelector
                    value={selectedEditProductType?.id || 0}
                    onChange={(typeId, productType) => {
                      setValueEdit('type_id', typeId);
                      setSelectedEditProductType(productType);
                    }}
                    placeholder="Seleccionar tipo de producto"
                  />
                  {errorsEdit.type_id && (
                    <p className="mt-1 text-sm text-red-600">{errorsEdit.type_id.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Precio</label>
                    <input
                      {...registerEdit('current_price', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      min="0"
                      className="input"
                      placeholder="0.00"
                    />
                    {errorsEdit.current_price && (
                      <p className="mt-1 text-sm text-red-600">{errorsEdit.current_price.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Stock</label>
                    <input
                      {...registerEdit('current_stock', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      className="input"
                      placeholder="0"
                    />
                    {errorsEdit.current_stock && (
                      <p className="mt-1 text-sm text-red-600">{errorsEdit.current_stock.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    {...registerEdit('is_active')}
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-900">
                    Producto activo
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingProduct(null);
                      setSelectedEditProductType(null);
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
                    {updateMutation.isPending ? 'Actualizando...' : 'Actualizar Producto'}
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