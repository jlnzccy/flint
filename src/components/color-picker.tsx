import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { BottomSheet } from '@/components/sheet';
import { ChunkyButton } from '@/components/chunky';
import { Body, FlintInput, Label } from '@/components/ui';
import { hexDarken, hslToHex, inkOn } from '@/theme/colors';
import { useTheme } from '@/theme/theme';

const STOPS = 12; // sampled gradient stops for a continuous (non-blocky) track

/* tap-or-drag gradient track. The thumb is driven on the UI thread by a shared
   value so dragging glides at 60fps; the colour value commits back to React state. */
function Track({
  value, onChange, colorAt,
}: { value: number; onChange: (v: number) => void; colorAt: (frac: number) => string }) {
  const t = useTheme();
  const [w, setW] = useState(0);
  const wSv = useSharedValue(0);
  const tx = useSharedValue(0);
  const draggingRef = useRef(false);
  const gid = useMemo(() => 'g' + Math.random().toString(36).slice(2), []);
  const stops = useMemo(
    () => Array.from({ length: STOPS }, (_, i) => ({ off: i / (STOPS - 1), col: colorAt(i / (STOPS - 1)) })),
    [colorAt]
  );

  // keep the thumb synced to the value when the change came from outside a drag
  useEffect(() => {
    if (!draggingRef.current) tx.value = value * w;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, w]);

  const setDragging = (v: boolean) => {
    draggingRef.current = v;
  };
  const commit = (frac: number) => onChange(Math.min(1, Math.max(0, frac)));

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      if (wSv.value <= 0) return;
      runOnJS(setDragging)(true);
      const x = Math.min(wSv.value, Math.max(0, e.x));
      tx.value = x;
      runOnJS(commit)(x / wSv.value);
    })
    .onUpdate((e) => {
      if (wSv.value <= 0) return;
      const x = Math.min(wSv.value, Math.max(0, e.x));
      tx.value = x;
      runOnJS(commit)(x / wSv.value);
    })
    .onFinalize(() => runOnJS(setDragging)(false));

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value - 13 }] }));

  return (
    <GestureDetector gesture={pan}>
      <View
        collapsable={false}
        onLayout={(e) => {
          const width = e.nativeEvent.layout.width;
          setW(width);
          wSv.value = width;
          if (!draggingRef.current) tx.value = value * width;
        }}
        style={{ height: 36, justifyContent: 'center' }}
      >
        <View style={{ height: 14, borderRadius: 99, overflow: 'hidden', borderWidth: 2, borderColor: t.lineSoft }}>
          {w > 0 && (
            <Svg width={w} height={14}>
              <Defs>
                <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
                  {stops.map((s) => (
                    <Stop key={s.off} offset={s.off} stopColor={s.col} />
                  ))}
                </LinearGradient>
              </Defs>
              <Rect width={w} height={14} fill={`url(#${gid})`} />
            </Svg>
          )}
        </View>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute', left: 0,
              width: 26, height: 26, borderRadius: 13,
              backgroundColor: colorAt(value), borderWidth: 3, borderColor: t.text,
            },
            thumb,
          ]}
        />
      </View>
    </GestureDetector>
  );
}

interface ColorPickerProps {
  open: boolean;
  initial: string; // "#rrggbb"
  onClose: () => void;
  onPick: (hex: string) => void;
}

export function ColorPickerSheet({ open, initial, onClose, onPick }: ColorPickerProps) {
  const t = useTheme();
  const [hue, setHue] = useState(20);
  const [light, setLight] = useState(0.55);
  const [hex, setHex] = useState(initial);
  const [typed, setTyped] = useState(initial);

  useEffect(() => {
    if (open) {
      setHex(initial);
      setTyped(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fromSliders = (h: number, l: number) => {
    const v = hslToHex(h, 0.72, l);
    setHex(v);
    setTyped(v);
  };

  const applyTyped = (raw: string) => {
    let v = raw.trim().toLowerCase();
    if (!v.startsWith('#')) v = '#' + v;
    if (/^#[0-9a-f]{6}$/.test(v)) setHex(v);
    setTyped(v);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Custom color">
      <View
        style={{
          height: 64, borderRadius: 18, backgroundColor: hex,
          borderWidth: 2, borderColor: t.lineSoft,
          alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}
      >
        <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: inkOn(hex), letterSpacing: 1 }}>
          {hex.toUpperCase()}
        </Text>
      </View>

      <Label style={{ marginBottom: 4 }}>Hue</Label>
      <Track
        value={hue / 360}
        onChange={(v) => {
          const h = Math.round(v * 360);
          setHue(h);
          fromSliders(h, light);
        }}
        colorAt={(f) => hslToHex(f * 360, 0.72, 0.55)}
      />

      <Label style={{ marginTop: 12, marginBottom: 4 }}>Brightness</Label>
      <Track
        value={light}
        onChange={(v) => {
          const l = Math.min(0.85, Math.max(0.2, v));
          setLight(l);
          fromSliders(hue, l);
        }}
        colorAt={(f) => hslToHex(hue, 0.72, 0.2 + f * 0.65)}
      />

      <Label style={{ marginTop: 14, marginBottom: 6 }}>Hex</Label>
      <FlintInput
        value={typed}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={7}
        placeholder="#ff6b35"
        onChangeText={applyTyped}
      />
      <Body size={12} color={t.faint} style={{ marginTop: 6 }}>
        Sliders or hex — whatever's faster.
      </Body>

      <ChunkyButton
        color={hex}
        deep={hexDarken(hex, 0.62)}
        ink={inkOn(hex)}
        fontSize={16}
        pad={[15, 24]}
        style={{ marginTop: 16 }}
        onPress={() => {
          onPick(hex);
          onClose();
        }}
      >
        Use this color
      </ChunkyButton>
    </BottomSheet>
  );
}
