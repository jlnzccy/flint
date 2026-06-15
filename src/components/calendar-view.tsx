import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { IconCheck, IconChevL, IconChevR } from '@/components/icons';
import { Body, Display, EmojiTile, Label, StepperBtn } from '@/components/ui';
import { routineOnDay } from '@/data/defaults';
import { dateKey, keyToDate, MONTHS, todayKey } from '@/lib/dates';
import { tapHaptic } from '@/lib/haptics';
import { dayLevel, mergedHistory, resolveRoutines, useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';

export function CalendarView() {
  const t = useTheme();
  const history = useStore((s) => s.history);
  const doneMap = useStore((s) => s.doneMap);
  const custom = useStore((s) => s.custom);
  const overrides = useStore((s) => s.overrides);
  const order = useStore((s) => s.order);
  const appDays = useStore((s) => s.appDays);
  const archived = useStore((s) => s.archived);
  const deleted = useStore((s) => s.deleted);

  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [sel, setSel] = useState<string | null>(null);

  const merged = useMemo(() => mergedHistory({ history, doneMap }), [history, doneMap]);
  // all (incl. archived) for resolving history; active set drives "scheduled on this day"
  const allRoutines = useMemo(
    () => resolveRoutines({ custom, overrides, order, archived: [], deleted }),
    [custom, overrides, order, deleted]
  );
  const activeRoutines = useMemo(
    () => resolveRoutines({ custom, overrides, order, archived, deleted }),
    [custom, overrides, order, archived, deleted]
  );
  const byId = Object.fromEntries(allRoutines.map((r) => [r.id, r]));

  const first = new Date(ym.y, ym.m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const daysIn = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];

  let showedUp = 0;
  for (let d = 1; d <= daysIn; d++) {
    if (dayLevel(merged, appDays, dateKey(new Date(ym.y, ym.m, d))) > 0) showedUp++;
  }

  const shift = (n: number) => {
    setSel(null);
    setYm((p) => {
      const d = new Date(p.y, p.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const todayK = todayKey();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      <Body size={15} color={t.muted} style={{ marginBottom: 18 }}>
        Showed up <Text style={{ color: t.text, fontFamily: 'BeVietnamPro_700Bold' }}>{showedUp} {showedUp === 1 ? 'day' : 'days'}</Text> in {MONTHS[ym.m]}.
      </Body>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <StepperBtn onPress={() => shift(-1)} label="Previous month">
          <IconChevL color={t.text} />
        </StepperBtn>
        <Display size={17}>{MONTHS[ym.m]} {ym.y}</Display>
        <StepperBtn onPress={() => shift(1)} label="Next month">
          <IconChevR color={t.text} />
        </StepperBtn>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Label key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11 }}>{d}</Label>
        ))}
      </View>

      <View style={{ gap: 7 }}>
        {Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) => (
          <View key={row} style={{ flexDirection: 'row', gap: 7 }}>
            {Array.from({ length: 7 }, (_, col) => {
              const d = cells[row * 7 + col] ?? null;
              if (d === null) return <View key={'b' + col} style={{ flex: 1, aspectRatio: 1 }} />;
              const k = dateKey(new Date(ym.y, ym.m, d));
              const level = dayLevel(merged, appDays, k);
              const isToday = k === todayK;
              const isFuture = new Date(ym.y, ym.m, d) > now;
              return (
                <Pressable
                  key={k}
                  onPressIn={() => tapHaptic()}
                  onPress={() => setSel(sel === k ? null : k)}
                  style={{
                    flex: 1, aspectRatio: 1, borderRadius: 11,
                    borderWidth: 2,
                    borderColor: sel === k ? t.text : isToday ? t.accent.main : 'transparent',
                    backgroundColor: level === 2 ? t.accent.main : level === 1 ? t.accent.soft : t.raised,
                    opacity: isFuture ? 0.32 : 1,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: level === 2 ? t.accent.ink : t.muted }}>{d}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, justifyContent: 'center', marginTop: 18 }}>
        {([['Rest', t.raised], ['Showed up', t.accent.soft], ['2+', t.accent.main]] as const).map(([lbl, bg]) => (
          <View key={lbl} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 16, height: 16, borderRadius: 5, backgroundColor: bg, borderWidth: 2, borderColor: t.lineSoft }} />
            <Body size={12} color={t.faint}>{lbl}</Body>
          </View>
        ))}
      </View>

      {sel && (() => {
        const selDow = keyToDate(sel).getDay();
        const doneSet = new Set(merged[sel] || []);
        const isFutureSel = keyToDate(sel) > now;
        // scheduled on that day + anything done that day (e.g. anytime / since-archived)
        const ids = [
          ...activeRoutines.filter((r) => routineOnDay(r, selDow)).map((r) => r.id),
          ...(merged[sel] || []),
        ].filter((id, i, a) => a.indexOf(id) === i);
        return (
          <Animated.View
            entering={FadeIn.duration(160)}
            style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, padding: 16, marginTop: 20 }}
          >
            <Label style={{ marginBottom: 10 }}>
              {keyToDate(sel).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Label>
            {ids.length === 0 ? (
              <Body size={13.5} color={t.faint}>A rest day. Nothing scheduled.</Body>
            ) : (
              <View style={{ gap: 10 }}>
                {ids.map((id) => {
                  const r = byId[id];
                  if (!r) return null;
                  const c = t.col(r.color);
                  const done = doneSet.has(id);
                  return (
                    <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <EmojiTile emoji={r.emoji} size={36} radius={11} soft={c.soft} border={done ? c.main : t.lineSoft} dim={!done} />
                      <Body size={15} style={{ flex: 1, fontFamily: 'BeVietnamPro_600SemiBold', color: done ? t.text : t.muted }}>{r.name}</Body>
                      {done ? (
                        <IconCheck size={16} color={t.green.main} />
                      ) : (
                        <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: t.lineSoft }} />
                      )}
                    </View>
                  );
                })}
              </View>
            )}
            {isFutureSel && ids.length > 0 && (
              <Body size={12.5} color={t.faint} style={{ marginTop: 12 }}>Coming up.</Body>
            )}
          </Animated.View>
        );
      })()}

      <Body size={12.5} color={t.faint} style={{ textAlign: 'center', marginTop: 22 }}>
        Empty days are rest.
      </Body>
    </ScrollView>
  );
}
