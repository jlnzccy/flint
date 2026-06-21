# Flint — Task Backlog (DONE archive)

Completed work, archived from `task.md`. Covers Batches 1–13, rev 2–4 polish, QoL, and the
v1.2.0 ship (2026-06-19, `bccecac`). Active/unfinished work lives in `task.md`. The only
non-done item kept here for context is **H6** (parked export). Read-only history — don't add
new tasks here.

Originally: planning doc distilled from raw notes (2026-06-15, rev 2). Grouped by surface, each
task has file refs + acceptance criteria. Product rules in `AGENTS.md` still apply (terse copy,
no shame, quiet attendance, no points/levels).

Legend: `[ ]` todo · `[x]` done · **S/M/L** rough effort.

## Progress / next up

Build order chosen by dependency + effort (not list order):

1. [x] **M2** — shared reduce-motion helper. `src/hooks/use-reduced-motion.ts`
   (`useReducedMotion()` = OS setting OR `settings.reduceMotion`). Added
   `reduceMotion` to `Settings` + `DEFAULT_SETTINGS`; store bumped v7→v8 with
   backfill migration. **Done 2026-06-15.**
2. [x] **A2** — template steps unchecked by default. `StepPicker` seeds `new Set()`;
   shared by onboarding + new-routine sheet. **Done 2026-06-15.**
3. [x] **D2** — per-routine auto-advance + `warn30` toggles on `Routine`, surfaced on
   pre-start ("This routine" section). **Done 2026-06-15.** Player wiring is E4/E5.
4. [x] **B1** — per-routine alarm sound. `alarmRingtoneUri` on `Routine`; picker in editor
   under alarm toggle; alarm screen plays per-routine URI. **Done 2026-06-15.**
5. [x] **H1** — removed "Sounds" section from Settings + dead `pickRingtone`/imports; also
   retired the global `settings.alarmRingtoneUri` (type + default). **Done 2026-06-15.**
6. [x] **E4 + E5** — player now honors D2's toggles: auto-advance fires `advance('done')`
   at target; `warn30` fires `warnHaptic()` at target-30s (steps >30s). **Done 2026-06-15.**
7. [x] **Batch 1 — Editor & picker polish** (B2, C1, C3, B3, C2). **Done 2026-06-15.**
   B2: removed the day-selector caption. C1: "At a time" reveals the time row, no auto-open.
   C3: stripped emoji glyphs from the Schedule + Dial/Type segmented controls. B3: color
   picker's trailing tile is one fixed slot (recolors in place, no reflow). C2: dial flips
   hour→minutes on gesture-end. `npx tsc --noEmit` clean.
8. [x] **Batch 2 — Onboarding & page dots** (A3, A4, A1, M1). **Done 2026-06-15.**
   A3: removed onboarding's look + streaks pages; `PAGES` now 5 (welcome + 2 slides +
   reminders + starter) + dead imports/selectors pruned. A4: no halo code existed (grep
   clean), no change. A1: starter cards + `NewRoutineSheet` template rows are now `ChunkyCard`
   plates. M1: animated `Dot` (onboarding) + `ProgressSeg` (player) via `withTiming` on
   width/color, gated on `useReducedMotion()`. `npx tsc --noEmit` clean.
9. [x] **Batch 3 — Nav & Settings restructure** (I1, H2, I2, H3, H5). **Done 2026-06-16.**
   I1: dropped `sounds` from `TABS` + `Tabs.Screen`; moved `(tabs)/sounds.tsx` → `src/app/sounds.tsx`
   (now a pushed stack route with a close-X header). H2: new "Experimental" Settings group
   (Sounds + Haptics lab, both pushed routes); Haptics-lab row moved out of Feedback. I2:
   prominent center "+" in the tab bar opens `NewRoutineSheet` (rendered at `TabsLayout`); header
   "+" still works. H3: `countUp` default→false, `streakNeverDies` default→true (migration's
   `version<2` force-false only hits legacy upgraders, not existing v8 users — verified, no clobber).
   H5: "Reduce motion" toggle in Display group wired to `settings.reduceMotion`. `npx tsc --noEmit` clean.
10. [x] **Batch 4 — Motion: celebration + alarm** (F1, F2, G1, G2). **Done 2026-06-16.**
   F1: removed the `celebrate` setting (type + default + v<3 migration line + Settings segment +
   player calm-branch/sound-gate) — every completion runs the animated celebration. F2: new
   `CelebrationGlow` (radial pulse, snappy beat, reduce-motion aware) behind the emoji in both the
   player celebrate phase (routine color) + `CelebrationOverlay` (accent). G1: alarm `PulseGlow`
   now a rhythmic pulse (460ms swell / 820ms settle) + reduce-motion static hold. G2: Pan gesture —
   swipe down = snooze, swipe up = stop; both reuse the button handlers + `silence()`; buttons kept;
   faint swipe hint added. `npx tsc --noEmit` clean.
11. [x] **Batch 5 — Insights overhaul** (J3, J4, J2, J1). **Done 2026-06-16.**
   J4: dropped the patterns/calendar `Segmented` + horizontal pager — single scrolling page. J3:
   removed the "Showed up N days this week" line (whole week-strip card retired). J1: GitHub-style
   `HeatGrid` (weekday-aligned rows of 7, no dates, brightness via `dayLevel(merged, appDays, k)`,
   legend). J2: `7d`/`30d` range toggle drives the grid window + a calendar `Chip` opens `/calendar`.
   `npx tsc --noEmit` clean.
12. [x] **Batch 6 — Player interactions** (E1, E3, E2). **Done 2026-06-16.**
   E1: next-step hint moved to a centered secondary row above the controls, copy
   `Next step: <n>. <text>`. E3: `goBack()` + absolute-left `IconChevL` "Back" (shown when
   `idx>0`), clears the returned-to step's result + restarts its timer. E2: `popCheck()` overlays
   an animated green check on the ring (withSequence pop/hold/fade) on Done — manual + E4
   auto-advance — gated on `useReducedMotion()`, no `TimerRing` change. `npx tsc --noEmit` clean.
13. [x] **Batch 7 — Finish windows** (D1, N1). **Done 2026-06-16.**
   Shared `addMins`/`nowHHMM` helpers in `lib/dates.ts`. D1: clock `Chip` on the pre-start screen
   showing `now – now+routineMin` (clock-aware). N1: scheduled `RoutineCard`s show the reminder
   time as a window `reminder – reminder+routineMin` in place of the lone start time. `npx tsc
   --noEmit` clean.
14. [x] **Batch 8 — Routine menu & tasks** (L2, L1, K1). **Done 2026-06-16.**
   L1: `duplicateRoutine(id)` store action (resolves override-merged source → custom copy,
   `id:'c'+Date.now()`, name `"… copy"`) + "Duplicate" `Chip` in `PreviewSheet`. L2: "Share"
   `Chip` (new `IconShare`) → "Coming soon" toast (QR still parked). K1: `TodoRow` renders every
   subtask inline (small `SubCheck` → `toggleSubtask`), dropped the `N/M subtasks` count; shared
   component so Tasks + Today both get it. `npx tsc --noEmit` clean.
15. [x] **Batch 9 — Editor guards & colors** (B4, B5). **Done 2026-06-16.**
   B4: editor unsaved-changes guard — `snapshot()`/`baseline` ref dirty-check; `leave()` shows a
   `confirmDestructive('Discard changes?')` only when dirty, wired to the Close X + Android
   hardware back (`useFocusEffect`+`BackHandler`); save/archive/delete bypass it via direct router
   calls. B5: `recentColors` on the store (persisted) + `pushRecentColor`; `ColorPickerSheet`
   shows a "Recent" swatch row (tap = apply) and pushes on commit. `npx tsc --noEmit` clean.
16. [x] **Batch 10 — Delete-all data** (H4). **Done 2026-06-16.**
   `resetAll()` store action (shared `freshData()` factory) wipes every field → `onboarded:false`
   flips the navigator guard back to onboarding (persist rewrites `flint-v1` with defaults).
   Bottom-of-Settings `HoldDelete`: 1500ms hold-to-confirm with a growing red fill; a tap
   cancels before the timer (does nothing), a full hold runs `resetAll` + "Erased" toast.
   `npx tsc --noEmit` clean. **All 10 batches done — backlog clear (only parked items remain).**
17. [x] **Batch 11 — Tabs, motion, insights, pomodoro, sound** (beyond the original
    backlog; user-driven polish + 1 feature). **Done 2026-06-16.**
    - Tab bar: `Chunky` pressed-edge "+" FAB; dropped text labels (icon-only); active
      tab gets an `accent.soft` pill; tab `animation` `none`→`fade` (cross-fade).
    - Sticky titles on all four tabs (Display lifted out of the ScrollView); Today's
      hero header pinned, day-swipe now animates only the scrolling list below it.
    - Today is routines-only: removed the Tasks section + `todayTodos`/`TodoRow`
      (AGENTS.md rule updated). Tasks live solely on the Tasks tab.
    - Celebration: dropped `CelebrationGlow` (halo) in both the overlay + player; new
      hand-rolled Reanimated `Confetti` (one-shot fall/spin/fade, reduce-motion gated).
    - Insights heat-grid: 5-step faded→deep ramp via `hexAlpha(accent, …)` keyed on
      `merged[k].length` (richer = more done); boxes fill the card width (dropped the
      30px cap); 7d/30d + calendar moved small inside the card; gradient legend.
    - Pomodoro: `pomodoro` config on the store (focus/short/long/cyclesBeforeLong +
      auto-start toggles; persist v8→v9 backfill). `/timer` gained a Free/Pomodoro
      `Segmented`; phase machine (focus→short/long), cycle dots, +5-min extend-on-flow,
      skip/reset, inline config sheet, gentle `playStepDone` chime + haptic per phase.
    - Sound: fixed broken `CELEBRATIONS` require (deleted grand/mini → `celebration-fanfare`
      only); `playStepDone()` wired to non-final Done steps (`step-done.mp3`); first-routine
      overlay now plays the sting (`_layout.tsx` effect on `showCelebration`).
    `npx tsc --noEmit` clean · `npx expo export --platform android` ok.

18. [x] **Batch 12 — Polish round (rev 3)** — user-driven, beyond the original backlog.
    Sound latency, sideways confetti, insights sizing + 7-day strip, tab-bar shapes,
    timer mode chooser + slider config, page-transition feel, player chrome, onboarding
    dots, notification opt-in, custom accent + Material You tease. **DONE 2026-06-16 — all
    18 tasks (P1–P18) built across 5 groups, tsc clean per group. Pre-existing uncommitted
    batches 1–11 committed first (`16c9aa6`), then G1 `fdd19b0` · G2 `c064d00` · G3 `e43cc57`
    · G4 `4f3477b` · G5 `a0f155e`. Note: P9's Slider already existed (`f2513f4`), reused.**

