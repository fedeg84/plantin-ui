import React, { useState, useRef, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { cn } from '../utils/cn';

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onChange: (startDate?: string, endDate?: string) => void;
  placeholder?: string;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  placeholder = "Seleccionar rango de fechas y horas",
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate || '');
  const [tempEndDate, setTempEndDate] = useState(endDate || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Formatear fechas para mostrar
  const formatDateRange = () => {
    if (!startDate && !endDate) return '';
    if (startDate && !endDate) return `Desde ${formatDate(startDate)}`;
    if (!startDate && endDate) return `Hasta ${formatDate(endDate)}`;
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Aplicar cambios
  const handleApply = () => {
    onChange(tempStartDate || undefined, tempEndDate || undefined);
    setIsOpen(false);
  };

  // Limpiar filtro
  const handleClear = () => {
    setTempStartDate('');
    setTempEndDate('');
    onChange(undefined, undefined);
    setIsOpen(false);
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Revertir cambios temporales si no se aplicaron
        setTempStartDate(startDate || '');
        setTempEndDate(endDate || '');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [startDate, endDate]);

  // Sincronizar valores temporales cuando cambian las props
  useEffect(() => {
    setTempStartDate(startDate || '');
    setTempEndDate(endDate || '');
  }, [startDate, endDate]);

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full input text-left flex items-center justify-between",
          (!startDate && !endDate) && "text-gray-500"
        )}
      >
        <span>{formatDateRange() || placeholder}</span>
        <div className="flex items-center gap-1">
          {(startDate || endDate) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fecha y hora desde
              </label>
              <input
                type="datetime-local"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fecha y hora hasta
              </label>
              <input
                type="datetime-local"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleClear}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Limpiar
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 