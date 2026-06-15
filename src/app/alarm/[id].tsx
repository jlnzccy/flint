import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, Vibration, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { tapHaptic } from '@/lib/haptics';
import { playAlarm, stopAlarm } from '@/lib/sfx';
import { AnimatedEmoji } from '@/components/animated-emoji';
import { ChunkyButton } from '@/components/chunky';
import { useToast } from '@/components/toast';
import { Body, Display, Label } from '@/components/ui';
import { resolveClock24 } from '@/lib/dates';
import { routineMin } from '@/data/defaults';
import { hexDarken } from '@/theme/colors';
import { resolveRoutines, useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';

/* Concentric pulse behind the emoji — a radial gradient of the routine's own color
   that breathes (scale + opacity) like the rings in the reference. Gradient, not
   flat bands, so the edges stay soft. */
function PulseGlow({ color }: { color: string }) {
  const { width, height } = useWindowDimensions();
  const size = Math.max(width, height) * 1.5;
  const scale = useSharedValue(0.82);
  const o = useSharedValue(0.45);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 2100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.82, { duration: 2100, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    o.value = withRepeat(
      withSequence(
        withTiming(0.92, { duration: 2100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.45, { duration: 2100, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, [scale, o]);
  const st = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: scale.value }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, st]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.9} />
            <Stop offset="18%" stopColor={color} stopOpacity={0.6} />
            <Stop offset="38%" stopColor={color} stopOpacity={0.34} />
            <Stop offset="62%" stopColor={color} stopOpacity={0.16} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill="url(#glow)" />
      </Svg>
    </Animated.View>
  );
}

export default function AlarmScreen() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const routine = useMemo(() => {
    const s = useStore.getState();
    return resolveRoutines({ custom: s.custom, overrides: s.overrides, order: s.order, archived: [], deleted: s.deleted }).find((r) => r.id === id);
  }, [id]);

  const haptics = useStore((s) => s.settings.haptics);
  const ringtoneUri = useStore((s) => s.settings.alarmRingtoneUri);
  const clock24 = resolveClock24(useStore((s) => s.settings.clock));
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!haptics) return;
    Vibration.vibrate([0, 220, 120, 220], true);
    return () => Vibration.cancel();
  }, [haptics]);

  // alarm sound — loop the chosen ringtone (or bundled marimba) until the screen
  // closes (Start / Snooze / Not today all unmount it). Reminders stay sound-free.
  useEffect(() => {
    if (!routine || !routine.alarm) return;
    playAlarm(ringtoneUri);
    return () => stopAlarm();
  }, [routine, ringtoneUri]);

  if (!routine) {
    router.back();
    return null;
  }
  // stop sound + vibration up front on every exit — don't wait for the screen to
  // unmount (native screen freezing can delay/skip the effect cleanups).
  const silence = () => {
    stopAlarm();
    Vibration.cancel();
  };
  const c = t.col(routine.color);
  const hh = now.getHours();
  const mm = now.getMinutes();
  const clockText = clock24
    ? `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
    : `${hh % 12 === 0 ? 12 : hh % 12}:${String(mm).padStart(2, '0')}`;
  const ampm = clock24 ? null : hh < 12 ? 'AM' : 'PM';

  return (
    <View style={{ flex: 1, backgroundColor: hexDarken(c.deep, 0.5) }}>
      <PulseGlow color={c.main} />

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 44,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 28,
        }}
      >
        {/* header — label + clock */}
        <Animated.View entering={FadeIn.duration(350)} style={{ alignItems: 'center' }}>
          <Label color="rgba(255,255,255,0.7)">{routine.alarm ? 'Alarm' : 'Reminder'}</Label>
          <Text style={{ fontFamily: 'Nunito_900Black', fontSize: 64, color: '#fff', marginTop: 6 }}>
            {clockText}{ampm ? <Text style={{ fontSize: 24 }}> {ampm}</Text> : null}
          </Text>
        </Animated.View>

        {/* center — emoji + name */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 30 }}>
          <View style={{ width: 132, height: 132, alignItems: 'center', justifyContent: 'center' }}>
            <AnimatedEmoji emoji={routine.emoji} size={132} />
          </View>
          <Animated.View entering={FadeIn.duration(350).delay(120)} style={{ alignItems: 'center' }}>
            <Display size={27} style={{ color: '#fff', textAlign: 'center' }}>Time for {routine.name}</Display>
            <Body size={15} color="rgba(255,255,255,0.78)" style={{ marginTop: 8, textAlign: 'center' }}>
              {routine.steps.length} {routine.steps.length === 1 ? 'step' : 'steps'} · {routineMin(routine)} min · starts with step one
            </Body>
          </Animated.View>
        </View>

        {/* footer — start + secondary actions */}
        <View style={{ gap: 12 }}>
          <ChunkyButton
            color={c.main}
            deep={c.deep}
            ink={c.ink}
            fontSize={19}
            pad={[19, 24]}
            onPress={() => {
              silence();
              router.replace(`/player/${routine.id}`);
            }}
          >
            Start
          </ChunkyButton>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPressIn={() => tapHaptic()}
              onPress={() => {
                silence();
                router.back();
                toast('Snoozed 5 min');
              }}
              style={{
                flex: 1, paddingVertical: 14, borderRadius: 18, alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
              }}
            >
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.7 }}>
                Snooze 5 min
              </Text>
            </Pressable>
            <Pressable
              onPressIn={() => tapHaptic()}
              onPress={() => {
                silence();
                useStore.getState().bump(routine.id);
                router.back();
                toast('See you tomorrow');
              }}
              style={{
                flex: 1, paddingVertical: 14, borderRadius: 18, alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
              }}
            >
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.7 }}>
                Not today
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
