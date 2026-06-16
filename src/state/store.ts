import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { BUILTIN_ROUTINES, Routine } from '@/data/defaults';
import { buildDemoData } from '@/data/demo';
import { addDays, dateKey, todayKey } from '@/lib/dates';
import { occursOn, Repeat } from '@/lib/repeat';
import type { ToneConfig } from '@/lib/tones';

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface Todo {
  id: string;
  title: string;
  details: string;
  reminderDate: string | null; // dateKey
  reminderTime: string | null; // "HH:MM"
  deadline: string | null; // dateKey
  repeat: Repeat | null;
  subtasks: Subtask[];
  done: boolean; // one-off tasks
  doneDates: string[]; // repeating tasks: which dates were completed
  createdAt: string;
}

export interface Settings {
  haptics: boolean;
  voice: boolean;
  keepOn: boolean;
  countUp: boolean;
  streaks: boolean; // streak counter + show-up strip
  streakNeverDies: boolean; // gaps pause the streak instead of breaking it
  theme: 'dark' | 'light' | 'system';
  clock: 'system' | '12' | '24'; // time display — 'system' follows the device's 12/24h setting
  remindersOn: boolean;
  reduceMotion: boolean; // calms pulsing/animated effects app-wide (also honors the OS setting)
}

/* Pomodoro mode on the Timer screen. ADHD-tuned: everything is user-controlled —
   no single "right" interval. Defaults are the classic 25/5/15 but the point is to
   adjust focus length to your attention window (10 min on a hard day is fine). */
export interface PomodoroConfig {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  cyclesBeforeLong: number; // focus blocks before a long break
  autoStartBreaks: boolean; // roll into the break automatically
  autoStartFocus: boolean; // roll into the next focus automatically
}

interface FlintState {
  custom: Routine[];
  overrides: Record<string, Partial<Routine>>;
  order: string[];
  archived: string[];
  deleted: string[];
  doneMap: Record<string, boolean>;
  bumped: Record<string, boolean>;
  todos: Todo[];
  history: Record<string, string[]>;
  appDays: Record<string, 1>; // quiet attendance: days the app was opened
  skips: Record<string, number>;
  lastDay: string;
  accent: string;
  onboarded: boolean;
  celebratedFirst: boolean; // persisted: the once-ever first-routine party has been shown
  showCelebration: boolean; // transient: the full-screen overlay is up right now
  settings: Settings;
  sound: ToneConfig; // last-used Sounds tab config (persisted)
  soundPlaying: boolean; // transient: the tone engine is running right now
  pomodoro: PomodoroConfig; // Timer-screen Pomodoro settings (persisted)
  recentColors: string[]; // recently picked custom colors (most-recent first), for the picker

  rollover: () => void;
  completeOnboarding: () => void;
  markFirstCelebrated: () => void;
  setShowCelebration: (v: boolean) => void;
  markDone: (id: string) => void;
  finishRoutine: (id: string) => void;
  bump: (id: string) => void;
  unbump: (id: string) => void;
  recordSkip: (id: string, idx: number) => void;
  saveRoutine: (r: Routine) => void;
  duplicateRoutine: (id: string) => void;
  archiveRoutine: (id: string) => void;
  restoreRoutine: (id: string) => void;
  deleteRoutine: (id: string) => void;
  resetRoutine: (id: string) => void;
  reorder: (ids: string[]) => void;
  addTodo: (t: Omit<Todo, 'id' | 'done' | 'doneDates' | 'createdAt'>) => void;
  updateTodo: (id: string, patch: Partial<Todo>) => void;
  removeTodo: (id: string) => void;
  toggleTodo: (id: string, day?: string) => void;
  toggleSubtask: (todoId: string, subId: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  setAccent: (hex: string) => void;
  setSound: (patch: Partial<ToneConfig>) => void;
  setSoundPlaying: (v: boolean) => void;
  setPomodoro: (patch: Partial<PomodoroConfig>) => void;
  pushRecentColor: (hex: string) => void;
  resetAll: () => void; // wipe everything → back to a fresh install (Settings → Delete all data)
  loadDemo: () => void; // seed believable routines/tasks/history (Settings → Demo)
}

const DEFAULT_SETTINGS: Settings = {
  haptics: true,
  voice: false,
  keepOn: true,
  countUp: false,
  streaks: true,
  streakNeverDies: true,
  theme: 'dark',
  clock: 'system',
  // opt-in: stays off until the user enables it (onboarding button / Settings →
  // Reminders), so no OS permission dialog fires while building the first routine.
  // Existing users keep their stored value — persist replaces this default wholesale.
  remindersOn: false,
  reduceMotion: false,
};

const DEFAULT_POMODORO: PomodoroConfig = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  cyclesBeforeLong: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
};

