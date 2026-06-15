import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarView } from '@/components/calendar-view';
import { ChunkyButton } from '@/components/chunky';
import { IconCheck, IconPencil } from '@/components/icons';
import { Body, Display, Label, MiniBar, Segmented } from '@/components/ui';
import { DOW, DOW1, keyToDate, weekKeys } from '@/lib/dates';
import { dayLevel, mergedHistory, resolveRoutines, streakOf, useStore } from '@/state/store';
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

export default function Insights() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sub, setSub] = useState<'patterns' | 'calendar'>('patterns');
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollView>(null);

  const goSub = (v: 'patterns' | 'calendar') => {
    setSub(v);
    pagerRef.current?.scrollTo({ x: v === 'calendar' ? width : 0, animated: true });
  };
  const onPagerEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const v = Math.round(e.nativeEvent.contentOffset.x / width) === 1 ? 'calendar' : 'patterns';
    if (v !== sub) setSub(v);
  };

  const history = useStore((s) => s.history);
  const doneMap = useStore((s) => s.doneMap);
  const custom = useStore((s) => s.custom);
  const overrides = useStore((s) => s.overrides);
  const order = useStore((s) => s.order);
  const archived = useStore((s) => s.archived);
  const deleted = useStore((s) => s.deleted);
  const appDays = useStore((s) => s.appDays);
  const skips = useStore((s) => s.skips);
  const streaksOn = useStore((s) => s.settings.streaks);
  const neverDies = useStore((s) => s.settings.streakNeverDies);

  const data = useMemo(() => {
    const merged = mergedHistory({ history, doneMap });
    const routines = resolveRoutines({ custom, overrides, order, archived, deleted });

    const wk = weekKeys();
    const week = wk.map((k) => ({ key: k, count: dayLevel(merged, appDays, k), future: keyToDate(k) > new Date() }));
    const showedThisWeek = week.filter((d) => d.count > 0).length;
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

    return { week, showedThisWeek, streak, bestDow, activeDays, breakdown, skipHints };
  }, [history, doneMap, custom, overrides, order, archived, deleted, appDays, skips, neverDies]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 }}>
        <Display size={30} style={{ marginBottom: 12 }}>Insights</Display>
        <Segmented
          value={sub}
          onChange={goSub}
          options={[
            { value: 'patterns', label: '📊 Patterns' },
            { value: 'calendar', label: '🗓️ Calendar' },
          ]}
        />
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPagerEnd}
        style={{ flex: 1 }}
      >
        <View style={{ width }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
          <>
            <Label style={{ marginBottom: 10 }}>This week</Label>
              <View style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
                  {data.week.map((d, i) => (
                    <View key={d.key} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                      <View
                        style={{
                          width: 30, height: 30, borderRadius: 15,
                          backgroundColor: d.count >= 2 ? t.accent.main : d.count === 1 ? t.accent.soft : t.raised,
                          borderWidth: 2, borderColor: d.count ? t.accent.main : t.lineSoft,
                          opacity: d.future ? 0.4 : 1,
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {d.count > 0 && <IconCheck size={14} color={d.count >= 2 ? t.accent.ink : t.accent.main} />}
                      </View>
                      <Label style={{ fontSize: 11 }}>{DOW1[(i + 1) % 7]}</Label>
                    </View>
                  ))}
                </View>
                <Body size={14} color={t.muted} style={{ textAlign: 'center', marginTop: 14 }}>
                  Showed up{' '}
                  <Text style={{ color: t.text, fontFamily: 'BeVietnamPro_700Bold' }}>
                    {data.showedThisWeek} {data.showedThisWeek === 1 ? 'day' : 'days'}
                  </Text>{' '}
                  this week.
                </Body>
              </View>
          </>

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
        <View style={{ width }}>
          <CalendarView />
        </View>
      </ScrollView>
    </View>
  );
}
