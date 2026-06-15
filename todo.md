# Flint — UI polish backlog

Status: ☐ todo · ◐ in progress · ☑ done · ⏸ deferred

## Done — session 2026-06-14 (pass 2b: device-feedback fixes, typecheck + android export clean)
- ☑ **Onboarding empty space** — Look/Streaks/Reminders pages now center content (`PAGE` = flexGrow+justifyContent center); bigger accent swatches; streak card shows 🔥. `onboarding.tsx`.
- ☑ **Reminders page back** — user reversed the turn-1 removal: re-added a dedicated **Reminders** onboarding page (Enable button) between Streaks and starter. `_layout.tsx` still fires the OS prompt on first entry too. `onboarding.tsx`.
- ☑ **Non-animated emojis move** — most object emojis (🧺/🌙) have no Noto lottie (CDN 404) → dead glyph. `animated-emoji.tsx` now wraps the glyph fallback in `GlyphBob` (gentle scale breathe). Fixes routine-detail + alarm icon "not animating". `animated-emoji.tsx`.
- ☑ **Confetti pops alongside fire (not replacing)** — `emoji-confetti.tsx` rewritten to a looping radial pop bursting from the fire; deleted the old geometric `Burst`/`Particle` from player + `CelebrationOverlay`. Fire stays. `emoji-confetti.tsx`, `player/[id].tsx`, `celebration.tsx`.
- ☑ **First-routine overlay = button dismiss** — removed auto-close; added "Let's go" `ChunkyButton`. `celebration.tsx`.
- ☑ **Alarm Start button** — dropped "🔥", now a routine-colored chunky "Start". `alarm/[id].tsx`.
- ☑ **Exit confirm = swipe sheet** — player X opens a `BottomSheet` (swipe-down to dismiss) with 🥹 + Keep going / Leave, not a centered floating dialog. `player/[id].tsx`.

## Done — session 2026-06-14 (pass 2: onboarding + clock + alarm + celebrations, typecheck + android export clean)
- ☑ **Notif perms on first open, not onboarding** — dropped the in-onboarding "Enable notifications" step. `_layout.tsx` sync now early-returns until `onboarded` (added to the subscribe signature), so the OS permission prompt fires the moment onboarding completes — not over the onboarding screens. `onboarding.tsx`, `_layout.tsx`.
- ☑ **Animated onboarding emojis** — intro-slide hero emoji → `AnimatedEmoji` (Noto lottie). `onboarding.tsx`.
- ☑ **Onboarding pages split** — setup page broken into **Look** (theme+accent) and **Streaks** pages (reminders page removed per above). `onboarding.tsx`.
- ☑ **Template step-picker in onboarding** — tapping a starter now opens the shared `StepPicker` (exported from `new-routine-sheet.tsx`) in a sheet, then routes to `/editor?template=…&pick=…`. `onboarding.tsx`, `new-routine-sheet.tsx`.
- ☑ **First-routine double-fire** — `index.tsx` latches `pendingCelebration` into local state and clears the store flag immediately → overlay fires exactly once.
- ☑ **System 12/24h clock** — `clock: 'system'|'12'|'24'` replaces `clock24` (store v4→v5 migrate). `dates.ts` `systemClock24()` reads **expo-localization** `uses24hourClock` (added dep+plugin), Intl `/13/` fallback; `resolveClock24()` feeds `useTimeFmt`, time-picker, alarm. Settings → Clock = Auto/12h/24h. `store.ts`, `dates.ts`, `ui.tsx`, `time-picker.tsx`, `alarm/[id].tsx`, `settings.tsx`.
- ☑ **Exit-routine confirm** — player X (while unfinished) opens a 🥹 `AnimatedEmoji` overlay (Keep going / Leave) instead of bare back. `player/[id].tsx`.
- ☑ **Celebration extra = random emojis** — `celebration-emojis.ts` (38 Noto lottie segments) + `emoji-confetti.tsx` (native fetch+float ~9; `.web.tsx` no-op). In player celebrate phase + first-routine `CelebrationOverlay`, gated on `celebrate==='extra'`. `player/[id].tsx`, `celebration.tsx`.
- ☑ **Routine emoji animated** — routine detail hero emoji → `AnimatedEmoji` (lottie). `routine/[id].tsx`.
- ☑ **Alarm pulse + static icon** — removed emoji scale/rotate throb; `PulseGlow` rewritten as a breathing radial **gradient** in the routine's own color (concentric, like the reference). `alarm/[id].tsx`.

