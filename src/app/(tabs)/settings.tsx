import { useRouter } from 'expo-router';
import * as IntentLauncher from 'expo-intent-launcher';
import React from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconChevR, IconRestart } from '@/components/icons';
import { tapHaptic } from '@/lib/haptics';
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

export default function Settings() {
  const t = useTheme();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const settings = useStore((s) => s.settings);
  const accent = useStore((s) => s.accent);
  const { setSettings, setAccent } = useStore.getState();

  // Android ringtone picker → store the chosen alarm URI (iOS has no public API)
  const pickRingtone = async () => {
    if (Platform.OS !== 'android') {
      toast('Android only');
      return;
    }
    try {
      const res = await IntentLauncher.startActivityAsync('android.intent.action.RINGTONE_PICKER', {
        extra: {
          'android.intent.extra.ringtone.TYPE': 4, // TYPE_ALARM
          'android.intent.extra.ringtone.SHOW_DEFAULT': true,
          'android.intent.extra.ringtone.SHOW_SILENT': false,
          'android.intent.extra.ringtone.TITLE': 'Alarm sound',
        },
      });
      const picked = (res.extra as Record<string, any> | undefined)?.['android.intent.extra.ringtone.PICKED_URI'] ?? res.data;
      if (res.resultCode === IntentLauncher.ResultCode.Success && picked) {
        setSettings({ alarmRingtoneUri: String(picked) });
        toast('Alarm sound set');
      }
    } catch {
      toast("Couldn't open picker");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <Display size={30}>Settings</Display>

        <Label style={{ marginTop: 24, marginBottom: 8 }}>Reminders</Label>
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

        <Label style={{ marginTop: 22, marginBottom: 8 }}>Sounds</Label>
        <Card>
          <Pressable onPress={pickRingtone}>
            <Row title="Alarm sound" sub={settings.alarmRingtoneUri ? 'Custom ringtone' : 'Marimba (default)'} top>
              <IconChevR size={18} color={t.faint} />
            </Row>
          </Pressable>
          {settings.alarmRingtoneUri ? (
            <Pressable
              onPress={() => {
                setSettings({ alarmRingtoneUri: null });
                toast('Back to default');
              }}
            >
              <Row title="Use app default" sub="Bundled marimba">
                <IconRestart size={16} color={t.faint} />
              </Row>
            </Pressable>
          ) : null}
        </Card>

        <Label style={{ marginTop: 22, marginBottom: 8 }}>Feedback</Label>
        <Card>
          <Row title="Haptics" top>
            <Toggle on={settings.haptics} onChange={(v) => setSettings({ haptics: v })} />
          </Row>
          <Row title="Voice guide" sub="Reads each step aloud">
            <Toggle on={settings.voice} onChange={(v) => setSettings({ voice: v })} />
          </Row>
          <Pressable onPress={() => router.push('/haptics-lab' as never)}>
            <Row title="Haptics lab" sub="Feel each cue, pick the crisp ones">
              <IconChevR size={18} color={t.faint} />
            </Row>
          </Pressable>
          <View style={{ padding: 16, borderTopWidth: 2, borderColor: t.lineSoft, gap: 12 }}>
            <Display size={16}>Celebration</Display>
            <Segmented
              value={settings.celebrate}
              onChange={(v) => setSettings({ celebrate: v })}
              options={[
                { value: 'calm', label: 'Calm' },
                { value: 'extra', label: 'Extra' },
              ]}
            />
          </View>
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

        <View style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, padding: 18, marginTop: 26, alignItems: 'center' }}>
          <Text style={{ fontSize: 26 }}>🔥</Text>
          <Body size={14} color={t.muted} style={{ textAlign: 'center', marginTop: 8 }}>
            Free, forever.
          </Body>
          <Display size={14} style={{ marginTop: 2 }}>Built by an ADHD brain, for ADHD brains</Display>
        </View>
      </ScrollView>
    </View>
  );
}
