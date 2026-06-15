import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface TimerRingProps {
  progress: number; // 0..1
  color: string;
  size?: number;
  pulsing?: boolean;
  children?: React.ReactNode;
}

export function TimerRing({ progress, color, size = 250, pulsing, children }: TimerRingProps) {
  const t = useTheme();
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = useSharedValue(Math.max(0, Math.min(1, progress)));
  const scale = useSharedValue(1);

  useEffect(() => {
    p.value = withTiming(Math.max(0, Math.min(1, progress)), { duration: 500, easing: Easing.linear });
  }, [progress, p]);

  useEffect(() => {
    if (pulsing) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.035, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [pulsing, scale]);

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.value) }));
  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[{ width: size, height: size }, pulse]}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill={t.surface} stroke={t.lineSoft} strokeWidth={stroke} />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          animatedProps={ringProps}
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {children}
      </View>
    </Animated.View>
  );
}
