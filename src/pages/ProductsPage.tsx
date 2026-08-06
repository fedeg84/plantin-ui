import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { productApi, productTypeApi, paymentMethodApi } from '../api/endpoints';
import { Plus, Package } from 'lucide-react';
import { FilterSortPanel } from '../components/FilterSortPanel';
import { SortableTableHeader } from '../components/SortableTableHeader';
import { navigateWithReturn } from '../utils/navigation';

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [page] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, any>>({});

  const { data: productTypes } = useQuery({
    queryKey: ['product-types'],
    queryFn: () => productTypeApi.find({ size: 100 }),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods', 'efectivo-column'],
    queryFn: () => paymentMethodApi.find({ size: 100, is_active: true }),
  });

  const efectivoDiscount = useMemo(() => {
    const efectivo = paymentMethods?.items.find(
      (pm) => pm.name.trim().toLowerCase() === 'efectivo'
    );
    const discount = efectivo?.discount ?? 0;
    return discount > 0 ? discount : null;
  }, [paymentMethods]);

  const formatEfectivoPrice = (price: number) =>
    `$${(price * (1 - (efectivoDiscount ?? 0) / 100)).toFixed(2)}`;

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', { search, page, sortBy, sortOrder, filters }],
    queryFn: () => productApi.find({ 
      search, 
      page, 
      size: 10, 
      sort_by: sortBy,
      sort_order: sortOrder,
      type_ids: filters.type_ids,
      is_active: true
    }),
  });

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

  const openProduct = (productId: number) => {
    navigate(`/products/${productId}`);
  };

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => navigateWithReturn(navigate, location, '/products/create')}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Producto
        </button>
      </div>

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

      <div className="hidden md:block bg-white shadow rounded-lg">
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
                  {efectivoDiscount !== null && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Efectivo (-{efectivoDiscount}%)
                    </th>
                  )}
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
                    Atributos
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products?.items.map((product) => (
                  <tr 
                    key={product.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    onClick={() => openProduct(product.id)}
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
                    {efectivoDiscount !== null && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatEfectivoPrice(product.current_price)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.current_stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.created_by_username}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.attributes && product.attributes.length > 0 ? (
                        <div className="space-y-1">
                          {product.attributes.slice(0, 3).map((attr, index) => (
                            <div key={index} className="flex items-center space-x-1">
                              <span className="text-xs font-medium text-gray-600 min-w-0 truncate">
                                {attr.attribute_type_name}:
                              </span>
                              <span className="text-xs text-gray-900 min-w-0 truncate">
                                {attr.value}
                              </span>
                            </div>
                          ))}
                          {product.attributes.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{product.attributes.length - 3} más...
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin atributos</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2">Cargando productos...</p>
          </div>
        ) : products?.items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin productos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando tu primer producto.
            </p>
          </div>
        ) : (
          products?.items.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openProduct(product.id)}
            >
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  Código: {product.code}
                </p>
                <p className="text-lg font-semibold text-green-600 mb-2">
                  ${product.current_price.toFixed(2)}
                  {efectivoDiscount !== null && (
                    <span className="ml-2 text-base font-medium text-gray-700">
                      · Efectivo: {formatEfectivoPrice(product.current_price)}
                    </span>
                  )}
                </p>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Stock:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {product.current_stock} unidades
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Tipo:</span>
                  <span className="text-sm text-gray-900">
                    {product.type_name}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Creado por:</span>
                  <span className="text-sm text-gray-900">
                    {product.created_by_username}
                  </span>
                </div>
                
                {product.attributes && product.attributes.length > 0 && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-gray-500 block mb-1">Atributos:</span>
                    <div className="space-y-1">
                      {product.attributes?.map((attr) => (
                        <div key={attr.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{attr.attribute_type_name}:</span>
                          <span className="text-gray-900">{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

