import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package } from 'lucide-react';
import { productApi, saleApi, shiftApi, userApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import UserAvatar from '../components/UserAvatar';
import WeeklyShiftsCalendar from '../components/WeeklyShiftsCalendar';
import { formatDateTimeLocal } from '../utils/datetime';
import { lastSevenDaysTimeRange } from '../utils/lastSevenDaysRange';
import { buildRestockList } from '../utils/restockProducts';

export default function HomePage() {
  const navigate = useNavigate();
  const { getUser } = useAuthStore();
  const currentUser = getUser();
  const userId = currentUser?.id;

  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.getById(userId!),
    enabled: !!userId,
  });

  const { data: shiftsData, isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts', 'all'],
    queryFn: () => shiftApi.find({ size: 100, effective_for_current_week: true }),
    refetchOnMount: 'always',
  });

  const { min_time, max_time } = useMemo(() => lastSevenDaysTimeRange(), []);

  const { data: restockProducts = [], isLoading: restockLoading } = useQuery({
    queryKey: ['restock-products', min_time, max_time],
    queryFn: async () => {
      const [salesData, productsData] = await Promise.all([
        saleApi.find({
          min_time,
          max_time,
          size: 1000,
          sort_by: 'time',
          sort_order: 'desc',
        }),
        productApi.find({ size: 1000 }),
      ]);

      const productsById = new Map(productsData.items.map((product) => [product.id, product]));
      return buildRestockList(salesData.items, productsById);
    },
    refetchOnMount: 'always',
  });

  const shifts = shiftsData?.items ?? [];
  const displayName = user?.name || currentUser?.username || '';

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center gap-4">
        <UserAvatar
          pictureId={user?.picture_id}
          username={user?.username || currentUser?.username || ''}
          size="large"
          className="w-16 h-16 sm:w-20 sm:h-20"
        />
        <h1 className="page-title">
          Bienvenido, {displayName}!
        </h1>
      </div>

      <section className="card p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">
          Cronograma de la semana
        </h2>
        {shiftsLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
            <p className="mt-2 text-gray-600">Cargando turnos...</p>
          </div>
        ) : (
          <WeeklyShiftsCalendar shifts={shifts} readOnly />
        )}
      </section>

      <section className="card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-stone-900">Producto a reponer</h2>
        </div>

        {restockLoading ? (
          <div className="py-6 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Cargando productos...</p>
          </div>
        ) : restockProducts.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No hay productos para reponer</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="hidden sm:grid sm:grid-cols-[1fr_4rem_9rem_6rem] gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span>Producto</span>
              <span className="text-center">Stock</span>
              <span>Última venta</span>
              <span>Vendedor</span>
            </div>
            <ul className="divide-y divide-gray-100">
              {restockProducts.map(({ product, lastSaleTime, lastSaleByUsername }) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors sm:grid sm:grid-cols-[1fr_4rem_9rem_6rem] sm:gap-3 sm:items-center"
                  >
                    <span className="block text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </span>
                    <span className="flex sm:justify-center mt-1 sm:mt-0">
                      <span
                        className={`inline-flex items-center justify-center min-w-[1.75rem] px-1.5 py-0.5 rounded text-xs font-semibold ${
                          product.current_stock === 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {product.current_stock}
                      </span>
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5 sm:mt-0 sm:text-sm">
                      {formatDateTimeLocal(lastSaleTime)}
                    </span>
                    <span className="block text-xs text-gray-500 sm:text-sm truncate">
                      {lastSaleByUsername}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