19. [x] **Batch 13 — Polish round (rev 4)** — retire `/timer` + Pomodoro-as-routine;
    tab/onboarding/player/celebration/insights polish (19 tasks). **DONE 2026-06-17 — all 19
    tasks (Q1, R1, V1–V4, T1–T3, S1–S3, U1–U3, X1, W1–W4) built across 8 groups, tsc clean per
    group. ⚠️ verify on a dev build: S1 edit-mode X / false-dirty, T2 swipe-back feel.**
    - Q1 ✅ retired standalone `/timer` — deleted `src/app/timer.tsx`, removed the Today
      clock `Chip` + unused `IconClock` import; pomodoro store slice + `slider.tsx` kept
      for W. `tsc` clean. Commit `refactor: retire standalone timer screen (Q1)`.
    - R1 ✅ tab "+" flush (dropped `marginTop:-16`, row centered) + taller bar (padding
      12/14→16/18, "+" face 40→46). `tsc` clean. Commit `feat: tab bar + flush + taller bar (R1)`.
    - V1–V4 ✅ insights heat-grid: GitHub-classic orientation filling card width (onLayout
      measure + fit week-columns), legend removed, monotonic faint→bright ramp (dropped
      `accent.deep` tail), dropped 7d/30d toggle, calendar chip → "This week" card. `tsc` clean.
      Commit `feat: insights heat-grid fills card, monotonic ramp (V1-V4)`.
    - T1–T3 ✅ player: `<` is prev-step only (hidden+slot at step 1), swipe-right=prev step
      (`Gesture.Pan`), next-step line dropped the number + bigger/clearer (16→19, text). `tsc`
      clean. Commit `feat: player back-only chevron, swipe-back, fuller next line (T1-T3)`.
    - S1–S3 ✅ editor `safeBack()` (fixes dead back from onboarding replace); onboarding bell
      animated + reduce-motion aware; "Enable notifications" folded into the Next button
      (requests once, never traps). `tsc` clean. Commit `fix: editor safeBack + onboarding bell/notif opt-in (S1-S3)`.
    - U1–U3 ✅ celebration: confetti rains from top + denser (110); `EmojiConfetti` reworked
      into a bobbing floating field (varied size/speed, ✨ sprinkle, reduce-motion gated) in
      overlay + player; new `CELEBRATION_FLOAT` pool. `tsc` clean. Commit `feat: celebration confetti from top + floating emoji field (U1-U3)`.
    - X1 ✅ `SCREEN_DURATION` 380→375 (Material full-screen value) + cite; no curve change.
      `tsc` clean. Commit `chore: pin SCREEN_DURATION to Material full-screen 375ms (X1)`.
    - W1–W4 ✅ Pomodoro as a routine: `RoutinePomodoro`+`pomodoro?` on `Routine`,
      `buildPomodoroSteps`, tomato 🍅 template (autoAdvance); template skips step-picker;
      editor config sliders (sessions/focus/break) regenerate steps; player "+5 min" for
      pomodoro. `tsc` clean. Commit `feat: Pomodoro as a routine (W1-W4)`. **All 19 Batch-13
      tasks built.**

Remaining motion track: none — all player/celebration/alarm motion (E2, F2, G1, M1) is built.

> Note: E5 is haptic-only (no soft sound asset). E2 resolves the old E4 "leave a beat" note by
> overlaying the check on the next step's timer (then fading) rather than delaying the advance.

> Note: H1 left the v7 historical migration line (store.ts ~343) that backfilled the old
> global field — append-only history, harmless (runs on `persisted: any`).

Dependency reminders: M2 → F2/G1/E2/M1/H5 · D2 → E4/E5 · B1 → H1 ·
M1 shared by onboarding + player.

## Batch plan (remaining 33 tasks → 10 sessions)

Grouped by surface so each batch is coherent + verifiable in one `npx tsc --noEmit`. Do
batches in order where noted; within a batch follow the listed order. **Per-batch rules:**
read each target region before editing · respect `AGENTS.md` (terse copy, no shame, motion
gated by `useReducedMotion()` from `src/hooks/use-reduced-motion.ts`, NativeWind classes
static / per-routine color via `t.col()`) · typecheck after the batch · then mark each task
`[x]` with a one-line **Built:** note, refresh this Progress block, and update the
`flint-backlog-progress` memory + `MEMORY.md` index.

- **Batch 1 — Editor & picker polish** [all S]: B2, C1, C3, B3, C2.
  Files: `editor.tsx`, `time-picker.tsx`. Independent quick wins.
- **Batch 2 — Onboarding & page dots**: A3 → A4 → A1 → M1.
  Files: `onboarding.tsx`, `new-routine-sheet.tsx`, `player.tsx`. Do A3 first (it changes
  the `PAGES` count + dot row) so M1's dot animation lands on the final layout.
- **Batch 3 — Nav & Settings restructure**: I1 → H2 → I2 → H3 → H5.
  Files: `(tabs)/_layout.tsx`, `(tabs)/settings.tsx`, the Sounds screen, `store.ts`.
  I1 + H2 are linked (Sounds stops being a tab, becomes a pushed route under Experimental).
- **Batch 4 — Motion: celebration + alarm**: F1 → F2, G1, G2.
  Files: `settings.tsx`, `store.ts`, `player.tsx`, `celebration.tsx`, `alarm/[id].tsx`.
  F1 (remove calm/extra) before F2 (pulse). F2/G1 gate on `useReducedMotion()`.
- **Batch 5 — Insights overhaul**: J3, J4 → J2 → J1.
  Files: `insights.tsx`, `calendar-view.tsx`. J1 is **L** (contribution grid) — verify
  rendering carefully; reuse `dayLevel(merged, appDays, key)` from store.
- **Batch 6 — Player interactions**: E1, E3, E2.
  Files: `player.tsx`, `timer-ring.tsx`. E2 (check in ring) gates on `useReducedMotion()`
  and should coordinate the E4 auto-advance beat (see note above).
- **Batch 7 — Finish windows**: D1 → N1.
  Files: `routine/[id].tsx`, `index.tsx`. N1 extends D1's finish-time math onto Today cards
  — share one helper.
- **Batch 8 — Routine menu & tasks**: L2, L1, K1.
  Files: `routine-bits.tsx`, `store.ts`, `todo-row.tsx`, `tasks.tsx`, `index.tsx`.
- **Batch 9 — Editor guards & colors**: B4, B5.
  Files: `editor.tsx`, `color-picker.tsx`, `store.ts`. B5 persists recent colors in the store.
- **Batch 10 — Delete-all data** [solo, **L, destructive**]: H4.
  Files: `settings.tsx`, `store.ts`. Wipes zustand + AsyncStorage `flint-v1` + restarts
  onboarding. Long-press after a confirm affordance — a tap must do nothing. Test the guard.

Parked (not in batches): H6 (export JSON), undo-completed-task. See "Parked" at the bottom.

**Resolved decisions (rev 2):** per-routine for alarm sound + auto-advance/30s toggles ·
"At a time" doesn't auto-open the dial + strip decorative emojis · alarm swipe-down = snooze,
swipe-up = stop · subtasks expand everywhere · Share = placeholder now (QR scan/create planned,
unconfirmed) · onboarding loses the halo, look, and streaks pages.

---

## A. Onboarding (`src/app/onboarding.tsx`)

- [x] **A1 · Plate-style template cards** — M ✅ 2026-06-15
  The starter grid (onboarding.tsx:241-262) uses flat `Pressable` cards. Make each template a
  raised, pressed-edge "plate" like every other clickable surface — reuse `ChunkyCard`
  (`src/components/chunky.tsx`). Same treatment in `NewRoutineSheet` for consistency.
  *Accept:* template tiles have the 4px backing + sink-on-press; tapping opens the step-picker.
  **Built:** onboarding starter cards + `NewRoutineSheet` template rows are now `ChunkyCard`
  (`style={{width:'47%'}}` + `faceStyle` for padding/layout). Dropped the manual `tapHaptic()`
  — `Chunky` already fires a press-in tap. Tap still opens the step-picker (`setPickTpl`/
  `setPicked`).

- [x] **A2 · All template steps unchecked by default** — S ✅ 2026-06-15
  `StepPicker` (`src/components/new-routine-sheet.tsx:89`) seeds the selection with **every**
  step on. Flip to start empty (`new Set()`), user opts steps in. CTA already handles 0
  selected. Fixes onboarding + new-routine sheet at once (shared component).
  *Accept:* opening a template shows all steps unchecked; "Use N steps" disabled until ≥1.
  **Built:** seed now `new Set<number>()`; CTA already had `disabled={idxs.length===0}` +
  `'Pick a step'` fallback (untouched); copy flipped to "Tap the ones you want."

- [x] **A3 · Trim onboarding to the core flow** — M ✅ 2026-06-15
  Remove the **look** page (theme/accent, onboarding.tsx:145-183) and the **streaks** page
  (onboarding.tsx:185-202) — both still live in Settings, they don't belong in the intro.
  Resulting flow: welcome (Flint) → "No streaks to lose" → "Start with step one" → gentle
  nudges → first routine. Update `PAGES` count (onboarding.tsx:27) and the dot row.
  *Accept:* onboarding has no look/streaks pages; page dots + skip logic match the new count.
  **Built:** deleted both pages; `PAGES = 1 + SLIDES.length + 1 + 1` (welcome + 2 slides +
  reminders + starter = 5). Removed now-dead `Segmented`/`Toggle`/`ACCENT_CHOICES` imports,
  the `accent`/`setAccent`/`settings` selectors, and `toggleStreaks`. Dots + Skip read `PAGES`
  so both follow the new count.

- [x] **A4 · Drop the gradient halo idea** — S ✅ 2026-06-15
  No halo behind the hero emojis (was considered, cut). Keep `PageHero`/`AnimatedEmoji` as-is
  (plain), just ensure nothing references a removed halo wrapper.
  *Accept:* hero emojis render plain; no leftover halo code.
  **Built:** nothing to remove — `PageHero`/`AnimatedEmoji` were already plain. Grepped
  `halo` across `src/` → no matches. Verified clean, no code change needed.

> Page-dot animation is shared with the player — see **M1**.

---

## B. Routine editor (`src/app/editor.tsx`)

- [x] **B1 · Per-routine alarm sound** — L ✅ 2026-06-15
  Add `alarmRingtoneUri?: string | null` to the `Routine` type (`src/data/defaults`). When a
  routine's alarm is on, show an "Alarm sound" picker under the alarm toggle (editor.tsx:286-
  299), reusing the Android ringtone-picker logic currently in Settings (settings.tsx:44-66).
  Plumb the per-routine URI into `playAlarm()` (alarm/[id].tsx:104-108, replacing the global
  `settings.alarmRingtoneUri`).
  *Accept:* alarm-on routines expose a sound picker; that routine's alarm plays its own sound;
  global alarm-sound setting is gone (see H1).
  **Built:** `alarmRingtoneUri?` on `Routine` (defaults.ts) + saveRoutine override whitelist.
  Editor: `alarmUri` state (seeds from `routine`, not template), `pickRingtone()` copied from
  settings (→ `setAlarmUri`), "Alarm sound" + "Use app default" rows gated by `alarm`; save
  writes `reminder && alarm ? alarmUri : null`. alarm/[id].tsx now plays
  `routine.alarmRingtoneUri ?? null` (stopped reading `settings.alarmRingtoneUri`). **H1 still
  owns removing the dead global Sounds UI + store field.**

- [x] **B2 · Remove "only shows on these days" helper text** — S ✅ 2026-06-15
  Delete the caption at editor.tsx:326-330. Day chips are self-explanatory.
  *Accept:* no helper line under the day selector.
  **Built:** removed the `days.length < 7 && <Body>…</Body>` caption block under the day
  selector. Day chips stand alone.

- [x] **B3 · Color picker no longer shifts the "+"** — S ✅ 2026-06-15
  Picking a custom color renders a new swatch **before** the "+" (editor.tsx:226-249), pushing
  "+" along / wrapping. Instead the trailing tile is a single fixed slot: the "+" tile itself
  shows the chosen custom color and re-opens the picker. Nothing reflows.
  *Accept:* choosing a custom color recolors the existing trailing tile in place; "+" never
  jumps.
  **Built:** deleted the separate `customColor && <swatch>` tile; the always-present trailing
  Pressable now fills with `c.main` (border `t.text`, scale 1.12) when `customColor`, else shows
  the `IconPlus` on `t.raised`. Layout slot is fixed 40×40 so nothing reflows.

