import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/chunky';
import { IconCal, IconPencil } from '@/components/icons';
import { Body, Chip, Display, Label, MiniBar, Segmented } from '@/components/ui';
import { addDays, dateKey, DOW, keyToDate } from '@/lib/dates';
import { mergedHistory, resolveRoutines, streakOf, useStore } from '@/state/store';
import { hexAlpha } from '@/theme/colors';
import { useTheme } from '@/theme/theme';

function StatChip({ value, label, sub }: { value: string; label: string; sub?: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, padding: 14 }}>
      <Display size={22} style={{ color: t.accent.main }}>{value}</Display>
      <Body size={12.5} style={{ marginTop: 3, fontFamily: 'BeVietnamPro_600SemiBold' }}>{label}</Body>
      {sub ? <Body size={11.5} color={t.faint} style={{ marginTop: 2 }}>{sub}</Body> : null}
    </View>
  );
}

/* GitHub-style contribution heat-grid (J1). Weekday-aligned rows of 7, oldest week
   on top, no dates. Each box ramps faded → deep with the day's activity: a faint
   tint for showing up / one thing, up to deep accent for a full day. Boxes fill the
   card width. Window is the J2 range. */
function HeatGrid({ days }: { days: number }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const history = useStore((s) => s.history);
  const doneMap = useStore((s) => s.doneMap);
  const appDays = useStore((s) => s.appDays);
  const merged = useMemo(() => mergedHistory({ history, doneMap }), [history, doneMap]);

  // faded → deep ramp (index 0 = rest); richer/deeper cell = more done that day
  const ramp = [t.raised, hexAlpha(t.accent.main, 0.24), hexAlpha(t.accent.main, 0.5), t.accent.main, t.accent.deep];
  const toneIdx = (k: string) => {
    const c = (merged[k] || []).length;
    if (c >= 3) return 4;
    if (c === 2) return 3;
    if (c === 1) return 2;
    return appDays[k] ? 1 : 0;
  };

  const today = new Date();
  const start = addDays(today, -(days - 1));
  const lead = (start.getDay() + 6) % 7; // Monday-first column alignment
  const cells: (string | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => dateKey(addDays(start, i))),
  ];
  while (cells.length % 7 !== 0) cells.push(null); // fill the trailing partial week
  const rows = cells.length / 7;

  const COLS = 7;
  const GAP = 6;
  // fill the card's inner width: screen − 20·2 page margin − 16·2 card padding
  const box = Math.floor((width - 40 - 32 - GAP * (COLS - 1)) / COLS);
  const gridW = COLS * box + (COLS - 1) * GAP;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: gridW, gap: GAP }}>
        {Array.from({ length: rows }, (_, r) => (
          <View key={r} style={{ flexDirection: 'row', gap: GAP }}>
            {Array.from({ length: COLS }, (_, col) => {
              const k = cells[r * COLS + col];
              if (!k) return <View key={col} style={{ width: box, height: box }} />;
              const idx = toneIdx(k);
              return (
                <View
                  key={col}
                  style={{
                    width: box, height: box, borderRadius: 7,
                    backgroundColor: ramp[idx],
                    borderWidth: 2, borderColor: idx ? 'transparent' : t.lineSoft,
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* less → more ramp; empty days read as rest, never failure */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 16 }}>
        <Body size={11.5} color={t.faint}>Rest</Body>
        {ramp.map((c, i) => (
          <View
            key={i}
            style={{ width: 13, height: 13, borderRadius: 4, backgroundColor: c, borderWidth: 2, borderColor: i ? 'transparent' : t.lineSoft }}
          />
        ))}
        <Body size={11.5} color={t.faint}>More</Body>
      </View>
    </View>
  );
}

export default function Insights() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<'7d' | '30d'>('30d');

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
        {/* the heat-grid card owns its own range toggle + calendar jump (top of card) */}
        <View style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Segmented
                small
                value={range}
                onChange={setRange}
                options={[
                  { value: '7d', label: '7d' },
                  { value: '30d', label: '30d' },
                ]}
              />
            </View>
            <Chip onPress={() => router.push('/calendar')} style={{ paddingVertical: 7, paddingHorizontal: 10 }}>
              <IconCal size={16} color={t.muted} />
            </Chip>
          </View>
          <HeatGrid days={range === '7d' ? 7 : 30} />
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
