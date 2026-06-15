# Flint — Expo app

ADHD routines app with step timers. No scrutiny, no shame, no guilt. Reward showing up; never measure output.

Expo SDK 56 (RN 0.85, React 19.2). Read https://docs.expo.dev/versions/v56.0.0/ before using unfamiliar Expo APIs.

## Stack

- expo-router (src/app), custom tab bar in `(tabs)/_layout.tsx`
- NativeWind 4 + Tailwind 3.4 — config in `tailwind.config.js`; theme colors are CSS vars set by `src/theme/theme.tsx` via `vars()`. Per-routine colors come from `useTheme().col(name)` inline styles (NativeWind classes must be static).
- Reanimated 4 for all motion; gesture-handler for drag reorder (`src/components/drag-list.tsx`)
- zustand + AsyncStorage persistence (`src/state/store.ts`), key `flint-v1`
- react-native-svg icons in `src/components/icons.tsx`

## Design language ("Ember Arcade")

Dark warm charcoal, chunky 4px pressed-edge surfaces (`src/components/chunky.tsx` — backing view sits CHUNK lower, face sinks on press). Fonts: Nunito 800/900 (display/labels, uppercase), Be Vietnam Pro (body). Radius 18. Original mockup: `../project/Flint Arcade.html`.

## Product rules (do not regress)

- UI copy is terse. No corny metaphor names (no twigs/sparks/embers/cold-ashes). Toasts ≤ 3 words where possible.
- No points or levels. Streaks are opt-in (Settings → Progress); "Streak never dies" makes gaps pause instead of reset. Streaks off = no streak UI anywhere.
- Routines: archive or delete (delete always confirms). Archived list lives in a sheet at the bottom of Today, not Settings.
- Today is sectioned: Tasks due today → Scheduled routines (timed, sorted) → Anytime (flexible) → Completed (done today, dimmed).
- Skip is drama-free. "Not today" bumps without penalty. No rest-day mode; nothing ever counts against the user.
- Quiet attendance: opening the app marks the day in `appDays`; calendar/week strip color it as showed-up. **Never surface this in UI copy** — it exists so the calendar never looks like failure. Calendar legend calls empty days "Rest".
- Tasks (todos) are separate from routines: own tab, full editor at `/task` (details, reminder date+time, deadline, repeat rule, subtasks). Tasks dated/due/repeating today surface on Today. Repeat math in `src/lib/repeat.ts`.

## Commands

- `npx expo start` — dev server (notifications don't fire in Expo Go on Android; use a dev build: `npx expo run:android`)
- `npx tsc --noEmit` — typecheck
- `npx expo export --platform android` — bundle sanity check
