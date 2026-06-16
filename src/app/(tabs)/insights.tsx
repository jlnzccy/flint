import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/chunky';
import { IconCal, IconCheck, IconPencil } from '@/components/icons';
import { Body, Chip, Display, Label, MiniBar } from '@/components/ui';
import { addDays, dateKey, DOW, DOW1, keyToDate } from '@/lib/dates';
import { mergedHistory, resolveRoutines, streakOf, useStore } from '@/state/store';
import { hexAlpha } from '@/theme/colors';
import { useTheme } from '@/theme/theme';

function StatChip({ value, label, sub }: { value: string; label: string; sub?: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, padding: 12 }}>
      <Display size={20} style={{ color: t.accent.main }}>{value}</Display>
      <Body size={12} style={{ marginTop: 3, fontFamily: 'BeVietnamPro_600SemiBold' }}>{label}</Body>
      {sub ? <Body size={11} color={t.faint} style={{ marginTop: 1 }}>{sub}</Body> : null}
    </View>
  );
}

/* GitHub-style contribution heat-grid (J1/V1). Classic orientation: 7 weekday rows
   (Mon→Sun, top→bottom), one column per week — oldest week left, this week right. No
   dates. The grid fills the card width: we measure the card, fit as many week-columns
   as the box+gap allow, then size each box so the columns span the full width.
   Each box ramps faintest → brightest with the day's activity; brightness increases
   monotonically (V3) so denser = brighter, never a dip. */