- [x] **B4 · Unsaved-changes guard (was QoL Q1)** — M ✅ 2026-06-16
  Backing out of the editor with unsaved edits triggers a soft "Discard changes?" confirm
  (reuse `confirmDestructive` / a sheet). Track dirty state vs. the seeded values. On-brand:
  a quiet catch, not a nag.
  *Accept:* leaving with edits prompts once; no prompt when nothing changed.
  **Built:** `snapshot()` serializes the editable fields (name/emoji/color/reminder/alarm/
  alarmUri/days/steps, all trimmed); `baseline` ref captures it on first render, `dirty =
  baseline !== snapshot()`. `leave()` → `confirmDestructive('Discard changes?', …, 'Discard',
  router.back)` when dirty, else straight `router.back()`. Wired to the Close "X" and Android
  hardware back (`useFocusEffect` + `BackHandler`, returns `false` when clean so back falls
  through). Save/archive/delete call the router directly → never prompt.

---

## B′. Color picker (`src/components/color-picker.tsx`)

- [x] **B5 · Recent custom colors (was QoL Q3)** — M ✅ 2026-06-16
  Persist recently picked custom colors (small list in the store) and show a "recent" row in
  the picker so a custom palette is reusable across routines.
  *Accept:* picker shows recent custom colors; tapping one applies it.
  **Built:** `recentColors: string[]` on the store (persisted, in `partialize`) + `pushRecentColor`
  action (lowercases, dedupes to front, caps 8). `ColorPickerSheet` shows a "Recent" swatch row
  (when non-empty) above Hue; tapping a swatch re-pushes + `onPick` + closes. Committing via "Use
  this color" also pushes. No version bump — top-level key, shallow-merge keeps `[]` for old saves.

---

## C. Time picker (`src/components/time-picker.tsx`, `src/app/editor.tsx`)

- [x] **C1 · "At a time" doesn't auto-open the dial** — S ✅ 2026-06-15
  Selecting the `timed` segment currently opens the picker sheet immediately (editor.tsx:256-
  260). Don't auto-open — reveal the time row, let the user tap "Change".
  *Accept:* switching to "At a time" shows the time row without forcing the sheet.
  **Built:** the `timed` branch now `setReminder(draftTime || '07:00')` (reveals the time row)
  instead of `setTimeOpen(true)`. The "Change" Chip still opens the dial.

- [x] **C2 · Auto-advance hour → minutes on the dial** — S ✅ 2026-06-15
  After the user sets the hour, switch the field to minutes automatically (no manual tap).
  In `commitTouch` (time-picker.tsx:103-121), once a fresh hour commits in the `'h'` field,
  `setField('m')`. Switch on tap / gesture-end only, not mid-drag.
  *Accept:* setting an hour flips the dial to minutes.
  **Built:** switch lives in the pan `.onEnd` (not `commitTouch`, which also runs mid-drag) —
  `if (fieldSv.value === 'h') runOnJS(setField)('m')` after the hour snaps. Tap and drag both
  end via `onEnd`; mid-drag `onUpdate` is untouched. The field-switch effect then glides the
  hand to the minute position.

- [x] **C3 · Strip decorative emojis from segmented controls** — S ✅ 2026-06-15
  Remove emoji glyphs from the relevant `Segmented` options: Schedule (`⚡ Anytime` / `🔔 At a
  time`, editor.tsx:262-265) and dial/type (`🕐 Dial` / `⌨ Type`, time-picker.tsx:277-280).
  Plain text labels.
  *Accept:* those segmented controls show text-only labels.
  **Built:** Schedule labels now `Anytime` / `At a time`; time-picker labels now `Dial` /
  `Type`. No glyphs.

---

## D. Pre-start screen (`src/app/routine/[id].tsx`)

- [x] **D1 · Estimated finish range up top** — M ✅ 2026-06-16
  Centered "now → finish" indicator near the top (e.g. `7:00 – 7:25`) from current time +
  `routineMin(routine)`. Updates if the user trims steps (Short on time).
  *Accept:* opening a routine shows an estimated start–finish window.
  **Built:** clock `Chip` under the name/meta showing `fmtT(nowHHMM()) – fmtT(addMins(nowHHMM(),
  routineMin))`, sat in a centered wrap-row beside the reminder chip. Trimming happens in the
  "Short on time" sheet (which starts the player) — those rows already show per-option minutes.
  Shared `addMins`/`nowHHMM` helpers added to `lib/dates.ts` (also used by N1).

- [x] **D2 · Pre-start toggles: auto-advance + 30s warning (per-routine)** — M ✅ 2026-06-15
  Two **per-routine** settings (stored on the `Routine`), surfaced as toggles here:
  - **Auto-advance** — at a step's 0, move to the next step automatically.
  - **30s-left reminder** — a cue (haptic / soft sound) when 30s remain.
  Player reads them (see E4/E5).
  *Accept:* toggles render + persist on the routine; player honors them.
  **Built:** added `autoAdvance?` + `warn30?` to `Routine` (defaults.ts) and to the
  `saveRoutine` builtin-override whitelist (store.ts). Pre-start ([id].tsx) has a "This
  routine" section with two `Toggle` rows; `patch()` calls `saveRoutine({...routine,...})`
  so the re-resolved routine drives the toggle state (no local state). **Player honoring
  is still TODO — that's E4 (auto-advance) + E5 (30s cue).**

---

## E. Routine player (`src/app/player/[id].tsx`)

- [x] **E1 · Promote the "Next step" indicator** — M ✅ 2026-06-16
  Faint bottom one-liner (player.tsx:396-398) reads too much like the current step. Move it
  somewhere clearly secondary (under the progress segments or above controls) and show the
  number: `Next step: 3. Brush my teeth`. Last step keeps a distinct message.
  *Accept:* next-step hint is visually subordinate and shows `Next step: <n>. <text>`.
  **Built:** the hint now lives in a centered secondary row above the controls, copy
  `Next step: ${idx+2}. ${steps[idx+1].t}` (size 13, faint) with `paddingHorizontal: 64` so it
  clears the E3 Back control on the left. Last step keeps `Last step — downhill from here`.

- [x] **E2 · Satisfying check on step complete** — M ✅ 2026-06-16
  On `advance('done')` (player.tsx:163-191), pop a check in the **center of the timer ring**,
  then cross-fade back to the next step's running time. Coordinate with `TimerRing`
  (`src/components/timer-ring.tsx`). Reanimated; honor reduce-motion (M2).
  *Accept:* completing a step shows a check in the ring center that fades as the next timer
  appears.
  **Built:** `checkSv` shared value driving an absolute-fill `Animated.View` overlaid on the
  ring (green disc + IconCheck). `popCheck()` runs a `withSequence` pop→hold→fade (150/220/320ms,
  scale 0.55→1) on Done in the non-final branch — fires for manual Done *and* E4 auto-advance.
  Gated on `useReducedMotion()` (calmed = no pop). No TimerRing change needed — overlays the next
  step's running timer and fades to reveal it (resolves the E4 "leave a beat" note: overlay, not
  delay).