### Verify-on-device (pass 2 — needs a dev build, `npx expo run:android`)
- Fresh install: onboarding has no notif step; permission prompt appears right as you land on Today. Slide emojis animate. Look + Streaks are separate pages. Tapping a starter asks which steps before the editor.
- Make first routine → celebration fires ONCE.
- Settings → Clock = Auto follows the phone's 24h toggle (flip it, cold-start app); 12h/24h force it. Check Today/cards/editor/alarm/routine detail.
- Player: tap X mid-routine → 🥹 confirm; "Keep going" stays, "Leave" exits.
- Finish a routine with Celebration=Extra → random animated emojis fly up (calm = just 🔥, no confetti).
- Routine detail hero emoji animates. Alarm: icon still, gradient pulse tinted to the routine color, no spin.

## Done — session 2026-06-14 (feature pass, typecheck clean)
- ☑ **Emoji sheet** — new `emoji-sheet.tsx`: type-your-own field (system keyboard) + tabbed `EMOJI_GROUPS` grid (padded to full rows so cells stay square). Editor's 7th tile is now a "+" that opens the sheet; a chosen custom emoji shows as its own highlighted tile. `editor.tsx`, `emoji-sheet.tsx`.
- ☑ **Toasts → compact pill** — dropped `sonner-native`; custom host (`useSyncExternalStore` queue, max 2, 2.2s) renders a hug-width **centered** Ember pill above the tab bar — chunky shadow/border, spring-in (`FadeInDown`) + swipe-to-dismiss. Same `useToast()`/`toast('msg')` API so all call sites untouched. `toast.tsx`.
- ☑ **Routine templates** — `ROUTINE_TEMPLATES` + `getTemplate` in `defaults.ts` (Morning/Evening/Study/Self-care/Ready for work/Shower, prefilled terse steps). New `new-routine-sheet.tsx` chooser (Blank vs template) opens from the "+" and empty-state. Editor seeds from `?template=` param, everything stays editable. `defaults.ts`, `new-routine-sheet.tsx`, `index.tsx`, `editor.tsx`.
- ☑ **Today → Routine tab + day view** — tab relabeled `Routine` (`_layout.tsx`). Routine page got a ‹ / › day pager (+ "Today" reset chip); other days are read-only previews (scheduled/anytime; done = check, undone = neutral, **never "missed"**; future = "Coming up"). Tasks/+/⋯/reorder stay today-only. Calendar day-detail now lists routines *scheduled* on any tapped date (upcoming included), not just completed — neutral ring for not-done, "rest day" copy when empty. `index.tsx`, `_layout.tsx`, `calendar-view.tsx`, `routine-bits.tsx` (RoutineCard `readonly`).

### Verify-on-device (this session)
- Emoji "+" tile opens sheet; typing commits a single emoji; grid tabs swap without lag; selection reflects back in the editor tile.
- Toast after Save / Done ✓ / Archived is a small centered pill that hugs the text and clears the tab bar; swipe sideways dismisses.
- "+" opens the chooser; a template lands in the editor with its steps; Blank still works.
- Tab reads "Routine"; ‹ / › shift the day; past shows checks (no red/missed), future shows "Coming up", today fully interactive; "Today" chip resets.
- Calendar: tap any day (incl. future) → scheduled + done list, no failure framing.

