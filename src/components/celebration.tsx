import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedEmoji } from '@/components/animated-emoji';
import { ChunkyButton } from '@/components/chunky';
import { Body, Display } from '@/components/ui';
import { CELEBRATION_LOTTIE } from '@/data/celebration-emojis';
import { enterFade, popIn, slideUp } from '@/theme/motion';
import { useTheme } from '@/theme/theme';

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

/* Full-screen one-shot celebration: a random hero emoji + a headline.
   Dismissed by the button (no auto-close). Reused for the first-routine moment. */
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
