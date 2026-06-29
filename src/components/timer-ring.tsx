import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
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

  const prevProgress = useRef(progress);

  useEffect(() => {
    const diff = Math.abs(progress - prevProgress.current);
    prevProgress.current = progress;

    const isJump = diff > 0.15;
    const isPaused = !pulsing;
    const duration = (isJump || isPaused) ? 250 : 1000;

    p.value = withTiming(Math.max(0, Math.min(1, progress)), {
      duration,
      easing: isJump ? Easing.out(Easing.ease) : Easing.linear,
    });
  }, [progress, pulsing, p]);

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.value) }));

  return (
    <View style={{ width: size, height: size }}>
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
    </View>
  );
}
