# ACTIVE PLAN — read this fully before doing anything

> **Any agent (Gemini included): READ THIS FILE FIRST and FOLLOW IT. Do NOT invent your own plan,
> do NOT re-scope, do NOT skip phases.** This file holds the *one* current plan. It is overwritten
> when the plan changes — treat whatever is here as the source of truth. If something here conflicts
> with your own idea, this file wins; if it's genuinely blocking, stop and ask, don't improvise.
>
> Workflow contract:
> - Do the tasks in the listed order.
> - Obey `AGENTS.md` product rules (terse copy, **no shame — never red, never ✗, no "behind" copy**,
>   quiet attendance, no points/levels). Motion gated by `useReducedMotion()`.
> - `npx tsc --noEmit` must be clean before you call a phase done.
> - After each task: mark it `[x]` in `task.md` with a one-line **Built:** note.
> - The detailed backlog (anchors, accept criteria) lives in `task.md → "# Batch 15"`. This file is
>   the focused, current slice of it.

---

## Current plan: Batch 15 — Phase 2 (continuous multi-day timeline) — DONE ✅

**Phase 2 SHIPPED (local, uncommitted)** — `timeline.tsx` rewritten + `index.tsx` restructured.
tsc clean, `expo export --platform android` ok. Device QA still pending (see gate below).

**Built:**
- `timeline.tsx` is now a continuous vertical `FlatList`, one full 0–24h section per dateKey
  (`DAY_H = 24*HOUR_H`), lazy-extended both directions (`onEndReached` future, `onScroll`<DAY_H past,
  guarded) with `maintainVisibleContentPosition` so prepend doesn't jump. Per-day agenda via cached
  `buildDay(key)` → `buildAgenda`. Midnight/date dividers (`Today`/`Tomorrow`/`Yesterday` else
  weekday·date). Now-line pinned at ~0.4·viewport via `scrollToOffset` re-anchor on a 30s tick while
  `atNow`; first drag drops `atNow`. Floating accent **"Now"** pill (no down-arrow icon exists) snaps
  back and hides. Reuses `packColumns`/`NowLine`, reduce-motion gated.
- **Architecture fix Gemini's plan missed:** the timeline can't live inside index.tsx's page
  `ScrollView` (no vertical-FlatList-in-vertical-ScrollView). `index.tsx` now branches
  `reordering / timeline / list`: in timeline mode the hero + `ROUTINES n/m`+switcher bar + sticky
  **Anytime** h-scroll strip are pinned, and `<Timeline flex:1>` owns the scroll. Horizontal
  day-swipe + slide kept in **list mode only**; switching to timeline snaps `viewKey` to today.

**Phase 1 was already DONE** (border-tint, shared header, reorder→long-press sheet,
archived→Settings→Data, anytime h-scroll). **Do not redo Phase 1 or Phase 2.**

Phase 2 = rewrite `src/components/timeline.tsx` from a single bounded day into a **continuous
vertical scroller spanning many days**. Build order: **P2-T6 → P2-T7 → P2-T8 → P2-T9 → P2-T10 → gate.**

### Context (why)
The timeline currently renders one bounded day with a horizontal day-swipe to change days. We want a
real day-view calendar: scroll *vertically* through time, continuous across midnight, now-line
pinned on screen while the grid moves under it. ADHD framing: time stays visible and "now" is always
the anchor — never a wall of empty failure.

### Data-flow change (do this first, it unblocks everything)
In timeline mode, `src/app/(tabs)/index.tsx` must stop passing a single day's `timed`/`anytime` to
`<Timeline>`. Instead pass `routines`, `todos`, `todayKey`, and a memoized
`buildDay(key) => buildAgenda(key, routines, todos, doneForKey(key))`, where:

```ts
const doneForKey = (key: string) => (item: AgendaItem) =>
  item.kind === 'routine'
    ? (key === todayK ? !!doneMap[item.id] : (history[key] || []).includes(item.id))
    : (() => { const t = todos.find(x => x.id === item.id); return t ? todoDoneOn(t, key) : false; })();
```

This mirrors the existing single-day closure at `index.tsx:128-142`. `buildAgenda` is pure and cheap
to call per-day (verified) — calling it for ~20 days at once is fine.

