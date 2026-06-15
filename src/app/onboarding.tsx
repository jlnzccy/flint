import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedEmoji } from '@/components/animated-emoji';
import { ChunkyButton } from '@/components/chunky';
import { FireAnim } from '@/components/fire-anim';
import { IconCheck, IconPlus } from '@/components/icons';
import { StepPicker } from '@/components/new-routine-sheet';
import { BottomSheet } from '@/components/sheet';
import { Body, Display, EmojiTile, Label, Segmented, Toggle } from '@/components/ui';
import { ROUTINE_TEMPLATES, RoutineTemplate, routineMin } from '@/data/defaults';
import { tapHaptic } from '@/lib/haptics';
import { ensurePermission, hasNotificationPermission } from '@/lib/notifications';
import { useToast } from '@/components/toast';
import { ACCENT_CHOICES } from '@/theme/colors';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';

const SLIDES = [
  { title: 'No streaks to lose', body: 'No points, no shame for an off day. The app only ever notices that you showed up.', emoji: '🌱' },
  { title: 'Start with step one', body: 'Each routine breaks into small timed steps. Open it, do the first tiny thing. That’s the whole trick.', emoji: '🎯' },
];

// welcome + intro slides + look + streaks + reminders + starter
const PAGES = 1 + SLIDES.length + 3 + 1;

// centers a short page's content vertically so it doesn't strand a wall of empty space
const PAGE = { flexGrow: 1, justifyContent: 'center' as const, paddingHorizontal: 24, paddingVertical: 24 };

/* Each setup page gets its own hero so it reads as onboarding, not a settings row that
   wandered in. Animated for the lively ones, a calm static glyph where motion would nag
   (the bell). */
