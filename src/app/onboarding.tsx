import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedEmoji } from '@/components/animated-emoji';
import { ChunkyButton, ChunkyCard } from '@/components/chunky';
import { FireAnim } from '@/components/fire-anim';
import { IconPlay, IconPlus } from '@/components/icons';
import { StepPicker } from '@/components/new-routine-sheet';
import { BottomSheet } from '@/components/sheet';
import { Body, Display, EmojiTile, Label } from '@/components/ui';
import { ROUTINE_TEMPLATES, RoutineTemplate, routineMin } from '@/data/defaults';
import { tapHaptic } from '@/lib/haptics';
import { ensurePermission, hasNotificationPermission } from '@/lib/notifications';
import { useToast } from '@/components/toast';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';
import { ACCENT_CHOICES, hexDarken } from '@/theme/colors';

const SLIDES = [
  { title: 'No streaks to lose', body: 'No points, no shame for an off day. The app only ever notices that you showed up.', emoji: '🌱' },
  { title: 'Start with step one', body: 'Each routine breaks into small timed steps. Open it, do the first tiny thing. That’s the whole trick.', emoji: '🎯' },
];

// welcome + intro slides + theme + reminders + starter
const PAGES = 1 + SLIDES.length + 1 + 1 + 1;

// centers a short page's content vertically so it doesn't strand a wall of empty space
const PAGE = { flexGrow: 1, justifyContent: 'center' as const, paddingHorizontal: 24, paddingVertical: 24 };

/* Each setup page gets its own hero so it reads as onboarding, not a settings row that
   wandered in. Animated for the lively ones, a calm static glyph where motion would nag
   (the bell). */
