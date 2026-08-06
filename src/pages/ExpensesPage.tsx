import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { expenseApi, paymentMethodApi, expenseTypeApi } from '../api/endpoints';
import { Plus, DollarSign } from 'lucide-react';
import { FilterSortPanel } from '../components/FilterSortPanel';
import { SortableTableHeader } from '../components/SortableTableHeader';
import ExpenseDateFilter from '../components/ExpenseDateFilter';
import { formatApiDateOnly } from '../utils/datetime';
import { useNavigate } from 'react-router-dom';
import {
  expenseDateRange,
  isExpenseDateRangeValid,
  monthBounds,
  toDateInputValue,
  toMonthInputValue,
} from '../utils/expenseDateRange';

const PAGE_SIZE = 10;

export default function ExpensesPage() {
  const navigate = useNavigate();
  const currentMonth = useMemo(() => toMonthInputValue(), []);
  const today = useMemo(() => toDateInputValue(), []);

  const [selectRange, setSelectRange] = useState(false);
  const [singleMonth, setSingleMonth] = useState(currentMonth);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, any>>({});

  const { min_date, max_date } = expenseDateRange(selectRange, singleMonth, dateFrom, dateTo);
  const rangeValid = isExpenseDateRangeValid(selectRange, dateFrom, dateTo);

  const baseQueryParams = {
    search,
    sort_by: sortBy,
    sort_order: sortOrder,
    created_by_ids: filters.created_by_ids,
    payment_method_ids: filters.payment_method_ids,
    expense_type_ids: filters.expense_type_ids,
    min_date,
    max_date,
    min_amount: filters.min_amount,
    max_amount: filters.max_amount,
  };

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods-filter'],
    queryFn: () => paymentMethodApi.find({ size: 50, is_active: true }),
  });

  const { data: expenseTypes } = useQuery({
    queryKey: ['expense-types-filter'],
    queryFn: () => expenseTypeApi.find({ size: 50 }),
  });

  const { data: allExpensesData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['expenses', 'stats', baseQueryParams],
    queryFn: () =>
      expenseApi.find({
        ...baseQueryParams,
        size: 1000,
        page: 0,
      }),
    enabled: rangeValid,
  });

  const { data: expensesData, isLoading: isLoadingList } = useQuery({
    queryKey: ['expenses', 'list', { ...baseQueryParams, page }],
    queryFn: () =>
      expenseApi.find({
        ...baseQueryParams,
        size: PAGE_SIZE,
        page,
      }),
    enabled: rangeValid,
  });

  const expenses = expensesData?.items || [];
  const allExpenses = allExpensesData?.items || [];
  const totalExpensesAmount = allExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const totalPages = expensesData?.pagination.total_pages ?? 1;

  const openExpense = (expenseId: number) => navigate(`/admin/expenses/${expenseId}/edit`);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => formatApiDateOnly(dateString);

  const resetPage = () => setPage(0);

  const handleFiltersChange = (next: Record<string, any>) => {
    setFilters(next);
    resetPage();
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    resetPage();
  };

  const handleSelectRangeChange = (value: boolean) => {
    if (value) {
      const bounds = monthBounds(singleMonth);
      setDateFrom(bounds.min_date);
      setDateTo(bounds.max_date);
    } else {
      setSingleMonth(dateFrom.slice(0, 7));
    }
    setSelectRange(value);
    resetPage();
  };

  const emptyStateMessage = !rangeValid
    ? 'Corregí el rango de fechas para ver los pagos'
    : 'Probá cambiar el mes o los filtros';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-end">
        <button
          onClick={() => navigate('/admin/expenses/create')}
          className="btn-primary flex items-center justify-center w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pago
        </button>
      </div>

      <ExpenseDateFilter
        selectRange={selectRange}
        onSelectRangeChange={handleSelectRangeChange}
        singleMonth={singleMonth}
        onSingleMonthChange={(value) => {
          setSingleMonth(value);
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

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <DollarSign className="h-8 w-8 text-red-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total gastos</p>
            <p className="text-2xl font-semibold text-gray-900">
              {!rangeValid ? '—' : isLoadingStats ? '...' : formatCurrency(totalExpensesAmount)}
            </p>
          </div>
        </div>
      </div>

      <FilterSortPanel
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar pagos por descripción..."
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
            key: 'expense_type_ids',
            label: 'Tipo de Pago',
            type: 'multiselect',
            placeholder: 'Buscar tipos de pago...',
            options:
              expenseTypes?.items.map((et) => ({
                value: et.id,
                label: et.name,
              })) || [],
          },
          {
            key: 'min_amount',
            label: 'Monto mínimo',
            type: 'money',
            placeholder: '0.00',
            min: 0,
          },
          {
            key: 'max_amount',
            label: 'Monto máximo',
            type: 'money',
            placeholder: '99999.99',
            min: 0,
          },
        ]}
        currentFilters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <div className="hidden md:block bg-white shadow rounded-lg">
        {!rangeValid ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">{emptyStateMessage}</p>
          </div>
        ) : isLoadingList ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando pagos...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin pagos</h3>
            <p className="mt-1 text-sm text-gray-500">{emptyStateMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortableTableHeader
                    field="date"
                    currentSort={sortBy}
                    currentSortOrder={sortOrder}
                    onSortChange={(field, order) => {
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                  >
                    Fecha
                  </SortableTableHeader>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método de Pago
                  </th>
                  <SortableTableHeader
                    field="amount"
                    currentSort={sortBy}
                    currentSortOrder={sortOrder}
                    onSortChange={(field, order) => {
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                  >
                    Monto
                  </SortableTableHeader>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creado por
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => openExpense(expense.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.expense_type_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={expense.description}>
                        {expense.description || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.payment_method_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-semibold text-red-600">
                        {formatCurrency(expense.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.created_by_username || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="md:hidden space-y-4">
        {!rangeValid ? (
          <div className="bg-white rounded-lg shadow p-4 text-center text-red-600 text-sm">
            {emptyStateMessage}
          </div>
        ) : isLoadingList ? (
          <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2">Cargando pagos...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin pagos</h3>
            <p className="mt-1 text-sm text-gray-500">{emptyStateMessage}</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openExpense(expense.id)}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">Pago #{expense.id}</h3>
                  <span className="text-sm text-gray-500">{formatDate(expense.date)}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {expense.expense_type_name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mb-1">{expense.description || '—'}</p>
                <p className="text-sm text-gray-500 mb-2">
                  {expense.payment_method_name || 'N/A'}
                </p>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency(expense.amount)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Creado por: {expense.created_by_username || 'N/A'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {rangeValid && totalPages > 1 && (
        <div className="bg-white shadow rounded-lg px-4 py-3 sm:px-6">
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
  );
}
