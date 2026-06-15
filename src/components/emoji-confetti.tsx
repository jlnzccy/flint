import LottieView from 'lottie-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

import { CELEBRATION_LOTTIE } from '@/data/celebration-emojis';

/* Random animated-emoji confetti for the celebration — Noto lottie emojis that pop
   outward from the fire, fade, and re-pop on a loop. Sits alongside the fire (never
   replaces it). Lottie is native-only; web gets the no-op variant. */

const CDN = 'https://fonts.gstatic.com/s/e/notoemoji/latest';
const cache = new Map<string, object | null>();

async function load(seg: string): Promise<object | null> {
  if (cache.has(seg)) return cache.get(seg)!;
  try {
    const res = await fetch(`${CDN}/${seg}/lottie.json`);
    if (res.ok) {
      const json = (await res.json()) as object;
      cache.set(seg, json);
      return json;
    }
  } catch {
    // network hiccup — just skip this one
  }
  cache.set(seg, null);
  return null;
}

function sample<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

export function EmojiConfetti({ count = 11 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const picks = useMemo(() => sample(CELEBRATION_LOTTIE, count), [count]);
  const cx = width / 2;
  const cy = height * 0.42; // roughly behind the fire
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      {picks.map((seg, i) => (
        <Pop key={`${seg}-${i}`} seg={seg} index={i} total={picks.length} cx={cx} cy={cy} />
      ))}
    </View>
  );
}

function Pop({ seg, index, total, cx, cy }: { seg: string; index: number; total: number; cx: number; cy: number }) {
  const [data, setData] = useState<object | null>(() => cache.get(seg) ?? null);

  // randoms fixed once per particle (never inside the worklet, which re-runs each frame)
  const p = useMemo(() => {
    const size = 42 + Math.random() * 28;
    return {
      size,
      angle: (index / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
      dist: 95 + Math.random() * 170,
      delay: Math.random() * 600,
      dur: 1400 + Math.random() * 800,
      spin: (Math.random() < 0.5 ? -1 : 1) * (16 + Math.random() * 30),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, total]);

  const prog = useSharedValue(0);

  useEffect(() => {
    let alive = true;
    if (!cache.has(seg)) load(seg).then((json) => alive && setData(json));
    else setData(cache.get(seg) ?? null);
    return () => {
      alive = false;
    };
  }, [seg]);

  useEffect(() => {
    prog.value = withRepeat(
      withDelay(p.delay, withTiming(1, { duration: p.dur, easing: Easing.out(Easing.cubic) })),
      -1,
      false
    );
  }, [prog, p]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.sin(p.angle) * p.dist * prog.value },
      { translateY: -Math.cos(p.angle) * p.dist * prog.value },
      { scale: 0.3 + prog.value * 0.95 },
      { rotate: `${p.spin * prog.value}deg` },
    ],
    opacity: prog.value < 0.15 ? prog.value / 0.15 : 1 - (prog.value - 0.15) / 0.85,
  }));

  if (!data) return null;
  return (
    <Animated.View style={[{ position: 'absolute', left: cx - p.size / 2, top: cy - p.size / 2, width: p.size, height: p.size }, style]}>
      <LottieView source={data as never} autoPlay loop style={{ width: p.size, height: p.size }} />
    </Animated.View>
  );
}
