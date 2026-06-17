import LottieView from 'lottie-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

/* A soft floating field of small animated ✨ sparkle emojis (U2): Noto lottie sparkles
   clustered randomly near the celebration hero — varied size, varied lottie speed, each
   bobbing gently up and down out of phase with the others. Not a pop-outward burst; a calm,
   lively backdrop. Sits alongside the hero (never replaces it). Lottie is native-only;
   web gets the no-op variant. Gated on reduce-motion. */

const CDN = 'https://fonts.gstatic.com/s/e/notoemoji/latest';
const cache = new Map<string, object | null>();
const SPARKLE = '2728'; // ✨ sparkles only

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

/* Prefetch the sparkle asset into the cache once, so the first celebration isn't sparse
   while the lottie JSON loads (QoL3). Fire-and-forget. */
let warmed = false;
export function warmCelebrationAssets() {
  if (warmed) return;
  warmed = true;
  if (!cache.has(SPARKLE)) load(SPARKLE);
}

export function EmojiConfetti({ count = 3 }: { count?: number }) {
  const reduce = useReducedMotion();
  // only use the ✨ animated emoji (SPARKLE) with varying sizes and speeds
  const picks = useMemo(() => Array(count).fill(SPARKLE), [count]);
  const cx = 105;
  const cy = 105; // center of the 210x210 hero container
  if (reduce) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: 210, height: 210 }}>
      {picks.map((seg, i) => (
        <Float key={`${seg}-${i}`} seg={seg} index={i} total={picks.length} cx={cx} cy={cy} />
      ))}
    </View>
  );
}

function Float({ seg, index, total, cx, cy }: { seg: string; index: number; total: number; cx: number; cy: number }) {
  const [data, setData] = useState<object | null>(() => cache.get(seg) ?? null);
  const [shouldPlay, setShouldPlay] = useState(false);

  // randoms fixed once per particle (never inside the worklet, which re-runs each frame).
  // cluster randomly near the hero so nothing stacks on the centre glyph; each gets
  // its own size, lottie speed, bob amplitude/period, phase and rotation.
  const p = useMemo(() => {
    const size = 28 + Math.random() * 24; // 28–52px

    // distribute 3 sparkles to the left side, top, and right side (never under the emoji)
    let angle = -Math.PI * 0.5; // fallback top
    let radius = 100;
    if (index === 0) {
      // Left side: centered at 9 o'clock (-PI), spanning from 7:30 to 10:30
      angle = -Math.PI + (Math.random() - 0.5) * Math.PI * 0.40;
      radius = 110 + Math.random() * 20; // 110-130px (well clear of the emoji)
    } else if (index === 1) {
      // Top: centered around 12 o'clock (-0.5 * PI)
      angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.15;
      radius = 100 + Math.random() * 15; // 100-115px (above the emoji, safe from screen top)
    } else if (index === 2) {
      // Right side: centered at 3 o'clock (0), spanning from 1:30 to 4:30
      angle = (Math.random() - 0.5) * Math.PI * 0.40;
      radius = 110 + Math.random() * 20; // 110-130px (well clear of the emoji)
    }

    return {
      size,
      x: cx + Math.cos(angle) * radius - size / 2,
      y: cy + Math.sin(angle) * radius - size / 2,
      amp: 6 + Math.random() * 6, // bob ±6–12px
      bobDur: 1600 + Math.random() * 1000,
      phase: Math.random() * 1200, // out of phase with its neighbours
      speed: 0.2 + Math.random() * 0.8, // slower lottie playback 0.2–1.0
      fadeDelay: Math.random() * 1200, // staggered start delay
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
    let alive = true;
    appear.value = withDelay(p.fadeDelay, withTiming(1, { duration: 420 }));
    bob.value = withDelay(
      p.phase,
      withRepeat(withTiming(1, { duration: p.bobDur, easing: Easing.inOut(Easing.ease) }), -1, true)
    );

    const timer = setTimeout(() => {
      if (alive) setShouldPlay(true);
    }, p.fadeDelay);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
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
      {shouldPlay && (
        <LottieView source={data as never} autoPlay loop speed={p.speed} style={{ width: p.size, height: p.size }} />
      )}
    </Animated.View>
  );
}
