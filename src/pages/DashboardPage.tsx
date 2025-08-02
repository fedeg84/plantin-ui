import { Package, ShoppingCart, CreditCard, Users } from 'lucide-react';

const stats = [
  { name: 'Total Productos', value: '0', icon: Package, color: 'bg-blue-500' },
  { name: 'Ventas del Mes', value: '0', icon: ShoppingCart, color: 'bg-green-500' },
  { name: 'Métodos de Pago', value: '0', icon: CreditCard, color: 'bg-purple-500' },
  { name: 'Usuarios Activos', value: '0', icon: Users, color: 'bg-orange-500' },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Resumen de tu sistema de gestión
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
          >
            <dt>
              <div className={`absolute ${item.color} rounded-md p-3`}>
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                {item.name}
              </p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">
                {item.value}
              </p>
            </dd>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Bienvenido a Plantin
        </h2>
        <p className="text-gray-600">
          Sistema de gestión completo para tu negocio. Administra productos, ventas,
          métodos de pago y mucho más desde una interfaz moderna y fácil de usar.
        </p>
        
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="border border-gray-200 rounded-lg p-4">
            <Package className="h-8 w-8 text-blue-500 mb-2" />
            <h3 className="font-medium text-gray-900">Gestión de Productos</h3>
            <p className="text-sm text-gray-600 mt-1">
              Crea y administra tu inventario de productos
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <ShoppingCart className="h-8 w-8 text-green-500 mb-2" />
            <h3 className="font-medium text-gray-900">Control de Ventas</h3>
            <p className="text-sm text-gray-600 mt-1">
              Registra y sigue tus ventas en tiempo real
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <CreditCard className="h-8 w-8 text-purple-500 mb-2" />
            <h3 className="font-medium text-gray-900">Métodos de Pago</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configura diferentes formas de pago
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 