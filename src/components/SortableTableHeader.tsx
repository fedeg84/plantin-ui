import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

interface SortableTableHeaderProps {
  field: string;
  children: React.ReactNode;
  currentSort?: string;
  currentSortOrder?: 'asc' | 'desc';
  onSortChange: (field: string, order: 'asc' | 'desc') => void;
  className?: string;
}

export const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({
  field,
  children,
  currentSort,
  currentSortOrder,
  onSortChange,
  className
}) => {
  const isCurrentField = currentSort === field;
  
  const handleClick = () => {
    if (isCurrentField) {
      // Si ya está ordenado por este campo, alternar la dirección
      const newOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
      onSortChange(field, newOrder);
    } else {
      // Si es un campo nuevo, empezar con ASC
      onSortChange(field, 'asc');
    }
  };

  return (
    <th 
      className={cn(
        "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none",
        isCurrentField && "bg-gray-100",
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <span>{children}</span>
        <div className="ml-2 flex flex-col">
          <ChevronUp 
            className={cn(
              "h-3 w-3 -mb-1",
              isCurrentField && currentSortOrder === 'asc' 
                ? "text-primary-600" 
                : "text-gray-300"
            )}
          />
          <ChevronDown 
            className={cn(
              "h-3 w-3",
              isCurrentField && currentSortOrder === 'desc' 
                ? "text-primary-600" 
                : "text-gray-300"
            )}
          />
        </div>
      </div>
    </th>
  );
}; 