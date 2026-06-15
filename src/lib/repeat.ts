/* Flint — repeat-rule math for tasks */

import { addDays, dateKey, daysBetween, keyToDate, todayKey } from '@/lib/dates';

export type RepeatUnit = 'day' | 'week' | 'month' | 'year';

export interface RepeatEnd {
  type: 'never' | 'on' | 'after';
  date?: string; // dateKey, for 'on'
  count?: number; // occurrences, for 'after'
}

export interface Repeat {
  every: number; // 1..n
  unit: RepeatUnit;
  weekdays: number[]; // 0=Sun..6=Sat, used when unit === 'week'
  time: string | null; // "HH:MM"
  start: string; // dateKey
  end: RepeatEnd;
}

const MAX_SCAN_DAYS = 366 * 3;

/* does the rule fire on this date, ignoring the end condition? */
function fires(r: Repeat, k: string): boolean {
  const diff = daysBetween(r.start, k);
  if (diff < 0) return false;
  if (r.unit === 'day') return diff % r.every === 0;
  if (r.unit === 'week') {
    const dow = keyToDate(k).getDay();
    const days = r.weekdays.length ? r.weekdays : [keyToDate(r.start).getDay()];
    if (!days.includes(dow)) return false;
    // week distance measured from the start date's week (Monday-first)
    const wkOf = (key: string) => {
      const d = keyToDate(key);
      return Math.floor(daysBetween('2000-01-03', dateKey(addDays(d, -((d.getDay() + 6) % 7)))) / 7);
    };
    return (wkOf(k) - wkOf(r.start)) % r.every === 0;
  }
  const a = keyToDate(r.start);
  const b = keyToDate(k);
  if (r.unit === 'month') {
    if (b.getDate() !== a.getDate()) return false;
    const months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    return months >= 0 && months % r.every === 0;
  }
  // year
  return b.getDate() === a.getDate() && b.getMonth() === a.getMonth() && (b.getFullYear() - a.getFullYear()) % r.every === 0;
}

/* does the rule fire on this date, end condition included? */
export function occursOn(r: Repeat, k: string): boolean {
  if (!fires(r, k)) return false;
  if (r.end.type === 'on' && r.end.date && k > r.end.date) return false;
  if (r.end.type === 'after' && r.end.count != null) {
    // count occurrences from start up to and including k
    let n = 0;
    let d = keyToDate(r.start);
    const target = keyToDate(k).getTime();
    for (let i = 0; i <= MAX_SCAN_DAYS && d.getTime() <= target; i++) {
      if (fires(r, dateKey(d))) {
        n++;
        if (n > r.end.count) return false;
      }
      d = addDays(d, 1);
    }
    return n <= r.end.count;
  }
  return true;
}

/* next date (>= from) the rule fires, or null */
export function nextOccurrence(r: Repeat, from = todayKey()): string | null {
  let d = keyToDate(from < r.start ? r.start : from);
  for (let i = 0; i <= MAX_SCAN_DAYS; i++) {
    const k = dateKey(d);
    if (occursOn(r, k)) return k;
    if (r.end.type === 'on' && r.end.date && k > r.end.date) return null;
    d = addDays(d, 1);
  }
  return null;
}

export function describeRepeat(r: Repeat): string {
  const DOW1 = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const unit = r.every === 1 ? r.unit : `${r.every} ${r.unit}s`;
  let s = `every ${unit}`;
  if (r.unit === 'week' && r.weekdays.length) {
    s += ` · ${[...r.weekdays].sort().map((d) => DOW1[d]).join('')}`;
  }
  return s;
}
