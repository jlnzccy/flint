# Flint — Task Backlog

Planning doc distilled from raw notes (2026-06-15, rev 2). Grouped by surface, each task has
file refs + acceptance criteria. Product rules in `AGENTS.md` still apply (terse copy, no shame,
quiet attendance, no points/levels).

Legend: `[ ]` todo · **S/M/L** rough effort.

**Resolved decisions (rev 2):** per-routine for alarm sound + auto-advance/30s toggles ·
"At a time" doesn't auto-open the dial + strip decorative emojis · alarm swipe-down = snooze,
swipe-up = stop · subtasks expand everywhere · Share = placeholder now (QR scan/create planned,
unconfirmed) · onboarding loses the halo, look, and streaks pages.

---

## A. Onboarding (`src/app/onboarding.tsx`)

- [ ] **A1 · Plate-style template cards** — M
  The starter grid (onboarding.tsx:241-262) uses flat `Pressable` cards. Make each template a
  raised, pressed-edge "plate" like every other clickable surface — reuse `ChunkyCard`
  (`src/components/chunky.tsx`). Same treatment in `NewRoutineSheet` for consistency.
  *Accept:* template tiles have the 4px backing + sink-on-press; tapping opens the step-picker.

- [ ] **A2 · All template steps unchecked by default** — S
  `StepPicker` (`src/components/new-routine-sheet.tsx:89`) seeds the selection with **every**
  step on. Flip to start empty (`new Set()`), user opts steps in. CTA already handles 0
  selected. Fixes onboarding + new-routine sheet at once (shared component).
  *Accept:* opening a template shows all steps unchecked; "Use N steps" disabled until ≥1.

- [ ] **A3 · Trim onboarding to the core flow** — M
  Remove the **look** page (theme/accent, onboarding.tsx:145-183) and the **streaks** page
  (onboarding.tsx:185-202) — both still live in Settings, they don't belong in the intro.
  Resulting flow: welcome (Flint) → "No streaks to lose" → "Start with step one" → gentle
  nudges → first routine. Update `PAGES` count (onboarding.tsx:27) and the dot row.
  *Accept:* onboarding has no look/streaks pages; page dots + skip logic match the new count.

- [ ] **A4 · Drop the gradient halo idea** — S
  No halo behind the hero emojis (was considered, cut). Keep `PageHero`/`AnimatedEmoji` as-is
  (plain), just ensure nothing references a removed halo wrapper.
  *Accept:* hero emojis render plain; no leftover halo code.

> Page-dot animation is shared with the player — see **M1**.

---

## B. Routine editor (`src/app/editor.tsx`)

- [ ] **B1 · Per-routine alarm sound** — L
  Add `alarmRingtoneUri?: string | null` to the `Routine` type (`src/data/defaults`). When a
  routine's alarm is on, show an "Alarm sound" picker under the alarm toggle (editor.tsx:286-
  299), reusing the Android ringtone-picker logic currently in Settings (settings.tsx:44-66).
  Plumb the per-routine URI into `playAlarm()` (alarm/[id].tsx:104-108, replacing the global
  `settings.alarmRingtoneUri`).
  *Accept:* alarm-on routines expose a sound picker; that routine's alarm plays its own sound;
  global alarm-sound setting is gone (see H1).

- [ ] **B2 · Remove "only shows on these days" helper text** — S
  Delete the caption at editor.tsx:326-330. Day chips are self-explanatory.
  *Accept:* no helper line under the day selector.

- [ ] **B3 · Color picker no longer shifts the "+"** — S
  Picking a custom color renders a new swatch **before** the "+" (editor.tsx:226-249), pushing
  "+" along / wrapping. Instead the trailing tile is a single fixed slot: the "+" tile itself
  shows the chosen custom color and re-opens the picker. Nothing reflows.
  *Accept:* choosing a custom color recolors the existing trailing tile in place; "+" never
  jumps.

- [ ] **B4 · Unsaved-changes guard (was QoL Q1)** — M
  Backing out of the editor with unsaved edits triggers a soft "Discard changes?" confirm
  (reuse `confirmDestructive` / a sheet). Track dirty state vs. the seeded values. On-brand:
  a quiet catch, not a nag.
  *Accept:* leaving with edits prompts once; no prompt when nothing changed.

---

## B′. Color picker (`src/components/color-picker.tsx`)

