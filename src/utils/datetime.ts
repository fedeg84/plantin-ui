const HAS_TIMEZONE_SUFFIX = /(?:[zZ]|[+-]\d{2}:\d{2})$/;

/** Parse API datetimes as UTC. Naive ISO strings are treated as UTC. */
export function parseApiDateTime(value: string): Date {
  if (!value) return new Date(NaN);
  const normalized = HAS_TIMEZONE_SUFFIX.test(value) ? value : `${value}Z`;
  return new Date(normalized);
}

export function formatDateTimeLocal(
  value: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseApiDateTime(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  });
}

export function formatDateLocal(
  value: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseApiDateTime(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  });
}

export function formatTimeLocal(
  value: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseApiDateTime(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  });
}

/** Format YYYY-MM-DD API dates without timezone shift. */
export function formatApiDateOnly(
  value: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return '—';

  return new Date(year, month - 1, day).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  });
}

export function localDateStartToUtcIso(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

export function localDateEndToUtcIso(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}
