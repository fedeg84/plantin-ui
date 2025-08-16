import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, ShoppingCart, DollarSign, Users, Settings, Package, CreditCard } from 'lucide-react';
import { saleApi } from '../api/endpoints';
import { Sale } from '../types/api';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [today] = useState(new Date().toISOString().split('T')[0]);

  // Fetch today's sales
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales', 'today', today],
    queryFn: () => saleApi.find({ 
      size: 5,
      sort_by: 'time',
      sort_order: 'desc',
      min_time: today + 'T00:00:00',
      max_time: today + 'T23:59:59',
    }),
  });

  const todaySales = salesData?.items || [];
  const totalRevenue = todaySales.reduce((sum, sale) => sum + (sale.total_price || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with greeting and new sale button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Panel de Administración
          </h1>
          <p className="text-gray-600 mt-1">
            Resumen de ventas y estadísticas del día
          </p>
        </div>
        
        <button
          onClick={() => navigate('/sales/create')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Venta
        </button>
      </div>

      {/* Today's summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Revenue Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Recaudación del Día
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Sales Count Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Ventas del Día
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {todaySales.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Últimas Ventas del Día
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="px-6 py-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
              Cargando ventas...
            </div>
          ) : todaySales.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No hay ventas hoy</p>
              <p className="text-sm">Comienza creando tu primera venta del día</p>
            </div>
          ) : (
            todaySales.map((sale: Sale) => (
              <div key={sale.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/sales/${sale.id}`)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Venta #{sale.id}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTime(sale.time)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(sale.total_price || 0)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {sale.payment_methods?.[0]?.payment_method_name || 'Sin método de pago'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Admin Management Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Gestión del Sistema
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Administra usuarios, productos y configuraciones del sistema
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Users Management */}
            <div 
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => navigate('/admin/users')}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Gestión de Usuarios</h3>
                  <p className="text-xs text-gray-500">Administrar usuarios del sistema</p>
                </div>
              </div>
            </div>

            {/* Products Management */}
            <div 
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => navigate('/products')}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Gestión de Productos</h3>
                  <p className="text-xs text-gray-500">Administrar productos y tipos</p>
                </div>
              </div>
            </div>

            {/* Payment Methods Management */}
            <div 
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => navigate('/payment-methods')}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Métodos de Pago</h3>
                  <p className="text-xs text-gray-500">Configurar métodos de pago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
