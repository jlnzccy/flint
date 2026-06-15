import React from 'react';

/* Web skips lottie-react-native (heavy wasm dep) — the confetti is native-only.
   The reanimated particle Burst still carries the celebration on web. */
export function EmojiConfetti(_: { count?: number }) {
  return null;
}
