import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Display } from '@/components/ui';
import { DISMISS, SPRING, TIMING } from '@/theme/motion';
import { useTheme } from '@/theme/theme';

const SCREEN_H = Dimensions.get('window').height;

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  /* false = render children directly (caller owns scrolling, e.g. emoji grid) */
  scroll?: boolean;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, scroll = true, children }: BottomSheetProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [render, setRender] = useState(open);

  const ty = useSharedValue(SCREEN_H); // card offset: SCREEN_H = fully hidden below
  const bg = useSharedValue(0); // backdrop opacity 0..1
  const mb = useSharedValue(0); // keyboard lift
  const closingRef = useRef(false);

  // Lift the card above the keyboard. RN <Modal> renders in its own window, so
  // KeyboardAvoidingView is unreliable inside it — track the height ourselves.
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const lift = (h: number) => {
      mb.value = withTiming(h > 0 ? Math.max(0, h - insets.bottom) : 0, TIMING.base);
    };
    const show = Keyboard.addListener(showEvt, (e) => lift(e.endCoordinates?.height ?? 0));
    const hide = Keyboard.addListener(hideEvt, () => lift(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [insets.bottom, mb]);

  const finishClose = useCallback(() => {
    closingRef.current = false;
    setRender(false);
    onClose();
  }, [onClose]);

  // velocity lets a flung dismiss carry its momentum into the slide-down; a
  // programmatic/tap close (no velocity) uses a clean, predictable timing.
  const animateClose = useCallback((velocity?: number) => {
    if (closingRef.current) return;
    closingRef.current = true;
    Keyboard.dismiss();
    bg.value = withTiming(0, TIMING.exit);
    const done = (fin: boolean | undefined) => {
      'worklet';
      if (fin) runOnJS(finishClose)();
    };
    ty.value =
      velocity != null
        ? withSpring(SCREEN_H, { ...SPRING.sheet, velocity }, done)
        : withTiming(SCREEN_H, TIMING.exit, done);
  }, [bg, ty, finishClose]);

  // open → mount + spring up; prop close → slide down then unmount
  useEffect(() => {
    if (open) {
      closingRef.current = false;
      setRender(true);
      ty.value = SCREEN_H;
      bg.value = 0;
      ty.value = withSpring(0, SPRING.sheet);
      bg.value = withTiming(1, TIMING.base);
    } else if (render) {
      animateClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // drag the grabber/header down to dismiss; the backdrop dims with the pull and
  // a release hands the gesture's velocity straight into the spring.
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      ty.value = Math.max(0, e.translationY);
      bg.value = interpolate(ty.value, [0, SCREEN_H * 0.5], [1, 0.35], Extrapolation.CLAMP);
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS.distance || e.velocityY > DISMISS.velocity) {
        runOnJS(animateClose)(e.velocityY);
      } else {
        ty.value = withSpring(0, { ...SPRING.sheet, velocity: e.velocityY });
        bg.value = withTiming(1, TIMING.fast);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }], marginBottom: mb.value }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: bg.value }));

  if (!render) return null;

  return (
    <Modal transparent visible statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={() => animateClose()}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.62)' }, backdropStyle]} />
          <Pressable style={StyleSheet.absoluteFill} onPress={() => animateClose()} accessibilityLabel="Close" />
          <Animated.View
            style={[
              {
                backgroundColor: t.surface,
                borderTopLeftRadius: 26,
                borderTopRightRadius: 26,
                // full border wraps the rounded card instead of a hairline across the top
                borderWidth: 2,
                borderColor: t.lineSoft,
                paddingTop: 10,
                paddingHorizontal: 20,
                paddingBottom: 20 + insets.bottom,
                maxHeight: '88%',
              },
              cardStyle,
            ]}
          >
            {/* grabber + title are the drag-to-dismiss handle */}
            <GestureDetector gesture={pan}>
              <View collapsable={false}>
                <View style={{ width: 42, height: 5, borderRadius: 99, backgroundColor: t.line, alignSelf: 'center', marginTop: 4, marginBottom: 14 }} />
                {title ? (
                  typeof title === 'string' ? (
                    <Display size={18} style={{ marginBottom: 12 }}>{title}</Display>
                  ) : (
                    title
                  )
                ) : null}
              </View>
            </GestureDetector>
            {scroll ? (
              <ScrollView bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 4 }}>
                {children}
              </ScrollView>
            ) : (
              children
            )}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
