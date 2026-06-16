import { ColorName } from '@/theme/colors';

export interface Step {
  t: string;
  min: number;
  hint?: string;
}

/* A Pomodoro routine's config (W). Its steps are *derived* from this — N focus blocks
   with a break between each (N focus → N-1 breaks) — never hand-edited. */
export interface RoutinePomodoro {
  focusMin: number;
  breakMin: number;
  sessions: number; // number of focus blocks
}

export interface Routine {
  id: string;
  name: string;
  emoji: string;
  color: ColorName | string; // preset name or custom "#rrggbb"
  reminder?: string | null; // "HH:MM" — null/absent = anytime (flexible)
  alarm?: boolean;
  days?: number[]; // 0=Sun … 6=Sat; absent = every day
  steps: Step[];
  autoAdvance?: boolean; // at a step's 0, move to the next step automatically (player E4)
  warn30?: boolean; // cue when 30s remain on a step (player E5)
  alarmRingtoneUri?: string | null; // per-routine alarm sound; null/absent = bundled marimba
  pomodoro?: RoutinePomodoro; // present = a Pomodoro routine; steps are generated from this (W)
  builtin?: boolean;
}

export const DEFAULT_POMODORO_CFG: RoutinePomodoro = { focusMin: 25, breakMin: 5, sessions: 4 };

/* Generate the focus/break step list from a Pomodoro config: breaks sit *between*
   focus blocks only, so N focus blocks produce N-1 breaks (W). */
export const buildPomodoroSteps = (cfg: RoutinePomodoro): Step[] => {
  const steps: Step[] = [];
  for (let i = 0; i < cfg.sessions; i++) {
    steps.push({ t: 'Focus', min: cfg.focusMin, hint: i === 0 ? 'One thing. Start small.' : undefined });
    if (i < cfg.sessions - 1) steps.push({ t: 'Break', min: cfg.breakMin, hint: 'Stretch, water, look away.' });
  }
  return steps;
};

/* does this routine show up today? */
export const routineOnDay = (r: Pick<Routine, 'days'>, dow = new Date().getDay()): boolean =>
  !r.days || r.days.length === 0 || r.days.includes(dow);

/* No seeded routines — new users start blank and build their first routine in
   onboarding (or from a template). Kept as an (empty) export so the store's
   builtin/override/delete plumbing and resolveRoutines() stay intact. */
export const BUILTIN_ROUTINES: Routine[] = [];

export const EMOJI_CHOICES = ['🌅', '🌙', '🎯', '🧹', '🍽️', '🚪', '🧺', '💪', '📚', '🛁', '🐕', '✉️', '🚿', '💊', '🧘', '☕'];

