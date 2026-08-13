import { cn } from '../utils/cn';
import { isExpenseDateRangeValid } from '../utils/expenseDateRange';

type ExpenseDateFilterProps = {
  selectRange: boolean;
  onSelectRangeChange: (value: boolean) => void;
  singleMonth: string;
  onSingleMonthChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  className?: string;
};

export default function ExpenseDateFilter({
  selectRange,
  onSelectRangeChange,
  singleMonth,
  onSingleMonthChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  className,
}: ExpenseDateFilterProps) {
  const rangeInvalid = selectRange && !isExpenseDateRangeValid(selectRange, dateFrom, dateTo);

  return (
    <div className={cn('card p-4', className)}>
      {!selectRange ? (
        <div className="w-full sm:max-w-xs">
          <label htmlFor="expense-month-single" className="block text-sm font-medium text-gray-700 mb-1">
            Mes
          </label>
          <input
            id="expense-month-single"
            type="month"
            value={singleMonth}
            onChange={(e) => onSingleMonthChange(e.target.value)}
            className="input w-full"
          />
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="w-full sm:flex-1 sm:max-w-xs">
            <label htmlFor="expense-date-from" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha desde
            </label>
            <input
              id="expense-date-from"
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => onDateFromChange(e.target.value)}
              className={cn('input w-full', rangeInvalid && 'border-red-300 focus:border-red-500 focus:ring-red-500')}
            />
          </div>
          <div className="w-full sm:flex-1 sm:max-w-xs">
            <label htmlFor="expense-date-to" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha hasta
            </label>
            <input
              id="expense-date-to"
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => onDateToChange(e.target.value)}
              className={cn('input w-full', rangeInvalid && 'border-red-300 focus:border-red-500 focus:ring-red-500')}
            />
          </div>
        </div>
      )}

      <label className="mt-3 flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={selectRange}
          onChange={(e) => onSelectRangeChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        Seleccionar rango
      </label>

      {rangeInvalid && (
        <p className="mt-2 text-sm text-red-600">
          La fecha hasta debe ser posterior o igual a la fecha desde
        </p>
      )}
    </div>
  );
}
