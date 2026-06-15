import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

/* Noto animated emoji — fetched on demand from Google's CDN, one tiny lottie JSON
   for the single emoji actually on screen. No bundled emoji library; nothing ships
   in the app but this fetch. Falls back to the system glyph while loading or when
   that emoji has no animation. Used only on the alarm screen. */

const CDN = 'https://fonts.gstatic.com/s/e/notoemoji/latest';
const cache = new Map<string, object | null>(); // emoji → lottie json, or null = no anim

function codepoints(emoji: string, keepFe0f: boolean): string {
  return Array.from(emoji)
    .map((ch) => ch.codePointAt(0)!.toString(16))
    .filter((cp) => keepFe0f || cp !== 'fe0f')
    .join('_');
}

async function load(emoji: string): Promise<object | null> {
  if (cache.has(emoji)) return cache.get(emoji)!;
  // Noto dirs sometimes keep the FE0F variation selector, sometimes drop it — try both.
  for (const keep of [true, false]) {
    const cp = codepoints(emoji, keep);
    if (!cp) continue;
    try {
      const res = await fetch(`${CDN}/${cp}/lottie.json`);
      if (res.ok) {
        const json = (await res.json()) as object;
        cache.set(emoji, json);
        return json;
      }
    } catch {
      // network hiccup — fall through to glyph
    }
  }
  cache.set(emoji, null);
  return null;
}

export function AnimatedEmoji({ emoji, size }: { emoji: string; size: number }) {
  const [data, setData] = useState<object | null>(() => cache.get(emoji) ?? null);

  useEffect(() => {
    let alive = true;
    setData(cache.get(emoji) ?? null);
    if (!cache.has(emoji)) load(emoji).then((json) => alive && setData(json));
    return () => {
      alive = false;
    };
  }, [emoji]);

  if (data) {
    // lottie JSON fetched at runtime — shape matches AnimationObject
    return <LottieView source={data as never} autoPlay loop style={{ width: size, height: size }} />;
  }
  // many emojis (objects like 🧺, 🌙) have no Noto animation — keep them alive with a
  // gentle breathe so the "animated" icon never reads as a dead glyph.
  return <GlyphBob emoji={emoji} size={size} />;
}

function GlyphBob({ emoji, size }: { emoji: string; size: number }) {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withRepeat(
      withSequence(
        withTiming(1.09, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, [s]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.Text style={[{ fontSize: size * 0.86, lineHeight: size, textAlign: 'center' }, st]}>
      {emoji}
    </Animated.Text>
  );
}