const DEFAULT_SOUND: ToneConfig = {
  mode: 'binaural',
  baseHz: 200,
  beatHz: 8,
  // isochronic mixer levels per ISO_BAND_HZ [1,2,3,4,6,8,12,16,24,32] — a gentle
  // "Relaxed" alpha blend so the first Play does something
  isoLevels: [0, 0, 0, 0, 0.4, 1, 0.7, 0, 0, 0],
  volume: 0.6,
};

const isBuiltin = (id: string) => BUILTIN_ROUTINES.some((b) => b.id === id);

/* fresh-install data (no actions) — the create() seed and resetAll() both start here */
const freshData = () => ({
  custom: [] as Routine[],
  overrides: {} as Record<string, Partial<Routine>>,
  order: [] as string[],
  archived: [] as string[],
  deleted: [] as string[],
  doneMap: {} as Record<string, boolean>,
  bumped: {} as Record<string, boolean>,
  todos: [] as Todo[],
  history: {} as Record<string, string[]>,
  appDays: {} as Record<string, 1>,
  skips: {} as Record<string, number>,
  lastDay: todayKey(),
  accent: '#ff6b35',
  onboarded: false,
  celebratedFirst: false,
  showCelebration: false,
  settings: DEFAULT_SETTINGS,
  sound: DEFAULT_SOUND,
  soundPlaying: false,
  pomodoro: DEFAULT_POMODORO,
  recentColors: [] as string[],
});

