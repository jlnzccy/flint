import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedEmoji } from '@/components/animated-emoji';
import { ChunkyButton } from '@/components/chunky';
import { Body, Display } from '@/components/ui';
import { CELEBRATION_LOTTIE } from '@/data/celebration-emojis';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { enterFade, popIn, slideUp } from '@/theme/motion';
import { useTheme } from '@/theme/theme';

type Piece = {
  x: number; // start column (px from left)
  w: number;
  h: number;
  color: string;
  delay: number;
  dur: number;
  drift: number; // horizontal sway amplitude
  sway: number; // number of sway half-cycles over the fall
  spin: number; // total rotation in degrees
};

function ConfettiPiece({ piece, fallH }: { piece: Piece; fallH: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(piece.delay, withTiming(1, { duration: piece.dur, easing: Easing.linear }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const st = useAnimatedStyle(() => {
    const ty = -30 + p.value * fallH;
    const tx = Math.sin(p.value * Math.PI * piece.sway) * piece.drift;
    const opacity = p.value < 0.82 ? 1 : Math.max(0, 1 - (p.value - 0.82) / 0.18);
    return {
      opacity,
      transform: [
        { translateX: piece.x + tx },
        { translateY: ty },
        { rotate: `${p.value * piece.spin}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        { position: 'absolute', top: 0, left: 0, width: piece.w, height: piece.h, borderRadius: 2, backgroundColor: piece.color },
        st,
      ]}
    />
  );
}

/* One-shot confetti burst that fills its parent and rains colored chips down past
   the bottom edge, then releases (no loop). Tinted from the palette plus the passed
   routine color. Honors reduce-motion — renders nothing when calmed. */
export function Confetti({ color, count = 32 }: { color?: string; count?: number }) {
  const t = useTheme();
  const reduce = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const fallH = height + 80;

  const pieces = useMemo<Piece[]>(() => {
    const palette = [color, t.accent.main, t.gold.main, t.teal.main, t.purple.main, t.green.main, t.rose.main].filter(
      Boolean
    ) as string[];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    return Array.from({ length: count }, () => ({
      x: rand(0, width),
      w: rand(6, 11),
      h: rand(9, 16),
      color: palette[Math.floor(Math.random() * palette.length)],
      delay: rand(0, 450),
      dur: rand(1500, 2300),
      drift: rand(18, 60),
      sway: rand(2, 4),
      spin: rand(180, 720) * (Math.random() < 0.5 ? -1 : 1),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, count, color]);

  if (reduce) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} fallH={fallH} />
      ))}
    </View>
  );
}

/* a Noto-pool seg (codepoints joined by _) back to its emoji glyph, so AnimatedEmoji
   can re-derive the lottie. e.g. '2764_fe0f_200d_1f525' → ❤️‍🔥 */
function segToEmoji(seg: string): string {
  return seg.split('_').map((cp) => String.fromCodePoint(parseInt(cp, 16))).join('');
}

/* The celebration hero: a random animated emoji from the pool (turtle, stars, fire…),
   picked once per mount — never always the fire. */
export function CelebrationEmoji({ size }: { size: number }) {
  const emoji = useMemo(
    () => segToEmoji(CELEBRATION_LOTTIE[Math.floor(Math.random() * CELEBRATION_LOTTIE.length)]),
    []
  );
  return <AnimatedEmoji emoji={emoji} size={size} />;
}

/* Full-screen one-shot celebration: a confetti burst + a random hero emoji + a
   headline. Dismissed by the button (no auto-close). Reused for the first-routine moment. */
export function CelebrationOverlay({
  title, sub, onDone,
}: { title: string; sub?: string; onDone: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={enterFade()}
      style={[StyleSheet.absoluteFill, { backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, zIndex: 50 }]}
    >
      <Confetti color={t.accent.main} />
      <View style={{ width: 210, height: 210, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View entering={popIn()}>
          <CelebrationEmoji size={150} />
        </Animated.View>
      </View>
      <Animated.View entering={slideUp(90)}>
        <Display size={30} style={{ textAlign: 'center', marginTop: 8 }}>{title}</Display>
      </Animated.View>
      {sub ? (
        <Animated.View entering={slideUp(160)}>
          <Body size={15} color={t.muted} style={{ textAlign: 'center', marginTop: 10 }}>{sub}</Body>
        </Animated.View>
      ) : null}

      <View style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 28 }}>
        <ChunkyButton fontSize={17} pad={[17, 24]} onPress={onDone}>
          Let’s go
        </ChunkyButton>
      </View>
    </Animated.View>
  );
}