- [x] **E3 · Back to previous step** — M ✅ 2026-06-16
  An unobtrusive "previous step" control to reverse an accidental Done. Roll back `idx`, clear
  `results.current[idx]`, reset `elapsed/extra/paused`, no double-count.
  *Accept:* after Done/Skip, user can step back one; that step's result is cleared and its
  timer restarts.
  **Built:** `goBack()` — absolute-left `IconChevL` + "Back" pressable in the secondary row,
  shown only when `idx > 0`. Clears the returned-to step's result (`results.current[prev] =
  undefined`, so the done/skip count can't double) and resets `elapsed/extra/paused`; the
  timer restarts and the segment reverts to current.

- [x] **E4 · Auto-advance on timeout** — M ✅ 2026-06-15
  When the routine's auto-advance is on (D2), reaching `target` auto-fires `advance('done')`
  instead of only buzzing (player.tsx:116-119). Respect pause; leave a beat for the E2 check.
  *Accept:* auto-advance on = steps progress at 0; off = current manual behavior.
  **Built:** folded into the tick effect — `if (elapsed === target) routine.autoAdvance ?
  advance('done') : doneHaptic()`. Guards `phase/paused/step/elapsed>0`. Advance is immediate
  (no E2 beat yet — E2 not built; coordinate when it lands).

- [x] **E5 · 30-seconds-left cue** — S ✅ 2026-06-15
  When the routine's 30s reminder is on (D2), fire a haptic/soft cue at `target - elapsed ==
  30` (guard sub-30s steps). Use `src/lib/haptics.ts`.
  *Accept:* one cue fires ~30s before a step ends when enabled.
  **Built:** same tick effect — `if (routine.warn30 && target > 30 && elapsed === target-30)
  warnHaptic()`. Added `warnHaptic()` to haptics.ts (Android Clock_Tick / iOS Light impact,
  distinct from the softer `done` target buzz). Haptic-only (no sound asset).

> Player progress-segment animation — see **M1**.

---

## F. Celebration (`src/components/celebration.tsx`, player celebrate phase)

- [x] **F1 · Remove the calm/extra option — always "extra"** — S
  Drop the `celebrate` setting entirely: Settings segment (settings.tsx:126-136), the calm
  branch (player.tsx:209-217), the sound gate (player.tsx:153-156), and `settings.celebrate`
  in the store + migration (store.ts:40,101,317).
  *Accept:* no celebration toggle anywhere; every completion runs the animated celebration.

- [x] **F2 · Color gradient pulse behind the emoji** — M
  Radial-gradient **pulse** (not a slow breathe) behind the celebration emoji, tinted by the
  **routine's color** (`t.col(routine.color)`). Reuse the alarm `PulseGlow` shape with a
  snappier beat. Player celebrate phase (player.tsx:201-218) + `CelebrationEmoji`. Note:
  `CelebrationOverlay` (first-routine party) has no routine color — pass one in or use accent.
  Honor reduce-motion (M2).
  *Accept:* celebration emoji sits over a pulsing colored glow matching the routine.

---

## G. Alarm (`src/app/alarm/[id].tsx`)

- [x] **G1 · Pulse instead of breathe** — S
  `PulseGlow` breathes slowly (2100ms ease, scale 0.82↔1.12, alarm/[id].tsx:31-72). Make it a
  faster rhythmic pulse ("falling into a hole" feel — quicker inward zoom + opacity beat).
  Photosensitivity-safe (no harsh strobe). Honor reduce-motion (M2).
  *Accept:* glow pulses rhythmically rather than gently breathing.

- [x] **G2 · Swipe down = snooze, swipe up = stop** — M
  Vertical pan gestures on the alarm screen: **swipe down → Snooze 5 min**, **swipe up → Stop**
  ("Not today" / dismiss). Both run `silence()` (stops sound + vibration). Keep the buttons too.
  *Accept:* swipe-down snoozes, swipe-up stops; both silence audio/vibration.

---

## H. Settings (`src/app/(tabs)/settings.tsx`, `src/state/store.ts`)

- [x] **H1 · Remove the "Sounds" section** — S ✅ 2026-06-15
  Delete the alarm-sound rows (settings.tsx:92-111) — picker moves into the routine editor (B1).
  *Accept:* no Sounds section in Settings.
  **Built:** removed the Sounds Label+Card, the `pickRingtone` fn, and now-dead imports
  (`IntentLauncher`, `Platform`, `IconRestart`). Also retired the global
  `settings.alarmRingtoneUri` from the `Settings` type + `DEFAULT_SETTINGS` (per-routine
  field on `Routine` is the only one now). Left the v7 historical migration line untouched.

- [x] **H2 · Experimental section** — M
  New "Experimental" group near the bottom: **Sounds** (the brainwave-tones screen, formerly a
  tab) + **Haptics lab**. Sounds becomes a pushed route, not a tab (I1). Move the Haptics-lab
  row (settings.tsx:121-125) here.
  *Accept:* Settings has an Experimental section linking to Sounds + Haptics lab.

- [x] **H3 · Default flips** — S
  In `DEFAULT_SETTINGS` (store.ts:92-102): `countUp: true → false`, `streakNeverDies: false →
  true`. Verify the migration block (store.ts:~300-345, esp. line 312 forcing
  `streakNeverDies=false`) doesn't clobber the new default for existing users; adjust if needed.
  *Accept:* fresh installs start count-up off + streak-never-dies on; existing users not reset.

- [x] **H4 · Delete-all data (long-press)** — L ✅ 2026-06-16
  Bottom of Settings: destructive "Delete all data" that wipes everything (zustand + AsyncStorage
  key `flint-v1`) and restarts onboarding (clears `onboarded`). Must require a **long-press**
  (not a tap) after a confirm affordance. Needs a store reset action + nav to `/onboarding`.
  *Accept:* long-press (after confirm) erases all data → onboarding; a tap does nothing.
  **Built:** `resetAll()` store action sets every data field back to `freshData()` (refactored
  factory shared with the create() seed) → `onboarded:false` flips the navigator guard, which
  swaps back to onboarding on its own (persist overwrites `flint-v1` with the defaults). Bottom-of-
  Settings `HoldDelete`: a hold-to-confirm Pressable (1500ms) with a red fill bar that grows as
  you hold; `onPressIn` arms + `warnHaptic`, `onPressOut` cancels. A tap fires in→out instantly →
  cancels before the timer → nothing. Completing the hold → `finishHaptic` + `resetAll` + "Erased"
  toast. Label flips to "Keep holding…" while armed.

- [x] **H5 · Reduce-motion toggle (was QoL Q5)** — M
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

- [x] **I1 · Drop Sounds from the tab bar** — S
  Remove `sounds` from `TABS` + `Tabs.Screen` (_layout.tsx:10-16, 74-78). Keep the screen file;
  reached from Settings → Experimental (H2). Tabs become: Routine, Tasks, Insights, Settings.
  *Accept:* no Sounds tab; Sounds still opens from Settings.

- [x] **I2 · Center "+" add-routine button** — M
  Prominent center "+" in the tab bar opening `NewRoutineSheet`. Layout:
  `Routine · Tasks · [ + ] · Insights · Settings`. Keep the existing header "+"
  (index.tsx:280-282) too — user wants both.
  *Accept:* center "+" opens New Routine; header "+" still works.

---

## J. Insights (`src/app/(tabs)/insights.tsx`, `src/components/calendar-view.tsx`)

- [x] **J1 · GitHub-style contribution grid** — L
  Replace the patterns/calendar pager with a single view. Add a heat-grid: small boxes, **no
  dates**, brightness ∝ activity that day, "showed up" (`appDays`) counts. Reuse
  `dayLevel(merged, appDays, key)` (store.ts).
  *Accept:* a heat-grid of boxes; busier days brighter/darker; showing-up lights a box.

- [x] **J2 · 30d / 7d range toggle + calendar button** — M
  `30d` / `7d` switch controlling the grid window + a calendar button opening the full month
  view (`/calendar`).
  *Accept:* toggling rescales the grid; the button opens the month calendar.

- [x] **J3 · Remove "Showed up N days this week"** — S
  Delete that summary line (insights.tsx:138-144).
  *Accept:* no "showed up … this week" copy.

- [x] **J4 · Remove the patterns/calendar switcher** — S
  Drop the `Segmented` + horizontal pager (insights.tsx:96-114, 201-204). Calendar reached via
  the J2 button.
  *Accept:* no top segmented control; single scrolling insights page.

---

## K. Tasks (`src/components/todo-row.tsx`, `src/app/(tabs)/tasks.tsx`, Today `index.tsx`)

- [x] **K1 · Show all subtasks inline, everywhere** — M ✅ 2026-06-16
  When a task has subtasks, render them all (checkable) instead of the `N/M subtasks` count
  (todo-row.tsx:54-64). Applies on the Tasks tab **and** the Today list (index.tsx:253-259).
  Keep rows tidy when expanded.
  *Accept:* any task with subtasks lists each subtask + checkbox, on Tasks and Today.
  **Built:** `TodoRow` wraps the main row + an indented (`paddingLeft: 37`) subtask list; each
  subtask is a `Pressable` with a small `SubCheck` (18px green box) → `toggleSubtask`, strike +
  faint when done, `doneHaptic` on check. Dropped the `N/M subtasks` meta entry (and the now-dead
  `subDone`). Both surfaces use the shared component, so Tasks + Today get it for free.

---

## L. Long-press menu (`src/components/routine-bits.tsx` → `PreviewSheet`)

- [x] **L1 · Duplicate routine** — M ✅ 2026-06-16
  "Duplicate" action in the long-press sheet (routine-bits.tsx:162-189). Clones with a new id
  (`"c" + Date.now()`, name "… copy") via a store action.
  *Accept:* duplicating creates an independent editable copy.
  **Built:** `duplicateRoutine(id)` store action resolves the routine (override-merged), strips
  `builtin`, and stores a custom copy (`id: 'c'+Date.now()`, name `"… copy"`, appended to `order`
  when non-empty). Wired to a "Duplicate" `Chip` (IconPlus) in `PreviewSheet`; Today's
  `onDuplicate` toasts "Duplicated". Independent — edits to the copy don't touch the source.

- [x] **L2 · Share routine — placeholder** — S ✅ 2026-06-16
  "Share" action that shows a "coming soon" placeholder for now. Planned direction: **QR
  share** (scan / create a QR to import a routine) — feasibility unconfirmed, so v1 is a
  visible placeholder only.
  *Accept:* Share appears in the menu and shows the placeholder; no real export yet.
  **Built:** "Share" `Chip` (new `IconShare` glyph) in `PreviewSheet`; `onShare` toasts
  "Coming soon" — no export yet. QR direction still parked/unconfirmed.

---

## M. Cross-cutting

- [x] **M1 · Re-animate page indicators (onboarding + player)** — S ✅ 2026-06-15
  Both dot rows snap width instantly (onboarding.tsx:276-286; player.tsx:300-316). Animate the
  active-dot width/color with Reanimated (`withTiming`). Honor reduce-motion (M2).
  *Accept:* the active dot animates its transition in both screens.
  **Built:** onboarding has a `Dot` component, player a `ProgressSeg` component — each runs
  `useAnimatedStyle` with `withTiming` on `width` + `backgroundColor` (220ms). Both read
  `useReducedMotion()` and set `duration: 0` when calmed (snap, no animation). Player's segment
  border (upcoming steps) stays static; only width/color animate.

- [x] **M2 · Shared reduce-motion helper** — S ✅ 2026-06-15
  One helper the new effects (F2, G1, E2, M1) consult; backs the H5 toggle and the OS setting.
  *Accept:* a single source of truth gates the animated effects.
  **Built:** `src/hooks/use-reduced-motion.ts` exports `useReducedMotion()` = OS
  reduced-motion (Reanimated) `||` `settings.reduceMotion`. Store: added
  `reduceMotion: boolean` to `Settings` + `DEFAULT_SETTINGS` (false), version 7→8
  with a backfill migration. H5 still needs the Settings UI toggle wired to
  `settings.reduceMotion`; consumers (F2/G1/E2/M1) import this hook.

---

## N. Today screen (`src/app/(tabs)/index.tsx`)

- [x] **N1 · Estimated finish window on cards (was QoL Q6)** — S ✅ 2026-06-16
  Extend the D1 finish-time math onto Today's routine cards so each shows its time window —
  complements the existing "Next: …" time-blindness anchor (index.tsx:228-232).
  *Accept:* scheduled routine cards show an estimated window; layout stays clean.
  **Built:** scheduled `RoutineCard`s now render the reminder time as a window
  `fmtT(reminder) – fmtT(addMins(reminder, routineMin))` (e.g. `7:00 – 7:25`) in place of the
  lone start time — no new layout, the bell/alarm icon still anchors it. Anytime cards unchanged.
  Reuses the shared `addMins` helper from D1.

---

## Parked (not now)

- **Undo on quick actions / un-complete a finished task** — was QoL Q2. Preferred variant per
  user: an "undo / mark-undone" path for **completed tasks**. Parked.
- **H6 · Export data (JSON)** — parked (listed under Settings so it lands near Delete-all).

> Deliberately **not** suggesting: levels, badges, XP, social leaderboards, mascots, or streak
> pressure — all off-limits per `AGENTS.md`.

---

# Batch 12 — Polish round (rev 3)

Raw notes 2026-06-16. Grouped by surface. Same per-batch rules apply: read each region before
editing · `AGENTS.md` rules (terse copy, no shame, motion gated by `useReducedMotion()`,
NativeWind static / per-routine color via `t.col()`) · `npx tsc --noEmit` after · then mark
each `[x]` with a **Built:** note, refresh the Progress block, update the `flint-backlog-progress`
memory + `MEMORY.md`.

Suggested build order (independent quick wins first, riskier UI last):
P1 → P16 → P15 → P6/P7 → P13/P14 → P3/P4/P5 → P10/P11 → P17/P18 → P2 → P12 → P8/P9.

## P. Sound + celebration

- [x] **P1 · Kill the SFX latency** — S
  `playOneShot` (`src/lib/sfx.ts:52`) calls `createAudioPlayer(src)` then `.play()` on every
  hit — the file decodes on demand, so Done + the celebration sting land ~100–300ms late.
  Preload **warm, persistent** `AudioPlayer` singletons for `STEP_DONE` and the celebration
  sting at module load; play via `seekTo(0)` + `play()` (reuse the same player — one-shots are
  short and rarely overlap). Call `ensureMode()` once at module init so `setAudioModeAsync`
  has resolved before the first play. Keep the alarm path (looping) as-is.
  *Accept:* the Done chime and the finish sting fire effectively instantly; no double-play /
  cut-off on rapid Done taps.
  **Built:** `sfx.ts` — module-load IIFE `warmOneShots()` builds persistent `stepDonePlayer`
  + `celebrationPlayer` (pre-decoded, volume set) after `ensureMode()`; new `fireWarm(player)`
  = `seekTo(0)`+`play()`. `playStepDone`/`playCelebration` call `fireWarm` (dropped `playOneShot`
  + its didJustFinish-release listener + the random-pick — single fanfare anyway). Alarm loop
  untouched. Committed `fdd19b0`. tsc clean.

- [x] **P2 · Sideways confetti burst + more pieces** — M
  `Confetti` (`src/components/celebration.tsx:32-99`) only rains straight down
  (`ty = -30 + p*fallH`). Rework to a **cannon burst**: pieces launch from two lower-corner
  origins (and/or center) with an initial angle + speed (cos/sin), arc outward sideways, then
  fall under gravity (`y = oy + v·sinθ·p + G·p²`, `x = ox + v·cosθ·p`). Bump `count` default
  32 → ~70. Keep spin/fade/`useReducedMotion()` gate. Tune so it reads as a celebratory pop,
  not a screen-filling mess.
  *Accept:* finishing a routine pops confetti outward/sideways from the edges (not just a
  top-down rain); noticeably denser; calmed when reduce-motion is on.
  **Built:** `celebration.tsx` — `Piece` now `{ox,oy,vx,vyUp,g,…}`; `ConfettiPiece` plots a
  ballistic arc `tx = ox + vx·p`, `ty = oy − vyUp·p + g·p²` (eased `Easing.out(quad)`). Pieces
  alternate the two lower corners (`ox` near 0 / near width, `oy` near bottom), spray outward
  (`vx = dir·speed`), strong up impulse + gravity exit off the bottom. `count` 32→70; tight
  `delay` (0–240ms) burst; spin/fade + `reduce` gate kept. Committed `a0f155e`.

## P′. Insights (`src/app/(tabs)/insights.tsx`)

- [x] **P3 · Shrink the heat-grid boxes** — S
  `HeatGrid` (insights.tsx:29-100) sizes boxes to fill the card width (`box = (width − …)/7`),
  so cells read huge. Cap box size GitHub-style (~14–16px), left-align the grid instead of
  stretching it. The reference image is small uniform squares. Also trim the `StatChip`
  ("Patterns") padding/font a touch so those boxes feel less bulky.
  *Accept:* heat-grid cells are small + tidy (≈the reference picture), not full-width slabs.
  **Built:** `insights.tsx` — `HeatGrid` `box` now fixed `15` (was width-derived), `GAP` 6→5,
  outer `alignItems` center→`flex-start`, legend `justifyContent` center→`flex-start`; dropped
  `useWindowDimensions`. `StatChip` padding 14→12, value 22→20, label 12.5→12. Committed `e43cc57`.

- [x] **P4 · Compact 7d/30d beside the calendar button** — S
  The range `Segmented` currently takes `flex:1` (full width) with the calendar `Chip` beside
  it (insights.tsx:163-178). Make 7d/30d a small control sitting next to the calendar button
  (right-aligned cluster), not a full-width bar.
  *Accept:* 7d/30d is a compact toggle next to the calendar icon; row no longer spans the card.
  **Built:** `insights.tsx` — toggle wrapper `flex:1` → fixed `width:104`, row
  `justifyContent:'flex-end'` so the 7d/30d + calendar cluster sits right-aligned. Committed `e43cc57`.

- [x] **P5 · Bring back the 7-day show-up strip** — M
  Re-add a last-7-days row (the J3-removed idea, reworked): one marker per day Mon→Sun (or
  trailing 7), each showing a **check** when ≥1 routine was done that day (`merged[k].length >
  0`). Quiet-attendance-safe (don't shame empty days — empty = plain dot, never an ✗). Lives
  above or below the heat-grid card.
  *Accept:* a 7-day strip shows a check on each day the user finished ≥1 routine; off days are
  neutral.
  **Built:** `insights.tsx` — new `WeekStrip` (trailing 7 days oldest→today; `DOW1` initials;
  `IconCheck` in `accent.soft`/`accent.main` tile when `merged[k].length>0`, else plain
  `raised`/`lineSoft` dot — never ✗; today's label brought to `t.muted`). **Placement: own
  "This week" card *below* the heat-grid card** (user pick). Committed `e43cc57`.

## P″. Tab bar (`src/app/(tabs)/_layout.tsx`)

- [x] **P6 · Rectangular add button** — S
  The center "+" is a circle (`radius:27`, 54×54 face, _layout.tsx:58-74). Make it a rounded
  **rectangle** (e.g. ~56×40, radius ~16) — keep the Chunky pressed-edge + accent fill.
  *Accept:* the add button is a rounded rectangle, not a circle; still opens `NewRoutineSheet`.
  **Built:** `(tabs)/_layout.tsx` — addBtn `radius` 27→16, face `54×54 r27` → `56×40 r16`,
  container `marginTop` -20→-16. Chunky edge + `onAdd` unchanged. Committed `c064d00`.

- [x] **P7 · Active-tab highlight = rounded-square outline** — S
  The active pill is a flat `accent.soft`-filled rounded rect with no border (_layout.tsx:41-50)
  — user reads it as a "sharp box." Make the active indicator a **rounded square with an accent
  outline** (2px `accent.main` border + soft fill, squircle radius). Inactive tabs stay bare.
  *Accept:* the selected tab shows a rounded, outlined square behind its icon.
  **Built:** `(tabs)/_layout.tsx` — active indicator now `borderRadius:14` `borderWidth:2`
  `borderColor: accent.main` + `accent.soft` fill; padding 7/18→8/10 (squarer). Inactive carries
  a transparent 2px border so the icon never shifts on selection. Committed `c064d00`.

## P‴. Timer (`src/app/timer.tsx`)

- [x] **P8 · Free/Pomodoro choice in a sheet, not a cramped segmented** — M
  Drop the top `Segmented` cramming both modes onto one page (timer.tsx:259-269). On open,
  present a **mode chooser** (a sheet, or a two-card select) → then render the chosen mode
  full-screen. A small control to switch modes again (header chip / back to chooser).
  *Accept:* picking Free vs Pomodoro happens in its own surface; the running timer page isn't
  sharing space with the mode switch.
  **Built (user pick: bottom sheet):** `timer.tsx` — dropped the top `Segmented`; header now has
  X + a mode **chip** (`Display` label + `IconChevD`, `t.surface`/`lineSoft`) → `setChooser(true)`.
  New `BottomSheet "Choose timer"` with two `ChunkyCard`s (Free / Pomodoro) → `pick()` sets mode +
  closes. `chooser` opens on entry (`useState(true)`). Committed `a0f155e`.

- [x] **P9 · Pomodoro config sheet with sliders** — M
  Pomodoro time + rounds currently use `−/+` `StepRow`s (timer.tsx:69-83, 230-239). Replace the
  numeric steppers with a **slider** for Focus / Short / Long / Rounds inside the config sheet.
  No `Slider` component exists yet — build one (`src/components/slider.tsx`, gesture-handler pan
  on a track, themed, haptic on step, reduce-motion aware) and reuse it. Keep the auto-start
  toggles.
  *Accept:* opening Pomodoro settings shows sliders (not −/+ buttons) for the durations + rounds;
  values persist via `setPomodoro`.
  **Built:** spec note was stale — `src/components/slider.tsx` **already exists** (committed
  `f2513f4`, used by `/sounds`): gesture-handler pan, UI-thread thumb, ratchet `tapHaptic` per step.
  Reused it. `timer.tsx` `StepRow` → `SliderRow` (label/sub + value readout above a `Slider`); the
  4 config rows now `SliderRow`. **Step sizes kept** (user pick): Focus 5/90·5, Short 1/30·1,
  Long 5/45·5, Rounds 2/8·1. Toggles unchanged; persists via `setPomodoro`. Committed `a0f155e`.

- [x] **P10 · Free timer needs an explicit Start** — S
  `FreeTimer` auto-runs on mount (timer.tsx:31-35 increments immediately). Start **idle** and
  require a Start press before counting; the primary button reads Start → Pause/Resume (mirror
  Pomodoro's Start/Pause). Restart returns to idle.
  *Accept:* the free timer sits at 0:00 until the user taps Start.
  **Built:** `timer.tsx` `FreeTimer` — `paused` → `running` (init **false**); interval gated on
  `running`; primary `ChunkyButton` label `running ? 'Pause' : elapsed>0 ? 'Resume' : 'Start'`;
  bottom row now mirrors Pomodoro: Restart `CircleBtn` (→ idle) / primary / Done `CircleBtn`
  (`IconCheck`, exits). Dropped the body Restart ghost + `IconPause`/`IconPlay`. Committed `4f3477b`.

- [x] **P11 · Step-done chime when focus ends** — S
  Confirm/secure the `step-done` SFX fires when a **focus** block completes (Pomodoro
  `advance(true)` → `playStepDone()`, timer.tsx:147-151 already calls it). With P1's preload the
  latency is gone; verify it plays on focus→break specifically and not just any phase flip.
  **Built:** `timer.tsx` `advance()` — `playStepDone()` now gated `if (phase === 'focus')` so the
  chime fires on focus→break only (break→focus = `doneHaptic` only). Manual Skip = `advance(false)`
  → silent, unchanged. Plays instantly off P1's warmed player. Committed `4f3477b`.
  *Accept:* finishing a focus block plays the step-done chime promptly.

## P⁗. Navigation feel (`src/app/_layout.tsx`, `src/theme/motion.ts`)

- [x] **P12 · Smoother page transitions** — M
  Pushes feel "quick but not smooth." Tune the stack transition (_layout.tsx:67-90,
  `animation: 'ios_from_right'`, `SCREEN_DURATION = 300`): try a slightly longer duration +
  easing, or `slide_from_right`, and keep it native-driven. Reduce per-screen mount jank
  (`enableScreens` already on; consider `freezeOnBlur` on heavy tabs / lazy mounts). Compare
  feel; pick the smoothest. Honor `useReducedMotion()` where a content animation is added.
  *Accept:* forward/back pushes glide rather than snap; no visible hitch on the heavy screens.
  **Built (user pick: keep iOS parallax, just less snappy):** kept `animation:'ios_from_right'`,
  `SCREEN_DURATION` 300→**380** (`motion.ts`) so the same parallax curve reads as a glide, not a
  snap; added `freezeOnBlur:true` to the root `Stack` `screenOptions` so blurred tabs under a
  pushed player/editor stop re-rendering mid-transition (less hitch). Native-driven, no JS content
  animation added (so no `useReducedMotion()` needed). Committed `a0f155e`.

## P⁗′. Routine player (`src/app/player/[id].tsx`)

- [x] **P13 · Top bar: Back left, X right** — S
  Today the top bar has X (exit) on the **left** + a spacer/short-session chip on the right
  (player.tsx:341-355). Flip: a **Back** control on the left, the **X** (exit) on the right.
  Reconcile with the E3 previous-step "Back" in the secondary row — promote that to the top-left
  Back (shown when `idx>0`), and drop the duplicate from the bottom row.
  *Accept:* X sits top-right (exit confirm), Back sits top-left (previous step / exit when at
  step 1); no duplicated Back control.
  **Built:** `player/[id].tsx` — top bar: left `CircleBtn` `IconChevL` → `goBack()` when `idx>0`
  else `setExitConfirm(true)` (label flips Previous step/Exit); right `CircleBtn` `IconX` → exit.
  Title centered in a flex column; short-session demoted from a `Chip` to a small `Label` under
  the title. Removed the bottom secondary-row Back (its hint went to P14). Committed `c064d00`.

- [x] **P14 · Promote the next-step line under the timer** — S
  The next-step hint is tiny + faint in the bottom row (player.tsx:477-479, size 13). Move it to
  **just below the timer**, under the "`X min` for this step" clock line (player.tsx:404-408),
  and make it bigger + readable (size ~16, clear color). Keep the `Next step: <n>. <text>` copy
  and the last-step variant.
  *Accept:* the next step reads clearly directly beneath the timer; no longer cramped/faint at
  the bottom.
  **Built:** `player/[id].tsx` — `Body size=16 color=muted` line right under the clock row:
  `Next: ${idx+2}. ${steps[idx+1].t}` (last-step variant kept). Old size-13 bottom-row hint
  deleted with the secondary row (P13). Committed `c064d00`.

## P⁗″. Onboarding (`src/app/onboarding.tsx`)

- [x] **P15 · Page dots on top** — S
  Move the page-dot row from the bottom (onboarding.tsx:222-227) to the **top** (into/near the
  Skip header row, onboarding.tsx:116-123). Keep the animated `Dot` (M1). The Next button stays
  at the bottom.
  *Accept:* page indicator sits at the top; dots still animate the active transition.
  **Built:** `onboarding.tsx` — dot row moved into the 44px header (centered via row), Skip
  re-anchored `position:absolute right:16` so dots stay centered regardless of Skip width.
  Bottom block now Next-only (dropped its dots + `gap`). Animated `Dot` reused. Committed `c064d00`.

- [x] **P16 · Notifications are opt-in, never asked during routine building** — M
  After onboarding, the root sync effect (`_layout.tsx:144-172` → `syncReminders`) calls
  `ensurePermission()` because `remindersOn` defaults **true** (`store.ts:119`) — so the OS
  permission dialog pops while the user is in the editor building their first routine. Make
  notifications opt-in: `remindersOn` default → **false**; the only enable paths are the
  onboarding "Enable notifications" button (already grant-gated) and Settings → Reminders
  (already grant-gated). Also gate the player's `scheduleTimerAlert` `ensurePermission` on
  `settings.remindersOn` so a running step never triggers a cold permission prompt. Migration:
  existing users keep their stored `remindersOn` (persisted settings replace the default
  wholesale — only fresh installs + `resetAll` see the new default); verify no clobber.
  *Accept:* skipping the onboarding notifications page → no permission dialog during/after
  building the first routine; reminders only turn on from Settings (or the onboarding button).
  **Built:** `store.ts` `DEFAULT_SETTINGS.remindersOn` true→false (comment notes persisted
  settings replace the default wholesale → existing users keep their value, only fresh install /
  `resetAll` see opt-in). `player/[id].tsx` `scheduleTimerAlert` effect now early-returns unless
  `settings.remindersOn`, added to the dep array → a running step never cold-prompts. Onboarding
  + Settings enable paths already grant-gated, untouched. Committed `fdd19b0`. tsc clean.

## P⁗‴. Settings (`src/app/(tabs)/settings.tsx`)

- [x] **P17 · Custom accent color** — M
  The Accent row only offers the 6 `ACCENT_CHOICES` swatches (settings.tsx:182-199). Add a
  trailing **custom** slot (like the editor's color row, editor.tsx:288-304) that opens
  `ColorPickerSheet` → `setAccent(hex)`; show the chosen custom color in the slot. The palette
  already supports any `#rrggbb` accent (`buildPalette`, colors.ts:105-121).
  *Accept:* a custom-color tile lets the user pick any accent; it applies app-wide and persists.
  **Built:** `settings.tsx` — trailing `Pressable` slot after the 6 swatches (mirrors editor:
  `customAccent = !ACCENT_CHOICES.includes(accent)`, shows `accent`/`IconPlus`, recolors in place)
  → `setAccentOpen(true)`. `ColorPickerSheet` mounted at root with `initial={accent}`/`onPick=
  setAccent` (recent-colors handled inside the sheet). Committed `4f3477b`.

