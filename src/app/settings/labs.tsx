import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconChevL, IconChevR } from '@/components/icons';
import { Body, Display, Label } from '@/components/ui';
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

export default function Labs() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 2 }}>
        <CircleBtn size={44} onPress={() => router.back()} label="Back">
          <IconChevL color={t.text} />
        </CircleBtn>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
        <Display size={30}>Experimental Labs</Display>
        <Body size={14} color={t.faint} style={{ marginTop: 4 }}>
          Try out experimental features and sensory helpers.
        </Body>

        <Label style={{ marginTop: 20, marginBottom: 8 }}>Sensory Labs</Label>
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
      </ScrollView>
    </View>
  );
}
