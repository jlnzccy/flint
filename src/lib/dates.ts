/* Flint — date/time helpers */

import * as Localization from 'expo-localization';

export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DOW1 = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function keyToDate(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function todayKey(): string {
  return dateKey(new Date());
}

/* Monday-first week containing d → 7 dateKeys */
export function weekKeys(d = new Date()): string[] {
  const day = (d.getDay() + 6) % 7;
  const mon = addDays(d, -day);
  return Array.from({ length: 7 }, (_, i) => dateKey(addDays(mon, i)));
}

/* "HH:MM" → "7:00 AM" */
export function fmt12(hhmm?: string | null): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

/* "HH:MM" → "07:00" (24-hour) */
export function fmt24(hhmm?: string | null): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/* clock-aware formatter, driven by the user's 12/24h setting */
export function fmtTime(hhmm: string | null | undefined, clock24: boolean): string {
  return clock24 ? fmt24(hhmm) : fmt12(hhmm);
}

/* does the device use a 24-hour clock? expo-localization reads the real OS toggle
   (Android's "Use 24-hour format", iOS' equivalent); Intl is a locale-based fallback.
   Cached after the first probe — a setting change is picked up on next cold start. */
let _sysClock24: boolean | null = null;
export function systemClock24(): boolean {
  if (_sysClock24 != null) return _sysClock24;
  try {
    const cal = Localization.getCalendars?.()[0];
    if (cal && typeof cal.uses24hourClock === 'boolean') {
      _sysClock24 = cal.uses24hourClock;
      return _sysClock24;
    }
  } catch {
    // module/value unavailable — fall through to the Intl heuristic
  }
  try {
    const s = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: 'numeric' }).format(
      new Date(2020, 0, 1, 13, 0)
    );
    _sysClock24 = /13/.test(s); // "13:00" → 24h; "1:00 PM" → 12h
  } catch {
    _sysClock24 = false;
  }
  return _sysClock24;
}

/* clock setting → concrete 24h boolean; 'system' defers to the device */
export function resolveClock24(mode: 'system' | '12' | '24'): boolean {
  return mode === '24' ? true : mode === '12' ? false : systemClock24();
}

export function fmtSec(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function minsUntil(hhmm?: string | null): number {
  if (!hhmm) return Infinity;
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  return h * 60 + m - (now.getHours() * 60 + now.getMinutes());
}

/* parse a trailing "@ 9:00am" / "@21:30" / "@9am" time flag on a task */
export function parseTaskTime(raw: string): { text: string; time: string | null } {
  const m = raw.match(/@\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*$/i);
  if (!m) return { text: raw.trim(), time: null };
  let h = +m[1];
  const min = m[2] ? +m[2] : 0;
  const ap = m[3] ? m[3].toLowerCase() : null;
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (h > 23 || min > 59) return { text: raw.trim(), time: null };
  const text = raw.slice(0, m.index).trim();
  return { text: text || raw.trim(), time: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}` };
}

/* whole days between two dateKeys (b - a) */
export function daysBetween(a: string, b: string): number {
  return Math.round((keyToDate(b).getTime() - keyToDate(a).getTime()) / 86400000);
}

/* "2026-06-13" → "Jun 13" (adds year if not current) */
export function fmtKey(k?: string | null): string {
  if (!k) return '';
  const d = keyToDate(k);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('en-US', opts);
}

export function isToday(k?: string | null): boolean {
  return !!k && k === todayKey();
}

export function greetingNow(): string {
  const h = new Date().getHours();
  return h < 5 ? 'Up late?' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
