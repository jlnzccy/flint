import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton, ChunkyCard, CircleBtn } from '@/components/chunky';
import { IconCheck, IconChevD, IconGear, IconRestart, IconSkip, IconX } from '@/components/icons';
import { BottomSheet } from '@/components/sheet';
import { Slider } from '@/components/slider';
import { TimerRing } from '@/components/timer-ring';
import { Body, Display, Toggle } from '@/components/ui';
import { fmtSec } from '@/lib/dates';
import { doneHaptic, tapHaptic } from '@/lib/haptics';
import { playStepDone } from '@/lib/sfx';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';

function KeepAwake() {
  useKeepAwake();
  return null;
}

/* ── Free: the body-double timer. No routine, no record, pure ignition. ── */
function FreeTimer() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [elapsed, setElapsed] = useState(0);
  // starts idle at 0:00 — an explicit Start press begins counting (P10)
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const restart = () => {
    setElapsed(0);
    setRunning(false);
  };

  return (
    <>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center' }}>
          <Display size={26} style={{ textAlign: 'center' }}>Just start something</Display>
          <Body size={14} color={t.muted} style={{ marginTop: 8, textAlign: 'center' }}>
            No routine. No record. Just company.
          </Body>
        </View>

        <TimerRing progress={(elapsed % 60) / 60} color={t.accent.main} size={208} pulsing={running}>
          <Display size={46}>{fmtSec(elapsed)}</Display>
        </TimerRing>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 18, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <CircleBtn onPress={restart} label="Restart">
          <IconRestart color={t.text} />
        </CircleBtn>
        <ChunkyButton color={t.accent.main} deep={t.accent.deep} ink={t.accent.ink} fontSize={18} pad={[17, 24]} style={{ flex: 1 }} onPress={() => setRunning((r) => !r)}>
          {running ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
        </ChunkyButton>
        <CircleBtn onPress={() => router.back()} label="Done">
          <IconCheck color={t.text} />
        </CircleBtn>
      </View>
    </>
  );
}

/* ── Pomodoro config sheet rows ── */
function SliderRow({
  label, sub, value, unit, min, max, step, onChange,
}: { label: string; sub?: string; value: number; unit?: string; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Body size={15} style={{ fontFamily: 'BeVietnamPro_600SemiBold' }}>{label}</Body>
          {sub ? <Body size={12} color={t.faint} style={{ marginTop: 1 }}>{sub}</Body> : null}
        </View>
        <Display size={16}>{unit ? `${value} ${unit}` : value}</Display>
      </View>
      <Slider value={value} min={min} max={max} step={step} onChange={onChange} />
    </View>
  );
}

function ToggleRow({ label, sub, on, onChange }: { label: string; sub?: string; on: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1 }}>
        <Body size={15} style={{ fontFamily: 'BeVietnamPro_600SemiBold' }}>{label}</Body>
        {sub ? <Body size={12} color={t.faint} style={{ marginTop: 1 }}>{sub}</Body> : null}
      </View>
      <Toggle on={on} onChange={onChange} />
    </View>
  );
}

const PHASE_LABEL: Record<'focus' | 'short' | 'long', string> = { focus: 'Focus', short: 'Short break', long: 'Long break' };
const PHASE_SUB: Record<'focus' | 'short' | 'long', string> = {
  focus: 'One thing. Start small.',
  short: 'Stretch, water, look away.',
  long: 'Step away properly.',
};

/* ── Pomodoro: focus → break cycles, all lengths user-controlled (ADHD-tuned). ──
   Counts down, no record/history. Extend focus when you're in flow (+5) instead of
   a hard cut; skip a break freely; gentle chime + haptic on each phase change. */