function HeatGrid() {
  const t = useTheme();
  const history = useStore((s) => s.history);
  const doneMap = useStore((s) => s.doneMap);
  const appDays = useStore((s) => s.appDays);
  const merged = useMemo(() => mergedHistory({ history, doneMap }), [history, doneMap]);
  const [w, setW] = useState(0);

  // faint → bright ramp (index 0 = rest); brightness strictly increases (V3): more
  // accent blended over the dark surface, topping out at solid accent.main.
  const ramp = [
    t.raised,
    hexAlpha(t.accent.main, 0.3),
    hexAlpha(t.accent.main, 0.55),
    hexAlpha(t.accent.main, 0.8),
    t.accent.main,
  ];
  const toneIdx = (k: string) => {
    const c = (merged[k] || []).length;
    if (c >= 3) return 4;
    if (c === 2) return 3;
    if (c === 1) return 2;
    return appDays[k] ? 1 : 0;
  };

  const ROWS = 7; // weekdays Mon→Sun
  const GAP = 5;
  const target = 15; // aim for ~15px squares, then fit columns + size to fill exactly
  const cols = w > 0 ? Math.max(1, Math.floor((w + GAP) / (target + GAP))) : 0;
  const box = cols > 0 ? (w - (cols - 1) * GAP) / cols : target;
  const radius = Math.round(box * 0.45);

  const today = new Date();
  const todayK = dateKey(today);
  const dow = (today.getDay() + 6) % 7; // 0 = Monday
  const curMon = addDays(today, -dow); // Monday of this week (rightmost column)

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {cols > 0 && (
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {Array.from({ length: cols }, (_, c) => {
            const weekMon = addDays(curMon, -(cols - 1 - c) * 7);
            return (
              <View key={c} style={{ gap: GAP }}>
                {Array.from({ length: ROWS }, (_, r) => {
                  const k = dateKey(addDays(weekMon, r));
                  if (k > todayK) return <View key={r} style={{ width: box, height: box }} />; // future
                  const idx = toneIdx(k);
                  return (
                    <View
                      key={r}
                      style={{
                        width: box, height: box, borderRadius: radius,
                        backgroundColor: ramp[idx],
                        borderWidth: 2, borderColor: idx ? 'transparent' : t.lineSoft,
                      }}
                    />
                  );
                })}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

/* Last-7-days show-up strip (P5). Trailing 7 days oldest→today, one marker per day.
   A check when ≥1 routine was finished that day; off days are a plain neutral dot —
   never an ✗ (quiet attendance, no shame). Today's weekday label is brought forward. */
function WeekStrip() {
  const t = useTheme();
  const history = useStore((s) => s.history);
  const doneMap = useStore((s) => s.doneMap);
  const merged = useMemo(() => mergedHistory({ history, doneMap }), [history, doneMap]);
  const today = new Date();
  const todayK = dateKey(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, -6 + i));
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {days.map((d) => {
        const k = dateKey(d);
        const done = (merged[k] || []).length > 0;
        const isToday = k === todayK;
        return (
          <View key={k} style={{ alignItems: 'center', gap: 8 }}>
            <Body size={11.5} color={isToday ? t.muted : t.faint}>{DOW1[d.getDay()]}</Body>
            <View
              style={{
                width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
                backgroundColor: done ? t.accent.soft : t.raised,
                borderWidth: 2, borderColor: done ? t.accent.main : t.lineSoft,
              }}
            >
              {done ? <IconCheck size={16} color={t.accent.main} /> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function Insights() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const history = useStore((s) => s.history);
  const doneMap = useStore((s) => s.doneMap);
  const custom = useStore((s) => s.custom);
  const overrides = useStore((s) => s.overrides);
  const order = useStore((s) => s.order);
  const archived = useStore((s) => s.archived);
  const deleted = useStore((s) => s.deleted);
  const skips = useStore((s) => s.skips);
  const streaksOn = useStore((s) => s.settings.streaks);
  const neverDies = useStore((s) => s.settings.streakNeverDies);

  const data = useMemo(() => {
    const merged = mergedHistory({ history, doneMap });
    const routines = resolveRoutines({ custom, overrides, order, archived, deleted });

    const streak = streakOf(merged, neverDies);

    const days = Object.keys(merged);
    const activeDays = days.filter((k) => merged[k].length).length;
    const dowCount = [0, 0, 0, 0, 0, 0, 0];
    days.forEach((k) => {
      if (merged[k].length) dowCount[keyToDate(k).getDay()]++;
    });
    const best = Math.max(...dowCount);
    const bestDow = best > 0 ? dowCount.indexOf(best) : -1;

    const breakdown = routines
      .map((r) => {
        const times = days.filter((k) => merged[k].includes(r.id)).length;
        const pct = activeDays ? Math.min(100, Math.round((times / activeDays) * 100)) : 0;
        return { r, times, pct };
      })
      .sort((a, b) => b.pct - a.pct);

    const skipHints: { id: string; idx: number; routine: (typeof routines)[number]; stepT: string }[] = [];
    Object.keys(skips).forEach((key) => {
      if (skips[key] >= 3) {
        const [rid, idxS] = key.split(':');
        const idx = +idxS;
        const r = routines.find((x) => x.id === rid);
        if (r && r.steps[idx]) skipHints.push({ id: rid, idx, routine: r, stepT: r.steps[idx].t });
      }
    });

    return { streak, bestDow, activeDays, breakdown, skipHints };
  }, [history, doneMap, custom, overrides, order, archived, deleted, skips, neverDies]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
        <Display size={30}>Insights</Display>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {/* heat-grid fills the card width (V1); no header, no range toggle (V4) */}
        <View style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, padding: 16 }}>
          <HeatGrid />
        </View>

        {/* this-week show-up strip — own card under the heat-grid (P5); calendar jump
            lives here now (V4), right-aligned beside the label */}
        <View style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, padding: 16, marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Label>This week</Label>
            <Chip onPress={() => router.push('/calendar')} style={{ paddingVertical: 7, paddingHorizontal: 10 }}>
              <IconCal size={16} color={t.muted} />
            </Chip>
          </View>
          <WeekStrip />
        </View>

        <Label style={{ marginTop: 24, marginBottom: 10 }}>Patterns</Label>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {streaksOn && <StatChip value={`🔥 ${data.streak}`} label="Streak" sub={neverDies ? 'never dies' : 'days'} />}
          <StatChip value={data.bestDow >= 0 ? DOW[data.bestDow] : '—'} label="Best day" sub="most active" />
          <StatChip value={String(data.activeDays)} label="Active days" sub="all time" />
        </View>

        <Label style={{ marginTop: 24, marginBottom: 10 }}>Routines</Label>
        <View style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, paddingVertical: 6, paddingHorizontal: 16 }}>
          {data.breakdown.length === 0 ? (
            <Body size={13.5} color={t.faint} style={{ textAlign: 'center', paddingVertical: 12 }}>
              Nothing yet. That's fine.
            </Body>
          ) : (
            data.breakdown.map(({ r, pct }, i) => (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 2 : 0, borderColor: t.lineSoft }}>
                <Text style={{ fontSize: 18 }}>{r.emoji}</Text>
                <Body size={14} style={{ flex: 1, fontFamily: 'BeVietnamPro_600SemiBold' }}>{r.name}</Body>
                <MiniBar pct={pct} color={t.col(r.color).main} style={{ width: 90 }} />
                <Display size={13} style={{ width: 38, textAlign: 'right', color: t.muted }}>{pct}%</Display>
              </View>
            ))
          )}
        </View>

        {data.skipHints.length > 0 && (
          <>
            <Label style={{ marginTop: 24, marginBottom: 10 }}>Often skipped</Label>
            <View style={{ gap: 10 }}>
              {data.skipHints.map((h) => (
                <View key={h.id + h.idx} style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, padding: 16 }}>
                  <Body size={14.5}>
                    <Text style={{ fontFamily: 'BeVietnamPro_700Bold' }}>"{h.stepT}"</Text> gets skipped a lot.
                  </Body>
                  <ChunkyButton
                    ghost
                    fontSize={14}
                    pad={[11, 18]}
                    style={{ marginTop: 12, alignSelf: 'flex-start' }}
                    onPress={() => router.push(`/editor?id=${h.id}&focusStep=${h.idx}`)}
                  >
                    <IconPencil size={15} color={t.text} />
                    <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: t.text, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                      Split this step
                    </Text>
                  </ChunkyButton>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
