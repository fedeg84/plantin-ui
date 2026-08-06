import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, ShoppingCart, DollarSign } from 'lucide-react';
import { saleApi, productApi, paymentMethodApi } from '../api/endpoints';
import { Sale } from '../types/api';
import SaleDateFilter from '../components/SaleDateFilter';
import { FilterSortPanel } from '../components/FilterSortPanel';
import { formatTimeLocal } from '../utils/datetime';
import { saleTimeRange, toDateInputValue, isSaleDateRangeValid } from '../utils/saleDateRange';

const PAGE_SIZE = 20;

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const today = useMemo(() => toDateInputValue(), []);

  const [selectRange, setSelectRange] = useState(false);
  const [singleDate, setSingleDate] = useState(today);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const { min_time, max_time } = saleTimeRange(selectRange, singleDate, dateFrom, dateTo);
  const rangeValid = isSaleDateRangeValid(selectRange, dateFrom, dateTo);

  const baseQueryParams = {
    search,
    sort_by: 'time' as const,
    sort_order: 'desc' as const,
    created_by_ids: filters.created_by_ids,
    payment_method_ids: filters.payment_method_ids,
    product_ids: filters.product_ids,
    min_time,
    max_time,
    min_total_price: filters.min_total_price,
    max_total_price: filters.max_total_price,
  };

  const { data: products } = useQuery({
    queryKey: ['products-filter'],
    queryFn: () => productApi.find({ size: 100, is_active: true }),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods-filter'],
    queryFn: () => paymentMethodApi.find({ size: 50, is_active: true }),
  });

  const { data: allSalesData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['sales', 'admin-history-stats', baseQueryParams],
    queryFn: () =>
      saleApi.find({
        ...baseQueryParams,
        size: 1000,
        page: 0,
      }),
    enabled: rangeValid,
  });

  const { data: salesData, isLoading: isLoadingList } = useQuery({
    queryKey: ['sales', 'admin-history-list', { ...baseQueryParams, page }],
    queryFn: () =>
      saleApi.find({
        ...baseQueryParams,
        size: PAGE_SIZE,
        page,
      }),
    enabled: rangeValid,
  });

  const sales = salesData?.items || [];
  const allSales = allSalesData?.items || [];
  const totalRevenue = allSales.reduce((sum, sale) => sum + (sale.total_price || 0), 0);
  const totalSalesCount = allSales.length;
  const totalPages = salesData?.pagination.total_pages ?? 1;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatTime = (dateString: string) => formatTimeLocal(dateString);

  const openSale = (saleId: number) => navigate(`/sales/${saleId}/edit`);

  const handleFiltersChange = (next: Record<string, any>) => {
    setFilters(next);
    setPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const resetPage = () => setPage(0);

  const handleSelectRangeChange = (value: boolean) => {
    if (value) {
      setDateFrom(singleDate);
      setDateTo((current) => (current < singleDate ? singleDate : current));
    } else {
      setSingleDate(dateFrom);
    }
    setSelectRange(value);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de ventas</h1>
        </div>

        <button
          onClick={() => navigate('/sales/create')}
          className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Venta
        </button>
      </div>

      <SaleDateFilter
        selectRange={selectRange}
        onSelectRangeChange={handleSelectRangeChange}
        singleDate={singleDate}
        onSingleDateChange={(value) => {
          setSingleDate(value);
          resetPage();
        }}
        dateFrom={dateFrom}
        onDateFromChange={(value) => {
          setDateFrom(value);
          resetPage();
        }}
        dateTo={dateTo}
        onDateToChange={(value) => {
          setDateTo(value);
          resetPage();
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recaudación</p>
              <p className="text-2xl font-semibold text-gray-900">
                {!rangeValid ? '—' : isLoadingStats ? '...' : formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ventas realizadas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {!rangeValid ? '—' : isLoadingStats ? '...' : totalSalesCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <FilterSortPanel
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar ventas por producto, vendedor..."
        filterFields={[
          {
            key: 'payment_method_ids',
            label: 'Método de Pago',
            type: 'multiselect',
            placeholder: 'Buscar métodos de pago...',
            options:
              paymentMethods?.items.map((pm) => ({
                value: pm.id,
                label: pm.name,
              })) || [],
          },
          {
            key: 'product_ids',
            label: 'Productos',
            type: 'multiselect',
            placeholder: 'Buscar productos...',
            options:
              products?.items.map((product) => ({
                value: product.id,
                label: product.name,
              })) || [],
          },
          {
            key: 'min_total_price',
            label: 'Precio mínimo',
            type: 'money',
            placeholder: '0.00',
            min: 0,
          },
          {
            key: 'max_total_price',
            label: 'Precio máximo',
            type: 'money',
            placeholder: '9999.99',
            min: 0,
          },
        ]}
        currentFilters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Ventas</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {!rangeValid ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p className="text-sm text-red-600">
                Corregí el rango de fechas para ver las ventas
              </p>
            </div>
          ) : isLoadingList ? (
            <div className="px-6 py-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
              Cargando ventas...
            </div>
          ) : sales.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No hay ventas</p>
              <p className="text-sm">Probá cambiar la fecha o los filtros</p>
            </div>
          ) : (
            sales.map((sale: Sale) => {
              const maxVisibleProducts = 4;
              const visibleItems = sale.items?.slice(0, maxVisibleProducts) || [];
              const hasMoreProducts = sale.items && sale.items.length > maxVisibleProducts;

              return (
                <div
                  key={sale.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => openSale(sale.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-primary-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        {visibleItems.length > 0 ? (
                          <div className="space-y-1">
                            {visibleItems.map((item, index) => (
                              <p key={index} className="text-sm text-gray-900 truncate">
                                {item.product.name}{' '}
                                {item.quantity > 1 && (
                                  <span className="text-gray-500">x{item.quantity}</span>
                                )}
                              </p>
                            ))}
                            {hasMoreProducts && (
                              <p className="text-xs text-gray-400 italic">
                                +{sale.items!.length - maxVisibleProducts} producto
                                {sale.items!.length - maxVisibleProducts > 1 ? 's' : ''} más
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Sin productos</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(sale.time)}
                          {sale.created_by_username ? ` · ${sale.created_by_username}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(sale.total_price || 0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {sale.payment_methods?.[0]?.payment_method_name || 'Sin método'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 sm:px-6 border-t border-gray-200">
            <div className="flex justify-between gap-3 sm:hidden">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-secondary flex-1 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="btn-secondary flex-1 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-secondary disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {page + 1} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="btn-secondary disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