- [ ] **B5 · Recent custom colors (was QoL Q3)** — M
  Persist recently picked custom colors (small list in the store) and show a "recent" row in
  the picker so a custom palette is reusable across routines.
  *Accept:* picker shows recent custom colors; tapping one applies it.

---

## C. Time picker (`src/components/time-picker.tsx`, `src/app/editor.tsx`)

- [ ] **C1 · "At a time" doesn't auto-open the dial** — S
  Selecting the `timed` segment currently opens the picker sheet immediately (editor.tsx:256-
  260). Don't auto-open — reveal the time row, let the user tap "Change".
  *Accept:* switching to "At a time" shows the time row without forcing the sheet.

- [ ] **C2 · Auto-advance hour → minutes on the dial** — S
  After the user sets the hour, switch the field to minutes automatically (no manual tap).
  In `commitTouch` (time-picker.tsx:103-121), once a fresh hour commits in the `'h'` field,
  `setField('m')`. Switch on tap / gesture-end only, not mid-drag.
  *Accept:* setting an hour flips the dial to minutes.

- [ ] **C3 · Strip decorative emojis from segmented controls** — S
  Remove emoji glyphs from the relevant `Segmented` options: Schedule (`⚡ Anytime` / `🔔 At a
  time`, editor.tsx:262-265) and dial/type (`🕐 Dial` / `⌨ Type`, time-picker.tsx:277-280).
  Plain text labels.
  *Accept:* those segmented controls show text-only labels.

---

## D. Pre-start screen (`src/app/routine/[id].tsx`)

- [ ] **D1 · Estimated finish range up top** — M
  Centered "now → finish" indicator near the top (e.g. `7:00 – 7:25`) from current time +
  `routineMin(routine)`. Updates if the user trims steps (Short on time).
  *Accept:* opening a routine shows an estimated start–finish window.

- [ ] **D2 · Pre-start toggles: auto-advance + 30s warning (per-routine)** — M
  Two **per-routine** settings (stored on the `Routine`), surfaced as toggles here:
  - **Auto-advance** — at a step's 0, move to the next step automatically.
  - **30s-left reminder** — a cue (haptic / soft sound) when 30s remain.
  Player reads them (see E4/E5).
  *Accept:* toggles render + persist on the routine; player honors them.

---

## E. Routine player (`src/app/player/[id].tsx`)

- [ ] **E1 · Promote the "Next step" indicator** — M
  Faint bottom one-liner (player.tsx:396-398) reads too much like the current step. Move it
  somewhere clearly secondary (under the progress segments or above controls) and show the
  number: `Next step: 3. Brush my teeth`. Last step keeps a distinct message.
  *Accept:* next-step hint is visually subordinate and shows `Next step: <n>. <text>`.

- [ ] **E2 · Satisfying check on step complete** — M
  On `advance('done')` (player.tsx:163-191), pop a check in the **center of the timer ring**,
  then cross-fade back to the next step's running time. Coordinate with `TimerRing`
  (`src/components/timer-ring.tsx`). Reanimated; honor reduce-motion (M2).
  *Accept:* completing a step shows a check in the ring center that fades as the next timer
  appears.

- [ ] **E3 · Back to previous step** — M
  An unobtrusive "previous step" control to reverse an accidental Done. Roll back `idx`, clear
  `results.current[idx]`, reset `elapsed/extra/paused`, no double-count.
  *Accept:* after Done/Skip, user can step back one; that step's result is cleared and its
  timer restarts.

- [ ] **E4 · Auto-advance on timeout** — M
  When the routine's auto-advance is on (D2), reaching `target` auto-fires `advance('done')`
  instead of only buzzing (player.tsx:116-119). Respect pause; leave a beat for the E2 check.
  *Accept:* auto-advance on = steps progress at 0; off = current manual behavior.

