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
import { EmojiConfetti } from '@/components/emoji-confetti';
import { Body, Display } from '@/components/ui';
import { CELEBRATION_LOTTIE } from '@/data/celebration-emojis';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { enterFade, popIn, slideUp } from '@/theme/motion';
import { useTheme } from '@/theme/theme';

type Piece = {
  ox: number; // launch origin x (px from left)
  oy: number; // launch origin y (px from top — near the top edge)
  vx: number; // total horizontal travel over the shot (signed; outward from the corner)
  vy: number; // initial downward impulse (px)
  g: number; // gravity pull (px) — accelerates the piece down past the bottom edge
  w: number;
  h: number;
  color: string;
  delay: number;
  dur: number;
  spin: number; // total rotation in degrees
};

function ConfettiPiece({ piece }: { piece: Piece }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(piece.delay, withTiming(1, { duration: piece.dur, easing: Easing.out(Easing.quad) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const st = useAnimatedStyle(() => {
    // rains down from the top: horizontal spread outward, vertical = down impulse + gravity
    const tx = piece.ox + piece.vx * p.value;
    const ty = piece.oy + piece.vy * p.value + piece.g * p.value * p.value;
    const opacity = p.value < 0.82 ? 1 : Math.max(0, 1 - (p.value - 0.82) / 0.18);
    return {
      opacity,
      transform: [
        { translateX: tx },
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

/* One-shot confetti *rain* (U1): pieces launch from the two upper corners, spray down
   + outward, then accelerate down under gravity past the bottom edge, then release (no
   loop). Denser than the old cannon. Tinted from the palette plus the passed routine
   color. Honors reduce-motion — renders nothing when calmed. */
export function Confetti({ color, count = 110 }: { color?: string; count?: number }) {
  const t = useTheme();
  const reduce = useReducedMotion();
  const { width, height } = useWindowDimensions();

  const pieces = useMemo<Piece[]>(() => {
    const palette = [color, t.accent.main, t.gold.main, t.teal.main, t.purple.main, t.green.main, t.rose.main].filter(
      Boolean
    ) as string[];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    return Array.from({ length: count }, (_, i) => {
      const left = i % 2 === 0; // alternate corners → balanced left/right spray
      const dir = left ? 1 : -1; // left corner sprays right, right corner sprays left
      const ox = left ? rand(0, width * 0.12) : width - rand(0, width * 0.12);
      const oy = rand(8, 70); // just below the top edge
      const speed = rand(0.28, 0.8) * width; // horizontal reach outward across the screen
      return {
        ox,
        oy,
        vx: dir * speed,
        vy: rand(0.2, 0.5) * height, // initial downward kick
        g: rand(1.2, 1.7) * height, // gravity carries it down past the bottom by p=1
        w: rand(6, 11),
        h: rand(9, 16),
        color: palette[Math.floor(Math.random() * palette.length)],
        delay: rand(0, 260), // tight burst, not a drawn-out drip
        dur: rand(1300, 2000),
        spin: rand(180, 720) * (Math.random() < 0.5 ? -1 : 1),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, count, color]);

  if (reduce) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} />
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
      <EmojiConfetti />
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
