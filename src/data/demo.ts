/* Flint — demo dataset
   One-tap seed (Settings → Demo) that fills the app with believable routines,
   tasks, and a month of history so Insights/calendar have something to show.
   Pure data only: returns the store slices to set; no settings/theme touched. */

import type { Routine } from '@/data/defaults';
import { addDays, dateKey, todayKey } from '@/lib/dates';
import type { Repeat } from '@/lib/repeat';
import type { Todo } from '@/state/store';

/* deterministic [0,1) from a string — the seeded history is identical on every
   reload, so the demo looks the same each time it's loaded */
function rand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100000 / 100000;
}

export const DEMO_ROUTINES: Routine[] = [
  {
    id: 'demo-morning', emoji: '🌅', name: 'Morning', color: 'accent', reminder: '07:00', alarm: true,
    autoAdvance: true, warn30: true,
    steps: [
      { t: "Write down today's goals", min: 2, hint: 'One or two. Not a list.' },
      { t: 'Drink a glass of water', min: 1 },
      { t: 'Brush teeth / wash face', min: 3, hint: 'Cold water wakes you.' },
      { t: 'Get some sunlight', min: 3, hint: 'A window counts.' },
      { t: 'Stretch', min: 3, hint: 'However your body wants.' },
      { t: 'Make breakfast', min: 10, hint: 'A banana is a meal.' },
      { t: 'Make coffee', min: 3 },
    ],
  },
  {
    id: 'demo-walk', emoji: '🐕', name: 'Walk the dog', color: 'gold', reminder: '08:00', alarm: false,
    steps: [
      { t: 'Leash + poop bags', min: 1 },
      { t: 'Out the door', min: 1, hint: 'Shoes on.' },
      { t: 'Walk', min: 20, hint: 'Let him sniff.' },
      { t: 'Water bowl + treat', min: 2 },
    ],
  },
  {
    id: 'demo-workout', emoji: '💪', name: 'Workout', color: 'rose', reminder: '17:30', alarm: true,
    days: [1, 3, 5],
    steps: [
      { t: 'Warm up', min: 5, hint: 'Loosen the joints.' },
      { t: 'Mobility', min: 5 },
      { t: 'Main sets', min: 25, hint: 'Leave one in the tank.' },
      { t: 'Cooldown stretch', min: 5 },
      { t: 'Water + protein', min: 2 },
    ],
  },
  {
    id: 'demo-study', emoji: '📚', name: 'Deep work', color: 'teal',
    steps: [
      { t: 'Clear the desk', min: 2, hint: 'Just the surface.' },
      { t: 'Water + snack nearby', min: 2 },
      { t: 'Write the one goal', min: 2, hint: 'One sentence.' },
      { t: '25-min focus', min: 25, hint: 'Phone far away.' },
      { t: 'Stretch break', min: 5, hint: 'Look at something far.' },
      { t: '25-min focus', min: 25, hint: 'Last push.' },
    ],
  },
  {
    id: 'demo-selfcare', emoji: '🌿', name: 'Self-care', color: 'green',
    steps: [
      { t: 'Drink some water', min: 1 },
      { t: 'Wash up or shower', min: 8 },
      { t: 'Eat something kind', min: 10 },
      { t: 'Step outside', min: 3, hint: 'Two minutes is enough.' },
      { t: 'Text someone back', min: 3, hint: 'Just one person.' },
      { t: 'One thing just for you', min: 10 },
    ],
  },
  {
    id: 'demo-evening', emoji: '🌙', name: 'Wind down', color: 'purple', reminder: '21:30', alarm: true,
    steps: [
      { t: 'Dim the lights', min: 1 },
      { t: 'Tidy one surface', min: 5, hint: 'One. Not the room.' },
      { t: "Lay out tomorrow's clothes", min: 3 },
      { t: 'Brush teeth', min: 3 },
      { t: 'Phone on its charger', min: 1, hint: 'Across the room.' },
      { t: 'Wind down', min: 10, hint: 'Read, breathe — whatever’s calm.' },
    ],
  },
];

/* how reliably each routine got done, per applicable day */
const WEIGHTS: Record<string, number> = {
  'demo-morning': 0.85,
  'demo-walk': 0.8,
  'demo-evening': 0.7,
  'demo-workout': 0.65,
  'demo-study': 0.42,
  'demo-selfcare': 0.35,
};
const WORKOUT_DAYS = [1, 3, 5];

