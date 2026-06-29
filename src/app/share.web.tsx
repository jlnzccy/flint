import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ChunkyButton } from '@/components/chunky';
import { useTheme } from '@/theme/theme';
import { Display, Body } from '@/components/ui';

export default function ShareWeb() {
  const t = useTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Display size={24} style={{ marginBottom: 12 }}>Android Only</Display>
      <Body size={15} color={t.muted} style={{ textAlign: 'center', marginBottom: 24 }}>
        Sharing routines is only supported in the Android application.
      </Body>
      <ChunkyButton onPress={() => router.back()}>Go Back</ChunkyButton>
    </View>
  );
}
