import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/endpoints';
import {
  Menu,
  X,
  Home,
  Plus,
  Package,
  ShoppingCart,
  LogOut,
  Settings,
  Clock,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Users,
  DollarSign,
  History,
  Sprout,
  User,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../utils/cn';
import UserAvatar from './UserAvatar';

interface LayoutProps {
  children: React.ReactNode;
}

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  isActive?: (pathname: string) => boolean;
};

type NavItemWithSubItems = {
  name: string;
  href: string;
  icon: LucideIcon;
  subItems: NavItem[];
};

type NavigationEntry = NavItem | NavItemWithSubItems;

function hasSubItems(item: NavigationEntry): item is NavItemWithSubItems {
  return 'subItems' in item;
}

function BrandMark({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      to="/home"
      onClick={onClick}
      className="flex items-center gap-2.5 min-w-0"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
        <Sprout className="h-5 w-5" />
      </span>
      <span className="truncate text-xl font-semibold tracking-tight text-stone-900">
        Plantin
      </span>
    </Link>
  );
}

function navItemClass(active: boolean, size: 'mobile' | 'desktop') {
  return cn(
    'group flex items-center rounded-xl font-medium transition-colors touch-manipulation',
    size === 'mobile' ? 'px-3 py-2.5 text-base min-h-[44px]' : 'px-3 py-2 text-sm',
    active
      ? 'bg-primary-50 text-primary-800'
      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
  );
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

  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.getById(userId!),
    enabled: !!userId,
  });

  const [expandedAdminMenu, setExpandedAdminMenu] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const displayName = user?.name || currentUser?.username || '';

  useEffect(() => {
    if (!userMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUserMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  const isProductsSection = (pathname: string) =>
    pathname === '/products' ||
    pathname.startsWith('/products/') ||
    pathname.startsWith('/product-types');

  const isPaymentsSection = (pathname: string) =>
    pathname === '/admin/payments' ||
    pathname.startsWith('/admin/payments/') ||
    pathname.startsWith('/admin/expenses') ||
    pathname.startsWith('/admin/expense-types');

  const navigation: NavItem[] = [
    {
      name: 'Home',
      href: '/home',
      icon: Home,
      isActive: (pathname) => pathname === '/home' || pathname === '/',
    },
    { name: 'Nueva Venta', href: '/sales/create', icon: Plus },
    { name: 'Ventas', href: '/sales', icon: ShoppingCart },
    { name: 'Productos', href: '/products', icon: Package, isActive: isProductsSection },
  ];

  const adminSubItems: NavItem[] = [
    { name: 'Historial de ventas', href: '/admin/dashboard', icon: History },
    { name: 'Gestión de Usuarios', href: '/admin/users', icon: Users },
    { name: 'Métodos de Pago', href: '/payment-methods', icon: CreditCard },
    { name: 'Pagos', href: '/admin/payments', icon: DollarSign, isActive: isPaymentsSection },
    { name: 'Turnos', href: '/admin/shifts', icon: Clock },
  ];

  const adminNavigation: NavItemWithSubItems = {
    name: 'Panel de Admin',
    href: '/admin/dashboard',
    icon: Settings,
    subItems: adminSubItems,
  };

  const adminStatus = isAdmin();

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

  const closeSidebar = () => setSidebarOpen(false);

  const allNavigation: NavigationEntry[] = adminStatus ? [...navigation, adminNavigation] : navigation;

  const isItemActive = (item: NavItem) =>
    item.isActive ? item.isActive(location.pathname) : location.pathname === item.href;

  const renderNav = (size: 'mobile' | 'desktop') =>
    allNavigation.map((item) => {
      if (hasSubItems(item)) {
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
            <div className={cn(navItemClass(isParentActive || isAnyChildActive, size), 'justify-between')}>
              <div
                onClick={() => {
                  navigate(item.href);
                  closeSidebar();
                }}
                className="flex flex-1 items-center cursor-pointer min-w-0"
              >
                <item.icon className={cn('shrink-0', size === 'mobile' ? 'mr-4 h-6 w-6' : 'mr-3 h-5 w-5')} />
                {item.name}
              </div>
              <button
                type="button"
                onClick={toggleAdminMenu}
                className="ml-2 p-1 rounded-lg hover:bg-black/5 shrink-0"
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
              <div className="ml-3 mt-1 space-y-1 border-l border-stone-200 pl-2">
                {item.subItems.map((subItem) => {
                  const isSubActive = subItem.isActive
                    ? subItem.isActive(location.pathname)
                    : location.pathname === subItem.href ||
                      location.pathname.startsWith(`${subItem.href}/`);
                  return (
                    <Link
                      key={subItem.name}
                      to={subItem.href}
                      onClick={closeSidebar}
                      className={navItemClass(isSubActive, size)}
                    >
                      <subItem.icon className={cn('shrink-0', size === 'mobile' ? 'mr-3 h-5 w-5' : 'mr-3 h-4 w-4')} />
                      {subItem.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      const isActive = isItemActive(item);
      return (
        <Link
          key={item.name}
          to={item.href}
          onClick={closeSidebar}
          className={navItemClass(isActive, size)}
        >
          <item.icon className={cn(size === 'mobile' ? 'mr-4 h-6 w-6' : 'mr-3 h-5 w-5')} />
          {item.name}
        </Link>
      );
    });

  return (
    <div className="h-full flex bg-stone-50">
      <div
        className={cn(
          'fixed inset-0 z-40 md:hidden',
          sidebarOpen ? 'flex' : 'pointer-events-none hidden'
        )}
      >
        <div
          className={cn(
            'fixed inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity',
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={closeSidebar}
        />

        <div
          className={cn(
            'relative flex w-full max-w-xs flex-1 flex-col bg-white shadow-xl transition-transform',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex items-center justify-between px-4 pt-5 pb-3">
            <BrandMark onClick={closeSidebar} />
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              onClick={closeSidebar}
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6 pt-2">
            {renderNav('mobile')}
          </nav>
        </div>
      </div>

      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex w-64 flex-col">
          <div className="flex h-0 flex-1 flex-col border-r border-stone-200/80 bg-white">
            <div className="flex flex-1 flex-col overflow-y-auto pb-4 pt-5">
              <div className="flex flex-shrink-0 items-center px-4">
                <BrandMark />
              </div>
              <nav className="mt-6 flex-1 space-y-1 px-3">{renderNav('desktop')}</nav>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 hover:text-stone-900 md:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu className="h-6 w-6" />
              </button>
              <span className="truncate text-lg font-semibold tracking-tight text-stone-900 md:hidden">
                Plantin
              </span>
            </div>
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex max-w-[14rem] items-center gap-2 rounded-xl py-1 pl-2.5 pr-1.5 text-left transition-colors hover:bg-stone-100 sm:max-w-xs"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                <span className="min-w-0 truncate text-sm font-medium text-stone-800">
                  {displayName}
                </span>
                <UserAvatar
                  pictureId={user?.picture_id}
                  username={user?.username || currentUser?.username || ''}
                  size="small"
                />
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-stone-400 transition-transform',
                    userMenuOpen && 'rotate-180'
                  )}
                />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-stone-200/80 bg-white py-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    <User className="h-4 w-4 text-stone-400" />
                    Mi perfil
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    <LogOut className="h-4 w-4 text-stone-400" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="relative z-0 flex-1 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <div className="py-5 sm:py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200/80 bg-white/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-4">
          {navigation.map((item) => {
            const active = isItemActive(item);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium touch-manipulation',
                  active ? 'text-primary-700' : 'text-stone-500'
                )}
              >
                <item.icon className={cn('h-5 w-5', active && 'stroke-[2.25]')} />
                <span className="truncate max-w-full">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
