import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, FadeIn, runOnJS, SlideInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedEmoji } from '@/components/animated-emoji';
import { CelebrationEmoji, Confetti } from '@/components/celebration';
import { ChunkyButton, CircleBtn } from '@/components/chunky';
import { EmojiConfetti } from '@/components/emoji-confetti';
import {
  IconCheck, IconChevL, IconClock, IconPause, IconPencil, IconPlay, IconRestart, IconSkip, IconX,
} from '@/components/icons';
import { StepRow } from '@/components/routine-bits';
import { BottomSheet } from '@/components/sheet';
import { TimerRing } from '@/components/timer-ring';
import { useToast } from '@/components/toast';
import { Body, Chip, Display, FlintInput, Label } from '@/components/ui';
import { fmtSec } from '@/lib/dates';
import { doneHaptic, finishHaptic, tapHaptic, warnHaptic } from '@/lib/haptics';
import { cancelTimerAlert, scheduleTimerAlert } from '@/lib/notifications';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { playCelebration, playStepDone } from '@/lib/sfx';
import { resolveRoutines, useStore } from '@/state/store';
import { routineOnDay } from '@/data/defaults';
import { useTheme } from '@/theme/theme';

type StepResult = 'done' | 'skipped';

interface Stats {
  doneCount: number;
  total: number;
  results: StepResult[];
  seconds: number;
  partial: boolean;
  headline: string;
}

const HEADLINES = [
  'Done.',
  'You showed up.',
  'That counts.',
  'Nice one.',
  'Look at you.',
  'That happened.',
  'Good move.',
  'Proud of you.',
  'You did the thing.',
  'Quietly winning.',
  'Solid.',
  'Worth it.',
  'Momentum.',
  'Still here.',
  'That was you.',
];

const pickHeadline = () => HEADLINES[Math.floor(Math.random() * HEADLINES.length)];

/* Progress segment — animates its width + color as the step changes (M1). Honors
   reduce-motion: when calmed, the change snaps (duration 0). */
function ProgressSeg({ width, color, bordered }: { width: number; color: string; bordered: boolean }) {
  const t = useTheme();
  const reduce = useReducedMotion();
  const anim = useAnimatedStyle(() => {
    const d = reduce ? 0 : 220;
    return {
      width: withTiming(width, { duration: d }),
      backgroundColor: withTiming(color, { duration: d }),
    };
  });
  return (
    <Animated.View
      style={[{ height: 9, borderRadius: 99, borderWidth: bordered ? 2 : 0, borderColor: t.lineSoft }, anim]}
    />
  );
}

function KeepAwake() {
  useKeepAwake();
  return null;
}

