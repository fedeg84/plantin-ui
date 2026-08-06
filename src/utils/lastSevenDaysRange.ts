import { localDateEndToUtcIso, localDateStartToUtcIso } from './datetime';
import { toDateInputValue } from './saleDateRange';

/** Inclusive range: today and the previous 6 days (7 days total). */
export function lastSevenDaysTimeRange(): { min_time: string; max_time: string } {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  return {
    min_time: localDateStartToUtcIso(toDateInputValue(sevenDaysAgo)),
    max_time: localDateEndToUtcIso(toDateInputValue(today)),
  };
}
