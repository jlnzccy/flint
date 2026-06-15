import React, { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ChunkyButton } from '@/components/chunky';
import { IconPause, IconPlay } from '@/components/icons';
import { Slider } from '@/components/slider';
import { Body, Chip, Display, Label, Segmented } from '@/components/ui';
import { tapHaptic } from '@/lib/haptics';
import { ISO_BAND_HZ, startTone, stopTone, updateTone } from '@/lib/tones';
import { EASE_OUT } from '@/theme/motion';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';

/* row metadata parallel to ISO_BAND_HZ [1,2,3,4,6,8,12,16,24,32] (mynoise table) */
const BAND_META: { band: string; tag: string }[] = [
  { band: 'Delta', tag: 'Lethargic' },
  { band: 'Delta', tag: 'Deep Sleep' },
  { band: 'Delta', tag: 'Dreamless' },
  { band: 'Theta', tag: 'Drowsy' },
  { band: 'Theta', tag: 'Fantasy' },
  { band: 'Alpha', tag: 'Relaxed' },
  { band: 'Alpha', tag: 'Conscious' },
  { band: 'Beta', tag: 'Focused' },
  { band: 'Beta', tag: 'Active' },
  { band: 'Gamma', tag: 'Alert' },
];

/* presets are saved mixer setups — a level (0..1) per band, blended together */
const PRESETS: { label: string; levels: number[]; surprise?: boolean }[] = [
  { label: 'Deep Sleep', levels: [0.6, 1, 0.7, 0.3, 0, 0, 0, 0, 0, 0] },
  { label: 'Deep Meditation', levels: [0, 0, 0.4, 0.9, 1, 0.5, 0, 0, 0, 0] },
  { label: 'Relaxed', levels: [0, 0, 0, 0, 0.4, 1, 0.7, 0, 0, 0] },
  { label: 'Inspired', levels: [0, 0, 0, 0.5, 1, 0.6, 0.2, 0, 0, 0] },
  { label: 'Concentrated', levels: [0, 0, 0, 0, 0, 0, 0.4, 1, 0.6, 0] },
  { label: 'Learning', levels: [0, 0, 0, 0, 0, 0.4, 1, 0.7, 0.2, 0] },
  { label: 'Alert', levels: [0, 0, 0, 0, 0, 0, 0, 0.3, 0.7, 1] },
  { label: 'Mind Power', levels: [0, 0, 0, 0, 0, 0, 0, 0.5, 1, 0.6] },
  { label: 'Surprise!', levels: [], surprise: true },
];

const BAND_COLOR: Record<string, string> = {
  Delta: 'purple',
  Theta: 'teal',
  Alpha: 'green',
  Beta: 'accent',
  Gamma: 'gold',
};

/* band name for an arbitrary rate — ranges line up 1:1 with the table */
function bandOf(hz: number): string {
  if (hz < 4) return 'Delta';
  if (hz < 8) return 'Theta';
  if (hz < 13) return 'Alpha';
  if (hz < 30) return 'Beta';
  return 'Gamma';
}

const levelsEqual = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 0.001);

function Card({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <View style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, overflow: 'hidden' }}>{children}</View>;
}

/* ── Pulse visualizer — orbs breathing at each band's rate, brightness = level ── */
function Orb({ active, rate, color, level, index, size }: { active: boolean; rate: number; color: string; level: number; index: number; size: number }) {
  const lit = active && level > 0.02;
  const sv = useSharedValue(1);
  useEffect(() => {
    cancelAnimation(sv);
    if (!lit) {
      sv.value = withTiming(1, { duration: 220 });
      return;
    }
    // clamp the visual rate so fast bands don't strobe (photosensitivity)
    const half = Math.max(90, 1000 / Math.max(0.5, rate) / 2);
    sv.value = withDelay(
      index * 55,
      withRepeat(withSequence(withTiming(1.4, { duration: half, easing: EASE_OUT }), withTiming(0.86, { duration: half, easing: EASE_OUT })), -1, false)
    );
    return () => cancelAnimation(sv);
  }, [lit, rate, index, sv]);

  const st = useAnimatedStyle(() => {
    const pulse = 0.5 + 0.5 * ((sv.value - 0.86) / (1.4 - 0.86));
    const base = lit ? 0.18 + 0.82 * level : 0.22;
    return { transform: [{ scale: sv.value }], opacity: base * (lit ? pulse : 1) };
  });

  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, st]} />;
}

