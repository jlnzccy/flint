import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { InteractionManager, Pressable, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedEmoji } from '@/components/animated-emoji';
import { ChunkyButton, CircleBtn } from '@/components/chunky';
import { IconBell, IconClock, IconDots, IconPencil, IconX } from '@/components/icons';
import { BottomSheet } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { Body, Chip, Display, Label, StepperBtn, Toggle, useTimeFmt } from '@/components/ui';
import { routineMin } from '@/data/defaults';
import { addMins, nowHHMM } from '@/lib/dates';
import { tapHaptic } from '@/lib/haptics';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { enterFade, enterUp } from '@/theme/motion';
import { resolveRoutines, useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';

export default function RoutineDetail() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const fmtT = useTimeFmt();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const custom = useStore((s) => s.custom);
  const overrides = useStore((s) => s.overrides);
  const order = useStore((s) => s.order);
  const archived = useStore((s) => s.archived);
  const bumped = useStore((s) => s.bumped);
  const settings = useStore((s) => s.settings);

  const routine = useMemo(
    () => resolveRoutines({ custom, overrides, order, archived: [], deleted: [] }).find((r) => r.id === id),
    [custom, overrides, order, id]
  );

  const [menu, setMenu] = useState(false);
  const [energy, setEnergy] = useState(false);
  const [customN, setCustomN] = useState(() => Math.min(2, routine?.steps.length ?? 1));

  const reduce = useReducedMotion();
  // defer the heavy tail (full step list + settings) until the push settles, so the
  // slide never hitches mid-transition. The hero (icon/name/start) renders immediately.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const h = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => h.cancel();
  }, []);
  // calmed users get a flat fade-in; everyone else gets the staggered rise
  const entrance = (delay: number) => (reduce ? enterFade(0) : enterUp(delay));

  if (!routine) {
    router.back();
    return null;
  }
  const c = t.col(routine.color);

  const start = (opts: { limit?: number } = {}) => {
    const q = opts.limit ? `?limit=${opts.limit}` : '';
    router.replace(`/player/${routine.id}${q}`);
  };

  // per-routine run settings — store update re-resolves `routine`, so the
  // toggles read straight off it (no local state). Player honors these (E4/E5).
  const patch = (p: { autoAdvance?: boolean; warn30?: boolean }) =>
    useStore.getState().saveRoutine({ ...routine, ...p });

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      {/* top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
        <CircleBtn size={44} onPress={() => router.back()} label="Close">
          <IconX color={t.text} />
        </CircleBtn>
        {/* name is shown large below the icon — keep the top bar clean (no duplicate title) */}
        <View style={{ flex: 1 }} />
        <CircleBtn size={44} onPress={() => setMenu(true)} label="More">
          <IconDots color={t.text} />
        </CircleBtn>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 96 }}>
            <View
              style={{
                width: 96, height: 96, borderRadius: 28, backgroundColor: c.soft,
                borderWidth: 3, borderColor: c.main,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <AnimatedEmoji emoji={routine.emoji} size={60} />
            </View>
          </View>
          <Display size={30} style={{ marginTop: 18, textAlign: 'center' }}>{routine.name}</Display>
          <Body size={15} color={t.muted} style={{ marginTop: 6 }}>
            {routine.steps.length} steps · {routineMin(routine)} min · just start the first
          </Body>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {/* estimated finish window — now → now + total (D1) */}
            <Chip style={{ paddingVertical: 6, paddingHorizontal: 12 }}>
              <IconClock size={14} color={t.text} />
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.text }}>
                {fmtT(nowHHMM())} – {fmtT(addMins(nowHHMM(), routineMin(routine)))}
              </Text>
            </Chip>
            {settings.remindersOn && routine.reminder ? (
              <Chip style={{ paddingVertical: 6, paddingHorizontal: 12 }}>
                <IconBell size={15} color={t.text} />
                <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.text }}>{fmtT(routine.reminder)}</Text>
              </Chip>
            ) : null}
          </View>
        </View>

        {ready && (
        <Animated.View entering={entrance(0)} style={{ gap: 10, marginTop: 24 }}>
          {routine.steps.map((s, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                paddingVertical: 14, paddingHorizontal: 16,
                backgroundColor: t.surface, borderRadius: 18,
                borderWidth: 2, borderColor: i === 0 ? c.main : t.lineSoft,
              }}
            >
              <View
                style={{
                  width: 38, height: 38, borderRadius: 19,
                  backgroundColor: i === 0 ? c.main : t.raised,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: 'Nunito_900Black', fontSize: 16, color: i === 0 ? c.ink : t.faint }}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Display size={16}>{s.t}</Display>
                {i === 0 ? (
                  <Body size={13} style={{ color: c.main, marginTop: 2 }}>start here</Body>
                ) : s.hint ? (
                  <Body size={13} color={t.faint} style={{ marginTop: 2 }}>{s.hint}</Body>
                ) : null}
              </View>
              <Body size={13} color={t.faint}>{s.min} min</Body>
            </View>
          ))}
        </Animated.View>
        )}

        {ready && (
        <Animated.View entering={entrance(60)}>
          <Label style={{ marginTop: 26, marginBottom: 8 }}>This routine</Label>
          <View style={{ gap: 10 }}>
            <View
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
                backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18,
              }}
            >
              <View style={{ flex: 1 }}>
                <Display size={15}>Auto-advance</Display>
                <Body size={12} color={t.faint} style={{ marginTop: 2 }}>Move to the next step at zero.</Body>
              </View>
              <Toggle on={!!routine.autoAdvance} onChange={(v) => patch({ autoAdvance: v })} />
            </View>
            <View
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
                backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18,
              }}
            >
              <View style={{ flex: 1 }}>
                <Display size={15}>30-second warning</Display>
                <Body size={12} color={t.faint} style={{ marginTop: 2 }}>A nudge before each step ends.</Body>
              </View>
              <Toggle on={!!routine.warn30} onChange={(v) => patch({ warn30: v })} />
            </View>
          </View>
        </Animated.View>
        )}
      </ScrollView>

      {/* bottom actions */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 18, gap: 10 }}>
        <ChunkyButton color={c.main} deep={c.deep} ink={c.ink} fontSize={18} pad={[18, 24]} onPress={() => start()}>
          Start
        </ChunkyButton>
        <Pressable style={{ padding: 8, alignSelf: 'center' }} onPressIn={() => tapHaptic()} onPress={() => setEnergy(true)}>
          <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13.5, color: t.accent.main }}>Short on time?</Text>
        </Pressable>
      </View>

      {/* overflow menu */}
      <BottomSheet open={menu} onClose={() => setMenu(false)} title={`${routine.emoji} ${routine.name}`}>
        <View style={{ gap: 10 }}>
          <ChunkyButton
            ghost
            fontSize={15}
            pad={[14, 18]}
            faceStyle={{ justifyContent: 'flex-start' }}
            onPress={() => {
              setMenu(false);
              router.push(`/editor?id=${routine.id}`);
            }}
          >
            <IconPencil size={16} color={t.text} />
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: t.text, textTransform: 'uppercase', letterSpacing: 0.7 }}>
              Edit routine
            </Text>
          </ChunkyButton>
          {!bumped[routine.id] && (
            <ChunkyButton
              ghost
              fontSize={15}
              pad={[14, 18]}
              faceStyle={{ justifyContent: 'flex-start' }}
              onPress={() => {
                setMenu(false);
                useStore.getState().bump(routine.id);
                toast('See you tomorrow');
                router.back();
              }}
            >
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: t.text, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                Not today
              </Text>
            </ChunkyButton>
          )}
        </View>
      </BottomSheet>

      {/* short-on-time sheet */}
      <BottomSheet open={energy} onClose={() => setEnergy(false)} title="How much today?">
        <View style={{ gap: 10 }}>
          <ChunkyButton
            ghost
            pad={[15, 18]}
            faceStyle={{ justifyContent: 'space-between' }}
            onPress={() => {
              setEnergy(false);
              start({ limit: 1 });
            }}
          >
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: t.text, textTransform: 'uppercase', letterSpacing: 0.7 }}>
              Just step one
            </Text>
            <Body size={13} color={t.faint}>~{routine.steps[0].min} min</Body>
          </ChunkyButton>
          {[2, 3]
            .filter((n) => n < routine.steps.length)
            .map((n) => (
              <ChunkyButton
                key={n}
                ghost
                pad={[15, 18]}
                faceStyle={{ justifyContent: 'space-between' }}
                onPress={() => {
                  setEnergy(false);
                  start({ limit: n });
                }}
              >
                <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: t.text, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                  First {n} steps
                </Text>
                <Body size={13} color={t.faint}>~{routine.steps.slice(0, n).reduce((a, s) => a + s.min, 0)} min</Body>
              </ChunkyButton>
            ))}
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
              backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18,
            }}
          >
            <Body size={15} style={{ flex: 1, fontFamily: 'BeVietnamPro_600SemiBold' }}>
              Custom: {customN} {customN === 1 ? 'step' : 'steps'}
            </Body>
            <Body size={13} color={t.faint}>~{routine.steps.slice(0, customN).reduce((a, s) => a + s.min, 0)} min</Body>
            <StepperBtn onPress={() => setCustomN((x) => Math.max(1, x - 1))} label="Fewer">−</StepperBtn>
            <StepperBtn onPress={() => setCustomN((x) => Math.min(routine.steps.length, x + 1))} label="More">+</StepperBtn>
          </View>
          <ChunkyButton
            color={c.main}
            deep={c.deep}
            ink={c.ink}
            fontSize={16}
            pad={[15, 24]}
            style={{ marginTop: 4 }}
            onPress={() => {
              setEnergy(false);
              start({ limit: customN });
            }}
          >
            {`Start ${customN} ${customN === 1 ? 'step' : 'steps'}`}
          </ChunkyButton>
        </View>
      </BottomSheet>
    </View>
  );
}
