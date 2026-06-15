import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { IconChevL, IconChevR } from '@/components/icons';
import { Display, Label, StepperBtn } from '@/components/ui';
import { dateKey, keyToDate, MONTHS, todayKey } from '@/lib/dates';
import { tapHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme/theme';

/* month-grid date picker (Monday-first), for task reminders/deadlines */
export function DatePicker({
  value,
  onChange,
  allowPast = false,
}: {
  value: string | null;
  onChange: (k: string) => void;
  allowPast?: boolean;
}) {
  const t = useTheme();
  const init = value ? keyToDate(value) : new Date();
  const [ym, setYm] = useState({ y: init.getFullYear(), m: init.getMonth() });

  const first = new Date(ym.y, ym.m, 1);
  const lead = (first.getDay() + 6) % 7;
  const daysIn = new Date(ym.y, ym.m + 1, 0).getDate();
  // always render 6 rows (42 cells) so the grid height is identical every month
  // and nothing below the picker shifts when you page between months
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  while (cells.length < 42) cells.push(null);
  const todayK = todayKey();

  const shift = (n: number) =>
    setYm((p) => {
      const d = new Date(p.y, p.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <StepperBtn onPress={() => shift(-1)} label="Previous month">
          <IconChevL color={t.text} />
        </StepperBtn>
        <Display size={16}>{MONTHS[ym.m]} {ym.y}</Display>
        <StepperBtn onPress={() => shift(1)} label="Next month">
          <IconChevR color={t.text} />
        </StepperBtn>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Label key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11 }}>{d}</Label>
        ))}
      </View>

      <View style={{ gap: 6 }}>
        {Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) => (
          <View key={row} style={{ flexDirection: 'row', gap: 6 }}>
            {Array.from({ length: 7 }, (_, col) => {
              const d = cells[row * 7 + col] ?? null;
              if (d === null) return <View key={'b' + col} style={{ flex: 1, aspectRatio: 1 }} />;
              const k = dateKey(new Date(ym.y, ym.m, d));
              const sel = k === value;
              const past = !allowPast && k < todayK;
              return (
                <Pressable
                  key={k}
                  disabled={past}
                  onPressIn={() => !past && tapHaptic()}
                  onPress={() => onChange(k)}
                  style={{
                    flex: 1, aspectRatio: 1, borderRadius: 11,
                    borderWidth: 2,
                    borderColor: sel ? t.accent.deep : k === todayK ? t.accent.main : 'transparent',
                    backgroundColor: sel ? t.accent.main : t.raised,
                    opacity: past ? 0.32 : 1,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: sel ? t.accent.ink : t.muted }}>
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