/* full picker, grouped — system font renders these as Noto on Android */
export const EMOJI_GROUPS: { name: string; emoji: string[] }[] = [
  {
    name: 'Routines',
    emoji: ['🌅', '🌙', '🎯', '🧹', '🍽️', '🚪', '🧺', '💪', '📚', '🛁', '🐕', '✉️', '🚿', '💊', '🧘', '☕', '🛏️', '🪥', '🧼', '🧽', '🗑️', '⏰', '📝', '🎒', '👟', '🥗', '💧'],
  },
  {
    name: 'Smileys',
    emoji: ['😀', '😄', '😅', '🤣', '😊', '😇', '🙂', '😉', '😍', '😘', '😋', '😜', '🤪', '🤩', '🥳', '😎', '🤓', '🧐', '😏', '😴', '🥱', '😪', '🤤', '😌', '🤔', '🤗', '🤭', '🫡', '🤠', '🥹', '😤', '😮‍💨', '🙃', '🫠', '😶‍🌫️', '🤯'],
  },
  {
    name: 'People',
    emoji: ['👋', '🤙', '👍', '👏', '🙌', '🤝', '💪', '🫶', '✍️', '🙏', '🧠', '👀', '🦷', '🗣️', '🚶', '🏃', '🧎', '🧍', '💃', '🕺', '🧘', '🏋️', '🚴', '🏊', '🤸', '⛹️', '🧗', '🛌'],
  },
  {
    name: 'Animals & nature',
    emoji: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦉', '🐴', '🦋', '🐝', '🐢', '🐙', '🐠', '🐳', '🌱', '🌿', '🍀', '🌵', '🌳', '🌸', '🌻', '🌹', '🍂', '🍁', '⭐', '🌟', '✨', '⚡', '🔥', '🌈', '☀️', '🌤️', '🌧️', '❄️', '🌊', '🌍'],
  },
  {
    name: 'Food & drink',
    emoji: ['🍎', '🍌', '🍇', '🍓', '🫐', '🍊', '🍋', '🥑', '🥦', '🥕', '🌽', '🥔', '🍞', '🥐', '🧀', '🥚', '🍳', '🥞', '🧇', '🥓', '🍗', '🍔', '🍟', '🍕', '🌮', '🌯', '🥪', '🥙', '🍜', '🍝', '🍣', '🍙', '🍚', '🥟', '🍰', '🧁', '🍪', '🍩', '🍫', '🍿', '🥤', '🧃', '🧋', '☕', '🍵', '🥛', '🍯', '🥣'],
  },
  {
    name: 'Activities',
    emoji: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥊', '🎽', '⛸️', '🛹', '🛼', '🎮', '🕹️', '🎲', '🧩', '♟️', '🎯', '🎳', '🎻', '🎸', '🎹', '🥁', '🎺', '🎤', '🎧', '🎨', '🖌️', '🧶', '🪡', '🎬', '📷', '🎟️', '🏆', '🥇', '🎖️'],
  },
  {
    name: 'Travel & places',
    emoji: ['🚗', '🚕', '🚌', '🚎', '🚲', '🛴', '🏍️', '🚆', '✈️', '🚀', '🛸', '⛵', '🚤', '🏠', '🏡', '🏢', '🏫', '🏥', '🏦', '🏪', '🏛️', '⛪', '🏰', '🗼', '🏖️', '🏕️', '⛰️', '🌋', '🗺️', '🧭', '🌃', '🌆', '🌉'],
  },
  {
    name: 'Objects',
    emoji: ['⌚', '📱', '💻', '🖥️', '🖨️', '🖱️', '💾', '📀', '📼', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🛢️', '💸', '💵', '💳', '💎', '🔧', '🔨', '🛠️', '⚙️', '🧲', '🔫', '🧨', '🪓', '🔪', '🛡️', '🚪', '🪑', '🛋️', '🚽', '🚿', '🛁', '🪞', '🧴', '🧷', '🧹', '🧺', '🧻', '🪣', '🧼', '🪥', '🧽', '🧯', '🛒', '🎁', '🎈', '🎀', '📦', '📫', '📜', '📅', '📋', '📁', '✂️', '📌', '📎', '📏', '🔒', '🔑', '🗝️', '📿', '💊', '🩹', '🩺', '🌡️', '🧬', '🔬', '🔭', '🧪', '🧫', '🧹'],
  },
  {
    name: 'Symbols',
    emoji: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💖', '💯', '✅', '☑️', '✔️', '❌', '⭕', '❗', '❓', '💤', '🔆', '🔅', '➕', '➖', '➗', '✖️', '♾️', '🔁', '🔄', '⏩', '⏪', '⏫', '⏬', '🔔', '🔕', '🎵', '🎶', '⚠️', '🚸', '🔱', '📛', '🔰', '♻️', '🌀', '🏁'],
  },
];
export const COLOR_CHOICES: ColorName[] = ['accent', 'gold', 'teal', 'purple', 'green', 'rose'];

export const routineMin = (r: Pick<Routine, 'steps'>): number => r.steps.reduce((a, s) => a + s.min, 0);

/* ── starter templates ──
   Blueprints the editor preloads when you tap a suggestion. Everything stays
   editable before saving. Distinct from BUILTIN_ROUTINES (the seeded set). */
export interface RoutineTemplate {
  id: string;
  emoji: string;
  name: string;
  color: ColorName | string; // preset name or custom "#rrggbb" (Pomodoro uses tomato)
  reminder?: string;
  alarm?: boolean;
  steps: Step[];
  autoAdvance?: boolean;
  pomodoro?: RoutinePomodoro; // present = skip the step-picker, edit via sliders (W)
}

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: 't-morning', emoji: '🌅', name: 'Morning', color: 'accent', reminder: '07:00', alarm: true,
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
    id: 't-evening', emoji: '🌙', name: 'Evening', color: 'purple', reminder: '21:30', alarm: true,
    steps: [
      { t: 'Dim the lights', min: 1 },
      { t: 'Tidy one surface', min: 5, hint: 'One. Not the room.' },
      { t: "Lay out tomorrow's clothes", min: 3 },
      { t: 'Brush teeth', min: 3 },
      { t: 'Phone on its charger', min: 1, hint: 'Across the room.' },
      { t: 'Wind down', min: 10, hint: 'Read, breathe — whatever’s calm.' },
    ],
  },
  {
    id: 't-study', emoji: '📚', name: 'Study', color: 'teal',
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
    id: 't-selfcare', emoji: '🌿', name: 'Self-care', color: 'green',
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
    id: 't-work', emoji: '💼', name: 'Ready for work', color: 'gold', reminder: '08:00',
    steps: [
      { t: 'Get dressed', min: 5, hint: 'Comfy counts.' },
      { t: 'Coffee or breakfast', min: 8 },
      { t: 'Keys, wallet, phone', min: 1, hint: 'Say it out loud.' },
      { t: "Check today's plan", min: 2 },
      { t: 'Shoes + jacket', min: 3 },
      { t: 'Head out', min: 2, hint: 'One look around. Stove off?' },
    ],
  },
  {
    id: 't-shower', emoji: '🚿', name: 'Shower', color: 'teal',
    steps: [
      { t: 'Grab a towel', min: 1 },
      { t: 'Warm the water', min: 1 },
      { t: 'Wash up', min: 5 },
      { t: 'Hair', min: 4 },
      { t: 'Dry off', min: 3 },
      { t: 'Moisturize', min: 3 },
    ],
  },
  {
    // Pomodoro is a routine now: skips the step-picker, edits via sliders, breaks flow
    // without a tap (autoAdvance). Tomato red, steps generated from the default config.
    id: 't-pomodoro', emoji: '🍅', name: 'Pomodoro', color: '#e8503a', autoAdvance: true,
    pomodoro: DEFAULT_POMODORO_CFG,
    steps: buildPomodoroSteps(DEFAULT_POMODORO_CFG),
  },
];

export const getTemplate = (id?: string | null): RoutineTemplate | undefined =>
  id ? ROUTINE_TEMPLATES.find((x) => x.id === id) : undefined;
