import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

import { Body, Chip, Display, FlintInput, Segmented } from '@/components/ui';
import { resolveClock24 } from '@/lib/dates';
import { tapHaptic } from '@/lib/haptics';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';

const ACircle = Animated.createAnimatedComponent(Circle);
const ALine = Animated.createAnimatedComponent(Line);

const SIZE = 250;
const C = SIZE / 2;
const R_OUT = 100; // hours 1–12 / minutes
const R_IN = 64; // hours 13–24 (24h mode)
const KNOB = 17;

const pad = (n: number) => String(n).padStart(2, '0');
const pol = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: C + r * Math.sin(rad), y: C - r * Math.cos(rad) };
};

export function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTheme();
  // 12/24h follows the global setting — no in-picker toggle
  const mode24 = resolveClock24(useStore((s) => s.settings.clock));
  const init = (value || '07:00').split(':').map(Number);
  const [h24, setH24] = useState(init[0] || 0);
  const [m, setM] = useState(init[1] || 0);
  const [field, setField] = useState<'h' | 'm'>('h');
  const [manual, setManual] = useState(false);

  const pm = h24 >= 12;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;

  // current selection's hand/knob position (snapped)
  const sel =
    field === 'm'
      ? { deg: m * 6, r: R_OUT }
      : mode24
      ? h24 === 0
        ? { deg: 0, r: R_IN }
        : h24 === 12
        ? { deg: 0, r: R_OUT }
        : h24 > 12
        ? { deg: (h24 - 12) * 30, r: R_IN }
        : { deg: h24 * 30, r: R_OUT }
      : { deg: (h12 % 12) * 30, r: R_OUT };

  // animated hand — glides to follow the finger / settle on the nearest tick
  const angle = useSharedValue(sel.deg);
  const radius = useSharedValue(sel.r);
  const fieldSv = useSharedValue<'h' | 'm'>(field);
  const draggingRef = useRef(false);
  const firstRef = useRef(true);

  // emit upward whenever the value changes (we are the source of truth once mounted)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onChange(`${pad(h24)}:${pad(m)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h24, m]);

  // move the hand on any non-drag change (field switch, AM/PM, typed value)
  useEffect(() => {
    fieldSv.value = field;
    if (draggingRef.current) return;
    const dur = firstRef.current ? 0 : 170;
    firstRef.current = false;
    // shortest-path so it never swings the long way round
    let target = sel.deg;
    const cur = angle.value;
    while (target - cur > 180) target -= 360;
    while (target - cur < -180) target += 360;
    angle.value = withTiming(target, { duration: dur });
    radius.value = withTiming(sel.r, { duration: dur });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel.deg, sel.r, field]);

  const setHour = (next: number) => {
    if (next !== h24) {
      tapHaptic();
      setH24(next);
    }
  };
  const setMin = (next: number) => {
    if (next !== m) {
      tapHaptic();
      setM(next);
    }
  };

  // snap a touch point to an hour/minute value (called from the gesture on the JS thread)
  const commitTouch = (x: number, y: number) => {
    const dx = x - C;
    const dy = y - C;
    const dist = Math.hypot(dx, dy);
    const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    const a = (deg + 360) % 360;
    if (field === 'h') {
      const idx = Math.round(a / 30) % 12; // 0..11, 0 = top
      if (mode24) {
        const inner = dist < (R_OUT + R_IN) / 2;
        setHour(inner ? (idx === 0 ? 0 : idx + 12) : idx === 0 ? 12 : idx);
      } else {
        const nh12 = idx === 0 ? 12 : idx;
        setHour((nh12 % 12) + (pm ? 12 : 0));
      }
    } else {
      setMin(Math.round(a / 6) % 60);
    }
  };

  const setDragging = (v: boolean) => {
    draggingRef.current = v;
  };

  // drive the hand straight from the finger, then settle onto the nearest tick
  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      runOnJS(setDragging)(true);
      const dx = e.x - C;
      const dy = e.y - C;
      angle.value = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
      radius.value =
        fieldSv.value === 'h' && mode24 ? (Math.hypot(dx, dy) < (R_OUT + R_IN) / 2 ? R_IN : R_OUT) : R_OUT;
      runOnJS(commitTouch)(e.x, e.y);
    })
    .onUpdate((e) => {
      const dx = e.x - C;
      const dy = e.y - C;
      angle.value = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
      radius.value =
        fieldSv.value === 'h' && mode24 ? (Math.hypot(dx, dy) < (R_OUT + R_IN) / 2 ? R_IN : R_OUT) : R_OUT;
      runOnJS(commitTouch)(e.x, e.y);
    })
    .onEnd(() => {
      const step = fieldSv.value === 'm' ? 6 : 30;
      angle.value = withTiming(Math.round(angle.value / step) * step, { duration: 110 });
      runOnJS(setDragging)(false);
    })
    .onFinalize(() => runOnJS(setDragging)(false));

  const knobProps = useAnimatedProps(() => {
    const rad = (angle.value * Math.PI) / 180;
    return { cx: C + radius.value * Math.sin(rad), cy: C - radius.value * Math.cos(rad) };
  });
  const handProps = useAnimatedProps(() => {
    const rad = (angle.value * Math.PI) / 180;
    return { x2: C + radius.value * Math.sin(rad), y2: C - radius.value * Math.cos(rad) };
  });

  const setPm = (next: boolean) => {
    if (next === pm) return;
    tapHaptic();
    setH24(next ? (h24 % 12) + 12 : h24 % 12);
  };

  const hourLabels = mode24
    ? [
        ...Array.from({ length: 12 }, (_, i) => ({ n: i === 0 ? 12 : i, label: i === 0 ? '12' : String(i), r: R_OUT, deg: i * 30 })),
        ...Array.from({ length: 12 }, (_, i) => ({ n: i === 0 ? 0 : i + 12, label: i === 0 ? '00' : String(i + 12), r: R_IN, deg: i * 30 })),
      ]
    : Array.from({ length: 12 }, (_, i) => ({ n: i === 0 ? 12 : i, label: i === 0 ? '12' : String(i), r: R_OUT, deg: i * 30 }));
  const minLabels = Array.from({ length: 12 }, (_, i) => ({ n: i * 5, label: pad(i * 5), r: R_OUT, deg: i * 30 }));

  const setManualH = (txt: string) => {
    const n = parseInt(txt.replace(/\D/g, ''), 10);
    if (Number.isNaN(n)) return;
    if (mode24) setH24(Math.min(23, n));
    else {
      const v = Math.min(12, Math.max(1, n)) % 12;
      setH24(v + (pm ? 12 : 0));
    }
  };
  const setManualM = (txt: string) => {
    const n = parseInt(txt.replace(/\D/g, ''), 10);
    if (Number.isNaN(n)) return;
    setM(Math.min(59, n));
  };

  return (
    <View style={{ alignItems: 'center', gap: 16 }}>
      {/* big editable readout */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Pressable onPressIn={() => tapHaptic()} onPress={() => setField('h')} accessibilityLabel="Edit hour">
          <Display size={42} style={{ color: field === 'h' ? t.accent.main : t.text, minWidth: 56, textAlign: 'center' }}>
            {mode24 ? pad(h24) : String(h12)}
          </Display>
        </Pressable>
        <Display size={42} style={{ color: t.faint }}>:</Display>
        <Pressable onPressIn={() => tapHaptic()} onPress={() => setField('m')} accessibilityLabel="Edit minute">
          <Display size={42} style={{ color: field === 'm' ? t.accent.main : t.text, minWidth: 56, textAlign: 'center' }}>
            {pad(m)}
          </Display>
        </Pressable>
        {!mode24 && (
          <View style={{ gap: 6, marginLeft: 8 }}>
            {(['AM', 'PM'] as const).map((ap) => (
              <Chip key={ap} active={(ap === 'PM') === pm} onPress={() => setPm(ap === 'PM')} style={{ justifyContent: 'center', paddingVertical: 6 }}>
                {ap}
              </Chip>
            ))}
          </View>
        )}
      </View>

      {manual ? (
        <View style={{ width: '100%', gap: 12, paddingHorizontal: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <FlintInput
              keyboardType="number-pad"
              value={mode24 ? pad(h24) : String(h12)}
              onChangeText={setManualH}
              maxLength={2}
              selectTextOnFocus
              style={{ width: 76, textAlign: 'center', fontSize: 22, fontFamily: 'Nunito_900Black' }}
            />
            <Display size={26} style={{ color: t.faint }}>:</Display>
            <FlintInput
              keyboardType="number-pad"
              value={pad(m)}
              onChangeText={setManualM}
              maxLength={2}
              selectTextOnFocus
              style={{ width: 76, textAlign: 'center', fontSize: 22, fontFamily: 'Nunito_900Black' }}
            />
          </View>
          <Body size={12.5} color={t.faint} style={{ textAlign: 'center' }}>
            {mode24 ? 'Hour 0–23' : 'Hour 1–12 · pick AM/PM above'}
          </Body>
        </View>
      ) : (
        <GestureDetector gesture={pan}>
          <View style={{ width: SIZE, height: SIZE }} collapsable={false}>
            <Svg width={SIZE} height={SIZE} pointerEvents="none">
              <Circle cx={C} cy={C} r={C - 2} fill={t.raised} stroke={t.lineSoft} strokeWidth={2} />
              <ALine x1={C} y1={C} animatedProps={handProps} stroke={t.accent.main} strokeWidth={3} strokeLinecap="round" />
              <Circle cx={C} cy={C} r={4} fill={t.accent.main} />
              <ACircle animatedProps={knobProps} r={KNOB} fill={t.accent.main} />
              {(field === 'h' ? hourLabels : minLabels).map((lb) => {
                const p = pol(lb.deg, lb.r);
                const active = field === 'h' ? lb.n === h24 || (!mode24 && lb.n === h12) : lb.n === m;
                return (
                  <SvgText
                    key={`${lb.r}-${lb.label}`}
                    x={p.x}
                    y={p.y + 5}
                    fontSize={lb.r === R_IN ? 12 : 15}
                    fontFamily="Nunito_800ExtraBold"
                    fill={active ? t.accent.ink : t.muted}
                    textAnchor="middle"
                  >
                    {lb.label}
                  </SvgText>
                );
              })}
            </Svg>
          </View>
        </GestureDetector>
      )}

      {/* dial vs type entry (12/24h is driven by Settings) */}
      <Segmented
        value={manual ? 'type' : 'dial'}
        onChange={(v) => setManual(v === 'type')}
        options={[
          { value: 'dial', label: '🕐 Dial' },
          { value: 'type', label: '⌨ Type' },
        ]}
      />
    </View>
  );
}