export default function Player() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { id, limit: limitParam } = useLocalSearchParams<{ id: string; limit?: string }>();

  const custom = useStore((s) => s.custom);
  const overrides = useStore((s) => s.overrides);
  const settings = useStore((s) => s.settings);

  const routine = useMemo(
    () => resolveRoutines({ custom, overrides, order: [], archived: [], deleted: [] }).find((r) => r.id === id),
    [custom, overrides, id]
  );

  const limit = limitParam ? Math.max(1, parseInt(limitParam, 10) || 0) : undefined;
  const steps = useMemo(
    () => (routine ? (limit ? routine.steps.slice(0, limit) : routine.steps) : []),
    [routine, limit]
  );

  const [phase, setPhase] = useState<'play' | 'celebrate'>('play');
  const [idx, setIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [extra, setExtra] = useState(0);
  const [paused, setPaused] = useState(false);
  const [restartN, setRestartN] = useState(0);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [dumpOpen, setDumpOpen] = useState(false);
  const [dumpText, setDumpText] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const results = useRef<StepResult[]>([]);
  const startRef = useRef(Date.now());
  const elapsedRef = useRef(0);

  const step = steps[idx];
  const target = step ? step.min * 60 + extra : 60;

  useEffect(() => {
    if (paused || phase !== 'play') return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [paused, idx, phase]);

  // keep a ref of elapsed so the alert effect can read it without re-firing each tick
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  // tick-driven cues. 30s-left nudge (E5, opt-in) on long-enough steps; then at the
  // set duration either auto-advance (E4, opt-in — its own doneHaptic fires) or just a
  // soft buzz. Works the same counting up or down (elapsed always counts up internally).
  useEffect(() => {
    if (phase !== 'play' || paused || !step || elapsed <= 0) return;
    if (routine?.warn30 && target > 30 && elapsed === target - 30) warnHaptic();
    if (elapsed === target) {
      if (routine?.autoAdvance) advance('done');
      else doneHaptic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  // schedule a local notification for when this step's timer runs out — so a step
  // still pings if the app is backgrounded. Re-armed on step change, +1 min, restart,
  // and pause/resume; cancelled on cleanup.
  useEffect(() => {
    // gate on remindersOn so a running step never triggers a cold OS permission
    // prompt when notifications are opt-in / off (P16).
    if (!settings.remindersOn || phase !== 'play' || paused || !routine || !step) return;
    const left = target - elapsedRef.current;
    if (left <= 0) return;
    let live = true;
    let id: string | null = null;
    scheduleTimerAlert(left, `${routine.emoji} ${routine.name}`, `Time's up: ${step.t}`).then((res) => {
      if (live) id = res;
      else cancelTimerAlert(res);
    });
    return () => {
      live = false;
      cancelTimerAlert(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, phase, paused, extra, restartN, settings.remindersOn]);

  useEffect(() => {
    if (!routine || phase !== 'play') return;
    if (settings.voice && step) {
      Speech.speak(step.t, { rate: 0.95 });
      return () => {
        Speech.stop();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, phase]);

  // celebration sound — one random sting when the routine completes
  useEffect(() => {
    if (phase === 'celebrate') playCelebration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // step-complete check (E2): a check pops in the ring center on Done, then fades as
  // the next step's timer appears. Honors reduce-motion — calmed = no pop.
  const reduce = useReducedMotion();
  const checkSv = useSharedValue(0);
  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkSv.value,
    transform: [{ scale: 0.55 + checkSv.value * 0.45 }],
  }));
  const popCheck = () => {
    if (reduce) return;
    checkSv.value = withSequence(
      withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 220 }),
      withTiming(0, { duration: 320, easing: Easing.in(Easing.cubic) })
    );
  };

  if (!routine || !step) {
    return null;
  }
  const c = t.col(routine.color);

  const advance = (result: StepResult) => {
    results.current[idx] = result;
    if (result === 'done') {
      doneHaptic();
    } else {
      useStore.getState().recordSkip(routine.id, idx);
      toast('Skipped');
    }
    if (idx + 1 >= steps.length) {
      const res = results.current.slice(0, steps.length);
      const finalStats: Stats = {
        doneCount: res.filter((r) => r === 'done').length,
        total: steps.length,
        results: res,
        partial: !!limit && limit < routine.steps.length,
        seconds: Math.round((Date.now() - startRef.current) / 1000),
        headline: pickHeadline(),
      };
      useStore.getState().finishRoutine(routine.id);
      finishHaptic();
      setStats(finalStats);
      setPhase('celebrate');
    } else {
      if (result === 'done') {
        popCheck();
        playStepDone();
      }
      setIdx((i) => i + 1);
      setElapsed(0);
      setExtra(0);
      setPaused(false);
    }
  };

  // step back one (E3) — reverse an accidental Done/Skip. Clears the returned-to
  // step's result so it can be redone (no double-count) and restarts its timer.
  const goBack = () => {
    if (idx === 0) return;
    const prev = idx - 1;
    (results.current as (StepResult | undefined)[])[prev] = undefined;
    tapHaptic();
    setIdx(prev);
    setElapsed(0);
    setExtra(0);
    setPaused(false);
  };

  // swipe right over the player body → previous step (T2). Horizontal-only (fails on
  // vertical) so it doesn't fight the paused "Still to go" list or button taps; goBack
  // already taps a haptic + no-ops at step 1, and the celebrate phase never mounts this.
  const swipeBack = Gesture.Pan()
    .activeOffsetX(24)
    .failOffsetY([-18, 18])
    .onEnd((e) => {
      if (e.translationX > 56 && idx > 0) runOnJS(goBack)();
    });

  /* ── celebration ── */
  if (phase === 'celebrate' && stats) {
    const headline = stats.headline;
    // dopamine receipt: this was the last open routine of the day
    const st = useStore.getState();
    const todayRoutines = resolveRoutines(st).filter((r) => routineOnDay(r));
    const doneToday = todayRoutines.filter((r) => st.doneMap[r.id]).length;
    const allDone = todayRoutines.length > 0 && doneToday === todayRoutines.length;
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
        <Confetti color={c.main} />
        <EmojiConfetti />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(350)} style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 210, height: 210, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View entering={ZoomIn.springify().damping(11).stiffness(150).mass(0.7)}>
                <CelebrationEmoji size={150} />
              </Animated.View>
            </View>
          </Animated.View>
          <Animated.View entering={SlideInDown.duration(300).delay(80)}>
            <Display size={31} style={{ textAlign: 'center', marginTop: 12, marginBottom: 8 }}>{headline}</Display>
          </Animated.View>
          <Animated.View entering={SlideInDown.duration(300).delay(150)}>
            <Chip>
              {`${stats.doneCount} of ${stats.total} steps · ${fmtSec(stats.seconds)}${stats.partial ? ' · short session' : ''}`}
            </Chip>
          </Animated.View>
          {allDone && (
            <Animated.View entering={SlideInDown.duration(300).delay(200)}>
              <Body size={14} color={t.muted} style={{ textAlign: 'center', marginTop: 12 }}>
                {doneToday === 1 ? 'That was today. Phone down.' : `${doneToday} things today. Phone down.`}
              </Body>
            </Animated.View>
          )}

          <Animated.View
            entering={SlideInDown.duration(300).delay(240)}
            style={{
              width: '100%', backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft,
              borderRadius: 18, paddingVertical: 4, paddingHorizontal: 16, marginTop: 22,
            }}
          >
            {steps.map((s, i) => {
              const ok = stats.results[i] === 'done';
              return (
                <View
                  key={i}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: i ? 2 : 0, borderColor: t.lineSoft }}
                >
                  <View
                    style={{
                      width: 22, height: 22, borderRadius: 11,
                      backgroundColor: ok ? t.green.main : t.raised,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {ok ? <IconCheck size={13} color={t.green.ink} /> : <Text style={{ color: t.faint, fontSize: 12 }}>–</Text>}
                  </View>
                  <Body size={14} color={ok ? t.text : t.faint} style={{ flex: 1 }}>{s.t}</Body>
                </View>
              );
            })}
          </Animated.View>
        </ScrollView>
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 22 }}>
          <ChunkyButton color={c.main} deep={c.deep} ink={c.ink} fontSize={18} pad={[18, 24]} onPress={() => router.back()}>
            Done
          </ChunkyButton>
        </View>
      </View>
    );
  }

  /* ── player ── */
  const ringProgress = settings.countUp ? elapsed / target : 1 - elapsed / target;
  const shownTime = settings.countUp ? elapsed : Math.max(0, target - elapsed);
  const remaining = steps.slice(idx + 1);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      {settings.keepOn && <KeepAwake />}

      {/* top bar — "<" is previous-step only (hidden at step 1 so it never duplicates the
          X); X is the sole exit (T1). Empty slot at step 1 keeps the title centered. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 }}>
        {idx > 0 ? (
          <CircleBtn size={44} onPress={goBack} label="Previous step">
            <IconChevL color={t.text} />
          </CircleBtn>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 8 }}>
          <Display size={16} numberOfLines={1} style={{ color: t.muted, textAlign: 'center' }}>
            {routine.emoji} {routine.name}
          </Display>
          {limit && limit < routine.steps.length ? (
            <Label color={t.faint} style={{ marginTop: 2 }}>short session</Label>
          ) : null}
        </View>
        <CircleBtn size={44} onPress={() => setExitConfirm(true)} label="Exit">
          <IconX color={t.text} />
        </CircleBtn>
      </View>

      {/* progress segments */}
      <Pressable
        onPressIn={() => tapHaptic()}
        onPress={() => setStepsOpen(true)}
        accessibilityLabel="Show steps"
        style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', paddingTop: 8, paddingBottom: 2 }}
      >
        {steps.map((_, i) => (
          <ProgressSeg
            key={i}
            width={i === idx ? 30 : 9}
            color={i < idx ? (results.current[i] === 'done' ? c.main : t.line) : i === idx ? c.main : t.raised}
            bordered={i > idx}
          />
        ))}
      </Pressable>

      {/* main area — swipe right here = previous step (T2) */}
      <GestureDetector gesture={swipeBack}>
      <View key={idx} style={{ flex: 1, alignItems: 'center', paddingHorizontal: 24 }}>
        {/* fixed-height prompt so the ring + controls never shift between steps */}
        <Animated.View entering={FadeIn.duration(250)} style={{ height: 124, justifyContent: 'center', alignItems: 'center', marginTop: 6 }}>
          <Display size={30} numberOfLines={2} style={{ textAlign: 'center' }}>{step.t}</Display>
          {step.hint ? (
            <Body size={15} color={t.muted} numberOfLines={2} style={{ marginTop: 10, fontFamily: 'BeVietnamPro_400Regular_Italic', textAlign: 'center' }}>
              {step.hint}
            </Body>
          ) : null}
        </Animated.View>

        <View style={{ marginTop: 24 }}>
          <TimerRing progress={ringProgress} color={c.main} size={208} pulsing={!paused}>
            <Display size={46}>{fmtSec(shownTime)}</Display>
            {elapsed > target && settings.countUp ? (
              <Body size={12} color={t.faint}>past target — still counts</Body>
            ) : null}
          </TimerRing>
          {/* step-complete check (E2) — pops over the ring, fades to reveal the next timer */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, checkStyle]}
          >
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: t.green.main, alignItems: 'center', justifyContent: 'center' }}>
              <IconCheck size={50} color={t.green.ink} />
            </View>
          </Animated.View>
        </View>

        {/* how long this step is set for */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
          <IconClock size={13} color={t.faint} />
          <Label color={t.faint}>{`${step.min} min${extra ? ` +${extra / 60}` : ''}`}</Label>
        </View>

        {/* next step — no number, more presence but still under the current step (T3) */}
        <Body size={19} color={t.text} numberOfLines={1} style={{ marginTop: 12, textAlign: 'center', maxWidth: 320 }}>
          {idx + 1 < steps.length ? `Next: ${steps[idx + 1].t}` : 'Last step — downhill from here'}
        </Body>

        {/* controls sit low, well clear of the clock */}
        <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: paused ? 'flex-start' : 'flex-end', paddingTop: 24, paddingBottom: 8 }}>
        {paused ? (
          <View style={{ width: '100%', maxWidth: 320 }}>
            <Label style={{ textAlign: 'center', marginBottom: 8 }}>Still to go</Label>
            <View style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, paddingVertical: 4, paddingHorizontal: 14 }}>
              {remaining.length ? (
                remaining.map((s, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderTopWidth: i ? 2 : 0, borderColor: t.lineSoft }}>
                    <Body size={14} color={t.muted}>{s.t}</Body>
                    <Body size={14} color={t.faint}>{s.min}m</Body>
                  </View>
                ))
              ) : (
                <Body size={14} color={t.muted} style={{ textAlign: 'center', paddingVertical: 12 }}>Last step.</Body>
              )}
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ChunkyButton ghost fontSize={13} pad={[10, 16]} onPress={() => setExtra((x) => x + 60)}>
              +1 min
            </ChunkyButton>
            <ChunkyButton
              ghost
              fontSize={13}
              pad={[10, 16]}
              onPress={() => {
                setElapsed(0);
                setExtra(0);
                setRestartN((n) => n + 1);
              }}
            >
              <IconRestart color={t.text} />
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.text, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Restart
              </Text>
            </ChunkyButton>
            <ChunkyButton ghost fontSize={13} pad={[10, 16]} accessibilityLabel="Capture a thought" onPress={() => setDumpOpen(true)}>
              <IconPencil size={14} color={t.text} />
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.text, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Note
              </Text>
            </ChunkyButton>
          </View>
        )}
        </View>
      </View>
      </GestureDetector>

      {/* bottom controls */}
      <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <CircleBtn onPress={() => setPaused((p) => !p)} label={paused ? 'Resume' : 'Pause'}>
            {paused ? <IconPlay color={t.text} /> : <IconPause color={t.text} />}
          </CircleBtn>
          <ChunkyButton
            color={c.main}
            deep={c.deep}
            ink={c.ink}
            fontSize={18}
            pad={[17, 24]}
            style={{ flex: 1 }}
            onPress={() => advance('done')}
          >
            <IconCheck size={18} color={c.ink} />
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: c.ink, textTransform: 'uppercase', letterSpacing: 0.9 }}>
              Done
            </Text>
          </ChunkyButton>
          <CircleBtn onPress={() => advance('skipped')} label="Skip step">
            <IconSkip color={t.text} />
          </CircleBtn>
        </View>
      </View>

      {/* steps sheet */}
      <BottomSheet open={stepsOpen} onClose={() => setStepsOpen(false)} title="Steps">
        <View style={{ backgroundColor: t.raised, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, paddingVertical: 4, paddingHorizontal: 16 }}>
          {steps.map((s, i) => (
            <StepRow key={i} index={i} text={s.t} min={s.min} first={i === idx} color={c} />
          ))}
        </View>
      </BottomSheet>

      {/* brain dump */}
      <BottomSheet
        open={dumpOpen}
        onClose={() => {
          setDumpOpen(false);
          setDumpText('');
        }}
        title="Quick thought"
      >
        <FlintInput
          autoFocus
          placeholder="Goes to Tasks — timer keeps running"
          value={dumpText}
          onChangeText={setDumpText}
          maxLength={80}
          onSubmitEditing={() => {
            if (!dumpText.trim()) return;
            useStore.getState().addTodo({ title: dumpText.trim(), details: '', reminderDate: null, reminderTime: null, deadline: null, repeat: null, subtasks: [] });
            toast('Saved to Tasks');
            setDumpOpen(false);
            setDumpText('');
          }}
        />
        <ChunkyButton
          color={c.main}
          deep={c.deep}
          ink={c.ink}
          fontSize={16}
          pad={[14, 24]}
          style={{ marginTop: 14 }}
          disabled={!dumpText.trim()}
          onPress={() => {
            useStore.getState().addTodo({ title: dumpText.trim(), details: '', reminderDate: null, reminderTime: null, deadline: null, repeat: null, subtasks: [] });
            toast('Saved to Tasks');
            setDumpOpen(false);
            setDumpText('');
          }}
        >
          Save
        </ChunkyButton>
      </BottomSheet>

      {/* exit confirm — a swipe-down sheet, soft 🥹 nudge (never guilt) */}
      <BottomSheet open={exitConfirm} onClose={() => setExitConfirm(false)} scroll={false}>
        <View style={{ alignItems: 'center', paddingTop: 4 }}>
          <AnimatedEmoji emoji="🥹" size={86} />
          <Display size={21} style={{ textAlign: 'center', marginTop: 12 }}>Leave already?</Display>
          <Body size={14.5} color={t.muted} style={{ textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 21 }}>
            You haven’t finished — but even one step counts. No pressure either way.
          </Body>
        </View>
        <ChunkyButton color={c.main} deep={c.deep} ink={c.ink} fontSize={16} pad={[15, 24]} onPress={() => setExitConfirm(false)}>
          Keep going
        </ChunkyButton>
        <Pressable onPressIn={() => tapHaptic()} onPress={() => router.back()} style={{ paddingVertical: 14, marginTop: 6, alignItems: 'center' }} hitSlop={8}>
          <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: t.faint, textTransform: 'uppercase', letterSpacing: 0.7 }}>
            Leave
          </Text>
        </Pressable>
      </BottomSheet>
    </View>
  );
}
