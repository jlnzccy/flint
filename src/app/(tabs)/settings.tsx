import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconChevR, IconTrash } from '@/components/icons';
import { finishHaptic, tapHaptic, warnHaptic } from '@/lib/haptics';
import { useToast } from '@/components/toast';
import { Body, Display, Label, Segmented, Toggle } from '@/components/ui';
import { ACCENT_CHOICES } from '@/theme/colors';
import { ensurePermission } from '@/lib/notifications';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';

function Row({ title, sub, children, top }: { title: string; sub?: string; children?: React.ReactNode; top?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderTopWidth: top ? 0 : 2, borderColor: t.lineSoft }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Display size={16}>{title}</Display>
        {sub ? <Body size={13} color={t.faint} style={{ marginTop: 3 }}>{sub}</Body> : null}
      </View>
      {children}
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <View style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18 }}>{children}</View>;
}

// Delete-all (H4): hold to confirm. A tap fires onPressIn→onPressOut almost
// instantly, cancels before HOLD_MS, and does nothing — only a sustained hold
// fills the bar and wipes. resetAll() flips onboarded → the navigator guard
// swaps back to onboarding on its own (no manual nav).
const HOLD_MS = 1500;

function HoldDelete() {
  const t = useTheme();
  const toast = useToast();
  const fill = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);

  const cancel = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setHolding(false);
    fill.value = withTiming(0, { duration: 160 });
  };
  const start = () => {
    setHolding(true);
    warnHaptic();
    fill.value = withTiming(1, { duration: HOLD_MS });
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      fill.value = 0;
      finishHaptic();
      useStore.getState().resetAll();
      toast('Erased');
    }, HOLD_MS);
  };
  // never leave a timer running if the screen unmounts mid-hold
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <>
      <Pressable
        onPressIn={start}
        onPressOut={cancel}
        accessibilityLabel="Hold to delete all data"
        style={{
          marginTop: 26, height: 56, borderRadius: 18, overflow: 'hidden',
          borderWidth: 2, borderColor: t.accent.main, backgroundColor: t.surface,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: t.accent.main, opacity: 0.22 }, fillStyle]}
        />
        <IconTrash size={16} color={t.accent.main} />
        <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: t.accent.main, textTransform: 'uppercase', letterSpacing: 0.7 }}>
          {holding ? 'Keep holding…' : 'Hold to delete all data'}
        </Text>
      </Pressable>
      <Body size={12} color={t.faint} style={{ textAlign: 'center', marginTop: 8 }}>
        Erases everything and starts over. Can't be undone.
      </Body>
    </>
  );
}

