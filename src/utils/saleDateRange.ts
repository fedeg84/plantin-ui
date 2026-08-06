import { localDateEndToUtcIso, localDateStartToUtcIso } from './datetime';

export function toDateInputValue(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSaleDateRangeValid(
  selectRange: boolean,
  dateFrom: string,
  dateTo: string
): boolean {
  if (!selectRange) return true;
  return dateFrom <= dateTo;
}

export function saleTimeRange(
  selectRange: boolean,
  singleDate: string,
  dateFrom: string,
  dateTo: string
): { min_time: string; max_time: string } {
  if (selectRange) {
    return {
      min_time: localDateStartToUtcIso(dateFrom),
      max_time: localDateEndToUtcIso(dateTo),
    };
  }

  return {
    min_time: localDateStartToUtcIso(singleDate),
    max_time: localDateEndToUtcIso(singleDate),
  };
}