## Next session — onboarding (planned, not built)
- ⏸ **First-run onboarding** — `onboarded` flag in store (migrate **v3→v4** = `true` for existing users so they skip it; fresh installs `false`); gate in `app/_layout.tsx` → new `app/onboarding.tsx`. Stepped flow writing **live** via `setSettings`/`setAccent`: Welcome → Look (theme + accent) → Progress (streaks) → Timer (count up/down) → First routine (reuse #3 templates) → Done. Skip throughout. Full design: `~/.claude/plans/ticklish-singing-lecun.md`.

## Done — session 2026-06-13 (polish pass 2, typecheck clean)
- ☑ **Time dial dead** — `<Modal>` renders outside `GestureHandlerRootView`, so the gesture-handler Pan never fired. Swapped the dial to the RN responder system (locationX/Y), same approach the working colour slider uses. `time-picker.tsx`.
- ☑ **12/24h clock setting** — new `settings.clock24`; `fmtTime()` + `useTimeFmt()` hook drive every time display (Today, cards, preview, editor, tasks, todo rows, routine detail, alarm). Time picker seeds its mode from the setting. Settings → Display → Clock. `dates.ts`, `ui.tsx`, `store.ts` (v3 migrate), `settings.tsx`, +call sites.
- ☑ **Emoji picker lag + look** — killed the nested horizontal-pager-of-vertical-FlatLists (the jank source). Single grid swapped per category via tabs, FlatList windowing props. `emoji-picker.tsx`.
- ☑ **Confirm dialog** — flat linear zoom → controlled spring pop (re-runs each open). `confirm-dialog.tsx`.
- ☑ **Default routine colour = system** — new routines default to `COLOR_CHOICES[0]` = `accent` (follows app ember/accent). `editor.tsx`.
- ☑ **6th routine colour** — added `rose`. `colors.ts`, `theme.tsx`, `defaults.ts`.
- ☑ **Custom-colour picker vanishing** — custom colour now shows as its own selected swatch AND the "+" picker button is always rendered; row wraps. `editor.tsx`.
- ☑ **Toasts** — bottom-center, offset clear of the tab bar, Ember card look (raised surface, line border, radius 16, chunky shadow) instead of the floating pill. `toast.tsx`.
- ☑ **Haptics too heavy** — tap → `selectionAsync` (lightest), done → Light (was Medium); finish stays Success (once per routine). `haptics.ts`.
- ☑ **Thin line in every sheet** — sheet card had top-only `borderTopWidth`, reading as a hairline across the top. Now full `borderWidth` so it wraps the rounded card. `sheet.tsx`.
- ☑ **Player layout** — routine title centered (balanced spacer); ring raised (dropped space-evenly; prompt → ring → controls stack from top). `player/[id].tsx`.
- ☑ **Restart icon broken** — replaced the misaligned arc+bracket with a clean filled refresh glyph. `icons.tsx`.
- ☑ **Celebration upgrade** — removed `juicy`; options are now `calm` | `extra`. Extra = confetti burst (reanimated, web-safe) + spring-popped fire. Default `extra`. `player/[id].tsx`, `store.ts`, `settings.tsx`.
- ☑ **Date picker shifting** — always renders 6 rows (42 cells) so height never changes between months; nothing below shifts. `date-picker.tsx`.
- ☑ **Completed routine = disabled look** — done cards now read flat + greyed (raised face, no chunk edge, faint name, dimmed emoji) to match disabled buttons; green check still signals done. `routine-bits.tsx`.
- ☑ **#9 sheet shows tab bar / bottom peeks** — scrim darkened 0.5 → 0.62 (matches dialog). `sheet.tsx`. *Verify on device.*
- ☑ **#13 keyboard covers input** — `<Modal>` doesn't resize for the keyboard, so the sheet now tracks keyboard height and lifts the card above it (smoothed with LinearTransition). Covers brain-dump, hex input, time/date pickers, all task sheets. `sheet.tsx`. *Verify on device.*

## Deferred (own session — heavy)
- ⏸ **Material theming** — Material 3 / dynamic-colour theming option (Android `expo-system-ui` / dynamic palette, themed surfaces). Its own session: design the token mapping, decide opt-in vs auto, keep Ember as default. Touches `theme/`, `colors.ts`, `settings.tsx`.
- ⏸ **React Navigation** — page-switch lag + nav polish. expo-router 56 = react-nav v7 (no v8 yet). Perf work: `react-native-screens` freezeOnBlur, lazy tabs, memoize screens, cut re-renders. Isolate; own session.

## Verify-on-device checklist (this session)
- Time dial: drag/tap hour+minute in the reminder sheet actually moves the hand now (Android).
- 12/24h: flip Settings → Clock, confirm every screen's time flips.
- Keyboard: brain-dump (autofocus), hex input, task time/date sheets — input stays visible above keyboard.
- Sheet hairline gone; scrim dark enough that the tab bar no longer peeks.
- Celebration "Extra": confetti + fire pop; "Calm": just 🔥. Old saves migrate (juicy/max → extra).
- Haptics feel light, not heavy/buggy.