export default function Settings() {
  const t = useTheme();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const settings = useStore((s) => s.settings);
  const accent = useStore((s) => s.accent);
  const { setSettings, setAccent } = useStore.getState();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
        <Display size={30}>Settings</Display>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 0, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <Label style={{ marginTop: 20, marginBottom: 8 }}>Reminders</Label>
        <Card>
          <Row title="Reminders" top>
            <Toggle
              on={settings.remindersOn}
              onChange={async (v) => {
                if (v) {
                  const ok = await ensurePermission();
                  if (!ok) {
                    toast('Allow notifications in system settings');
                    return;
                  }
                }
                setSettings({ remindersOn: v });
              }}
            />
          </Row>
        </Card>

        <Label style={{ marginTop: 22, marginBottom: 8 }}>Feedback</Label>
        <Card>
          <Row title="Haptics" top>
            <Toggle on={settings.haptics} onChange={(v) => setSettings({ haptics: v })} />
          </Row>
          <Row title="Voice guide" sub="Reads each step aloud">
            <Toggle on={settings.voice} onChange={(v) => setSettings({ voice: v })} />
          </Row>
        </Card>

        <Label style={{ marginTop: 22, marginBottom: 8 }}>Display</Label>
        <Card>
          <View style={{ padding: 16, gap: 12 }}>
            <Display size={16}>Theme</Display>
            <Segmented
              value={settings.theme}
              onChange={(v) => setSettings({ theme: v })}
              options={[
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
                { value: 'system', label: 'Auto' },
              ]}
            />
          </View>
          <Row title="Keep screen on" sub="During a routine">
            <Toggle on={settings.keepOn} onChange={(v) => setSettings({ keepOn: v })} />
          </Row>
          <Row title="Count-up timer" sub="Ring fills instead of drains">
            <Toggle on={settings.countUp} onChange={(v) => setSettings({ countUp: v })} />
          </Row>
          <Row title="Reduce motion" sub="Calm the pulsing and animations">
            <Toggle on={settings.reduceMotion} onChange={(v) => setSettings({ reduceMotion: v })} />
          </Row>
          <View style={{ padding: 16, borderTopWidth: 2, borderColor: t.lineSoft, gap: 12 }}>
            <Display size={16}>Clock</Display>
            <Segmented
              value={settings.clock}
              onChange={(v) => setSettings({ clock: v })}
              options={[
                { value: 'system', label: 'Auto' },
                { value: '12', label: '12h' },
                { value: '24', label: '24h' },
              ]}
            />
          </View>
          <View style={{ padding: 16, borderTopWidth: 2, borderColor: t.lineSoft, gap: 12 }}>
            <Display size={16}>Accent</Display>
            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              {ACCENT_CHOICES.map((a) => (
                <Pressable
                  key={a}
                  accessibilityLabel={a}
                  onPressIn={() => tapHaptic()}
                  onPress={() => setAccent(a)}
                  style={{
                    width: 40, height: 40, borderRadius: 20, backgroundColor: a,
                    borderWidth: 3, borderColor: a === accent ? t.text : 'transparent',
                    transform: [{ scale: a === accent ? 1.12 : 1 }],
                  }}
                />
              ))}
            </View>
          </View>
        </Card>

        <Label style={{ marginTop: 22, marginBottom: 8 }}>Progress</Label>
        <Card>
          <Row title="Streaks" sub="Streak counter + show-up history" top>
            <Toggle on={settings.streaks} onChange={(v) => setSettings({ streaks: v })} />
          </Row>
          {settings.streaks && (
            <Row title="Streak never dies" sub="A missed day pauses it, never resets it">
              <Toggle on={settings.streakNeverDies} onChange={(v) => setSettings({ streakNeverDies: v })} />
            </Row>
          )}
        </Card>

        <Label style={{ marginTop: 22, marginBottom: 8 }}>Demo</Label>
        <Card>
          <Pressable
            onPress={() => {
              useStore.getState().loadDemo();
              finishHaptic();
              toast('Demo loaded');
            }}
          >
            <Row title="Load demo data" sub="Sample routines, tasks & a month of insights" top>
              <IconChevR size={18} color={t.faint} />
            </Row>
          </Pressable>
        </Card>

        <Label style={{ marginTop: 22, marginBottom: 8 }}>Experimental</Label>
        <Card>
          <Pressable onPress={() => router.push('/sounds' as never)}>
            <Row title="Sounds" sub="Brainwave tones to settle in or lock on" top>
              <IconChevR size={18} color={t.faint} />
            </Row>
          </Pressable>
          <Pressable onPress={() => router.push('/haptics-lab' as never)}>
            <Row title="Haptics lab" sub="Feel each cue, pick the crisp ones">
              <IconChevR size={18} color={t.faint} />
            </Row>
          </Pressable>
        </Card>

        <View style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, padding: 18, marginTop: 26, alignItems: 'center' }}>
          <Text style={{ fontSize: 26 }}>🔥</Text>
          <Body size={14} color={t.muted} style={{ textAlign: 'center', marginTop: 8 }}>
            Free, forever.
          </Body>
          <Display size={14} style={{ marginTop: 2 }}>Built by an ADHD brain, for ADHD brains</Display>
        </View>

        <HoldDelete />
      </ScrollView>
    </View>
  );
}
