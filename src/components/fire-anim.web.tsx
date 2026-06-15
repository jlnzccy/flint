import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

/* Web fallback: lottie's web renderer needs a heavy wasm dep, so we hand-animate the
   same fire emoji the 'calm' celebration uses — a gentle flicker (breathe + sway +
   glow) so the celebration still has live motion on web. */
export function FireAnim({ size }: { size: number }) {
  const flick = useSharedValue(0);
  useEffect(() => {
    flick.value = withRepeat(withTiming(1, { duration: 560, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [flick]);

  const flame = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + flick.value * 0.13 },
      { rotate: `${(flick.value - 0.5) * 7}deg` },
      { translateY: -flick.value * 3 },
    ],
    opacity: 0.85 + flick.value * 0.15,
  }));
  const glow = useAnimatedStyle(() => ({
    opacity: 0.25 + flick.value * 0.25,
    transform: [{ scale: 0.8 + flick.value * 0.25 }],
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: size,
            backgroundColor: '#ff8a3d',
          },
          glow,
        ]}
      />
      <Animated.Text style={[{ fontSize: Math.round(size * 0.5), textAlign: 'center' }, flame]}>🔥</Animated.Text>
    </View>
  );
}
