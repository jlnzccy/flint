import React, { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, View } from 'react-native';

import { Display, Label } from '@/components/ui';
import { tapHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme/theme';

const ITEM_W = 50; // width of one tick column

export function WheelPicker({
  value,
  options,
  unit,
  onChange,
}: {
  value: number;
  options: number[];
  unit: string;
  onChange: (v: number) => void;
}) {
  const t = useTheme();
  const ref = useRef<ScrollView>(null);
  const [w, setW] = useState(0);
  const [sel, setSel] = useState(value);
  const clampIdx = (i: number) => Math.max(0, Math.min(options.length - 1, i));
  const pad = w > 0 ? (w - ITEM_W) / 2 : 0;

  const initializedRef = useRef(false);
  const isInteractingRef = useRef(false);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // reset initialization state if layout width is lost/reset
  useEffect(() => {
    if (w === 0) {
      initializedRef.current = false;
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    }
  }, [w]);

  // clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);

  // keep selected value in sync with prop if changed from outside
  useEffect(() => {
    setSel(value);
    if (w > 0) {
      const idx = clampIdx(options.indexOf(value));
      // Only scroll programmatically if the position is not yet initialized, OR
      // if the external value changed and the user is not actively scrolling.
      // This prevents the state-update loop from fighting touch gestures or momentum.
      if (!initializedRef.current || (!isInteractingRef.current && value !== sel)) {
        const runScroll = () => {
          ref.current?.scrollTo({ x: idx * ITEM_W, animated: false });
        };
        if (!initializedRef.current) {
          if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
          initTimeoutRef.current = setTimeout(runScroll, 50);
          initializedRef.current = true;
        } else {
          runScroll();
        }
      }
    }
  }, [value, w, options]);

  const idxOf = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    clampIdx(Math.round(e.nativeEvent.contentOffset.x / ITEM_W));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const v = options[idxOf(e)];
    if (v !== sel) {
      setSel(v);
      tapHaptic();
      onChange(v);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ alignItems: 'center', marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
          <Display size={36}>{sel}</Display>
          <Label style={{ fontSize: 13, marginBottom: 6 }}>{unit}</Label>
        </View>
      </View>

      <View
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        style={{ height: 56, justifyContent: 'center' }}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute', left: '50%', marginLeft: -(ITEM_W / 2),
            width: ITEM_W, height: 44, borderRadius: 12,
            backgroundColor: t.accent.soft, borderWidth: 2, borderColor: t.accent.main,
          }}
        />
        <ScrollView
          ref={ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_W}
          snapToAlignment="start"
          decelerationRate="normal"
          disableIntervalMomentum={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onScrollBeginDrag={() => {
            isInteractingRef.current = true;
          }}
          onScrollEndDrag={(e) => {
            const velocityX = e.nativeEvent.velocity?.x ?? 0;
            if (velocityX === 0) {
              isInteractingRef.current = false;
            }
          }}
          onMomentumScrollEnd={() => {
            isInteractingRef.current = false;
          }}
          contentContainerStyle={{ paddingHorizontal: pad }}
        >
          {options.map((v, i) => {
            const on = v === sel;
            return (
              <View key={i} style={{ width: ITEM_W, alignItems: 'center', justifyContent: 'center' }}>
                <Text
                  style={{
                    fontFamily: on ? 'Nunito_900Black' : 'Nunito_800ExtraBold',
                    fontSize: on ? 18 : 14,
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

export function MinutePicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const values = Array.from({ length: 90 }, (_, i) => i + 1);
  return <WheelPicker value={value} options={values} unit="min" onChange={onChange} />;
}
