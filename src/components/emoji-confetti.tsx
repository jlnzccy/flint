import LottieView from 'lottie-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

import { CELEBRATION_FLOAT } from '@/data/celebration-emojis';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/* A soft floating field of small animated-emoji (U2): Noto lottie emojis scattered
   *around* the celebration hero — varied size, varied lottie speed, each bobbing
   gently up and down out of phase with the others. Not a pop-outward burst; a calm,
   lively backdrop. Sits alongside the hero (never replaces it). Lottie is native-only;
   web gets the no-op variant. Gated on reduce-motion. */

const CDN = 'https://fonts.gstatic.com/s/e/notoemoji/latest';
const cache = new Map<string, object | null>();
const SPARKLE = '2728'; // ✨ sprinkled among the pool picks

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

/* Prefetch the whole float pool (+ sparkle) into the cache once, so the first
   celebration isn't sparse while the lottie JSON loads (QoL3). Fire-and-forget; the
   guard makes repeat calls free. Call it (idle) after the first routine is saved. */
let warmed = false;
export function warmCelebrationAssets() {
  if (warmed) return;
  warmed = true;
  [...CELEBRATION_FLOAT, SPARKLE].forEach((seg) => {
    if (!cache.has(seg)) load(seg);
  });
}

function sample<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

export function EmojiConfetti({ count = 12 }: { count?: number }) {
  const reduce = useReducedMotion();
  const { width, height } = useWindowDimensions();
  // pick from the float pool, then sprinkle in ✨ (~1 in 4) — fixed once per mount
  const picks = useMemo(
    () => sample(CELEBRATION_FLOAT, count).map((seg) => (Math.random() < 0.28 ? SPARKLE : seg)),
    [count]
  );
  const cx = width / 2;
  const cy = height * 0.4; // around the hero, which sits a touch above centre
  if (reduce) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      {picks.map((seg, i) => (
        <Float key={`${seg}-${i}`} seg={seg} index={i} total={picks.length} cx={cx} cy={cy} />
      ))}
    </View>
  );
}

function Float({ seg, index, total, cx, cy }: { seg: string; index: number; total: number; cx: number; cy: number }) {
  const [data, setData] = useState<object | null>(() => cache.get(seg) ?? null);

  // randoms fixed once per particle (never inside the worklet, which re-runs each frame).
  // scatter on a ring around the hero so nothing stacks on the centre glyph; each gets
  // its own size, lottie speed, bob amplitude/period and phase.
  const p = useMemo(() => {
    const size = 28 + Math.random() * 36; // 28–64px
    const angle = (index / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.7;
    const radius = 110 + Math.random() * 140; // outside the ~150px hero
    return {
      size,
      x: cx + Math.cos(angle) * radius - size / 2,
      y: cy + Math.sin(angle) * radius - size / 2,
      amp: 6 + Math.random() * 6, // bob ±6–12px
      bobDur: 1600 + Math.random() * 1000,
      phase: Math.random() * 1200, // out of phase with its neighbours
      speed: 0.6 + Math.random() * 0.8, // lottie playback 0.6–1.4
      fadeDelay: Math.random() * 500,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, total, cx, cy]);

  const bob = useSharedValue(0);
  const appear = useSharedValue(0);

  useEffect(() => {
    let alive = true;
    if (!cache.has(seg)) load(seg).then((json) => alive && setData(json));
    else setData(cache.get(seg) ?? null);
    return () => {
      alive = false;
    };
  }, [seg]);

  useEffect(() => {
    appear.value = withDelay(p.fadeDelay, withTiming(1, { duration: 420 }));
    bob.value = withDelay(
      p.phase,
      withRepeat(withTiming(1, { duration: p.bobDur, easing: Easing.inOut(Easing.ease) }), -1, true)
    );
  }, [bob, appear, p]);

  const style = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [
      { translateY: (bob.value - 0.5) * 2 * p.amp },
      { scale: 0.7 + appear.value * 0.3 },
    ],
  }));

  if (!data) return null;
  return (
    <Animated.View style={[{ position: 'absolute', left: p.x, top: p.y, width: p.size, height: p.size }, style]}>
      <LottieView source={data as never} autoPlay loop speed={p.speed} style={{ width: p.size, height: p.size }} />
    </Animated.View>
  );
}
