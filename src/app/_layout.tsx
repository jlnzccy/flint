import '../global.css';

import {
  BeVietnamPro_400Regular,
  BeVietnamPro_400Regular_Italic,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import { Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';

import { CelebrationOverlay } from '@/components/celebration';
import { ConfirmHost } from '@/components/confirm-dialog';
import { ToastProvider } from '@/components/toast';
import {
  addForegroundAlarmListener,
  addNotificationTapListener,
  getLaunchRoutine,
  syncReminders,
} from '@/lib/notifications';
import { SCREEN_DURATION } from '@/theme/motion';
import { resolveRoutines, useStore } from '@/state/store';
import { ThemeProvider, useTheme } from '@/theme/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Freeze inactive screens at the native level — without this every screen stays a
// live View on the JS thread, which is the main source of navigation jank.
enableScreens(true);

function Root() {
  const t = useTheme();
  const router = useRouter();
  const onboarded = useStore((s) => s.onboarded);
  const showCelebration = useStore((s) => s.showCelebration);

  // notification taps: alarm routines open the full-screen alarm, others open the routine
  useEffect(() => {
    const go = (id: string, alarm: boolean) => router.push(alarm ? `/alarm/${id}` : `/routine/${id}`);
    const offTap = addNotificationTapListener(go);
    const offFg = addForegroundAlarmListener((id) => router.push(`/alarm/${id}`));
    getLaunchRoutine().then((r) => r && go(r.routineId, r.alarm));
    return () => {
      offTap();
      offFg();
    };
  }, [router]);

  return (
    <>
      <StatusBar style={t.theme === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.bg },
          // hierarchical pushes get the iOS-style parallax push: the incoming screen
          // slides the full width while the outgoing one drifts ~30% behind it, so the
          // background reads as deeper and there's less total motion. Auto-reverses on
          // back nav (forward/back), and runs on the native thread — smoothest.
          animation: 'ios_from_right',
          animationDuration: SCREEN_DURATION,
        }}
      >
        {/* on a fresh install onboarding owns the screen — the tabs never mount behind it,
            so there's no flash of Today before (or between) the onboarding steps */}
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        {/* the full-screen alarm still rises from the bottom; everything else (player,
            editor, routine, …) falls through to the default page push */}
        <Stack.Screen name="alarm/[id]" options={{ animation: 'slide_from_bottom' }} />
      </Stack>

      {/* the once-ever first-routine party. Lives above the whole navigator so it's truly
          full-screen (no tab bar peeking) and covers the editor→Today hop underneath. */}
      {showCelebration && (
        <CelebrationOverlay
          title="First routine"
          sub="Tiny steps from here. Open it whenever."
          onDone={() => useStore.getState().setShowCelebration(false)}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Nunito_800ExtraBold,
    Nunito_900Black,
    BeVietnamPro_400Regular,
    BeVietnamPro_400Regular_Italic,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  // wait for persisted state before deciding onboarding/blank — avoids a flash
  const [hydrated, setHydrated] = useState(() => useStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    // hydration may have finished between first render and now — re-check so we
    // don't wait forever on an onFinishHydration that already fired
    if (useStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    const fallback = setTimeout(() => setHydrated(true), 2000); // never freeze on splash
    return () => {
      unsub();
      clearTimeout(fallback);
    };
  }, [hydrated]);

  // day rollover: on launch and whenever the app returns to the foreground
  useEffect(() => {
    useStore.getState().rollover();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') useStore.getState().rollover();
    });
    return () => sub.remove();
  }, []);

  // keep scheduled notifications in sync with state
  useEffect(() => {
    const sync = () => {
      const s = useStore.getState();
      // hold off until onboarding is done — the system permission prompt should fire
      // on the user's first real entry to the app, not over the onboarding screens
      if (!s.onboarded) return;
      syncReminders(resolveRoutines(s), s.todos, s.settings.remindersOn);
    };
    sync();
    let last = '';
    const unsub = useStore.subscribe((s) => {
      // fingerprint the raw reminder inputs only — skip the resolveRoutines() merge that
      // ran on every state tick (it could block the JS thread mid-navigation)
      const sig = JSON.stringify([
        s.onboarded,
        s.settings.remindersOn,
        s.custom.map((r) => [r.id, r.reminder, r.name, r.emoji, r.days]),
        s.overrides,
        s.archived,
        s.deleted,
        s.todos.map((t) => [t.id, t.title, t.reminderDate, t.reminderTime, t.repeat, t.done]),
      ]);
      if (sig !== last) {
        last = sig;
        sync();
      }
    });
    return unsub;
  }, []);

  const ready = loaded && hydrated;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ToastProvider>
          <Root />
        </ToastProvider>
        <ConfirmHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
