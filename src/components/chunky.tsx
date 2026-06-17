import React from 'react';
import { Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { tapHaptic } from '@/lib/haptics';
import { CHUNK, RADIUS } from '@/theme/colors';
import { SPRING } from '@/theme/motion';
import { useTheme } from '@/theme/theme';

/* ── Chunky: the pressed-edge press surface every button/card shares ──
   A backing layer sits CHUNK px lower; the face sinks onto it when pressed. */
interface ChunkyProps {
  children: React.ReactNode;
  faceStyle?: StyleProp<ViewStyle>;
  backColor: string;
  radius?: number;
  borderTopLeftRadius?: number;
  borderBottomLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomRightRadius?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  pressable?: boolean;
  /* fire a light tap on press-IN, so the cue lands with the sink, not on release */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>; // outer
  accessibilityLabel?: string;
}

export function Chunky({
  children, faceStyle, backColor, radius = RADIUS, onPress, onLongPress,
  disabled, pressable = true, haptic = true, style, accessibilityLabel,
  borderTopLeftRadius, borderBottomLeftRadius, borderTopRightRadius, borderBottomRightRadius,
}: ChunkyProps) {
  const down = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: down.value }] }));

  const rStyle = {
    borderRadius: radius,
    ...(borderTopLeftRadius !== undefined && { borderTopLeftRadius }),
    ...(borderBottomLeftRadius !== undefined && { borderBottomLeftRadius }),
    ...(borderTopRightRadius !== undefined && { borderTopRightRadius }),
    ...(borderBottomRightRadius !== undefined && { borderBottomRightRadius }),
  };

  const face = (
    <Animated.View style={[rStyle, faceStyle, anim]}>{children}</Animated.View>
  );

  return (
    <View style={style}>
      <View
        pointerEvents="none"
        style={[
          {
            position: 'absolute', left: 0, right: 0, top: CHUNK, bottom: 0,
            backgroundColor: backColor,
          },
          rStyle
        ]}
      />
      {pressable ? (
        <Pressable
          accessibilityLabel={accessibilityLabel}
          disabled={disabled}
          onPress={onPress}
          onLongPress={onLongPress}
          delayLongPress={420}
          onPressIn={() => {
            if (haptic) tapHaptic();
            down.value = withSpring(CHUNK, SPRING.press);
          }}
          onPressOut={() => (down.value = withSpring(0, SPRING.press))}
          style={{ marginBottom: CHUNK }}
        >
          {face}
        </Pressable>
      ) : (
        <View style={{ marginBottom: CHUNK }}>{face}</View>
      )}
    </View>
  );
}

/* ── ChunkyButton ── */
interface ChunkyButtonProps {
  children: React.ReactNode;
  color?: string; // main color; defaults to accent
  deep?: string;
  ink?: string;
  ghost?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  faceStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fontSize?: number;
  pad?: [number, number]; // [vertical, horizontal]
  radius?: number;
  borderTopLeftRadius?: number;
  borderBottomLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomRightRadius?: number;
  accessibilityLabel?: string;
}

export function ChunkyButton({
  children, color, deep, ink, ghost, onPress, onLongPress, disabled, haptic,
  style, faceStyle, textStyle, fontSize = 17, pad = [16, 24], radius, accessibilityLabel,
  borderTopLeftRadius, borderBottomLeftRadius, borderTopRightRadius, borderBottomRightRadius,
}: ChunkyButtonProps) {
  const t = useTheme();
  const main = color ?? t.accent.main;
  const deepC = ghost ? t.line : deep ?? t.accent.deep;
  const inkC = ghost ? t.text : ink ?? t.accent.ink;

  // disabled reads as flat + greyed, not a dimmed live button
  const backColor = disabled ? t.lineSoft : deepC;
  const faceBg = disabled || ghost ? t.raised : main;
  const labelColor = disabled ? t.faint : inkC;

  return (
    <Chunky
      backColor={backColor}
      radius={radius}
      borderTopLeftRadius={borderTopLeftRadius}
      borderBottomLeftRadius={borderBottomLeftRadius}
      borderTopRightRadius={borderTopRightRadius}
      borderBottomRightRadius={borderBottomRightRadius}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      haptic={haptic}
      style={style}
      accessibilityLabel={accessibilityLabel}
      faceStyle={[
        {
          backgroundColor: faceBg,
          borderWidth: disabled || ghost ? 2 : 0,
          borderColor: disabled ? t.lineSoft : ghost ? t.line : undefined,
          paddingVertical: pad[0],
          paddingHorizontal: pad[1],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.9 : 1,
        },
        faceStyle,
      ]}
    >
      {typeof children === 'string' ? (
        <Text
          style={[
            {
              fontFamily: 'Nunito_800ExtraBold',
              fontSize,
              color: labelColor,
              textTransform: 'uppercase',
              letterSpacing: fontSize * 0.05,
            },
            textStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Chunky>
  );
}

/* ── ChunkyCard ── */
interface ChunkyCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  faceStyle?: StyleProp<ViewStyle>;
  borderColor?: string;
  backColor?: string;
}

export function ChunkyCard({ children, onPress, onLongPress, style, faceStyle, borderColor, backColor }: ChunkyCardProps) {
  const t = useTheme();
  return (
    <Chunky
      backColor={backColor ?? t.lineSoft}
      onPress={onPress}
      onLongPress={onLongPress}
      pressable={!!(onPress || onLongPress)}
      style={style}
      faceStyle={[
        { backgroundColor: t.surface, borderWidth: 2, borderColor: borderColor ?? t.lineSoft },
        faceStyle,
      ]}
    >
      {children}
    </Chunky>
  );
}

/* ── CircleBtn — round ghost icon button ── */
export function CircleBtn({
  children, onPress, size = 56, label, style,
}: { children: React.ReactNode; onPress?: () => void; size?: number; label?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <ChunkyButton
      ghost
      onPress={onPress}
      accessibilityLabel={label}
      pad={[0, 0]}
      radius={size / 2}
      style={[{ width: size }, style]}
      faceStyle={{ width: size, height: size, borderRadius: size / 2 }}
    >
      {children}
    </ChunkyButton>
  );
}
