import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorPickerSheet } from '@/components/color-picker';
import { IconChevL, IconPlus } from '@/components/icons';
import { tapHaptic } from '@/lib/haptics';
import { useToast } from '@/components/toast';
import { Body, Display, Label, Segmented, Toggle } from '@/components/ui';
import { ACCENT_CHOICES, hexDarken } from '@/theme/colors';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';
import { CircleBtn } from '@/components/chunky';

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

export default function Preferences() {
  const t = useTheme();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const settings = useStore((s) => s.settings);
  const accent = useStore((s) => s.accent);
  const { setSettings, setAccent } = useStore.getState();
  const [accentOpen, setAccentOpen] = useState(false);
  const customAccent = !ACCENT_CHOICES.includes(accent as (typeof ACCENT_CHOICES)[number]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 2 }}>
        <CircleBtn size={44} onPress={() => router.back()} label="Back">
          <IconChevL color={t.text} />
        </CircleBtn>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
        <Display size={30}>Preferences</Display>
        <Body size={14} color={t.faint} style={{ marginTop: 4 }}>
          Tailor the app's look and timing behaviors.
        </Body>

        <Label style={{ marginTop: 20, marginBottom: 8 }}>Theme</Label>
        <Card>
          <View style={{ padding: 16, gap: 12 }}>
            <Display size={16}>App Theme</Display>
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
        </Card>

        <Label style={{ marginTop: 20, marginBottom: 8 }}>Color Profile</Label>
        <Card>
          <View style={{ padding: 16, gap: 12 }}>
            <Display size={16}>Style</Display>
            <Segmented
              value={settings.themeStyle ?? 'ember'}
              onChange={(v) => setSettings({ themeStyle: v as 'ember' | 'neutral' })}
              options={[
                { value: 'ember', label: 'Ember (Warm)' },
                { value: 'neutral', label: 'Neutral (Cool)' },
              ]}
            />
          </View>
        </Card>

        <Label style={{ marginTop: 22, marginBottom: 8 }}>Accent Color</Label>
        <Card>
          <View style={{ padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              {ACCENT_CHOICES.map((a) => {
                const active = a === accent;
                const dark = hexDarken(a, 0.55);
                return (
                  <Pressable
                    key={a}
                    accessibilityLabel={a}
                    onPressIn={() => tapHaptic()}
                    onPress={() => setAccent(a)}
                    style={{
                      width: 40, height: 40, borderRadius: 20, backgroundColor: a,
                      borderWidth: active ? 3 : 1.5,
                      borderColor: active ? dark : t.line,
                      alignItems: 'center', justifyContent: 'center',
                      transform: [{ scale: active ? 1.12 : 1 }],
                    }}
                  >
                    {/* tonal ring + dot — a darker shade of the swatch, not black */}
                    <View style={{ width: 15, height: 15, borderRadius: 8, backgroundColor: dark }} />
                  </Pressable>
                );
              })}
              <Pressable
                accessibilityLabel={customAccent ? 'Edit custom accent' : 'Custom accent'}
                onPressIn={() => tapHaptic()}
                onPress={() => setAccentOpen(true)}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: customAccent ? accent : t.raised,
                  borderWidth: customAccent ? 3 : 2,
                  borderColor: customAccent ? hexDarken(accent, 0.55) : t.line,
                  alignItems: 'center', justifyContent: 'center',
                  transform: [{ scale: customAccent ? 1.12 : 1 }],
                }}
              >
                {customAccent
                  ? <View style={{ width: 15, height: 15, borderRadius: 8, backgroundColor: hexDarken(accent, 0.55) }} />
                  : <IconPlus size={16} color={t.muted} />}
              </Pressable>
            </View>

            <Pressable
              accessibilityLabel="Material You"
              onPressIn={() => tapHaptic()}
              onPress={() => toast('Coming soon')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}
            >
              <View style={{ flex: 1 }}>
                <Body size={14} style={{ fontFamily: 'BeVietnamPro_600SemiBold' }}>Material You</Body>
                <Body size={12} color={t.faint} style={{ marginTop: 1 }}>Match your wallpaper</Body>
              </View>
              <Body size={12} color={t.faint}>Coming soon</Body>
            </Pressable>
          </View>
        </Card>

        <Label style={{ marginTop: 22, marginBottom: 8 }}>Display & Timing</Label>
        <Card>
          <Row title="Keep screen on" sub="During a routine" top>
            <Toggle on={settings.keepOn} onChange={(v) => setSettings({ keepOn: v })} />
          </Row>
          <Row title="Count-up timer" sub="Ring fills instead of drains">
            <Toggle on={settings.countUp} onChange={(v) => setSettings({ countUp: v })} />
          </Row>
          <Row title="Reduce motion" sub="Calm the pulsing and animations">
            <Toggle on={settings.reduceMotion} onChange={(v) => setSettings({ reduceMotion: v })} />
          </Row>
          <View style={{ padding: 16, borderTopWidth: 2, borderColor: t.lineSoft, gap: 12 }}>
            <Display size={16}>Clock Format</Display>
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
        </Card>
      </ScrollView>

      <ColorPickerSheet
        open={accentOpen}
        initial={accent}
        onClose={() => setAccentOpen(false)}
        onPick={setAccent}
      />
    </View>
  );
}
