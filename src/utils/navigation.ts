import type { Location, NavigateFunction } from 'react-router-dom';

export type NavigationState = {
  from?: string;
};

export function currentPath(location: Location): string {
  return location.pathname + location.search + location.hash;
}

/** Navega guardando la pantalla actual para poder volver con goBack. */
export function navigateWithReturn(
  navigate: NavigateFunction,
  location: Location,
  to: string,
  options?: { replace?: boolean }
) {
  navigate(to, {
    ...options,
    state: { from: currentPath(location) } satisfies NavigationState,
  });
}

/** Vuelve a la pantalla anterior: state.from, historial del browser, o fallback. */
export function goBack(navigate: NavigateFunction, location: Location, fallback: string) {
  const from = (location.state as NavigationState | null)?.from;
  if (from) {
    navigate(from);
    return;
  }

  const idx = (window.history.state as { idx?: number } | null)?.idx;
  if (typeof idx === 'number' && idx > 0) {
    navigate(-1);
    return;
  }

  navigate(fallback);
}