function PageHero({ emoji, animated }: { emoji: string; animated?: boolean }) {
  return (
    <View style={{ height: 104, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
      {animated ? (
        <AnimatedEmoji emoji={emoji} size={84} />
      ) : (
        <Text style={{ fontSize: 72, textAlign: 'center' }}>{emoji}</Text>
      )}
    </View>
  );
}

export default function Onboarding() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const settings = useStore((s) => s.settings);
  const accent = useStore((s) => s.accent);
  const complete = useStore((s) => s.completeOnboarding);
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
      // straight into the editor (still an unguarded route) *before* flipping onboarded,
      // so Today never flashes between onboarding and building the first routine
      router.replace(href as Parameters<typeof router.replace>[0]);
      complete();
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

  const enableNotifs = async () => {
    const ok = await ensurePermission();
    if (ok) {
      setSettings({ remindersOn: true });
      setNotifOn(true);
      toast('Notifications on');
    } else {
      toast('Allow it in system settings');
    }
  };

  const toggleStreaks = (v: boolean) => {
    // streaks on → never-dies on by default, so a missed day never resets it
    setSettings({ streaks: v, streakNeverDies: v ? true : settings.streakNeverDies });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      {/* skip */}
      <View style={{ height: 44, justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 16 }}>
        {page < PAGES - 1 && (
          <Pressable onPressIn={() => tapHaptic()} onPress={() => finish()} hitSlop={10} style={{ paddingVertical: 6, paddingHorizontal: 8 }}>
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

        {/* look — theme + accent */}
        <View style={{ width }}>
          <ScrollView contentContainerStyle={PAGE} showsVerticalScrollIndicator={false}>
            <PageHero emoji="🎨" animated />
            <Display size={26} style={{ textAlign: 'center' }}>The look</Display>
            <Body size={14.5} color={t.muted} style={{ textAlign: 'center', marginTop: 10, marginBottom: 28, lineHeight: 21 }}>
              Pick a vibe. Change it any time in Settings.
            </Body>

            <Label style={{ marginBottom: 8 }}>Appearance</Label>
            <Segmented
              value={settings.theme === 'light' ? 'light' : 'dark'}
              onChange={(v) => setSettings({ theme: v })}
              options={[
                { value: 'dark', label: '🌙 Dark' },
                { value: 'light', label: '☀️ Light' },
              ]}
            />

            <Label style={{ marginTop: 26, marginBottom: 14 }}>Accent</Label>
            <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {ACCENT_CHOICES.map((a) => (
                <Pressable
                  key={a}
                  accessibilityLabel={a}
                  onPress={() => {
                    tapHaptic();
                    setAccent(a);
                  }}
                  style={{
                    width: 50, height: 50, borderRadius: 25, backgroundColor: a,
                    borderWidth: 3, borderColor: a === accent ? t.text : 'transparent',
                    transform: [{ scale: a === accent ? 1.12 : 1 }],
                  }}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* streaks */}
        <View style={{ width }}>
          <ScrollView contentContainerStyle={PAGE} showsVerticalScrollIndicator={false}>
            <PageHero emoji="🔥" animated />
            <Display size={26} style={{ textAlign: 'center' }}>Streaks?</Display>
            <Body size={14.5} color={t.muted} style={{ textAlign: 'center', marginTop: 10, marginBottom: 28, lineHeight: 21 }}>
              Some brains love a streak. Some feel chased by it. Your call.
            </Body>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 20 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Display size={16}>Count my streak</Display>
                <Body size={12.5} color={t.faint} style={{ marginTop: 3 }}>Never dies — a missed day pauses it, never resets.</Body>
              </View>
              <Toggle on={settings.streaks} onChange={toggleStreaks} />
            </View>
          </ScrollView>
        </View>

        {/* reminders */}
        <View style={{ width }}>
          <ScrollView contentContainerStyle={PAGE} showsVerticalScrollIndicator={false}>
            <PageHero emoji="🔔" />
            <Display size={26} style={{ textAlign: 'center' }}>Gentle nudges?</Display>
            <Body size={14.5} color={t.muted} style={{ textAlign: 'center', marginTop: 10, marginBottom: 28, lineHeight: 21 }}>
              A nudge when a routine is due — alarms too, if you set one. Always optional.
            </Body>

            <ChunkyButton
              ghost={!notifOn}
              color={notifOn ? t.green.main : undefined}
              deep={notifOn ? t.green.deep : undefined}
              ink={notifOn ? t.green.ink : undefined}
              fontSize={16}
              pad={[16, 20]}
              onPress={enableNotifs}
            >
              {notifOn ? <IconCheck size={16} color={t.green.ink} /> : null}
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: notifOn ? t.green.ink : t.text, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                {notifOn ? 'Notifications on' : 'Enable notifications'}
              </Text>
            </ChunkyButton>
            <Body size={12.5} color={t.faint} style={{ marginTop: 12, textAlign: 'center' }}>
              You can flip this any time in Settings.
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
                  <Pressable
                    key={tpl.id}
                    onPress={() => {
                      tapHaptic();
                      setPickTpl(tpl);
                    }}
                    style={{
                      width: '47%', padding: 14, borderRadius: 18,
                      backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft,
                    }}
                  >
                    <EmojiTile emoji={tpl.emoji} size={44} radius={13} soft={c.soft} border={c.main} />
                    <Display size={15} style={{ marginTop: 10 }}>{tpl.name}</Display>
                    <Body size={12} color={t.faint} style={{ marginTop: 2 }}>{tpl.steps.length} steps · {routineMin(tpl)} min</Body>
                  </Pressable>
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

      {/* dots + next */}
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 20, paddingTop: 12, gap: 18 }}>
        <View style={{ flexDirection: 'row', gap: 7, justifyContent: 'center' }}>
          {Array.from({ length: PAGES }, (_, i) => (
            <View
              key={i}
              style={{
                width: i === page ? 22 : 7, height: 7, borderRadius: 4,
                backgroundColor: i === page ? t.accent.main : t.line,
              }}
            />
          ))}
        </View>
        {page < PAGES - 1 && (
          <ChunkyButton fontSize={17} pad={[17, 24]} onPress={next}>
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
