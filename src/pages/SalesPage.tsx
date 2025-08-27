import { useState } from 'react';
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { saleApi, productApi, paymentMethodApi } from '../api/endpoints';
import { Plus, ShoppingCart, Trash2, Eye, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { FilterSortPanel } from '../components/FilterSortPanel';
import { SortableTableHeader } from '../components/SortableTableHeader';
import { useNavigate } from 'react-router-dom';

export default function SalesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page] = useState(0);
  const [sortBy, setSortBy] = useState('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, any>>({});
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
      return saleApi.find(queryParams);
    },
  });

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleView = (saleId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/sales/${saleId}`);
  };

  const handleEdit = (saleId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/sales/${saleId}/edit`);
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
          onClick={() => navigate('/sales/create')}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Venta
        </button>
      </div>

      {/* Filters */}
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

      {/* Desktop Sales Table - Hidden on mobile */}
      <div className="hidden md:block bg-white shadow rounded-lg">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Métodos de Pago
                  </th>
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
                    className="hover:bg-gray-50 transition-colors duration-150"
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
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sale.payment_methods && sale.payment_methods.length > 0 ? (
                        <div className="space-y-1">
                          {sale.payment_methods.map((pm, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <div className="flex items-center">
                                <span className="font-medium">{pm.payment_method_name}</span>
                                {pm.discount_percentage > 0 && (
                                  <span className="text-orange-600 text-xs ml-1">
                                    (-{pm.discount_percentage}%)
                                  </span>
                                )}
                                <span className="text-gray-500">:</span>
                              </div>
                              <span className="text-green-600">
                                ${pm.amount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin métodos de pago</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-semibold text-green-600">
                        ${sale.total_price.toFixed(2)}
                      </span>
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
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => handleView(sale.id, e)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors duration-150"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleEdit(sale.id, e)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors duration-150"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(sale.id, e)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors duration-150"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Sales Cards - Hidden on desktop */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2">Cargando ventas...</p>
          </div>
        ) : sales?.items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin ventas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza registrando tu primera venta.
            </p>
          </div>
        ) : (
          sales?.items.map((sale) => (
            <div key={sale.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">Venta #{sale.id}</h3>
                    <span className="text-sm text-gray-500">
                      {new Date(sale.time).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Vendedor: {sale.created_by_username}
                  </p>
                  <p className="text-lg font-semibold text-green-600">
                    ${sale.total_price.toFixed(2)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => handleView(sale.id, e)}
                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors duration-150"
                    title="Ver detalles"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => handleEdit(sale.id, e)}
                    className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors duration-150"
                    title="Editar"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(sale.id, e)}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors duration-150"
                    title="Eliminar"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 border-t pt-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Productos:</h4>
                <div className="space-y-1">
                  {sale.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.product.name} x{item.quantity}
                      </span>
                      <span className="text-gray-900 font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Métodos de pago:</span>
                    <div className="text-right">
                      {sale.payment_methods.map((pm) => (
                        <div key={pm.id} className="text-gray-900">
                          {pm.payment_method_name}: ${pm.amount.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 