import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useStore } from '@/state/store';

const on = () => useStore.getState().settings.haptics;
const android = Platform.OS === 'android';

/* Light, snappy feedback — tuned so the app never feels heavy or laggy.
   iOS uses the Taptic Engine (already crisp). Android's old Vibrator waveform
   path (selectionAsync/impactAsync) holds the motor on ~50ms and feels buzzy,
   so on Android we route through the device haptic engine via
   performAndroidHapticsAsync — single sharp taps, no VIBRATE permission.

   tap = lightest selection tick · done = soft single tap on a step/task done
   finish = the one richer cue, reserved for completing a whole routine.
   iOS Taptic is the strong one, so done/finish are kept gentle there (Soft + a
   single Medium tap, not the triple-buzz Success). Android already routes through
   the device haptic engine, which lands light, so it stays as-is. */
export function tapHaptic() {
  if (!on()) return;
  if (android) Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Clock_Tick).catch(() => {});
  else Haptics.selectionAsync().catch(() => {});
}

export function doneHaptic() {
  if (!on()) return;
  if (android) Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Keyboard_Tap).catch(() => {});
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
}

/* warn = the 30-seconds-left nudge (per-routine, opt-in). A clock-tick on Android
   and a Light tap on iOS — distinct from `done`'s softer target buzz, never alarming. */
export function warnHaptic() {
  if (!on()) return;
  if (android) Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Clock_Tick).catch(() => {});
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function finishHaptic() {
  if (!on()) return;
  if (android) Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm).catch(() => {});
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
