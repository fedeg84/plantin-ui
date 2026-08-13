import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '../utils/cn';

export interface SectionTab {
  id: string;
  label: string;
  to: string;
  isActive: (pathname: string) => boolean;
}

interface SectionTabsLayoutProps {
  title: string;
  tabs: SectionTab[];
}

export default function SectionTabsLayout({ title, tabs }: SectionTabsLayoutProps) {
  const { pathname } = useLocation();

  return (
    <div className="space-y-6">
      <h1 className="page-title">{title}</h1>

      <nav className="flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1">
        {tabs.map((tab) => {
          const active = tab.isActive(pathname);
          return (
            <Link
              key={tab.id}
              to={tab.to}
              className={cn(
                'whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium min-h-[44px] inline-flex items-center touch-manipulation',
                active
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