function buildTodos(): Todo[] {
  const off = (n: number) => dateKey(addDays(new Date(), n));
  const sub = (id: string, text: string, done = false) => ({ id, text, done });
  const daily = (startOff: number, time: string | null): Repeat => ({
    every: 1, unit: 'day', weekdays: [], time, start: off(startOff), end: { type: 'never' },
  });
  const everyN = (every: number, startOff: number, time: string | null): Repeat => ({
    every, unit: 'day', weekdays: [], time, start: off(startOff), end: { type: 'never' },
  });
  const weekly = (weekdays: number[], startOff: number, time: string | null): Repeat => ({
    every: 1, unit: 'week', weekdays, time, start: off(startOff), end: { type: 'never' },
  });

  const created = off(-26);
  const base = { details: '', reminderDate: null, reminderTime: null, deadline: null, repeat: null, subtasks: [] as Todo['subtasks'], done: false, doneDates: [] as string[], createdAt: created };

  return [
    {
      ...base, id: 'demo-t1', title: 'Pick up prescription',
      details: 'Pharmacy on 5th — closes at 6.',
      reminderDate: off(0), reminderTime: '15:00', deadline: off(0),
    },
    {
      ...base, id: 'demo-t2', title: 'Call the dentist',
      reminderDate: off(0), reminderTime: '11:30',
    },
    {
      ...base, id: 'demo-t3', title: 'Buy groceries',
      details: "Trader Joe's run.", reminderDate: off(0), deadline: off(1),
      subtasks: [
        sub('s1', 'Oat milk', true),
        sub('s2', 'Eggs', true),
        sub('s3', 'Bread', false),
        sub('s4', 'Coffee', false),
        sub('s5', 'Spinach', false),
      ],
    },
    {
      ...base, id: 'demo-t4', title: 'Take vitamins',
      repeat: daily(-26, '09:00'),
      doneDates: [off(-3), off(-2), off(-1), off(0)],
    },
    {
      ...base, id: 'demo-t5', title: 'Water the plants',
      repeat: everyN(2, -4, '18:00'),
      doneDates: [off(-4), off(-2)],
    },
    {
      ...base, id: 'demo-t6', title: 'Reply to Sarah',
      details: 'About the weekend trip.', reminderDate: off(-1), done: true,
    },
    {
      ...base, id: 'demo-t7', title: 'Meal prep for the week',
      repeat: weekly([0], -28, '12:00'),
      doneDates: [off(-21), off(-14), off(-7)],
    },
    {
      ...base, id: 'demo-t8', title: 'Renew library books',
      details: 'Central branch.', deadline: off(3),
    },
    {
      ...base, id: 'demo-t9', title: 'Pay rent',
      reminderDate: off(5), reminderTime: '10:00',
    },
  ];
}

/* the full demo slice — store.loadDemo() shallow-merges this over current state */
export function buildDemoData() {
  const now = new Date();
  const tKey = todayKey();
  const history: Record<string, string[]> = {};
  const appDays: Record<string, 1> = { [tKey]: 1 };

  // ~6 weeks of believable activity, weighted per routine; today lives in doneMap
  for (let i = 1; i <= 44; i++) {
    const d = addDays(now, -i);
    const k = dateKey(d);
    const dow = d.getDay();
    const done: string[] = [];
    for (const r of DEMO_ROUTINES) {
      if (r.id === 'demo-workout' && !WORKOUT_DAYS.includes(dow)) continue;
      if (rand(r.id + k) < (WEIGHTS[r.id] ?? 0.5)) done.push(r.id);
    }
    if (done.length) history[k] = done;
    // opened the app on most days, even the quiet ones (quiet attendance)
    if (done.length || rand('open' + k) < 0.7) appDays[k] = 1;
  }

  return {
    custom: DEMO_ROUTINES,
    overrides: {} as Record<string, Partial<Routine>>,
    order: DEMO_ROUTINES.map((r) => r.id),
    archived: [] as string[],
    deleted: [] as string[],
    // a couple already done today, so Today + Insights show live progress
    doneMap: { 'demo-morning': true, 'demo-walk': true } as Record<string, boolean>,
    bumped: {} as Record<string, boolean>,
    todos: buildTodos(),
    history,
    appDays,
    // ≥3 skips surfaces an Insights "often skipped" hint
    skips: { 'demo-morning:4': 4, 'demo-evening:5': 3 } as Record<string, number>,
    lastDay: tKey,
    onboarded: true,
    celebratedFirst: true,
  };
}
