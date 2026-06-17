import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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

import { CannonConfetti } from 'react-native-fast-confetti';

export function Confetti({ color, count = 110 }: { color?: string; count?: number }) {
  const t = useTheme();
  const reduce = useReducedMotion();
  const { width, height } = useWindowDimensions();

  const palette = useMemo(() => {
    return [color, t.accent.main, t.gold.main, t.teal.main, t.purple.main, t.green.main, t.rose.main].filter(
      Boolean
    ) as string[];
  }, [color, t]);

  if (reduce) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <CannonConfetti autoplay gravity={3}>
        <CannonConfetti.Origin
          position={{ x: 0, y: height * 0.45 }}
          count={Math.floor(count / 2)}
          colors={palette}
          initialSpeed={1.5}
        >
          <CannonConfetti.Flake size={12} radius={6} />
        </CannonConfetti.Origin>
        <CannonConfetti.Origin
          position={{ x: width, y: height * 0.45 }}
          count={Math.floor(count / 2)}
          colors={palette}
          initialSpeed={1.5}
        >
          <CannonConfetti.Flake size={12} radius={6} />
        </CannonConfetti.Origin>
      </CannonConfetti>
    </View>
  );
}

/* a Noto-pool seg (codepoints joined by _) back to its emoji glyph, so AnimatedEmoji
   can re-derive the lottie. e.g. '2764_fe0f_200d_1f525' → ❤️‍🔥 */
function segToEmoji(seg: string): string {
  return seg.split('_').map((cp) => String.fromCodePoint(parseInt(cp, 16))).join('');
}

let shuffledPool: string[] = [];

function getNextCelebrationEmoji(): string {
  if (shuffledPool.length === 0) {
    shuffledPool = [...CELEBRATION_LOTTIE];
    for (let i = shuffledPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPool[i], shuffledPool[j]] = [shuffledPool[j], shuffledPool[i]];
    }
  }
  return shuffledPool.pop()!;
}

/* The celebration hero: a random animated emoji from the pool (turtle, stars, fire…),
   picked once per mount using a shuffled cycle to ensure even distribution and prevent repeating. */
export function CelebrationEmoji({ size }: { size: number }) {
  const reduce = useReducedMotion();
  const emoji = useMemo(() => segToEmoji(getNextCelebrationEmoji()), []);
  // reduce-motion stills the hero too — a static glyph, no looping lottie (QoL6)
  if (reduce) return <Text style={{ fontSize: size * 0.86, lineHeight: size, textAlign: 'center' }}>{emoji}</Text>;
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
        <EmojiConfetti />
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