function PulseRow({ orbs, active, size, gap }: { orbs: { rate: number; color: string; level: number }[]; active: boolean; size: number; gap: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap, height: 56 }}>
      {orbs.map((o, i) => (
        <Orb key={i} active={active} rate={o.rate} color={o.color} level={o.level} index={i} size={size} />
      ))}
    </View>
  );
}

/* label + big value header used above a slider */
function Stat({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
      <Label>{label}</Label>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5 }}>
        <Display size={22} style={{ color }}>{value}</Display>
        <Label color={t.faint} style={{ marginBottom: 3 }}>{unit}</Label>
      </View>
    </View>
  );
}

export default function Sounds() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const sound = useStore((s) => s.sound);
  const playing = useStore((s) => s.soundPlaying);
  const { setSound, setSoundPlaying } = useStore.getState();

  const isIso = sound.mode === 'isochronic';
  const levels = sound.isoLevels;

  // dominant band drives the accent color, caption + play button
  const domIdx = isIso ? levels.reduce((bi, l, i, arr) => (l > arr[bi] ? i : bi), 0) : 0;
  const domLevel = isIso ? levels[domIdx] ?? 0 : 1;
  const activeBand = isIso ? (domLevel > 0 ? BAND_META[domIdx].band : 'Alpha') : bandOf(sound.beatHz);
  const activeHz = isIso ? ISO_BAND_HZ[domIdx] : sound.beatHz;
  const cs = t.col(BAND_COLOR[activeBand]);

  const orbs = isIso
    ? ISO_BAND_HZ.map((hz, i) => ({ rate: hz, level: levels[i] ?? 0, color: t.col(BAND_COLOR[BAND_META[i].band]).main }))
    : [0, 1, 2, 3, 4].map(() => ({ rate: sound.beatHz, level: 1, color: cs.main }));
  const vizActive = playing && (isIso ? levels.some((l) => l > 0.02) : true);

  // keep the engine in step with the config while it's running
  useEffect(() => {
    if (playing) updateTone(sound);
  }, [sound, playing]);

  const toggle = () => {
    if (playing) {
      stopTone();
      setSoundPlaying(false);
    } else {
      startTone(sound);
      setSoundPlaying(true);
    }
  };

  const setLevel = (i: number, v: number) => {
    const next = levels.slice();
    next[i] = v;
    setSound({ isoLevels: next });
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    if (p.surprise) {
      const next = Array(ISO_BAND_HZ.length).fill(0);
      const n = 2 + Math.floor(Math.random() * 2);
      for (let k = 0; k < n; k++) next[Math.floor(Math.random() * next.length)] = 0.5 + Math.random() * 0.5;
      setSound({ isoLevels: next });
    } else {
      setSound({ isoLevels: p.levels.slice() });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        <Display size={30}>Sounds</Display>
        <Body size={14} color={t.faint} style={{ marginTop: 4 }}>
          Brainwave tones to settle in or lock on.
        </Body>

        {/* visualizer */}
        <View style={{ marginTop: 18, marginBottom: 18, alignItems: 'center' }}>
          <PulseRow orbs={orbs} active={vizActive} size={isIso ? 13 : 18} gap={isIso ? 9 : 16} />
          <Body size={13} color={vizActive ? cs.main : t.faint} style={{ marginTop: 8, fontFamily: 'Nunito_800ExtraBold' }}>
            {isIso ? (domLevel > 0 ? `${activeHz} Hz · ${activeBand}` : 'Raise a band to begin') : `${activeHz} Hz · ${activeBand}`}
          </Body>
        </View>

        {/* mode */}
        <Segmented
          value={sound.mode}
          onChange={(v) => setSound({ mode: v })}
          options={[
            { value: 'binaural', label: 'Binaural' },
            { value: 'isochronic', label: 'Isochronic' },
          ]}
        />

        {!isIso ? (
          <View style={{ marginTop: 16 }}>
            <Card>
              <View style={{ padding: 18 }}>
                <Stat label="Base frequency" value={String(sound.baseHz)} unit="Hz" color={t.text} />
                <Slider value={sound.baseHz} min={100} max={440} step={1} color={cs.main} onChange={(v) => setSound({ baseHz: v })} />

                <View style={{ height: 14 }} />
                <Stat label={`Beat · ${activeBand}`} value={String(sound.beatHz)} unit="Hz" color={cs.main} />
                <Slider value={sound.beatHz} min={1} max={30} step={1} color={cs.main} onChange={(v) => setSound({ beatHz: v })} />
              </View>
            </Card>
            <Body size={12.5} color={t.faint} style={{ marginTop: 10, paddingHorizontal: 2 }}>
              Use headphones — each ear gets a slightly different pitch and your brain fills in the beat.
            </Body>
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            <Label style={{ marginBottom: 8 }}>Presets</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {PRESETS.map((p) => {
                const active = !p.surprise && levelsEqual(levels, p.levels);
                return (
                  <Chip key={p.label} active={active} color={active ? cs.main : undefined} onPress={() => applyPreset(p)}>
                    {p.label}
                  </Chip>
                );
              })}
            </View>

            <Label style={{ marginBottom: 8 }}>Mix</Label>
            <Card>
              {ISO_BAND_HZ.map((hz, i) => {
                const m = BAND_META[i];
                const c = t.col(BAND_COLOR[m.band]);
                const lv = levels[i] ?? 0;
                const on = lv > 0.02;
                return (
                  <View key={hz} style={{ paddingTop: 12, paddingBottom: 6, paddingHorizontal: 16, borderTopWidth: i === 0 ? 0 : 2, borderColor: t.lineSoft }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.main, opacity: on ? 1 : 0.3 }} />
                      <Display size={16} style={{ color: c.main, width: 52 }}>{hz} Hz</Display>
                      <Body size={13} color={on ? t.text : t.muted} style={{ flex: 1 }}>
                        {m.band} · {m.tag}
                      </Body>
                      <Label color={on ? c.main : t.faint}>{Math.round(lv * 100)}%</Label>
                    </View>
                    <Slider value={lv} min={0} max={1} step={0.05} color={c.main} onChange={(v) => setLevel(i, v)} />
                  </View>
                );
              })}
            </Card>
            <Body size={12.5} color={t.faint} style={{ marginTop: 10, paddingHorizontal: 2 }}>
              No headphones needed. Blend bands like a mixer, or tap a preset.
            </Body>
          </View>
        )}

        {/* volume */}
        <View style={{ marginTop: 18 }}>
          <Card>
            <View style={{ padding: 18 }}>
              <Stat label="Volume" value={String(Math.round(sound.volume * 100))} unit="%" color={t.text} />
              <Slider value={sound.volume} min={0} max={1} step={0.05} color={cs.main} onChange={(v) => setSound({ volume: v })} />
            </View>
          </Card>
        </View>

        {/* play / stop */}
        <ChunkyButton
          color={playing ? t.rose.main : cs.main}
          deep={playing ? t.rose.deep : cs.deep}
          ink={playing ? t.rose.ink : cs.ink}
          onPress={toggle}
          pad={[17, 24]}
          style={{ marginTop: 20 }}
        >
          {playing ? <IconPause size={22} color={t.rose.ink} /> : <IconPlay size={22} color={cs.ink} />}
          <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 17, letterSpacing: 0.85, textTransform: 'uppercase', color: playing ? t.rose.ink : cs.ink }}>
            {playing ? 'Stop' : 'Play'}
          </Text>
        </ChunkyButton>
      </ScrollView>
    </View>
  );
}
