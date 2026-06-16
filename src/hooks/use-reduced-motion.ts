/* ── Reduce-motion: single source of truth ──
   New / heavy effects (celebration pulse, alarm pulse, step-complete check,
   page-dot animation) gate on this instead of reading the setting or the OS
   flag directly. True when EITHER the device's "reduce motion" accessibility
   setting OR the in-app toggle (Settings → Display) is on — so honoring it is
   one import, and there's nowhere to forget one of the two sources. */

import { useReducedMotion as useOSReducedMotion } from 'react-native-reanimated';

import { useStore } from '@/state/store';

/** Should animated/pulsing effects be calmed? OR of the OS setting + app toggle. */
export function useReducedMotion(): boolean {
  const os = useOSReducedMotion();
  const setting = useStore((s) => s.settings.reduceMotion);
  return os || setting;
}