export const useStore = create<FlintState>()(
  persist(
    (set, get) => ({
      ...freshData(),

      completeOnboarding: () => set({ onboarded: true }),
      markFirstCelebrated: () => set({ celebratedFirst: true }),
      setShowCelebration: (v) => set({ showCelebration: v }),

      rollover: () => {
        const s = get();
        const today = todayKey();
        if (s.lastDay === today) {
          if (!s.appDays[today]) set({ appDays: { ...s.appDays, [today]: 1 } });
          return;
        }
        const doneIds = Object.keys(s.doneMap).filter((k) => s.doneMap[k]);
        const history = doneIds.length
          ? { ...s.history, [s.lastDay]: [...new Set([...(s.history[s.lastDay] || []), ...doneIds])] }
          : s.history;
        set({
          history,
          doneMap: {},
          bumped: {},
          appDays: { ...s.appDays, [today]: 1 },
          lastDay: today,
        });
      },

      markDone: (id) => set((s) => ({ doneMap: { ...s.doneMap, [id]: true } })),

      finishRoutine: (id) =>
        set((s) => {
          const bumped = { ...s.bumped };
          delete bumped[id];
          return { doneMap: { ...s.doneMap, [id]: true }, bumped };
        }),

      bump: (id) => set((s) => ({ bumped: { ...s.bumped, [id]: true } })),

      unbump: (id) =>
        set((s) => {
          const bumped = { ...s.bumped };
          delete bumped[id];
          return { bumped };
        }),

      recordSkip: (id, idx) =>
        set((s) => ({ skips: { ...s.skips, [`${id}:${idx}`]: (s.skips[`${id}:${idx}`] || 0) + 1 } })),

      saveRoutine: (r) =>
        set((s) => {
          if (isBuiltin(r.id)) {
            return {
              overrides: {
                ...s.overrides,
                [r.id]: { name: r.name, emoji: r.emoji, color: r.color, steps: r.steps, reminder: r.reminder, alarm: r.alarm, days: r.days, autoAdvance: r.autoAdvance, warn30: r.warn30, alarmRingtoneUri: r.alarmRingtoneUri },
              },
            };
          }
          const exists = s.custom.some((x) => x.id === r.id);
          const custom = exists ? s.custom.map((x) => (x.id === r.id ? r : x)) : [...s.custom, r];
          const order = s.order.includes(r.id) || s.order.length === 0 ? s.order : [...s.order, r.id];
          return { custom, order };
        }),

      duplicateRoutine: (id) =>
        set((s) => {
          const src = resolveRoutines({ custom: s.custom, overrides: s.overrides, order: s.order, archived: [], deleted: s.deleted }).find((r) => r.id === id);
          if (!src) return {};
          const { builtin: _b, ...rest } = src;
          const copy: Routine = { ...rest, id: 'c' + Date.now(), name: `${src.name} copy` };
          const order = s.order.length === 0 ? s.order : [...s.order, copy.id];
          return { custom: [...s.custom, copy], order };
        }),

      archiveRoutine: (id) =>
        set((s) => {
          const doneMap = { ...s.doneMap };
          delete doneMap[id];
          const bumped = { ...s.bumped };
          delete bumped[id];
          return { archived: [...new Set([...s.archived, id])], doneMap, bumped };
        }),

      restoreRoutine: (id) => set((s) => ({ archived: s.archived.filter((x) => x !== id) })),

      deleteRoutine: (id) =>
        set((s) => {
          const doneMap = { ...s.doneMap };
          delete doneMap[id];
          const bumped = { ...s.bumped };
          delete bumped[id];
          const overrides = { ...s.overrides };
          delete overrides[id];
          return {
            custom: s.custom.filter((x) => x.id !== id),
            order: s.order.filter((x) => x !== id),
            archived: s.archived.filter((x) => x !== id),
            deleted: isBuiltin(id) ? [...new Set([...s.deleted, id])] : s.deleted,
            overrides,
            doneMap,
            bumped,
          };
        }),

      resetRoutine: (id) =>
        set((s) => {
          const overrides = { ...s.overrides };
          delete overrides[id];
          return { overrides };
        }),

      reorder: (ids) => set({ order: ids }),

      addTodo: (t) =>
        set((s) => ({
          todos: [
            ...s.todos,
            { ...t, id: 'u' + Date.now(), done: false, doneDates: [], createdAt: todayKey() },
          ],
        })),

      updateTodo: (id, patch) =>
        set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      removeTodo: (id) => set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),

      toggleTodo: (id, day = todayKey()) =>
        set((s) => ({
          todos: s.todos.map((t) => {
            if (t.id !== id) return t;
            if (t.repeat) {
              const has = t.doneDates.includes(day);
              return { ...t, doneDates: has ? t.doneDates.filter((d) => d !== day) : [...t.doneDates, day] };
            }
            return { ...t, done: !t.done };
          }),
        })),

      toggleSubtask: (todoId, subId) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === todoId
              ? { ...t, subtasks: t.subtasks.map((x) => (x.id === subId ? { ...x, done: !x.done } : x)) }
              : t
          ),
        })),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      setAccent: (hex) => set({ accent: hex }),

      setSound: (patch) => set((s) => ({ sound: { ...s.sound, ...patch } })),

      setSoundPlaying: (v) => set({ soundPlaying: v }),

      setPomodoro: (patch) => set((s) => ({ pomodoro: { ...s.pomodoro, ...patch } })),

      pushRecentColor: (hex) =>
        set((s) => {
          const h = hex.toLowerCase();
          return { recentColors: [h, ...s.recentColors.filter((x) => x !== h)].slice(0, 8) };
        }),

      // hard reset: data fields back to defaults (onboarded → false flips the
      // navigator guard back to onboarding); persist overwrites storage with these
      resetAll: () => set({ ...freshData() }),

      // shallow-merge the demo slice; settings/theme/accent stay as the user has them
      loadDemo: () => set({ ...buildDemoData() }),
    }),
    {
      name: 'flint-v1',
      version: 9,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted: any, version) => {
        if (version < 2 && persisted) {
          // v1 tasks: { id, text, time, done } → todos
          const old = Array.isArray(persisted.tasks) ? persisted.tasks : [];
          persisted.todos = old
            .filter((x: any) => !x.done)
            .map((x: any, i: number) => ({
              id: x.id || 'm' + i,
              title: x.text || '',
              details: '',
              reminderDate: x.time ? todayKey() : null,
              reminderTime: x.time || null,
              deadline: null,
              repeat: null,
              subtasks: [],
              done: false,
              doneDates: [],
              createdAt: todayKey(),
            }));
          delete persisted.tasks;
          delete persisted.restDay;
          delete persisted.tasksOpen;
          persisted.deleted = persisted.deleted || [];
          persisted.appDays = persisted.appDays || {};
          if (persisted.settings) {
            delete persisted.settings.defaultReminder;
            persisted.settings.streakNeverDies = false;
          }
        }
        if (version < 3 && persisted?.settings) {
          if (persisted.settings.clock24 == null) persisted.settings.clock24 = false;
        }
        if (version < 4 && persisted) {
          // existing installs have already "onboarded" — don't show it to them
          persisted.onboarded = persisted.onboarded ?? true;
        }
        if (version < 5 && persisted?.settings) {
          // clock24 boolean → clock mode. An explicit 24h pick is kept; everyone
          // else moves to 'system' so time follows the device's 12/24h setting.
          persisted.settings.clock = persisted.settings.clock24 === true ? '24' : 'system';
          delete persisted.settings.clock24;
        }
        if (version < 6 && persisted) {
          // anyone already past onboarding has met their routines — the first-routine
          // party is a fresh-install moment, so don't replay it for them
          persisted.celebratedFirst = persisted.celebratedFirst ?? !!persisted.onboarded;
        }
        if (version < 7 && persisted) {
          // Sounds isochronic became a per-band mixer (isoLevels[]) — the old
          // single-band config is incompatible, so reset to the default sound
          delete persisted.sound;
          // backfill the new alarm-ringtone setting (persisted.settings replaces
          // the default wholesale, so a missing field would read undefined)
          if (persisted.settings) persisted.settings.alarmRingtoneUri = persisted.settings.alarmRingtoneUri ?? null;
        }
        if (version < 8 && persisted?.settings) {
          // reduce-motion toggle (H5) is new — backfill off so it reads a real
          // boolean (persisted.settings replaces the default wholesale)
          persisted.settings.reduceMotion = persisted.settings.reduceMotion ?? false;
        }
        if (version < 9 && persisted) {
          // Pomodoro config is new — backfill the whole object (it's persisted
          // standalone, so a missing field would read undefined at every call site)
          persisted.pomodoro = persisted.pomodoro ?? { ...DEFAULT_POMODORO };
        }
        return persisted;
      },
      partialize: (s) => ({
        custom: s.custom,
        overrides: s.overrides,
        order: s.order,
        archived: s.archived,
        deleted: s.deleted,
        doneMap: s.doneMap,
        bumped: s.bumped,
        todos: s.todos,
        history: s.history,
        appDays: s.appDays,
        skips: s.skips,
        lastDay: s.lastDay,
        accent: s.accent,
        onboarded: s.onboarded,
        celebratedFirst: s.celebratedFirst,
        settings: s.settings,
        sound: s.sound,
        pomodoro: s.pomodoro,
        recentColors: s.recentColors,
      }),
    }
  )
);

