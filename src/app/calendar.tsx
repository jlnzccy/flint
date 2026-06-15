import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarView } from '@/components/calendar-view';
import { CircleBtn } from '@/components/chunky';
import { IconX } from '@/components/icons';
import { Display } from '@/components/ui';
import { useTheme } from '@/theme/theme';

export default function CalendarScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
        <CircleBtn size={44} onPress={() => router.back()} label="Close">
          <IconX color={t.text} />
        </CircleBtn>
        <Display size={18}>Calendar</Display>
      </View>
      <CalendarView />
    </View>
  );
}