- [x] **P18 · Tease Material You theming** — S
  Add a **Material You** option in the Display/Accent area (a row or segment). Selecting it does
  **not** apply anything yet — it shows a **"Coming soon"** toast (mirror the Share placeholder,
  L2). Visible tease only; no real dynamic-color wiring.
  *Accept:* a Material You entry exists; tapping it surfaces "Coming soon" and changes nothing.
  **Built:** `settings.tsx` — "Material You" `Pressable` row under the accent swatches (title +
  "Match your wallpaper" sub + trailing "Coming soon") → `toast('Coming soon')`, applies nothing.
  Committed `4f3477b`.

**Open decisions (confirm before/while building):** P8 chooser shape (sheet vs full select
screen) · P12 final transition preset · P5 strip placement (above vs below heat-grid) · P9
slider granularity (step sizes per field).

---

# Batch 13 — Polish round (rev 4)

Raw notes 2026-06-17. Same per-batch rules: read each region before editing · `AGENTS.md`
rules (terse copy, no shame, motion gated by `useReducedMotion()`, NativeWind static /
per-routine color via `t.col()`) · `npx tsc --noEmit` after each group · then mark each `[x]`
with a **Built:** note, refresh this Progress block, update the `flint-backlog-progress` memory
+ `MEMORY.md`.

