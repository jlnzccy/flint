import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconChevL, IconTrash } from '@/components/icons';
import { finishHaptic, warnHaptic } from '@/lib/haptics';
import { useToast } from '@/components/toast';
import { Body, Display, Label } from '@/components/ui';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';
import { ChunkyButton, CircleBtn } from '@/components/chunky';
import { BottomSheet } from '@/components/sheet';

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
          marginTop: 12, height: 56, borderRadius: 18, overflow: 'hidden',
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

export default function DataScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 2 }}>
        <CircleBtn size={44} onPress={() => router.back()} label="Back">
          <IconChevL color={t.text} />
        </CircleBtn>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
        <Display size={30}>System & Data</Display>
        <Body size={14} color={t.faint} style={{ marginTop: 4 }}>
          Manage your app data and workspace state.
        </Body>

        <Label style={{ marginTop: 22, marginBottom: 8 }}>Danger Zone</Label>
        <ChunkyButton
          color={t.accent.main}
          deep={t.accent.deep}
          ink={t.accent.ink}
          fontSize={14}
          pad={[13, 18]}
          onPress={() => setSheetOpen(true)}
          style={{ marginTop: 8 }}
        >
          Delete all data
        </ChunkyButton>
      </ScrollView>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Delete all data" scroll={false}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          <Body size={14} color={t.text} style={{ lineHeight: 20, marginBottom: 12 }}>
            This will permanently delete all routines, tasks, history, and settings. This action cannot be undone.
          </Body>
          <HoldDelete />
        </View>
      </BottomSheet>
    </View>
  );
}
