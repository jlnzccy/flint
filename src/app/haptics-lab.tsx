import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircleBtn } from '@/components/chunky';
import { IconChevL } from '@/components/icons';
import { Body, Display, Label } from '@/components/ui';
import { CHUNK, RADIUS_SM } from '@/theme/colors';
import { useTheme } from '@/theme/theme';

/* ──────────────────────────────────────────────────────────────────────────
   Haptics Lab — feel the difference between Android's two haptic paths.

   CRISP  = view.performHapticFeedback(HapticFeedbackConstants.*) routed through
            the device's tuned haptic engine. Single sharp "tap". No VIBRATE perm.
            (expo-haptics: Haptics.performAndroidHapticsAsync)
   BUZZY  = Vibrator.vibrate(VibrationEffect.createWaveform(...)). Motor held on
            for ~50ms = the "zzz" you feel now.
            (expo-haptics: selectionAsync / impactAsync / notificationAsync)

   Tap fires on press-IN so the cue lands the instant your finger touches.
   ────────────────────────────────────────────────────────────────────────── */

const isAndroid = Platform.OS === 'android';

/* Android-native crisp constants, lightest → heaviest. */
const CRISP: { label: string; type: Haptics.AndroidHaptics }[] = [
  { label: 'Segment frequent tick', type: Haptics.AndroidHaptics.Segment_Frequent_Tick },
  { label: 'Segment tick', type: Haptics.AndroidHaptics.Segment_Tick },
  { label: 'Clock tick', type: Haptics.AndroidHaptics.Clock_Tick },
  { label: 'Text handle move', type: Haptics.AndroidHaptics.Text_Handle_Move },
  { label: 'Keyboard tap', type: Haptics.AndroidHaptics.Keyboard_Tap },
  { label: 'Keyboard press', type: Haptics.AndroidHaptics.Keyboard_Press },
  { label: 'Keyboard release', type: Haptics.AndroidHaptics.Keyboard_Release },
  { label: 'Virtual key', type: Haptics.AndroidHaptics.Virtual_Key },
  { label: 'Virtual key release', type: Haptics.AndroidHaptics.Virtual_Key_Release },
  { label: 'Context click', type: Haptics.AndroidHaptics.Context_Click },
  { label: 'Toggle on', type: Haptics.AndroidHaptics.Toggle_On },
  { label: 'Toggle off', type: Haptics.AndroidHaptics.Toggle_Off },
  { label: 'Gesture start', type: Haptics.AndroidHaptics.Gesture_Start },
  { label: 'Gesture end', type: Haptics.AndroidHaptics.Gesture_End },
  { label: 'Drag start', type: Haptics.AndroidHaptics.Drag_Start },
  { label: 'Confirm', type: Haptics.AndroidHaptics.Confirm },
  { label: 'Reject', type: Haptics.AndroidHaptics.Reject },
  { label: 'Long press', type: Haptics.AndroidHaptics.Long_Press },
];

/* The old Vibrator-waveform path — this is what feels buzzy today. */
const BUZZY: { label: string; fire: () => void }[] = [
  { label: 'selection', fire: () => Haptics.selectionAsync() },
  { label: 'impact light', fire: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) },
  { label: 'impact medium', fire: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) },
  { label: 'impact heavy', fire: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy) },
  { label: 'notify success', fire: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) },
  { label: 'notify warning', fire: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning) },
  { label: 'notify error', fire: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) },
];

/* A pressed-edge tile that fires its cue on touch-down (not release). */
function Tile({ label, color, deep, ink, onFire }: { label: string; color: string; deep: string; ink: string; onFire: () => void }) {
  const down = React.useRef(0);
  return (
    <View style={{ width: '48%' }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: CHUNK, bottom: 0, borderRadius: RADIUS_SM, backgroundColor: deep }} />
      <Pressable
        onPressIn={() => {
          down.current = Date.now();
          onFire();
        }}
        style={({ pressed }) => ({
          marginBottom: CHUNK,
          transform: [{ translateY: pressed ? CHUNK : 0 }],
          backgroundColor: color,
          borderRadius: RADIUS_SM,
          paddingVertical: 16,
          paddingHorizontal: 12,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 56,
        })}
      >
        <Body size={13} color={ink} style={{ fontFamily: 'Nunito_800ExtraBold', textAlign: 'center' }}>
          {label}
        </Body>
      </Pressable>
    </View>
  );
}

export default function HapticsLab() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
        <CircleBtn size={44} onPress={() => router.back()} label="Back">
          <IconChevL color={t.text} />
        </CircleBtn>
        <Display size={18} style={{ flex: 1 }}>Haptics Lab</Display>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <Body size={14} color={t.muted}>
          Tap each. Crisp ones are single sharp taps from the device haptic engine. Buzzy ones hold the
          motor on for ~50&nbsp;ms — the &quot;zzz&quot; feel. Result depends on your phone&apos;s actuator.
        </Body>

        {!isAndroid && (
          <View style={{ marginTop: 16, padding: 14, borderRadius: RADIUS_SM, borderWidth: 2, borderColor: t.rose.deep, backgroundColor: t.rose.soft }}>
            <Body size={13} color={t.text}>The crisp section is Android-only. Run this on an Android device or emulator with vibration.</Body>
          </View>
        )}

        <Label style={{ marginTop: 24, marginBottom: 10 }}>Crisp — device haptic engine</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 4 }}>
          {CRISP.map((c) => (
            <Tile
              key={c.label}
              label={c.label}
              color={t.surface}
              deep={t.teal.main}
              ink={t.text}
              onFire={() => {
                if (isAndroid) Haptics.performAndroidHapticsAsync(c.type).catch(() => {});
              }}
            />
          ))}
        </View>

        <Label style={{ marginTop: 28, marginBottom: 10 }}>Buzzy — legacy Vibrator</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 4 }}>
          {BUZZY.map((b) => (
            <Tile
              key={b.label}
              label={b.label}
              color={t.raised}
              deep={t.rose.deep}
              ink={t.muted}
              onFire={() => {
                b.fire();
              }}
            />
          ))}
        </View>

        <Body size={12} color={t.faint} style={{ marginTop: 24 }}>
          Pick the crisp constants you like. Tell me the three and I wire them into tap / done / finish.
        </Body>
      </ScrollView>
    </View>
  );
}