The headline move: the standalone Timer screen is **retired**, and Pomodoro is reborn as a
**routine** (a template that generates focus/break steps and edits via sliders). The free
body-double timer is dropped entirely (it never recorded anything; "just start" is already
what opening any routine does).

Suggested build order (independent wins first, the Pomodoro-routine feature last as it
touches the data model): Q1 → R1 → V1–V4 → T1–T3 → S1–S3 → U1–U3 → X1 → W1–W4.

## Q. Retire the standalone Timer (`src/app/timer.tsx`, `src/app/(tabs)/index.tsx`)

- [x] **Q1 · Remove Pomodoro + Free timer screen** — M ✅ 2026-06-17
  **Built:** deleted `src/app/timer.tsx`; removed the Today clock `Chip` (`index.tsx`) + its
  now-unused `IconClock` import (verified only use); `/timer` had no other refs + no explicit
  `_layout.tsx` route. Kept the `pomodoro` store slice + `slider.tsx` for W. `tsc` clean.
  Delete `src/app/timer.tsx` and the only entry to it: the clock `Chip` on Today
  (`index.tsx:253-255`) + its now-unused `IconClock` import (check it's not used elsewhere on
  the screen first). **Keep** the `pomodoro` store config (`store.ts`) and `src/components/slider.tsx`
  — both are reused by the new Pomodoro *routine* (W). Drop any timer-only dead imports.
  *Accept:* no `/timer` route, no clock chip on Today; app builds with no dangling import; the
  pomodoro store slice + Slider component still compile (used by W).

## R. Tab bar (`src/app/(tabs)/_layout.tsx`)

- [x] **R1 · "+" flush in the bar + a taller bar** — S ✅ 2026-06-17
  **Built:** dropped the "+"'s `marginTop:-16`; row `alignItems` `flex-start`→`center` so the
  "+" centers against the tab icons (flush inside, no poke). Tab padding `12/14`→`16/18` (taller
  bar); "+" face `40`→`46`. Still opens `NewRoutineSheet`. `tsc` clean. Commit `feat: tab bar + flush + taller bar (R1)`.
  The center "+" extrudes above the bar (`marginTop: -16`, `_layout.tsx:71`) and the bar is
  short. Make the "+" sit **flush inside** the bar (drop the negative margin, vertically center
  it against the tab icons) and make the whole tab bar a bit **taller** (raise the row's
  `paddingTop`/`paddingBottom`, `_layout.tsx:38,79-89`). Keep the Chunky pressed-edge + accent
  fill; the "+" face height should read balanced against the taller bar (e.g. ~44–48).
  *Accept:* the "+" no longer pokes above the tab bar; the bar is taller; "+" stays vertically
  aligned with the tab icons and still opens `NewRoutineSheet`.

## S. Onboarding + editor bugs (`src/app/onboarding.tsx`, `src/app/editor.tsx`)

