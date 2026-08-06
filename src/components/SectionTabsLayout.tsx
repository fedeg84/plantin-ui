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
  description?: string;
  tabs: SectionTab[];
}

export default function SectionTabsLayout({ title, description, tabs }: SectionTabsLayoutProps) {
  const { pathname } = useLocation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const active = tab.isActive(pathname);
            return (
              <Link
                key={tab.id}
                to={tab.to}
                className={cn(
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                  active
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
