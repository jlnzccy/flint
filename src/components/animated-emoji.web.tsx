import React from 'react';
import { Text } from 'react-native';

/* Web build skips lottie-react-native (heavy wasm dep) — just the glyph. */
export function AnimatedEmoji({ emoji, size }: { emoji: string; size: number }) {
  return <Text style={{ fontSize: size * 0.86, lineHeight: size, textAlign: 'center' }}>{emoji}</Text>;
}