- [x] **S1 · Fix first-routine creation + the editor "X"** — M ⚠️ edit-mode X best confirmed on device ✅ 2026-06-17
  **Built:** added `safeBack() = router.canGoBack() ? router.back() : router.replace('/(tabs)')`;
  routed `leave()`, the Discard-confirm callback, and both `save()` exits (firstEver + normal)
  through it (folded the old inline `canGoBack` check in). Fixes the dead back when the editor is
  entered via `router.replace` from onboarding. **Edit-mode X / false-dirty:** static analysis
  found no bug — the editor is *pushed* when editing (back stack exists, so back isn't dead) and
  `baseline` is captured on the first render from the same seed values (untouched edit isn't
  dirty). Couldn't run a dev build here, so flagged for device verification.
  When the editor is opened from onboarding it's a `router.replace` (`onboarding.tsx:89`) → the
  editor has **no back stack**, so the X / discard / post-save `router.back()` calls
  (`editor.tsx:138, 198`) are no-ops → the X appears dead and the first-creation flow can strand.
  Add a `safeBack()` helper: `router.canGoBack() ? router.back() : router.replace('/(tabs)')`,
  and route `leave()`, the "Discard changes?" confirm callback, and `save()`'s non-first exit
  through it. (The `firstEver` branch already handles `canGoBack` — fold it into the same helper.)
  Then **verify the edit-mode X** too: reproduce "X doesn't work when editing" on a dev build —
  if it's a *false-dirty* baseline (X always prompts Discard) rather than a dead back, fix the
  `snapshot()`/`baseline` capture (`editor.tsx:120-133`) so an untouched edit isn't dirty.
  *Accept:* the X closes the editor from every entry (onboarding replace, push-from-Today,
  push-from-routine); first-routine creation from onboarding lands cleanly (celebration → Today);
  no spurious Discard prompt when nothing changed.

- [x] **S2 · Animate the onboarding bell** — S ✅ 2026-06-17
  **Built:** `PageHero` now reads `useReducedMotion()` — renders `AnimatedEmoji` (Noto lottie /
  glyph-bob) when animated + motion on, static glyph when calmed; bell call is `<PageHero emoji="🔔" animated />`.
  The reminders page renders 🔔 as a static glyph (`PageHero emoji="🔔"`, no `animated`,
  `onboarding.tsx:169` + `PageHero` 36-46). Animate it — either route it through `AnimatedEmoji`
  (Noto lottie / glyph-bob fallback) or a small Reanimated swing/ring wobble. Honor
  `useReducedMotion()` (calm = static glyph), in keeping with the existing "calm bell" note.
  *Accept:* the bell moves on the reminders page; reduce-motion leaves it still.

- [x] **S3 · Fold "Enable notifications" into the Next button** — M ✅ 2026-06-17
  **Built:** removed the standalone Enable-notifications `ChunkyButton`. `handleNext()`: on the
  reminders page (`remindersPage = 1 + SLIDES.length`) when `!notifOn`, runs `ensurePermission()`
  → on grant sets `remindersOn:true` + `setNotifOn(true)` + toast, then always `next()` (declining
  never blocks). Bottom button stays labeled "Next". Caption kept (+ a one-liner on what Next does).
  Dropped the now-unused `IconCheck`/`enableNotifs`. `tsc` clean.
  Commit `fix: editor safeBack + onboarding bell/notif opt-in (S1-S3)`.
  Remove the separate "Enable notifications" `ChunkyButton` on the reminders page
  (`onboarding.tsx:175-188`). Instead, when the user is **on the reminders page**, the bottom
  primary button asks for permission: tapping Next runs `ensurePermission()`; on grant →
  `setSettings({ remindersOn: true })`, toast, and the button **reverts to plain "Next"** (and
  advances). If they tap Next again (or it's already granted) it just advances. Don't block
  advancing if they decline — opt-in stays opt-in (P16). Keep the "flip it any time in Settings"
  caption.
  *Accept:* no standalone enable button on the reminders page; the Next button requests
  notifications once on that page, turns back into "Next" after, and never traps the user who
  declines.

## T. Routine player (`src/app/player/[id].tsx`)

- [x] **T1 · "<" is previous-step only; "X" exits** — S ✅ 2026-06-17
  **Built:** top-left `<` now renders only when `idx>0` (→`goBack`); at step 1 it's an empty
  44px `View` (slot kept, title stays centered). X is the sole exit.
  Today the top-left `<` does `idx>0 ? goBack() : setExitConfirm()` and the top-right X exits
  (`player.tsx:343-358`) — so on **step 1** both buttons exit ("they work the same"). Make `<`
  strictly previous-step: hide or disable it at `idx===0` (keep its slot so the title stays
  centered) so it never duplicates the X. X always opens the exit confirm.
  *Accept:* `<` only ever steps back; at step 1 it's inert/hidden; X is the sole exit.

- [x] **T2 · Swipe back → previous step** — M ✅ 2026-06-17 ⚠️ feel best confirmed on device
  **Built:** `Gesture.Pan` over the player main area — `activeOffsetX(24)`/`failOffsetY([-18,18])`
  so it's horizontal-only (won't fight vertical scroll/taps); `onEnd` → `runOnJS(goBack)()` when
  `translationX>56 && idx>0`. `goBack` already taps a haptic + no-ops at step 1; the celebrate
  phase returns earlier so the gesture never mounts there.
  Add a horizontal swipe-right gesture over the player body (gesture-handler `Gesture.Pan`,
  like `drag-list.tsx`) that calls `goBack()` when `idx>0`. Light `tapHaptic` on trigger; small
  threshold so it doesn't fight vertical scroll. Don't hijack the celebrate phase.
  *Accept:* swiping right in the player goes back one step (when not on step 1); feels distinct
  from a scroll; no effect during celebration.

- [x] **T3 · Next-step line: no number, more presence** — S ✅ 2026-06-17
  **Built:** dropped the number (`Next: ${steps[idx+1].t}`), size `16`→`19`, color `t.muted`→`t.text`
  — clearer but still under the Display-30 current step. Last-step variant kept. `tsc` clean.
  Commit `feat: player back-only chevron, swipe-back, fuller next line (T1-T3)`.
  The hint reads `Next: ${idx+2}. ${steps[idx+1].t}` faint at size 16 (`player.tsx:413-416`).
  Drop the number → `Next: ${steps[idx+1].t}`. Make it **more noticeable but still subordinate**
  to the current step (Display 30): bump to ~size 18–20 and a clearer color (`t.text`/`t.muted`
  rather than faint). Keep the last-step variant.
  *Accept:* the next-step line shows `Next: <name>` (no number), reads clearly but stays smaller
  than the current step.

## U. Celebration (`src/components/celebration.tsx`, `src/data/celebration-emojis.ts`)

- [x] **U1 · Confetti pops from the TOP + denser** — M ✅ 2026-06-17
  **Built:** `Confetti` origins flipped to the upper corners (`oy = rand(8,70)`); pieces get a
  downward impulse (`vy`) + gravity (`g`) so they rain down + outward; renamed `vyUp`→`vy`,
  worklet `ty = oy + vy·p + g·p²`. `count` 70→110 (denser). Spin/fade + reduce-motion gate kept.
  `Confetti` launches from the two **lower** corners (`oy = height - rand(20,80)`,
  `celebration.tsx:75-99`) → the pop reads bottom-up. Flip the origins to the **upper** corners
  (small `oy` near the top) and spray **down + outward** (initial down/out impulse, gravity
  carries pieces down the screen). Bump `count` (~70 → ~100–120) for a denser burst; keep
  spin/fade + the `useReducedMotion()` gate. Tune so it's celebratory, not a curtain.
  *Accept:* finishing pops confetti from the top corners raining/arcing down; noticeably denser;
  calmed when reduce-motion is on.

- [x] **U2 · Floating animated lottie around the hero** — L ✅ 2026-06-17
  **Built:** reworked `EmojiConfetti` into a floating field — picks from `CELEBRATION_FLOAT`
  (U3) + sprinkles ✨ `2728` (~1 in 4); each emoji scattered on a ring around the hero at varied
  size (28–64px), gentle vertical bob (`withRepeat` translateY ±6–12px, randomized phase via
  `withDelay`), fade-in, and varied playback via `LottieView speed` (0.6–1.4). `pointerEvents="none"`,
  gated on `useReducedMotion()`. Rendered in both `CelebrationOverlay` and the player celebrate phase.
  Chose the calmer drift/bob (not pop-outward-loop); count default 12.
  Scatter **small animated Noto-lottie emojis** around the static center hero (both the player
  celebrate phase, `player.tsx:264-331`, and `CelebrationOverlay`, `celebration.tsx:131-164`).
  Rework/replace `EmojiConfetti` (`src/components/emoji-confetti.tsx`) into a "floating field":
  - random picks from the new float pool (U3), sprinkle ✨ `2728` among them;
  - **varying size** (e.g. 28–64px), scattered around the hero (not all from center);
  - **subtle vertical bob** — a gentle, noticeable up/down (Reanimated `withRepeat` on translateY,
    small amplitude ~6–12px, randomized phase);
  - **varying animation speed** per emoji via `LottieView`'s `speed` prop (≈0.6–1.4) — needs a
    `speed` pass-through (extend the local Lottie render; `AnimatedEmoji` currently hardcodes
    `autoPlay loop` with no speed, `animated-emoji.tsx:55`);
  - `pointerEvents="none"`, gated on `useReducedMotion()`.
  *Accept:* a lively but soft field of small animated emojis (incl. sparkles) drifts/bobs around
  the celebration hero at varied sizes + speeds; reduce-motion drops it.

- [x] **U3 · New celebration lottie pool** — S ✅ 2026-06-17
  **Built:** added `CELEBRATION_FLOAT` export (the 20 requested codepoints) to
  `celebration-emojis.ts`; `CELEBRATION_LOTTIE` kept for the hero pick. `2728` sprinkled by the
  field (U2), not listed in the pool. Nothing bundled — fetched on demand + cached. `tsc` clean.
  Commit `feat: celebration confetti from top + floating emoji field (U1-U3)`.
  Add the requested codepoints as a float pool in `src/data/celebration-emojis.ts` (a new export,
  e.g. `CELEBRATION_FLOAT`, keeping `CELEBRATION_LOTTIE` for the hero pick). Codepoints (Noto
  `…/latest/<seg>/lottie.json`): `1f61b 1f61d 1f61c 1f92a 1f92d 1fae1 1f638 1f639 1f63b 1f918
  1faf0 1f90c 1f989 1f982 1f37b 1f942 1f37e 1f375 1f947 1f3c1` (+ `2728` sprinkled per U2).
  *Accept:* U2 draws from this pool; nothing bundled (still fetched on demand + cached).

## V. Insights heat-grid (`src/app/(tabs)/insights.tsx`)

- [x] **V1 · Heat-grid fills the card with boxes** — M ✅ 2026-06-17
  **Built:** flipped `HeatGrid` to GitHub-classic orientation — 7 weekday rows (Mon→Sun), one
  column per week, oldest left / this week right. `onLayout` measures the card; `cols =
  floor((w+GAP)/(target+GAP))` then `box = (w-(cols-1)·GAP)/cols` so columns span the full
  width. Future days in the current column render as empty placeholders.
  The grid renders exactly `days` cells at a fixed 15px box (`HeatGrid`, `insights.tsx:29-98`),
  so a 7- or 30-day window leaves a small block with empty card space. Make it a proper
  contribution graph that **fills the card width**: measure the card width (`onLayout`), compute
  how many weekday-columns (rows of 7) fit at the box+gap size, and render the most-recent N
  weeks that fill the space (oldest column left, today's column right). No dates.
  *Accept:* the heat-grid spans the card width with a full grid of small boxes (GitHub-style),
  not a 5-row stub with dead space.

- [x] **V2 · Remove the heat-grid legend** — S ✅ 2026-06-17
  **Built:** deleted the Rest…More gradient legend row.
  Delete the "Rest … More" gradient legend row (`insights.tsx:85-95`).
  *Accept:* no legend under the grid.

- [x] **V3 · Ramp is faintest → brightest (monotonic)** — S ✅ 2026-06-17
  **Built:** ramp now `[raised, α.3, α.55, α.8, accent.main]` — dropped the `accent.deep` tail
  (darker than `main` = the dip bug); brightness strictly increases, densest day = solid `accent.main`.
  The ramp ends on `t.accent.deep` (`insights.tsx:37`), which is **darker** than `accent.main` —
  so it goes faint → bright → *less* bright. Make brightness strictly increase: drop the
  `accent.deep` tail (end on `accent.main`, or extend with a *lighter* tint via `hexAlpha`/a
  brighter step). Re-tone the level mapping so the densest day is the brightest cell.
  *Accept:* darker = less activity, brighter = more, with no dip at the top end.

- [x] **V4 · Drop 7d/30d, calendar jumps from "This week"** — S ✅ 2026-06-17
  **Built:** removed the `7d`/`30d` `Segmented` + wrapper + `range` state (+ unused `Segmented`
  import); heat-grid card is now header-less (just the grid, fills by space). Calendar `Chip`
  (→`/calendar`) moved into the "This week" card header, right-aligned beside the label. `tsc` clean.
  Commit `feat: insights heat-grid fills card, monotonic ramp (V1-V4)`.
  Remove the `7d`/`30d` `Segmented` + its wrapper (`insights.tsx:197-214`) and the `range` state
  (the grid no longer takes a range — V1 fills by space). Move the calendar `Chip`
  (`→ /calendar`) out of the heat-grid header and into the **"This week"** card
  (`insights.tsx:217-221`), e.g. right-aligned beside the "This week" label.
  *Accept:* no range toggle anywhere; the heat-grid header is gone/minimal; the calendar button
  lives in the This-week card and still opens `/calendar`.

## W. Pomodoro as a routine (`src/data/defaults.ts`, `editor.tsx`, `new-routine-sheet.tsx`, `onboarding.tsx`, `player/[id].tsx`)

The standalone timer is gone (Q1); Pomodoro returns as a first-class **routine** so it shows on
Today, records attendance, and reuses the player. Steps are generated focus/break blocks.

- [x] **W1 · Pomodoro template + data flag** — M ✅ 2026-06-17 (decision: `pomodoro` object, tomato hex)
  **Built:** added `RoutinePomodoro {focusMin,breakMin,sessions}` + `pomodoro?` on `Routine`;
  `buildPomodoroSteps(cfg)` (N focus → N-1 breaks: Focus/Break steps), `DEFAULT_POMODORO_CFG`
  (4×25/5). New `t-pomodoro` template: 🍅, tomato `#e8503a`, `autoAdvance:true`, generated steps.
  Added `pomodoro: r.pomodoro` to the builtin-override whitelist (custom routines store `r` whole,
  so it persists either way).
  Add a Pomodoro entry to `ROUTINE_TEMPLATES` (`defaults.ts:91`): 🍅 tomato emoji, a tomato-red
  color (custom `#…` hex or a palette red), default config **4 focus × 25 min with 5-min breaks
  between** → generated steps `[Focus 25, Break 5, Focus 25, Break 5, Focus 25, Break 5, Focus 25]`
  (breaks *between* sessions only, so N focus → N-1 breaks). Add a `pomodoro?: { focusMin,
  breakMin, sessions }` (or a `kind: 'pomodoro'` + the three numbers) to the `Routine` type +
  the `saveRoutine` builtin-override whitelist (`store.ts`), and a `buildPomodoroSteps(cfg)`
  helper in `defaults.ts`. Set `autoAdvance: true` by default for pomodoro routines so breaks
  flow without a tap.
  *Accept:* a Pomodoro template exists; saving one persists its config + generated steps + the
  pomodoro flag.

- [x] **W2 · Pomodoro template skips the step-picker** — S ✅ 2026-06-17
  **Built:** in both `NewRoutineSheet` and the onboarding starter grid, a template with
  `tpl.pomodoro` opens the editor directly (`/editor?template=t-pomodoro`) instead of `StepPicker`;
  other templates keep the picker.
  Tapping the Pomodoro template (in `NewRoutineSheet` `new-routine-sheet.tsx:54-69` and the
  onboarding starter grid `onboarding.tsx:204-218`) must **not** open `StepPicker` — go straight
  to the editor with the generated steps + config (`/editor?template=t-pomodoro` or a dedicated
  param). Other templates keep the step-picker.
  *Accept:* choosing Pomodoro opens the editor directly (pre-filled), no "choose steps" sheet.

- [x] **W3 · Pomodoro config sheet (sliders)** — M ✅ 2026-06-17 (ranges: sessions 2–8·1, focus 5–60·5, break 1–20·1)
  **Built:** when the editor holds a pomodoro routine it shows a Pomodoro config card (reusing
  `components/slider.tsx` via a local `PomoSliderRow`): Sessions / Focus / Break sliders, in place
  of the step list; `setPomoField` regenerates the steps via `buildPomodoroSteps`. Manual
  Add-step + DragList hidden for pomodoro. Name/emoji/color/schedule/alarm stay editable. `pomo`
  added to the dirty-snapshot; values persist via `save()`.
  When the editor holds a pomodoro routine, surface a **Pomodoro** config card/sheet (in place
  of, or above, the freeform step list) with **sliders** (reuse `src/components/slider.tsx` —
  swipe left/right to pick numbers, the "swiping … for selecting numbers" ask): **Sessions**,
  **Focus min**, **Break min**. Changing any slider **regenerates** the steps via
  `buildPomodoroSteps`. Keep name/emoji/color/schedule/alarm editable as usual; hide the manual
  Add-step / per-step drag for pomodoro routines (steps are derived).
  *Accept:* editing a Pomodoro routine shows sliders for sessions/focus/break; dragging them
  rebuilds the focus/break steps; values persist.

- [x] **W4 · Player: pomodoro uses "+5 min"** — S ✅ 2026-06-17
  **Built:** the extend button reads "+5 min" and adds 300s when `routine.pomodoro` is set, else
  "+1 min"/60s. Ring/Done/skip/back/next-step line unchanged. `tsc` clean.
  Commit `feat: Pomodoro as a routine (W1-W4)`.
  In the player, pomodoro routines show **"+5 min"** instead of "+1 min" and add 300s (vs 60s)
  to `extra` (`player.tsx:438-440`). Everything else (ring, Done, skip, back, next-step line) is
  unchanged. Key off the routine's pomodoro flag.
  *Accept:* running a Pomodoro routine, the extend button reads "+5 min" and adds 5 minutes;
  normal routines keep "+1 min".

## X. Navigation feel (`src/theme/motion.ts`, `src/app/_layout.tsx`)

- [x] **X1 · Confirm the transition duration (already tuned)** — S ✅ 2026-06-17
  **Built:** `SCREEN_DURATION` 380→375 (Material full-screen / complex-transition value) + a
  comment citing the spec (300ms small-element standard, >400ms reads slow) and recording that
  the lever for any remaining roughness is the easing curve + mount jank, not duration. No curve
  change made (per the note). `tsc` clean. Commit `chore: pin SCREEN_DURATION to Material full-screen 375ms (X1)`.
  Investigated: Material spec puts **full-screen / complex transitions at ~375 ms** (300 ms is
  the standard small-element duration; >400 ms reads as slow). `SCREEN_DURATION` is already
  **380** (`motion.ts:42`, native `ios_from_right`, `freezeOnBlur` on) — i.e. already in the
  recommended band, not the 300 the note assumed. So duration isn't the problem; if Android still
  reads "not smooth," the lever is the **easing/curve** and mount jank, not a longer time. Set to
  **375** to match the spec exactly and leave a one-line comment citing it; only revisit the curve
  if it still hitches on a dev build. (Sources in the build note.)
  *Accept:* `SCREEN_DURATION` documented at the Material full-screen value (~375 ms); no
  regression in push/back feel; decision recorded so it isn't re-litigated.

**Open decisions (confirm before building):** W1 pomodoro color (palette red vs custom tomato
hex) + whether to store `pomodoro` config object vs `kind` discriminant · W3 slider ranges
(sessions 2–8, focus 5–60·5, break 1–20·1?) · U2 floating-emoji count + whether to keep the
"pop outward and re-loop" motion or switch to a calmer drift/bob.

## QoL suggestions — ALL APPLIED ✅ 2026-06-17 (user OK'd all 6)

On-brand with `AGENTS.md` (no points/levels/shame, terse, quiet attendance):

1. [x] **Swipe symmetry in the player** ✅ — player Pan now does swipe-right=prev, swipe-left=skip
   (`activeOffsetX([-24,24])`, `translationX<-56` → `advance('skipped')`). **Plus** (user ask): a
   revisited *finished* step's primary button reads **"Do it again"** (IconRestart) — `goBack` no
   longer clears the result, so `results.current[idx]==='done'` flips the label; redo re-records
   the same result (no double-count). Commit `feat: player swipe-left=skip + Do-it-again ... (QoL1)`.
2. [x] **Pomodoro long-break (proper timer)** ✅ — `RoutinePomodoro` gained `longBreakMin` +
   `longEvery` (classic 4); `buildPomodoroSteps` inserts a short break between focus blocks and a
   **long break after every Nth focus**, so a completed set winds down on the long break (no
   trailing short). Editor adds a Long-break slider. **Also (user ask):** 🍅 + tomato red `#e8503a`
   are locked — Icon + Color sections hidden in the editor for pomodoro routines. Commit
   `feat: proper pomodoro long-breaks + lock tomato icon/color`.
3. [x] **Warm the celebration lottie** ✅ — `warmCelebrationAssets()` prefetches the float pool (+✨)
   into the cache once; `editor.save()` calls it idle (InteractionManager) after a save. Web no-op.
   Commit `feat: prefetch celebration lottie + still hero on reduce-motion (QoL3, QoL6)`.
4. [x] **Heat-grid empty state** ✅ — quiet "Fills in as you show up." caption under the grid when
   no routine has ever been completed. Commit `feat: heat-grid empty-state caption (QoL4)`.
5. [x] **Tab-bar "+" safe-area** ✅ verified (no code) — the taller, center-aligned bar lays the
   "+" in the content box above `paddingBottom: insets.bottom`, so it clears the home indicator on
   gesture-nav.
6. [x] **Reduce-motion audit** ✅ — U1 `Confetti`, U2 `EmojiConfetti`, S2 bell all early-return on
   `useReducedMotion()`; **closed the gap**: `CelebrationEmoji` hero now renders a static glyph under reduce-motion instead of the looping lottie (same commit as QoL3).

## Batch 12 — Bug Fixes & Feature Enhancements (June 2026)

- [x] **1. Emoji Selection Mechanics** — Built: absolute overlay input with value=""
  - Update `EmojiSheet` in `src/components/emoji-sheet.tsx` to use absolute TextInput with `value=""` overlayed on preview pressable.
  - Ensure typing replaces the current selection without duplicating emojis.

- [x] **2. Onboarding Exit & Save Redirect Flow** — Built: push editor with fromOnboarding=true, only complete on save
  - Push editor route from `src/app/onboarding.tsx` instead of replacing it, passing `fromOnboarding=true`.
  - Call `completeOnboarding()` in `src/app/editor.tsx` only on save, not on mount or route transition.
  - Redirect back to onboarding template picker on cancel/discard, and replace to tabs on save.

- [x] **3. Data Deletion Safeguard Bottom Sheet** — Built: moved HoldDelete into BottomSheet triggered by normal button
  - Move `HoldDelete` component inside a `BottomSheet` in `src/app/settings/data.tsx`.
  - Render a normal "Delete all data" button on the main settings screen to trigger this bottom sheet.

- [x] **4. Accent Colors from Mockup Image** — Built: updated ACCENT_CHOICES to mockup colors
  - Update `ACCENT_CHOICES` in `src/theme/colors.ts` to Macaw (`#1CB0F6`), Cardinal (`#FF4B4B`), Bee (`#FFC800`), Fox (`#FF9600`), Beetle (`#CE82FF`), Humpback (`#2B70C9`), and Feather Green (`#58CC02`).

- [x] **5. Color Picker Aesthetic & Constant Plus Icon** — Built: center dots on active presets + high-contrast IconPlus always on custom color button
  - Update routine color choice pressables in `src/app/editor.tsx` to match settings preferences accent selection (show center dot when active).
  - Update custom color picker pressable in `src/app/editor.tsx` and custom accent pressable in `src/app/settings/preferences.tsx` to always show `IconPlus` (in high-contrast color when active).

- [x] **6. Move Routine Overview Settings** — Built: moved auto-advance and 30-second warning to overflow BottomSheet
  - Remove Auto-advance and 30-second warning toggles from the main scroll view in `src/app/routine/[id].tsx`.
  - Render these two toggles in the "More" overflow menu bottom sheet on the same screen.

- [x] **7. 30-Second Warning Chiptune Alarm** — Built: warning chime function in sfx.ts called on 30s alert
  - Add and export `playWarningChime()` in `src/lib/sfx.ts` to play a double-beep retro melody.
  - Play warning chime alongside haptic cue in `src/app/player/[id].tsx` when 30 seconds remain.

- [x] **8. Done Button Icon & Completion Screen Check** — Built: removed IconCheck from Done button (except redo) and set animated check to white
  - Remove `IconCheck` from the player's Done button (except for redo).
  - Set `color="#ffffff"` on the check icon in the green check animation in `src/app/player/[id].tsx`.

- [x] **9. Step Duration Seconds & 0-Minute Selection** — Built: added step seconds, updated routineMin, built WheelPicker, stacked pickers in editor, updated details/player screens
  - Update `Step` in `src/data/defaults.ts` to support `sec?: number`.
  - Update `routineMin` to calculate fractional minutes (rounded up).
  - Implement `WheelPicker` in `src/components/minute-picker.tsx` for generalized horizontal snapping.
  - Stack minute (0-90) and second (0-55, step 5) WheelPickers in the step editor bottom sheet in `src/app/editor.tsx`.
  - Update step formatting on details/player screens to handle seconds.

- [x] **10. Pomodoro Settings Wheel Pickers** — Built: replaced Focus, Short break, and Long break sliders with WheelPickers
  - Replace sliders for Focus, Short break, and Long break in `src/app/editor.tsx` with the new `WheelPicker` component.

- [x] **11. Constrained Sliders ("Overboarding" Fix)** — Built: clamped slider and track thumb center coordinates
  - Update `src/components/slider.tsx` to keep thumb center within `[R, width - R]`.
  - Update `src/components/color-picker.tsx` track to apply the same thumb boundary limits.

- [x] **12. Share Routine Card Flipping** — Built: wrapped ticket in Pressable to toggle flipped state to render back layout, added flip hint
  - Introduce `flipped` state in `src/app/share.tsx`.
  - Wrap ticket card in a pressable to toggle flipping.
  - Render routine steps list on the back side of the ticket card.
  - Show a helper flip sub-label.

- [x] **13. Save to Device API Fix** — Built: changed Asset.create to MediaLibrary.createAssetAsync(uri)
  - Change `Asset.create` to `MediaLibrary.createAssetAsync(uri)` in `src/app/share.tsx`.

- [x] **14. Quality of Control Verification**
  - Run typecheck: `npx tsc --noEmit`
  - Run android export check: `npx expo export --platform android`

---

# Batch 14 — Daily Planner: Agenda + Visual Timeline (DONE)

Shipped the List ↔ Timeline view on Today: a pure agenda selector (`buildAgenda`) + a visual
timeline that makes the day spatial (block height ∝ duration, NOW line, anytime lane). Archived
from `task.md` 2026-06-21. New files: `src/lib/agenda.ts`, `src/components/timeline.tsx`.

- [x] **T0 · Relax routines-only rule in `AGENTS.md`** — S
  *Built:* `AGENTS.md` now states timed tasks + deadlines may appear on Today's timeline; untimed
  tasks stay Tasks-tab-only.
- [x] **P1 · `buildAgenda()` in `src/lib/agenda.ts`** (new, pure) — M
  *Built:* merges routines (active-on-day, timed if `reminder` else anytime) + qualified tasks
  (timed markers / deadline → anytime `due`), sorts timed ascending. No store/React coupling.
- [x] **P1b · Wire `buildAgenda` into List mode "Scheduled"** — S
  *Built:* `index.tsx` List mode renders `TodoRow` task markers alongside routines; untimed tasks
  excluded.
- [x] **P2a · `Timeline` component** (`src/components/timeline.tsx`, new) — L
  *Built:* time-axis vertical block list, proportional heights, collapsed spacers, left clock rail,
  anytime lane, drift dimming.
- [x] **P2b · NOW line + auto-scroll** — M
  *Built:* pulsing `NowLine` overlay; on-mount auto-scroll to the active time; reduce-motion calm.
- [x] **P2c · `List ↔ Timeline` toggle + persistence** — M
  *Built:* `Segmented` toggle in `index.tsx` header; `todayView` settings key + store v10 migration.
- [x] **P2d · Typecheck + export** — S
  *Built:* `npx tsc --noEmit` clean; `npx expo export --platform android` ok.

## Batch 14 — rev 6: Timeline hour-grid redesign (DONE 2026-06-21, local — uncommitted)

First redesign pass after dogfooding: the flow-stack timeline read like a timestamped list, and the
text toggle was cramped top-middle. Rewrote to a calendar-style hour grid + relocated the toggle.
**Note:** superseded in part by Batch 15 (border-tint replaces the left color-bar; continuous
multi-day replaces the bounded single-day window).

- [x] **P2e · Hour-grid day-view + toggle relocation** — L
  *Built:* `timeline.tsx` rewritten flow-stack → absolute-positioned hour grid (fixed `HOUR_H=64`,
  per-hour gridline + gutter label honoring 12/24h via `useTimeFmt`, events placed by clock with
  height ∝ duration, 4px color left-bar block, slim task markers, interval-graph overlap columns via
  `packColumns`, window snapped to whole hours / bounded to active range, NOW line with gutter pill +
  pulse). `index.tsx`: removed the cramped text `Segmented`; added a compact icon toggle (list|clock)
  to the header right cluster. `npx tsc --noEmit` clean.
