import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconChevL, IconChevR, IconTrash } from '@/components/icons';
import { finishHaptic, warnHaptic } from '@/lib/haptics';
import { useToast } from '@/components/toast';
import { Body, Chip, Display, Label } from '@/components/ui';
import { resolveRoutines, useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';
import { Routine } from '@/data/defaults';
import { confirmDestructive } from '@/lib/confirm';
import { ChunkyButton, CircleBtn } from '@/components/chunky';
import { BottomSheet } from '@/components/sheet';
import { CHUNK, RADIUS } from '@/theme/colors';
import { SPRING } from '@/theme/motion';

const HOLD_MS = 1500;

function HoldDelete() {
  const t = useTheme();
  const toast = useToast();
  const router = useRouter();
  const fill = useSharedValue(0);
  const down = useSharedValue(0); // pressed-edge sink, same as ChunkyButton
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);

  const cancel = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setHolding(false);
    fill.value = withTiming(0, { duration: 160 });
    down.value = withSpring(0, SPRING.press);
  };
  const start = () => {
    setHolding(true);
    warnHaptic();
    down.value = withSpring(CHUNK, SPRING.press);
    fill.value = withTiming(1, { duration: HOLD_MS });
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      fill.value = 0;
      down.value = withSpring(0, SPRING.press);
      finishHaptic();
      // wipe → onboarded flips false. Pop the settings stack so the navigator's
      // onboarding guard can take over (otherwise we'd strand the user on this
      // now-empty screen). Fresh data = onboarding runs again.
      useStore.getState().resetAll();
      toast('Erased');
      router.replace('/onboarding');
    }, HOLD_MS);
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: down.value }] }));

  return (
    <>
      <View style={{ marginTop: 12 }}>
        {/* backing layer sits CHUNK lower — the face sinks onto it on hold */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: CHUNK, bottom: 0, borderRadius: RADIUS, backgroundColor: t.accent.deep }}
        />
        <Pressable onPressIn={start} onPressOut={cancel} accessibilityLabel="Hold to delete all data" style={{ marginBottom: CHUNK }}>
          <Animated.View
            style={[
              {
                height: 56, borderRadius: RADIUS, overflow: 'hidden', backgroundColor: t.accent.main,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              },
              faceStyle,
            ]}
          >
            {/* hold progress — a darker sweep filling across the face */}
            <Animated.View
              pointerEvents="none"
              style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: t.accent.ink, opacity: 0.18 }, fillStyle]}
            />
            <IconTrash size={16} color={t.accent.ink} />
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: t.accent.ink, textTransform: 'uppercase', letterSpacing: 0.7 }}>
              {holding ? 'Keep holding…' : 'Hold to delete all data'}
            </Text>
          </Animated.View>
        </Pressable>
      </View>
      <Body size={12} color={t.faint} style={{ textAlign: 'center', marginTop: 8 }}>
        Erases everything and starts over. Can't be undone.
      </Body>
    </>
  );
}

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

export default function DataScreen() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [archOpen, setArchOpen] = useState(false);

  const custom = useStore((s) => s.custom);
  const overrides = useStore((s) => s.overrides);
  const order = useStore((s) => s.order);
  const archived = useStore((s) => s.archived);
  const deleted = useStore((s) => s.deleted);
  const restoreRoutine = useStore((s) => s.restoreRoutine);
  const deleteRoutine = useStore((s) => s.deleteRoutine);

  const archivedList = useMemo(() => {
    const all = resolveRoutines({ custom, overrides, order, archived: [], deleted });
    return archived.map((id) => all.find((r) => r.id === id)).filter(Boolean) as Routine[];
  }, [custom, overrides, order, archived, deleted]);

  const confirmDelete = (r: Routine, after?: () => void) =>
    confirmDestructive('Delete routine?', `"${r.name}" and its history stay gone.`, 'Delete', () => {
      deleteRoutine(r.id);
      toast('Deleted');
      after?.();
    });

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

        <Label style={{ marginTop: 22, marginBottom: 8 }}>Data Settings</Label>
        <Card>
          <Pressable onPress={() => router.push('/settings/manage-data' as never)}>
            <Row title="Manage Data" sub="Export or import your backup files" top>
              <IconChevR size={18} color={t.faint} />
            </Row>
          </Pressable>
          <Pressable onPress={() => setArchOpen(true)}>
            <Row title={`Archived (${archivedList.length})`} sub="Restore or delete archived routines">
              <IconChevR size={18} color={t.faint} />
            </Row>
          </Pressable>
        </Card>

        <Label style={{ marginTop: 28, marginBottom: 8 }}>Danger Zone</Label>
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

      <BottomSheet open={archOpen} onClose={() => setArchOpen(false)} title="Archived">
        <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          {archivedList.length === 0 ? (
            <Body size={13.5} color={t.faint} style={{ textAlign: 'center', padding: 16 }}>
              Nothing archived.
            </Body>
          ) : (
            <View>
              {archivedList.map((r, i) => (
                <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 2 : 0, borderColor: t.lineSoft }}>
                  <Text style={{ fontSize: 20, opacity: 0.7 }}>{r.emoji}</Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Display size={15}>{r.name}</Display>
                    <Body size={12} color={t.faint}>{r.steps.length} steps</Body>
                  </View>
                  <Chip
                    onPress={() => confirmDelete(r, () => archivedList.length <= 1 && setArchOpen(false))}
                  >
                    <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.muted }}>Delete</Text>
                  </Chip>
                  <Chip
                    active
                    onPress={() => {
                      restoreRoutine(r.id);
                      toast('Restored');
                      if (archivedList.length <= 1) setArchOpen(false);
                    }}
                  >
                    Restore
                  </Chip>
                </View>
              ))}
            </View>
          )}
        </View>
      </BottomSheet>
    </View>
  );
}
