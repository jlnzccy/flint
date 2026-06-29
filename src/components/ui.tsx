import React from 'react';
import { Pressable, StyleProp, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { IconCheck } from '@/components/icons';
import { fmtTime, resolveClock24 } from '@/lib/dates';
import { tapHaptic } from '@/lib/haptics';
import { SPRING } from '@/theme/motion';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';

/* clock-aware time formatter bound to the user's 12/24h setting */
export function useTimeFmt() {
  const clock = useStore((s) => s.settings.clock);
  return React.useCallback((hhmm?: string | null) => fmtTime(hhmm, resolveClock24(clock)), [clock]);
}

/* ── type helpers ── */
export function Display({ children, style, size = 16, numberOfLines }: { children: React.ReactNode; style?: StyleProp<TextStyle>; size?: number; numberOfLines?: number }) {
  const t = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={[{ fontFamily: 'Nunito_900Black', fontSize: size, color: t.text, letterSpacing: -size * 0.01 }, style]}>
      {children}
    </Text>
  );
}

export function Label({ children, style, color }: { children: React.ReactNode; style?: StyleProp<TextStyle>; color?: string }) {
  const t = useTheme();
  return (
    <Text
      style={[
        { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.85, color: color ?? t.faint },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Body({ children, style, size = 14, color, numberOfLines }: { children: React.ReactNode; style?: StyleProp<TextStyle>; size?: number; color?: string; numberOfLines?: number }) {
  const t = useTheme();
  return <Text numberOfLines={numberOfLines} style={[{ fontFamily: 'BeVietnamPro_400Regular', fontSize: size, color: color ?? t.text }, style]}>{children}</Text>;
}

/* ── Chip ── */
export function Chip({
  children, active, onPress, style, color,
}: { children: React.ReactNode; active?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle>; color?: string }) {
  const t = useTheme();
  const main = color ?? t.accent.main;
  const deep = color ? undefined : t.accent.deep;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => onPress && tapHaptic()}
      disabled={!onPress}
      style={[
        {
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: active ? main : t.raised,
          borderWidth: 2, borderColor: active ? deep ?? main : t.lineSoft,
          borderRadius: 99, paddingVertical: 8, paddingHorizontal: 14,
        },
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: active ? t.accent.ink : t.text }}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

/* ── Toggle ── */
export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(on ? 22 : 0, SPRING.gentle) }],
  }));
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      onPress={() => {
        tapHaptic();
        onChange(!on);
      }}
      style={{
        width: 54, height: 32, borderRadius: 99,
        backgroundColor: on ? t.accent.main : t.raised,
        borderWidth: 2, borderColor: on ? t.accent.deep : t.line,
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={[
          { width: 22, height: 22, borderRadius: 11, marginLeft: 3, backgroundColor: on ? '#fff' : t.muted },
          knob,
        ]}
      />
    </Pressable>
  );
}

/* ── Segmented ── */
export function Segmented<T extends string>({
  options, value, onChange, small,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; small?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4, padding: small ? 3 : 4, backgroundColor: t.raised, borderWidth: 2, borderColor: t.lineSoft, borderRadius: small ? 12 : 14 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPressIn={() => tapHaptic()}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1, borderRadius: small ? 9 : 10, paddingVertical: small ? 5 : 8, paddingHorizontal: 4,
              backgroundColor: active ? t.accent.main : 'transparent', alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: small ? 12 : 13, color: active ? t.accent.ink : t.muted }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ── Checkbox ── */
export function Checkbox({ on, onPress }: { on: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      hitSlop={8}
      style={{
        width: 26, height: 26, borderRadius: 9,
        borderWidth: 2, borderColor: on ? t.green.deep : t.line,
        backgroundColor: on ? t.green.main : t.raised,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {on && <IconCheck size={16} color={t.green.ink} />}
    </Pressable>
  );
}

/* ── text input ── */
export function FlintInput({ style, ...props }: TextInputProps & { ref?: React.Ref<TextInput> }) {
  const t = useTheme();
  const [focus, setFocus] = React.useState(false);
  return (
    <TextInput
      placeholderTextColor={t.faint}
      cursorColor={t.accent.main}
      selectionColor={t.accent.soft}
      {...props}
      onFocus={(e) => {
        setFocus(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        props.onBlur?.(e);
      }}
      style={[
        {
          backgroundColor: t.raised,
          borderWidth: 2,
          borderColor: focus ? t.accent.main : t.line,
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 16,
          color: t.text,
          fontFamily: 'BeVietnamPro_400Regular',
          fontSize: 16,
        },
        style,
      ]}
    />
  );
}

/* ── stepper button (small square) ── */
export function StepperBtn({
  children, onPress, label, style,
}: { children: React.ReactNode; onPress?: () => void; label?: string; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      onPressIn={() => onPress && tapHaptic()}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 34, height: 34, borderRadius: 10,
          backgroundColor: pressed ? t.line : t.raised,
          borderWidth: 2, borderColor: t.line,
          alignItems: 'center', justifyContent: 'center',
        },
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text style={{ color: t.text, fontSize: 16, fontFamily: 'Nunito_800ExtraBold' }}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

/* ── emoji tile (routine avatar) ── */
export function EmojiTile({
  emoji, size = 52, radius = 16, soft, border, dim,
}: { emoji: string; size?: number; radius?: number; soft: string; border: string; dim?: boolean }) {
  return (
    <View
      style={{
        width: size, height: size, borderRadius: radius, backgroundColor: soft,
        borderWidth: 2, borderColor: border,
        alignItems: 'center', justifyContent: 'center',
        opacity: dim ? 0.6 : 1,
      }}
    >
      <Text style={{ fontSize: size * 0.46, fontFamily: 'NotoColorEmoji' }}>{emoji}</Text>
    </View>
  );
}

/* ── mini progress bar ── */
export function MiniBar({ pct, color, style }: { pct: number; color: string; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View style={[{ height: 9, borderRadius: 99, backgroundColor: t.raised, borderWidth: 2, borderColor: t.lineSoft, overflow: 'hidden' }, style]}>
      <View style={{ height: '100%', width: `${Math.min(100, Math.max(0, pct))}%`, borderRadius: 99, backgroundColor: color }} />
    </View>
  );
}
