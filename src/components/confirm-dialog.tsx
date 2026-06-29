import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { ChunkyButton } from '@/components/chunky';
import { Body, Display } from '@/components/ui';
import { ConfirmOpts, registerConfirm } from '@/lib/confirm';
import { SPRING, TIMING } from '@/theme/motion';
import { useTheme } from '@/theme/theme';

interface Active extends ConfirmOpts {
  onConfirm: () => void;
}

/* Mounted once at the app root (above the tabs) so it sits over everything
   and never shows the native OS alert. */
export function ConfirmHost() {
  const t = useTheme();
  const [active, setActive] = useState<Active | null>(null);
  const scale = useSharedValue(0.9);
  const op = useSharedValue(0);

  useEffect(() => {
    registerConfirm((opts, onConfirm) => setActive({ ...opts, onConfirm }));
    return () => registerConfirm(null);
  }, []);

  // re-run a gentle spring pop every time a dialog opens
  useEffect(() => {
    if (active) {
      scale.value = 0.9;
      op.value = 0;
      scale.value = withSpring(1, SPRING.snappy);
      op.value = withTiming(1, TIMING.fast);
    }
  }, [active, scale, op]);

  const cardStyle = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ scale: scale.value }] }));

  const close = useCallback(() => setActive(null), []);

  if (!active) return null;
  // destructive confirms read as danger (rose), not the brand accent — matches the
  // delete actions used elsewhere and stops a "delete" button looking like a reward.
  const cc = active.destructive ? t.rose : t.accent;
  return (
    <Modal transparent visible statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={close}>
      <Animated.View
        entering={FadeIn.duration(140)}
        exiting={FadeOut.duration(120)}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 30 }}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Dismiss" />
        <Animated.View
          style={[
            {
              width: '100%', maxWidth: 380,
              backgroundColor: t.surface, borderWidth: 2, borderColor: t.line,
              borderRadius: 24, padding: 22,
            },
            cardStyle,
          ]}
        >
          <Display size={20} style={{ marginBottom: active.message ? 8 : 18 }}>{active.title}</Display>
          {active.message ? (
            <Body size={14.5} color={t.muted} style={{ marginBottom: 20, lineHeight: 21 }}>{active.message}</Body>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ChunkyButton ghost fontSize={15} pad={[11, 16]} style={{ flex: 1 }} onPress={close}>
              {active.cancelLabel ?? 'Cancel'}
            </ChunkyButton>
            <ChunkyButton
              color={cc.main}
              deep={cc.deep}
              ink={cc.ink}
              fontSize={15}
              pad={[11, 16]}
              style={{ flex: 1 }}
              onPress={() => {
                const fn = active.onConfirm;
                close();
                fn();
              }}
            >
              {active.confirmLabel ?? 'OK'}
            </ChunkyButton>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
