/* ── Flint motion system ──
   One rhythm for everything. Springs carry gesture velocity where a drag hands
   off; timings own opacity / color / backdrop. Personality: buttery + controlled
   — springs sit near critically damped (dampingRatio ~0.9), so nothing
   cheap-bounces (see the note in toast.tsx). Tune here, not at call sites. */

import {
  Easing,
  FadeIn,
  FadeInDown,
  SlideInDown,
  ZoomIn,
} from 'react-native-reanimated';

/* Physics springs (Reanimated duration + dampingRatio API). Spread one of these
   and add `velocity` at the call site to carry a gesture's momentum into the
   settle: `withSpring(0, { ...SPRING.sheet, velocity: e.velocityY })`. */
export const SPRING = {
  sheet: { duration: 420, dampingRatio: 0.92 }, // sheet slide + snap-back
  snappy: { duration: 280, dampingRatio: 0.86 }, // dialog / pop
  press: { duration: 170, dampingRatio: 1.0 }, // button sink — no overshoot
  gentle: { duration: 300, dampingRatio: 0.9 }, // toggle knob, drag settle
} as const;

/* Easings. */
export const EASE_OUT = Easing.out(Easing.cubic);
export const EASE_IN = Easing.in(Easing.cubic);
export const EASE_OVERSHOOT = Easing.bezier(0.21, 1.02, 0.45, 1); // toast enter

/* Timings — opacity / color / backdrop, where a spring reads wrong. */
export const TIMING = {
  fast: { duration: 140, easing: EASE_OUT },
  base: { duration: 220, easing: EASE_OUT },
  exit: { duration: 160, easing: EASE_IN },
} as const;

/* Gesture dismiss thresholds (sheet + toast). */
export const DISMISS = { distance: 110, velocity: 800 } as const;

/* Native screen-push duration hint (see src/app/_layout.tsx). NOTE: react-native-screens
   ignores animationDuration for the `ios_from_right` preset, so on Android the REAL lever
   is the native res/anim override written by plugins/with-page-transition.js (currently
   300ms + decelerate) — keep this roughly aligned with that value. iOS uses its own native
   parallax timing regardless. ~300ms ≈ Duolingo's measured ~290ms glide. */
export const SCREEN_DURATION = 300;

/* ── Entering presets (layout animations) ──
   Factories so each mount gets a fresh builder. Drive screen-content
   choreography and one-shot pops with the same curves as everything else. */
export const enterFade = (delay = 0) => FadeIn.duration(220).delay(delay);
export const enterUp = (delay = 0) => FadeInDown.duration(280).delay(delay).easing(EASE_OUT);
export const slideUp = (delay = 0) => SlideInDown.duration(300).delay(delay).easing(EASE_OUT);
export const popIn = () => ZoomIn.springify().damping(18).stiffness(170).mass(0.7);
