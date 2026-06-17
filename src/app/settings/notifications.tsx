import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconChevL } from '@/components/icons';
import { useToast } from '@/components/toast';
import { Body, Display, Label, Toggle } from '@/components/ui';
import { ensurePermission } from '@/lib/notifications';
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

export default function Notifications() {
  const t = useTheme();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const settings = useStore((s) => s.settings);
  const { setSettings } = useStore.getState();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 2 }}>
        <CircleBtn size={44} onPress={() => router.back()} label="Back">
          <IconChevL color={t.text} />
        </CircleBtn>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
        <Display size={30}>Notifications</Display>
        <Body size={14} color={t.faint} style={{ marginTop: 4 }}>
          Manage your alerts and sensory feedback.
        </Body>

        <Label style={{ marginTop: 20, marginBottom: 8 }}>Reminders</Label>
        <Card>
          <Row title="Reminders" sub="Get reminded about scheduled routines" top>
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

        <Label style={{ marginTop: 22, marginBottom: 8 }}>Feedback Cues</Label>
        <Card>
          <Row title="Haptics" sub="Tactile feedback during actions" top>
            <Toggle on={settings.haptics} onChange={(v) => setSettings({ haptics: v })} />
          </Row>
          <Row title="Voice guide" sub="Reads each step aloud">
            <Toggle on={settings.voice} onChange={(v) => setSettings({ voice: v })} />
          </Row>
        </Card>
      </ScrollView>
    </View>
  );
}