- [ ] **E5 · 30-seconds-left cue** — S
  When the routine's 30s reminder is on (D2), fire a haptic/soft cue at `target - elapsed ==
  30` (guard sub-30s steps). Use `src/lib/haptics.ts`.
  *Accept:* one cue fires ~30s before a step ends when enabled.

> Player progress-segment animation — see **M1**.

---

## F. Celebration (`src/components/celebration.tsx`, player celebrate phase)

- [ ] **F1 · Remove the calm/extra option — always "extra"** — S
  Drop the `celebrate` setting entirely: Settings segment (settings.tsx:126-136), the calm
  branch (player.tsx:209-217), the sound gate (player.tsx:153-156), and `settings.celebrate`
  in the store + migration (store.ts:40,101,317).
  *Accept:* no celebration toggle anywhere; every completion runs the animated celebration.

- [ ] **F2 · Color gradient pulse behind the emoji** — M
  Radial-gradient **pulse** (not a slow breathe) behind the celebration emoji, tinted by the
  **routine's color** (`t.col(routine.color)`). Reuse the alarm `PulseGlow` shape with a
  snappier beat. Player celebrate phase (player.tsx:201-218) + `CelebrationEmoji`. Note:
  `CelebrationOverlay` (first-routine party) has no routine color — pass one in or use accent.
  Honor reduce-motion (M2).
  *Accept:* celebration emoji sits over a pulsing colored glow matching the routine.

---

## G. Alarm (`src/app/alarm/[id].tsx`)

- [ ] **G1 · Pulse instead of breathe** — S
  `PulseGlow` breathes slowly (2100ms ease, scale 0.82↔1.12, alarm/[id].tsx:31-72). Make it a
  faster rhythmic pulse ("falling into a hole" feel — quicker inward zoom + opacity beat).
  Photosensitivity-safe (no harsh strobe). Honor reduce-motion (M2).
  *Accept:* glow pulses rhythmically rather than gently breathing.

- [ ] **G2 · Swipe down = snooze, swipe up = stop** — M
  Vertical pan gestures on the alarm screen: **swipe down → Snooze 5 min**, **swipe up → Stop**
  ("Not today" / dismiss). Both run `silence()` (stops sound + vibration). Keep the buttons too.
  *Accept:* swipe-down snoozes, swipe-up stops; both silence audio/vibration.

---

## H. Settings (`src/app/(tabs)/settings.tsx`, `src/state/store.ts`)

- [ ] **H1 · Remove the "Sounds" section** — S
  Delete the alarm-sound rows (settings.tsx:92-111) — picker moves into the routine editor (B1).
  *Accept:* no Sounds section in Settings.

- [ ] **H2 · Experimental section** — M
  New "Experimental" group near the bottom: **Sounds** (the brainwave-tones screen, formerly a
  tab) + **Haptics lab**. Sounds becomes a pushed route, not a tab (I1). Move the Haptics-lab
  row (settings.tsx:121-125) here.
  *Accept:* Settings has an Experimental section linking to Sounds + Haptics lab.

- [ ] **H3 · Default flips** — S
  In `DEFAULT_SETTINGS` (store.ts:92-102): `countUp: true → false`, `streakNeverDies: false →
  true`. Verify the migration block (store.ts:~300-345, esp. line 312 forcing
  `streakNeverDies=false`) doesn't clobber the new default for existing users; adjust if needed.
  *Accept:* fresh installs start count-up off + streak-never-dies on; existing users not reset.

- [ ] **H4 · Delete-all data (long-press)** — L
  Bottom of Settings: destructive "Delete all data" that wipes everything (zustand + AsyncStorage
  key `flint-v1`) and restarts onboarding (clears `onboarded`). Must require a **long-press**
  (not a tap) after a confirm affordance. Needs a store reset action + nav to `/onboarding`.
  *Accept:* long-press (after confirm) erases all data → onboarding; a tap does nothing.

- [ ] **H5 · Reduce-motion toggle (was QoL Q5)** — M
  Add a "Reduce motion" toggle in Settings (Display group). New/heavy animations check it
  (F2, G1, E2, M1) — wire via a shared `useReducedMotion()`-style helper that also respects the
  OS setting. On-brand with the existing photosensitivity care in Sounds.
  *Accept:* toggling reduce-motion calms the pulsing/animated effects app-wide.

- [ ] **H6 · Export data (was QoL Q4) — PARKED** — _later_
  Export all data as JSON (safety net before Delete-all, seed for future routine import/share).
  No account, no cloud. Parked per request; keep here so it lands near H4/Experimental when
  picked up.

---

## I. Navigation / tab bar (`src/app/(tabs)/_layout.tsx`)

- [ ] **I1 · Drop Sounds from the tab bar** — S
  Remove `sounds` from `TABS` + `Tabs.Screen` (_layout.tsx:10-16, 74-78). Keep the screen file;
  reached from Settings → Experimental (H2). Tabs become: Routine, Tasks, Insights, Settings.
  *Accept:* no Sounds tab; Sounds still opens from Settings.

- [ ] **I2 · Center "+" add-routine button** — M
  Prominent center "+" in the tab bar opening `NewRoutineSheet`. Layout:
  `Routine · Tasks · [ + ] · Insights · Settings`. Keep the existing header "+"
  (index.tsx:280-282) too — user wants both.
  *Accept:* center "+" opens New Routine; header "+" still works.

---

## J. Insights (`src/app/(tabs)/insights.tsx`, `src/components/calendar-view.tsx`)

- [ ] **J1 · GitHub-style contribution grid** — L
  Replace the patterns/calendar pager with a single view. Add a heat-grid: small boxes, **no
  dates**, brightness ∝ activity that day, "showed up" (`appDays`) counts. Reuse
  `dayLevel(merged, appDays, key)` (store.ts).
  *Accept:* a heat-grid of boxes; busier days brighter/darker; showing-up lights a box.

- [ ] **J2 · 30d / 7d range toggle + calendar button** — M
  `30d` / `7d` switch controlling the grid window + a calendar button opening the full month
  view (`/calendar`).
  *Accept:* toggling rescales the grid; the button opens the month calendar.

- [ ] **J3 · Remove "Showed up N days this week"** — S
  Delete that summary line (insights.tsx:138-144).
  *Accept:* no "showed up … this week" copy.

- [ ] **J4 · Remove the patterns/calendar switcher** — S
  Drop the `Segmented` + horizontal pager (insights.tsx:96-114, 201-204). Calendar reached via
  the J2 button.
  *Accept:* no top segmented control; single scrolling insights page.

---

## K. Tasks (`src/components/todo-row.tsx`, `src/app/(tabs)/tasks.tsx`, Today `index.tsx`)

- [ ] **K1 · Show all subtasks inline, everywhere** — M
  When a task has subtasks, render them all (checkable) instead of the `N/M subtasks` count
  (todo-row.tsx:54-64). Applies on the Tasks tab **and** the Today list (index.tsx:253-259).
  Keep rows tidy when expanded.
  *Accept:* any task with subtasks lists each subtask + checkbox, on Tasks and Today.

---

## L. Long-press menu (`src/components/routine-bits.tsx` → `PreviewSheet`)

- [ ] **L1 · Duplicate routine** — M
  "Duplicate" action in the long-press sheet (routine-bits.tsx:162-189). Clones with a new id
  (`"c" + Date.now()`, name "… copy") via a store action.
  *Accept:* duplicating creates an independent editable copy.

- [ ] **L2 · Share routine — placeholder** — S
  "Share" action that shows a "coming soon" placeholder for now. Planned direction: **QR
  share** (scan / create a QR to import a routine) — feasibility unconfirmed, so v1 is a
  visible placeholder only.
  *Accept:* Share appears in the menu and shows the placeholder; no real export yet.

---

## M. Cross-cutting

- [ ] **M1 · Re-animate page indicators (onboarding + player)** — S
  Both dot rows snap width instantly (onboarding.tsx:276-286; player.tsx:300-316). Animate the
  active-dot width/color with Reanimated (`withTiming`). Honor reduce-motion (M2).
  *Accept:* the active dot animates its transition in both screens.

- [ ] **M2 · Shared reduce-motion helper** — S
  One helper the new effects (F2, G1, E2, M1) consult; backs the H5 toggle and the OS setting.
  *Accept:* a single source of truth gates the animated effects.

---

## N. Today screen (`src/app/(tabs)/index.tsx`)

- [ ] **N1 · Estimated finish window on cards (was QoL Q6)** — S
  Extend the D1 finish-time math onto Today's routine cards so each shows its time window —
  complements the existing "Next: …" time-blindness anchor (index.tsx:228-232).
  *Accept:* scheduled routine cards show an estimated window; layout stays clean.

---

## Parked (not now)

- **Undo on quick actions / un-complete a finished task** — was QoL Q2. Preferred variant per
  user: an "undo / mark-undone" path for **completed tasks**. Parked.
- **H6 · Export data (JSON)** — parked (listed under Settings so it lands near Delete-all).

> Deliberately **not** suggesting: levels, badges, XP, social leaderboards, mascots, or streak
> pressure — all off-limits per `AGENTS.md`.
