import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { tapHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme/theme';

/* Tap-or-drag numeric slider in the arcade style. The thumb rides a UI-thread
   shared value so it glides at 60fps; snapped values commit back to React with a
   ratchet tap as each step passes. Mirrors the color-picker track. */

const THUMB = 26;

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  color?: string;
  onChange: (v: number) => void;
}

export function Slider({ value, min, max, step = 1, color, onChange }: SliderProps) {
  const t = useTheme();
  const main = color ?? t.accent.main;
  const [w, setW] = useState(0);
  const wSv = useSharedValue(0);
  const tx = useSharedValue(0);
  const draggingRef = useRef(false);
  const lastRef = useRef(value);
  lastRef.current = value;

  const R = THUMB / 2;

  // keep the thumb synced when the value changes from outside a drag
  useEffect(() => {
    if (!draggingRef.current && w > 0) {
      tx.value = R + ((value - min) / (max - min)) * (w - 2 * R);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, w, min, max]);

  const setDragging = (v: boolean) => {
    draggingRef.current = v;
  };

  const commit = (frac: number) => {
    const raw = min + Math.min(1, Math.max(0, frac)) * (max - min);
    const snapped = Math.min(max, Math.max(min, Math.round(raw / step) * step));
    if (snapped !== lastRef.current) {
      lastRef.current = snapped;
      tapHaptic();
      onChange(snapped);
    }
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      if (wSv.value <= 0) return;
      runOnJS(setDragging)(true);
      const x = Math.min(wSv.value - R, Math.max(R, e.x));
      tx.value = x;
      runOnJS(commit)((x - R) / (wSv.value - 2 * R));
    })
    .onUpdate((e) => {
      if (wSv.value <= 0) return;
      const x = Math.min(wSv.value - R, Math.max(R, e.x));
      tx.value = x;
      runOnJS(commit)((x - R) / (wSv.value - 2 * R));
    })
    .onFinalize(() => runOnJS(setDragging)(false));

  const fill = useAnimatedStyle(() => ({ width: tx.value }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value - THUMB / 2 }] }));

  return (
    <GestureDetector gesture={pan}>
      <View
        collapsable={false}
        onLayout={(e) => {
          const width = e.nativeEvent.layout.width;
          setW(width);
          wSv.value = width;
          if (!draggingRef.current) tx.value = R + ((value - min) / (max - min)) * (width - 2 * R);
        }}
        style={{ height: 40, justifyContent: 'center' }}
      >
        <View style={{ height: 14, borderRadius: 99, backgroundColor: t.raised, borderWidth: 2, borderColor: t.lineSoft, overflow: 'hidden' }}>
          <Animated.View style={[{ height: '100%', backgroundColor: main, borderRadius: 99 }, fill]} />
        </View>
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: 0, width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: main, borderWidth: 3, borderColor: t.text },
            thumb,
          ]}
        />
      </View>
    </GestureDetector>
  );
}
