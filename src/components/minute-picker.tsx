import React, { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, View } from 'react-native';

import { Display, Label } from '@/components/ui';
import { tapHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme/theme';

/* Swipe-to-pick minutes. A horizontal ruler that snaps tick-by-tick under a fixed
   centre marker — the centred value is the selection. Lighter and more tactile than
   plus/minus taps, which matters for picking a step that's 12 or 25 minutes. */

const MIN = 1;
const MAX = 90;
const ITEM_W = 50; // width of one tick column
const VALUES = Array.from({ length: MAX - MIN + 1 }, (_, i) => MIN + i);
const clampIdx = (i: number) => Math.max(0, Math.min(VALUES.length - 1, i));

export function MinutePicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const t = useTheme();
  const ref = useRef<ScrollView>(null);
  const [w, setW] = useState(0);
  const [sel, setSel] = useState(value);
  const pad = w > 0 ? (w - ITEM_W) / 2 : 0;

  // centre the incoming value once the rail width is known (mount + rotation)
  useEffect(() => {
    if (w <= 0) return;
    const idx = clampIdx(VALUES.indexOf(value));
    ref.current?.scrollTo({ x: idx * ITEM_W, animated: false });
    setSel(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w]);

  const idxOf = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    clampIdx(Math.round(e.nativeEvent.contentOffset.x / ITEM_W));

  // live readout + ratchet haptic as each tick passes centre
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const v = VALUES[idxOf(e)];
    if (v !== sel) {
      setSel(v);
      tapHaptic();
      onChange(v);
    }
  };

  return (
    <View>
      <View style={{ alignItems: 'center', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
          <Display size={46}>{sel}</Display>
          <Label style={{ fontSize: 14, marginBottom: 10 }}>min</Label>
        </View>
      </View>

      <View
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        style={{ height: 64, justifyContent: 'center' }}
      >
        {/* fixed centre marker the rail snaps under */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute', left: '50%', marginLeft: -(ITEM_W / 2),
            width: ITEM_W, height: 52, borderRadius: 14,
            backgroundColor: t.accent.soft, borderWidth: 2, borderColor: t.accent.main,
          }}
        />
        <ScrollView
          ref={ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_W}
          snapToAlignment="start"
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={onScroll}
          contentContainerStyle={{ paddingHorizontal: pad }}
        >
          {VALUES.map((v) => {
            const on = v === sel;
            return (
              <View key={v} style={{ width: ITEM_W, alignItems: 'center', justifyContent: 'center' }}>
                <Text
                  style={{
                    fontFamily: on ? 'Nunito_900Black' : 'Nunito_800ExtraBold',
                    fontSize: on ? 20 : 15,
                    color: on ? t.accent.main : t.faint,
                  }}
                >
                  {v}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