function PageHero({ emoji, animated }: { emoji: string; animated?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <View style={{ height: 104, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
      {animated && !reduce ? (
        <AnimatedEmoji emoji={emoji} size={84} />
      ) : (
        <Text style={{ fontSize: 72, textAlign: 'center' }}>{emoji}</Text>
      )}
    </View>
  );
}

/* Page dot — animates its width + color on the active transition (M1). Honors
   reduce-motion: when calmed, the change snaps (duration 0). */
function Dot({ active }: { active: boolean }) {
  const t = useTheme();
  const reduce = useReducedMotion();
  const on = t.accent.main;
  const off = t.line;
  const anim = useAnimatedStyle(() => {
    const d = reduce ? 0 : 220;
    return {
      width: withTiming(active ? 22 : 7, { duration: d }),
      backgroundColor: withTiming(active ? on : off, { duration: d }),
    };
  });
  return <Animated.View style={[{ height: 7, borderRadius: 4 }, anim]} />;
}

export default function Onboarding() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const complete = useStore((s) => s.completeOnboarding);
  const settings = useStore((s) => s.settings);
  const accent = useStore((s) => s.accent);
  const { setSettings, setAccent } = useStore.getState();

  const ref = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [pickTpl, setPickTpl] = useState<RoutineTemplate | null>(null);
  // reflect the OS permission, not the remindersOn default — the button shouldn't claim
  // "on" before the user has actually granted it.
  const [notifOn, setNotifOn] = useState(false);
  useEffect(() => {
    hasNotificationPermission().then(setNotifOn);
  }, []);

  const finish = (href?: string) => {
    if (href) {
      // push into the editor *before* flipping onboarded, so they can go back/cancel.
      const separator = href.includes('?') ? '&' : '?';
      const target = `${href}${separator}fromOnboarding=true`;
      router.push(target as Parameters<typeof router.push>[0]);
    } else {
      // skip: flip onboarded → the navigator swaps onboarding out for Today
      complete();
      router.replace('/(tabs)');
    }
  };

  const next = () => {
    tapHaptic();
    ref.current?.scrollTo({ x: width * (page + 1), animated: true });
  };

  // theme and reminders page indexes
  const themePage = 1 + SLIDES.length;
  const remindersPage = themePage + 1;

  // Next doubles as the notifications opt-in on the reminders page (S3): it requests
  // permission once, then always advances — declining never traps the user (P16).
  const handleNext = async () => {
    if (page === remindersPage && !notifOn) {
      const ok = await ensurePermission();
      if (ok) {
        setSettings({ remindersOn: true });
        setNotifOn(true);
        toast('Notifications on');
      }
    }
    next();
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      {/* header: page dots centered, Skip pinned right */}
      <View style={{ height: 44, justifyContent: 'center', paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', gap: 7, justifyContent: 'center' }}>
          {Array.from({ length: PAGES }, (_, i) => (
            <Dot key={i} active={i === page} />
          ))}
        </View>
        {page < PAGES - 1 && (
          <Pressable
            onPressIn={() => tapHaptic()}
            onPress={() => finish()}
            hitSlop={10}
            style={{ position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 8 }}
          >
            <Label color={t.faint}>Skip</Label>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ flex: 1 }}
      >
        {/* welcome — animated fire */}
        <View style={{ width, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <FireAnim size={150} />
          <Display size={34} style={{ textAlign: 'center', marginTop: 18 }}>Flint</Display>
          <Body size={16} color={t.muted} style={{ textAlign: 'center', marginTop: 14, lineHeight: 24, maxWidth: 320 }}>
            Routines, one tiny step at a time.
          </Body>
        </View>

        {/* intro slides — animated emoji */}
        {SLIDES.map((s) => (
          <View key={s.title} style={{ width, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <View style={{ height: 128, justifyContent: 'center', marginBottom: 18 }}>
              <AnimatedEmoji emoji={s.emoji} size={118} />
            </View>
            <Display size={32} style={{ textAlign: 'center' }}>{s.title}</Display>
            <Body size={16} color={t.muted} style={{ textAlign: 'center', marginTop: 14, lineHeight: 24, maxWidth: 320 }}>
              {s.body}
            </Body>
          </View>
        ))}

        {/* theme configuration */}
        <View style={{ width }}>
          <ScrollView contentContainerStyle={PAGE} showsVerticalScrollIndicator={false}>
            <Display size={26} style={{ textAlign: 'center', marginTop: 8 }}>Make it yours</Display>
            <Body size={14} color={t.muted} style={{ textAlign: 'center', marginTop: 5, marginBottom: 16, lineHeight: 20 }}>
              Choose how Flint looks and feels. You can change these any time in Settings.
            </Body>
 
            {/* Retro Game Bezel Screen */}
            <View
              style={{
                backgroundColor: t.raised,
                borderWidth: 4,
                borderColor: t.line,
                borderRadius: 20,
                padding: 12,
                paddingBottom: 16,
                marginBottom: 16,
                width: '100%',
              }}
            >
              {/* Bezel Title Bar */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, opacity: 0.6 }}>
                <Label color={t.faint} style={{ fontSize: 9, letterSpacing: 1.5 }}>FLINT CONSOLE v1.0</Label>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.accent.main }} />
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.line }} />
                </View>
              </View>
 
              {/* The Live Interactive Preview Card */}
              <ChunkyCard
                borderColor={t.lineSoft}
                backColor={t.lineSoft}
                faceStyle={{ padding: 14 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: t.accent.soft,
                      borderWidth: 2,
                      borderColor: t.accent.main,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconPlay size={16} color={t.accent.main} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Display size={15} numberOfLines={1}>Morning Routine</Display>
                    <Body size={11.5} color={t.faint} numberOfLines={1}>3 steps · 15 min</Body>
                  </View>
                  {/* Circular Play Button on the right, matching the play circle update */}
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: 2.5,
                      borderColor: t.accent.main,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconPlay size={16} color={t.accent.main} />
                  </View>
                </View>
              </ChunkyCard>
            </View>
 
            {/* Unified Console Controller Deck */}
            <ChunkyCard
              borderColor={t.lineSoft}
              backColor={t.lineSoft}
              faceStyle={{ padding: 16, gap: 14 }}
            >
              {/* Row 1: Style Profile */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Label style={{ width: 75, fontSize: 11 }}>Style</Label>
                <View style={{ flexDirection: 'row', flex: 1, backgroundColor: t.raised, borderRadius: 12, padding: 3, borderWidth: 1.5, borderColor: t.line }}>
                  {[
                    { value: 'ember', label: 'Ember' },
                    { value: 'neutral', label: 'Neutral' },
                  ].map((opt) => {
                    const active = (settings.themeStyle ?? 'ember') === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPressIn={() => tapHaptic()}
                        onPress={() => setSettings({ themeStyle: opt.value as any })}
                        style={{
                          flex: 1,
                          backgroundColor: active ? t.accent.main : 'transparent',
                          borderRadius: 9,
                          paddingVertical: 8,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: active ? t.accent.ink : t.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
 
              {/* Row 2: App Theme */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Label style={{ width: 75, fontSize: 11 }}>Theme</Label>
                <View style={{ flexDirection: 'row', flex: 1, backgroundColor: t.raised, borderRadius: 12, padding: 3, borderWidth: 1.5, borderColor: t.line }}>
                  {[
                    { value: 'dark', label: 'Dark' },
                    { value: 'light', label: 'Light' },
                    { value: 'system', label: 'Auto' },
                  ].map((opt) => {
                    const active = settings.theme === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPressIn={() => tapHaptic()}
                        onPress={() => setSettings({ theme: opt.value as any })}
                        style={{
                          flex: 1,
                          backgroundColor: active ? t.accent.main : 'transparent',
                          borderRadius: 9,
                          paddingVertical: 8,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: active ? t.accent.ink : t.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
 
              {/* Row 3: Accent Color */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Label style={{ width: 75, fontSize: 11 }}>Color</Label>
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }}>
                  {ACCENT_CHOICES.map((a) => {
                    const active = a === accent;
                    const dark = hexDarken(a, 0.55);
                    return (
                      <Pressable
                        key={a}
                        accessibilityLabel={a}
                        onPressIn={() => tapHaptic()}
                        onPress={() => setAccent(a)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: a,
                          borderWidth: active ? 2.5 : 1.5,
                          borderColor: active ? dark : t.line,
                          justifyContent: 'center',
                          alignItems: 'center',
                          transform: [{ scale: active ? 1.15 : 1 }],
                        }}
                      >
                        {/* tonal ring + dot — a darker shade of the swatch, not black */}
                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: dark }} />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ChunkyCard>
          </ScrollView>
        </View>

        {/* reminders */}
        <View style={{ width }}>
          <ScrollView contentContainerStyle={PAGE} showsVerticalScrollIndicator={false}>
            <PageHero emoji="🔔" animated />
            <Display size={26} style={{ textAlign: 'center' }}>Gentle nudges?</Display>
            <Body size={14.5} color={t.muted} style={{ textAlign: 'center', marginTop: 10, marginBottom: 16, lineHeight: 21 }}>
              A nudge when a routine is due — alarms too, if you set one. Always optional.
            </Body>
            {/* the bottom Next button asks for permission on this page (S3); no standalone
                button. We just say what tapping Next does, plus the always-optional caption. */}
            <Body size={12.5} color={t.faint} style={{ textAlign: 'center' }}>
              {notifOn ? 'Notifications are on. ' : 'Next will ask your permission. '}You can flip this any time in Settings.
            </Body>
          </ScrollView>
        </View>

        {/* starter */}
        <View style={{ width }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
            <Display size={26} style={{ textAlign: 'center', marginTop: 8 }}>Your first routine</Display>
            <Body size={14.5} color={t.muted} style={{ textAlign: 'center', marginTop: 10, marginBottom: 22, lineHeight: 21 }}>
              Pick a starter to tweak, or build your own. You can change everything later.
            </Body>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
              {ROUTINE_TEMPLATES.map((tpl) => {
                const c = t.col(tpl.color);
                return (
                  <ChunkyCard
                    key={tpl.id}
                    // Pomodoro skips the step-picker — straight into the editor (W2)
                    onPress={() => (tpl.pomodoro ? finish(`/editor?template=${tpl.id}`) : setPickTpl(tpl))}
                    style={{ width: '47%' }}
                    faceStyle={{ padding: 14 }}
                  >
                    <EmojiTile emoji={tpl.emoji} size={44} radius={13} soft={c.soft} border={c.main} />
                    <Display size={15} style={{ marginTop: 10 }}>{tpl.name}</Display>
                    <Body size={12} color={t.faint} style={{ marginTop: 2 }}>{tpl.steps.length} steps · {routineMin(tpl)} min</Body>
                  </ChunkyCard>
                );
              })}
            </View>

            <ChunkyButton ghost fontSize={15} pad={[14, 20]} style={{ marginTop: 16 }} onPress={() => finish('/editor')}>
              <IconPlus size={16} color={t.text} />
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: t.text, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                Build my own
              </Text>
            </ChunkyButton>
          </ScrollView>
        </View>
      </ScrollView>

      {/* next (dots live in the top header now) */}
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 20, paddingTop: 12 }}>
        {page < PAGES - 1 && (
          <ChunkyButton fontSize={17} pad={[17, 24]} onPress={handleNext}>
            Next
          </ChunkyButton>
        )}
      </View>

      {/* template → choose-steps, then into the editor */}
      <BottomSheet open={!!pickTpl} onClose={() => setPickTpl(null)} title="Choose steps" scroll={false}>
        {pickTpl && (
          <StepPicker
            template={pickTpl}
            onBack={() => setPickTpl(null)}
            onUse={(idxs) => {
              const href = `/editor?template=${pickTpl.id}&pick=${idxs.join(',')}`;
              setPickTpl(null);
              finish(href);
            }}
          />
        )}
      </BottomSheet>
    </View>
  );
}