function PomodoroTimer() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const pomo = useStore((s) => s.pomodoro);
  const { setPomodoro } = useStore.getState();

  const [phase, setPhase] = useState<'focus' | 'short' | 'long'>('focus');
  const [cycle, setCycle] = useState(0); // focus blocks done toward the long break
  const [bonus, setBonus] = useState(0); // +5 seconds added to the current focus
  const [left, setLeft] = useState(pomo.focusMin * 60);
  const [running, setRunning] = useState(false);
  const [cfg, setCfg] = useState(false);

  const isFocus = phase === 'focus';
  const c = isFocus ? t.accent : t.teal; // breaks read cooler than focus
  const phaseLen = (p: 'focus' | 'short' | 'long') =>
    (p === 'focus' ? pomo.focusMin : p === 'short' ? pomo.shortBreakMin : pomo.longBreakMin) * 60;
  const total = phaseLen(phase) + (isFocus ? bonus : 0);

  // while idle on a fresh phase, follow live config edits so the ring shows the new length
  useEffect(() => {
    if (!running && bonus === 0) setLeft(phaseLen(phase));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomo.focusMin, pomo.shortBreakMin, pomo.longBreakMin]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const startPhase = (p: 'focus' | 'short' | 'long', auto: boolean) => {
    setPhase(p);
    setBonus(0);
    setLeft(phaseLen(p));
    setRunning(auto);
  };

  const advance = (chime: boolean) => {
    if (chime) {
      doneHaptic();
      // step-done chime marks a *focus* block completing (focus→break), not any
      // phase flip — a break ending into focus gets the haptic only (P11)
      if (phase === 'focus') playStepDone();
    }
    if (phase === 'focus') {
      const done = cycle + 1;
      if (done >= pomo.cyclesBeforeLong) {
        setCycle(0);
        startPhase('long', pomo.autoStartBreaks);
      } else {
        setCycle(done);
        startPhase('short', pomo.autoStartBreaks);
      }
    } else {
      startPhase('focus', pomo.autoStartFocus);
    }
  };

  useEffect(() => {
    if (left === 0 && running) advance(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, running]);

  const reset = () => {
    setPhase('focus');
    setCycle(0);
    setBonus(0);
    setLeft(pomo.focusMin * 60);
    setRunning(false);
  };
  const extend = () => {
    setBonus((b) => b + 300);
    setLeft((l) => l + 300);
  };

  const progress = total > 0 ? (total - left) / total : 0;

  return (
    <>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center' }}>
          <Display size={26} style={{ textAlign: 'center', color: c.main }}>{PHASE_LABEL[phase]}</Display>
          <Body size={14} color={t.muted} style={{ marginTop: 8, textAlign: 'center' }}>{PHASE_SUB[phase]}</Body>
          {/* rounds toward the long break */}
          <View style={{ flexDirection: 'row', gap: 7, marginTop: 14 }}>
            {Array.from({ length: pomo.cyclesBeforeLong }, (_, i) => (
              <View
                key={i}
                style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: i < cycle ? t.accent.main : t.lineSoft }}
              />
            ))}
          </View>
        </View>

        <TimerRing progress={progress} color={c.main} size={208} pulsing={running}>
          <Display size={46}>{fmtSec(left)}</Display>
        </TimerRing>

        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          {isFocus && (
            <ChunkyButton ghost fontSize={13} pad={[10, 16]} onPress={extend}>
              +5 min
            </ChunkyButton>
          )}
          <ChunkyButton ghost fontSize={13} pad={[10, 16]} onPress={() => setCfg(true)} accessibilityLabel="Pomodoro settings">
            <IconGear size={15} color={t.text} />
          </ChunkyButton>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 18, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <CircleBtn onPress={reset} label="Reset">
          <IconRestart color={t.text} />
        </CircleBtn>
        <ChunkyButton color={c.main} deep={c.deep} ink={c.ink} fontSize={18} pad={[17, 24]} style={{ flex: 1 }} onPress={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Start'}
        </ChunkyButton>
        <CircleBtn onPress={() => advance(false)} label="Skip">
          <IconSkip color={t.text} />
        </CircleBtn>
      </View>

      <BottomSheet open={cfg} onClose={() => setCfg(false)} title="Pomodoro">
        <View style={{ gap: 18 }}>
          <SliderRow label="Focus" sub="10 min on a hard day is plenty" value={pomo.focusMin} unit="min" min={5} max={90} step={5} onChange={(v) => setPomodoro({ focusMin: v })} />
          <SliderRow label="Short break" value={pomo.shortBreakMin} unit="min" min={1} max={30} step={1} onChange={(v) => setPomodoro({ shortBreakMin: v })} />
          <SliderRow label="Long break" value={pomo.longBreakMin} unit="min" min={5} max={45} step={5} onChange={(v) => setPomodoro({ longBreakMin: v })} />
          <SliderRow label="Rounds" sub="focus blocks before a long break" value={pomo.cyclesBeforeLong} min={2} max={8} step={1} onChange={(v) => setPomodoro({ cyclesBeforeLong: v })} />
          <ToggleRow label="Auto-start breaks" on={pomo.autoStartBreaks} onChange={(v) => setPomodoro({ autoStartBreaks: v })} />
          <ToggleRow label="Auto-start focus" on={pomo.autoStartFocus} onChange={(v) => setPomodoro({ autoStartFocus: v })} />
        </View>
      </BottomSheet>
    </>
  );
}

export default function Timer() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const keepOn = useStore((s) => s.settings.keepOn);
  const [mode, setMode] = useState<'free' | 'pomo'>('free');
  // pick Free vs Pomodoro in its own sheet (P8); the running timer no longer
  // shares the screen with the mode switch. Opens on entry, reopened by the chip.
  const [chooser, setChooser] = useState(true);

  const pick = (m: 'free' | 'pomo') => {
    setMode(m);
    setChooser(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      {keepOn && <KeepAwake />}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
        <CircleBtn size={44} onPress={() => router.back()} label="Exit">
          <IconX color={t.text} />
        </CircleBtn>
        {/* mode chip — reopens the chooser; the switch lives in its own surface */}
        <Pressable
          onPressIn={() => tapHaptic()}
          onPress={() => setChooser(true)}
          accessibilityLabel="Change timer mode"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 13, borderWidth: 2, borderColor: t.lineSoft, backgroundColor: t.surface }}
        >
          <Display size={15}>{mode === 'free' ? 'Free' : 'Pomodoro'}</Display>
          <IconChevD size={16} color={t.muted} />
        </Pressable>
      </View>

      {mode === 'free' ? <FreeTimer /> : <PomodoroTimer />}

      {/* mode chooser (P8) */}
      <BottomSheet open={chooser} onClose={() => setChooser(false)} title="Choose timer">
        <View style={{ gap: 12 }}>
          <ChunkyCard onPress={() => pick('free')} faceStyle={{ padding: 16 }}>
            <Display size={17}>Free</Display>
            <Body size={13} color={t.muted} style={{ marginTop: 3 }}>Body-double timer. No routine, no record.</Body>
          </ChunkyCard>
          <ChunkyCard onPress={() => pick('pomo')} faceStyle={{ padding: 16 }}>
            <Display size={17}>Pomodoro</Display>
            <Body size={13} color={t.muted} style={{ marginTop: 3 }}>Focus → break cycles, lengths your call.</Body>
          </ChunkyCard>
        </View>
      </BottomSheet>
    </View>
  );
}