/* ── derived helpers ── */

type Resolvable = Pick<FlintState, 'custom' | 'overrides' | 'order' | 'archived' | 'deleted'>;

export function resolveRoutines(s: Resolvable): Routine[] {
  const base = BUILTIN_ROUTINES.filter((r) => !s.deleted.includes(r.id)).map((r) => ({
    ...r,
    ...(s.overrides[r.id] || {}),
    id: r.id,
    builtin: true,
  }));
  const customs = s.custom.map((r) => ({ ...r, builtin: false }));
  const all = [...base, ...customs];
  const order = s.order.length ? s.order : all.map((r) => r.id);
  const byId = Object.fromEntries(all.map((r) => [r.id, r]));
  const ordered = order.map((id) => byId[id]).filter(Boolean) as Routine[];
  all.forEach((r) => {
    if (!order.includes(r.id)) ordered.push(r);
  });
  return ordered.filter((r) => !s.archived.includes(r.id));
}

export function archivedRoutinesOf(s: Pick<FlintState, 'custom' | 'overrides' | 'archived' | 'deleted'>): Routine[] {
  const base = BUILTIN_ROUTINES.filter((r) => !s.deleted.includes(r.id)).map((r) => ({
    ...r,
    ...(s.overrides[r.id] || {}),
    id: r.id,
    builtin: true,
  }));
  const customs = s.custom.map((r) => ({ ...r, builtin: false }));
  const byId = Object.fromEntries([...base, ...customs].map((r) => [r.id, r]));
  return s.archived.map((id) => byId[id]).filter(Boolean) as Routine[];
}

/* today's history merged with live doneMap */
export function mergedHistory(s: Pick<FlintState, 'history' | 'doneMap'>): Record<string, string[]> {
  const merged = { ...s.history };
  const todays = Object.keys(s.doneMap).filter((k) => s.doneMap[k]);
  if (todays.length) {
    const t = todayKey();
    merged[t] = [...new Set([...(merged[t] || []), ...todays])];
  }
  return merged;
}

/* current streak in days. neverDies: gaps pause instead of break. */
export function streakOf(merged: Record<string, string[]>, neverDies: boolean): number {
  const showed = (k: string) => (merged[k] || []).length > 0;
  if (neverDies) return Object.keys(merged).filter(showed).length;
  let n = 0;
  let d = new Date();
  if (!showed(dateKey(d))) d = addDays(d, -1); // today isn't over yet — don't count it against you
  for (let i = 0; i < 3700; i++) {
    if (!showed(dateKey(d))) break;
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/* is this todo on today's plate? (dated today, due today/overdue, or repeats today) */
export function todoIsToday(t: Todo, day = todayKey()): boolean {
  if (t.repeat) return occursOn(t.repeat, day);
  if (t.done) return false;
  if (t.reminderDate && t.reminderDate <= day) return true;
  if (t.deadline && t.deadline <= day) return true;
  return false;
}

export function todoDoneOn(t: Todo, day = todayKey()): boolean {
  return t.repeat ? t.doneDates.includes(day) : t.done;
}

/* attendance for the calendar: routines done OR (quietly) opened the app */
export function dayLevel(
  merged: Record<string, string[]>,
  appDays: Record<string, 1>,
  k: string
): 0 | 1 | 2 {
  const count = (merged[k] || []).length;
  if (count >= 2) return 2;
  if (count === 1) return 1;
  return appDays[k] ? 1 : 0;
}
