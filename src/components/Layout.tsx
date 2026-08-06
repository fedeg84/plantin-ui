import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/endpoints';
import { 
  Menu, 
  X, 
  Plus, 
  Package, 
  ShoppingCart, 
  LogOut,
  Settings,
  User,
  Clock,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Users,
  DollarSign,
  History
} from 'lucide-react';
import { cn } from '../utils/cn';
import UserAvatar from './UserAvatar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const { getUser } = useAuthStore();
  const currentUser = getUser();
  const userId = currentUser?.id;

  // Get current user details for avatar
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.getById(userId!),
    enabled: !!userId,
  });

  const [expandedAdminMenu, setExpandedAdminMenu] = useState(false);

  const isProductsSection = (pathname: string) =>
    pathname === '/products' ||
    pathname.startsWith('/products/') ||
    pathname.startsWith('/product-types');

  const isPaymentsSection = (pathname: string) =>
    pathname === '/admin/payments' ||
    pathname.startsWith('/admin/payments/') ||
    pathname.startsWith('/admin/expenses') ||
    pathname.startsWith('/admin/expense-types');

  const navigation = [
    { name: 'Nueva Venta', href: '/sales/create', icon: Plus },
    { name: 'Ventas', href: '/sales', icon: ShoppingCart },
    { name: 'Productos', href: '/products', icon: Package, isActive: isProductsSection },
  ];

  const adminSubItems = [
    { name: 'Historial de ventas', href: '/admin/dashboard', icon: History },
    { name: 'Gestión de Usuarios', href: '/admin/users', icon: Users },
    { name: 'Métodos de Pago', href: '/payment-methods', icon: CreditCard },
    { name: 'Pagos', href: '/admin/payments', icon: DollarSign, isActive: isPaymentsSection },
    { name: 'Turnos', href: '/admin/shifts', icon: Clock },
  ];

  const adminNavigation = {
    name: 'Panel de Admin',
    href: '/admin/dashboard',
    icon: Settings,
    subItems: adminSubItems,
  };

  const adminStatus = isAdmin();
  
  // Expand admin submenu when entering an admin route
  useEffect(() => {
    const isAdminPage =
      location.pathname.startsWith('/admin') || location.pathname === '/payment-methods';
    if (isAdminPage) {
      setExpandedAdminMenu(true);
    }
  }, [location.pathname]);

  const toggleAdminMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedAdminMenu((prev) => !prev);
  };

  const allNavigation = adminStatus ? [...navigation, adminNavigation] : navigation;

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
          {sidebarOpen && (
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
          )}
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Link to="/sales/create" className="text-2xl font-bold text-primary-600 hover:text-primary-700 cursor-pointer">
                Plantin
              </Link>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {allNavigation.map((item) => {
                if (item.subItems && item.subItems.length > 0) {
                  // Admin menu with subitems
                  const isParentActive = location.pathname === item.href;
                  const isAnyChildActive = item.subItems.some((subItem) =>
                    subItem.isActive
                      ? subItem.isActive(location.pathname)
                      : location.pathname === subItem.href ||
                        location.pathname.startsWith(`${subItem.href}/`)
                  );
                  const isExpanded = expandedAdminMenu;
                  
                  return (
                    <div key={item.name}>
                      <div
                        className={cn(
                          'group flex items-center justify-between px-2 py-2 text-base font-medium rounded-md',
                          (isParentActive || isAnyChildActive)
                            ? 'bg-primary-100 text-primary-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <div
                          onClick={() => {
                            navigate(item.href);
                            setSidebarOpen(false);
                          }}
                          className="flex flex-1 items-center cursor-pointer min-w-0"
                        >
                          <item.icon className="mr-4 h-6 w-6 shrink-0" />
                          {item.name}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            toggleAdminMenu(e);
                          }}
                          className="ml-2 p-1 rounded hover:bg-black/5 shrink-0"
                          aria-label={isExpanded ? 'Contraer menú de admin' : 'Expandir menú de admin'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.subItems.map((subItem) => {
                            const isSubActive = subItem.isActive
                              ? subItem.isActive(location.pathname)
                              : location.pathname === subItem.href ||
                                location.pathname.startsWith(`${subItem.href}/`);
                            return (
                              <Link
                                key={subItem.name}
                                to={subItem.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                                  isSubActive
                                    ? 'bg-primary-100 text-primary-900'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                )}
                              >
                                <subItem.icon className="mr-3 h-5 w-5" />
                                {subItem.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // Regular menu item
                  const isActive = item.isActive
                    ? item.isActive(location.pathname)
                    : location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
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
                }
              })}
            </nav>
          </div>
          
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <Link to="/sales/create" className="text-2xl font-bold text-primary-600 hover:text-primary-700 cursor-pointer">
                  Plantin
                </Link>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {allNavigation.map((item) => {
                  if (item.subItems && item.subItems.length > 0) {
                    // Admin menu with subitems
                    const isParentActive = location.pathname === item.href;
                    const isAnyChildActive = item.subItems.some((subItem) =>
                    subItem.isActive
                      ? subItem.isActive(location.pathname)
                      : location.pathname === subItem.href ||
                        location.pathname.startsWith(`${subItem.href}/`)
                  );
                    const isExpanded = expandedAdminMenu;
                    
                    return (
                      <div key={item.name}>
                        <div
                          className={cn(
                            'group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md',
                            (isParentActive || isAnyChildActive)
                              ? 'bg-primary-100 text-primary-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          <div
                            onClick={() => navigate(item.href)}
                            className="flex flex-1 items-center cursor-pointer min-w-0"
                          >
                            <item.icon className="mr-3 h-5 w-5 shrink-0" />
                            {item.name}
                          </div>
                          <button
                            type="button"
                            onClick={toggleAdminMenu}
                            className="ml-2 p-1 rounded hover:bg-black/5 shrink-0"
                            aria-label={isExpanded ? 'Contraer menú de admin' : 'Expandir menú de admin'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="ml-4 mt-1 space-y-1">
                            {item.subItems.map((subItem) => {
                              const isSubActive = subItem.isActive
                              ? subItem.isActive(location.pathname)
                              : location.pathname === subItem.href ||
                                location.pathname.startsWith(`${subItem.href}/`);
                              return (
                                <Link
                                  key={subItem.name}
                                  to={subItem.href}
                                  className={cn(
                                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                                    isSubActive
                                      ? 'bg-primary-100 text-primary-900'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  )}
                                >
                                  <subItem.icon className="mr-3 h-4 w-4" />
                                  {subItem.name}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    // Regular menu item
                    const isActive = item.isActive
                    ? item.isActive(location.pathname)
                    : location.pathname === item.href;
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
                  }
                })}
              </nav>
            </div>
            
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top Header Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {!sidebarOpen && (
              <button
                type="button"
                className="md:hidden -ml-0.5 h-10 w-10 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
            )}
            <div className="flex-1" /> {/* Spacer */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/profile')}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                title="Mi Perfil"
              >
                <UserAvatar
                  pictureId={user?.picture_id}
                  username={user?.username || currentUser?.username || ''}
                  size="small"
                />
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
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