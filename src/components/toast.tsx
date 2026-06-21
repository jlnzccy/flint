import React from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, Keyframe, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DISMISS, SPRING } from '@/theme/motion';
import { useTheme } from '@/theme/theme';

/* Tiny custom toast host — a compact Ember pill that hugs the (≤3-word) message,
   centered above the tab bar. Keeps the old useToast()/toast('msg') call shape so
   nothing else changes. */

interface ToastItem {
  id: number;
  msg: string;
}

const MAX = 2;
const DURATION = 2200;

/* react-hot-toast feel: ease up + fade + a small scale pop on enter, ease back down
   on exit. No spring overshoot — the old bounce read as cheap. */
const ENTER = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 28 }, { scale: 0.86 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: Easing.bezier(0.21, 1.02, 0.45, 1) },
}).duration(340);

const EXIT = new Keyframe({
  0: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
  100: { opacity: 0, transform: [{ translateY: 14 }, { scale: 0.9 }], easing: Easing.in(Easing.ease) },
}).duration(190);

let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function dismiss(id: number) {
  if (!items.some((i) => i.id === id)) return;
  items = items.filter((i) => i.id !== id);
  emit();
}

function pushToast(msg: string) {
  const id = ++seq;
  items = [...items, { id, msg }].slice(-MAX);
  emit();
  setTimeout(() => dismiss(id), DURATION);
}

export const toast = (msg: string) => pushToast(msg);
export const useToast = () => toast;

function useToasts(): ToastItem[] {
  return React.useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => items,
    () => items
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastHost />
    </>
  );
}

function ToastHost() {
  const insets = useSafeAreaInsets();
  const list = useToasts();
  if (!list.length) return null;
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 78, alignItems: 'center', gap: 8 }}
    >
      {list.map((it) => (
        <Pill key={it.id} item={it} />
      ))}
    </View>
  );
}

function Pill({ item }: { item: ToastItem }) {
  const t = useTheme();
  const tx = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = e.translationX;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > DISMISS.distance || Math.abs(e.velocityX) > DISMISS.velocity) {
        runOnJS(dismiss)(item.id);
      } else {
        tx.value = withSpring(0, { ...SPRING.gentle, velocity: e.velocityX });
      }
    });

  // drag lives on the inner view; enter/exit own the outer view's transform so the
  // two never fight over the same `transform` array.
  const dragStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View entering={ENTER} exiting={EXIT}>
        <Animated.View
          style={[
            {
              maxWidth: '86%',
              backgroundColor: t.raised,
              borderWidth: 2,
              borderColor: t.line,
              borderRadius: 14,
              paddingVertical: 11,
              paddingHorizontal: 18,
            },
            dragStyle,
          ]}
        >
          <Text numberOfLines={1} style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: t.text, letterSpacing: 0.2 }}>
            {item.msg}
          </Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
