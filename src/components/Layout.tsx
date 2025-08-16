import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Menu, 
  X, 
  Plus, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  LogOut,
  Tags,
  Settings,
  User
} from 'lucide-react';
import { cn } from '../utils/cn';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [forceAdmin, setForceAdmin] = useState(false);
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  const navigation = [
    { name: 'Nueva Venta', href: '/sales/create', icon: Plus },
    { name: 'Ventas', href: '/sales', icon: ShoppingCart },
    { name: 'Productos', href: '/products', icon: Package },
    { name: 'Tipos de Producto', href: '/product-types', icon: Tags },
    { name: 'Métodos de Pago', href: '/payment-methods', icon: CreditCard },
  ];

  const adminNavigation = [
    { name: 'Panel de Admin', href: '/admin/dashboard', icon: Settings },
  ];

  const adminStatus = isAdmin();
  const user = useAuthStore.getState().getUser();
  console.log('Admin status:', adminStatus, 'User:', user); // Debug log
  
  // Temporary function to force admin mode for testing
  const forceAdminMode = () => {
    setForceAdmin(true);
    console.log('Admin mode forced!');
  };
  
  const finalAdminStatus = adminStatus || forceAdmin;
  
  const allNavigation = finalAdminStatus ? [...navigation, ...adminNavigation] : navigation;

  return (
    <div className="h-full flex">
      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-0 flex z-40 md:hidden',
        sidebarOpen ? '' : 'pointer-events-none'
      )}>
        <div className={cn(
          'fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity',
          sidebarOpen ? 'opacity-100' : 'opacity-0'
        )} onClick={() => setSidebarOpen(false)} />
        
        <div className={cn(
          'relative flex-1 flex flex-col max-w-xs w-full bg-white transition transform',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-2xl font-bold text-primary-600">Plantin</h1>
              {!finalAdminStatus && (
                <button
                  onClick={forceAdminMode}
                  className="ml-4 px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  title="Forzar modo admin (solo para testing)"
                >
                  Forzar Admin
                </button>
              )}
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {allNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'group flex items-center px-2 py-2 text-base font-medium rounded-md',
                      isActive
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex-shrink-0 border-t border-gray-200 p-4 space-y-2">
            <Link
              to="/profile"
              className="flex items-center text-gray-600 hover:text-gray-900 w-full"
            >
              <User className="mr-3 h-5 w-5" />
              Mi Perfil
            </Link>
            <button
              onClick={logout}
              className="flex items-center text-gray-600 hover:text-gray-900 w-full"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                                                                                                           <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-2xl font-bold text-primary-600">Plantin</h1>
                {!finalAdminStatus && (
                  <button
                    onClick={forceAdminMode}
                    className="ml-4 px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    title="Forzar modo admin (solo para testing)"
                  >
                    Forzar Admin
                  </button>
                )}
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {allNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                        isActive
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="flex-shrink-0 border-t border-gray-200 p-4 space-y-2">
              <Link
                to="/profile"
                className="flex items-center text-gray-600 hover:text-gray-900 w-full"
              >
                <User className="mr-3 h-5 w-5" />
                Mi Perfil
              </Link>
              <button
                onClick={logout}
                className="flex items-center text-gray-600 hover:text-gray-900 w-full"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 