### Tasks

**P2-T6 · Continuous day-section scroller** — L — `timeline.tsx`, `index.tsx`
- `DAY_H = 24 * HOUR_H` (keep `HOUR_H = 64`). Use a vertical `FlatList`, **one item per dateKey**,
  with `getItemLayout: (_, i) => ({ length: DAY_H, offset: i * DAY_H, index: i })`.
- `keys` = state array of dateKeys centered on today (init e.g. today-10 … today+10 via
  `addDays`/`dateKey`).
- Each list item = a `position:relative` `View` of height `DAY_H` containing 24 hour gridlines +
  gutter hour labels and that day's blocks from `buildDay(key)` (absolute-positioned by minute;
  overlaps via the **existing** `packColumns` helper already in `timeline.tsx` — reuse it).
- Lazy extend: `onEndReached` → append future keys; near-top → prepend past keys using
  `maintainVisibleContentPosition={{ minIndexForVisible: 0 }}` so prepending doesn't jump the scroll.
- Initial scroll to today's section + now-of-day offset.
- *Accept:* smooth multi-day vertical scroll; events land on the correct day; no visual jump when
  past days prepend.

**P2-T7 · Midnight + date dividers** — M — `timeline.tsx`
- At each day boundary (the `00:00` line atop every day section) render a bolder rule + a **date
  label** from `keyToDate(key)` ("Sat · Jun 21"); relative "Today"/"Tomorrow"/"Yesterday" labels
  are welcome.
- *Accept:* crossing midnight clearly shows `00:00` + the new date as a transition marker.

**P2-T8 · Pinned now-line + "Now" button** — M — `timeline.tsx`
- Now-line = a content element in *today's* section at `nowMins * PX_PER_MIN` (accent rule across the
  grid + gutter time-pill + pulsing dot; pulse gated by `useReducedMotion`).
- `atNow` mode: a 30s ticker + on-open + on-Now-tap call `scrollToOffset` so the now-line sits at a
  fixed screen anchor (~0.35 · viewportH) → the line looks static while the grid creeps.
  `onScrollBeginDrag` sets `atNow = false`.
- Floating **"Now" button** (FAB, bottom-right) visible only when `!atNow`; tap → animated
  `scrollToOffset` back to the anchor, set `atNow = true`, hide the button.
- *Accept:* opening lands on now with the line pinned; scrolling away reveals the Now button; tapping
  it returns; calm under reduce-motion.

**P2-T9 · Sticky Anytime bar** — M — `timeline.tsx` / `index.tsx`
- Promote the Anytime lane (Phase 1 made it a horizontal ScrollView) to a **sticky, always-visible**
  horizontal-scroll strip of today's flexible items, pinned just below the shared header / above the
  scroller (outside the FlatList scroll, or as a sticky header).
- *Accept:* anytime items are always reachable regardless of vertical scroll; h-scroll on overflow.

**P2-T10 · Day-nav interplay** — S — `index.tsx`
- In **timeline** mode, disable the horizontal day-swipe + `viewKey` slide (vertical scroll *is* the
  day nav now). Keep the horizontal swipe in **list** mode. Timeline always anchors its range on
  **today**.
- *Accept:* no gesture conflict; list-mode day-swipe unchanged.

### Phase 2 gate
`npx tsc --noEmit` clean · `npx expo export --platform android` ok · dev-build check: multi-day
scroll + prepend (no jump), midnight/date dividers, pinned now-line + Now button, sticky anytime bar,
reduce-motion calm, no shame/red on drift.

### Reuse (do not reinvent)
`buildAgenda` (`src/lib/agenda.ts`), `packColumns` (already in `timeline.tsx`), `routineMin`
(`data/defaults`), `todoDoneOn`/`todoIsToday` (`state/store`),
`addDays`/`dateKey`/`keyToDate`/`todayKey` (`lib/dates`), `useReducedMotion`, `t.col()`, `useTimeFmt`.

### Heads-up
The rev-6 hour-grid `timeline.tsx` and all of Phase 1 are **local / uncommitted** — build on the
working tree, not on git history.
