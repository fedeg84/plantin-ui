export function toMonthInputValue(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function toDateInputValue(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function monthBounds(monthValue: string): { min_date: string; max_date: string } {
  const [yearStr, monthStr] = monthValue.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const lastDay = new Date(year, month, 0).getDate();

  return {
    min_date: `${yearStr}-${monthStr}-01`,
    max_date: `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function isExpenseDateRangeValid(
  selectRange: boolean,
  dateFrom: string,
  dateTo: string
): boolean {
  if (!selectRange) return true;
  return dateFrom <= dateTo;
}

export function expenseDateRange(
  selectRange: boolean,
  singleMonth: string,
  dateFrom: string,
  dateTo: string
): { min_date: string; max_date: string } {
  if (selectRange) {
    return { min_date: dateFrom, max_date: dateTo };
  }

  return monthBounds(singleMonth);
}
