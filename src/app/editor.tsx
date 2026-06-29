import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as IntentLauncher from 'expo-intent-launcher';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, InteractionManager, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton, CircleBtn } from '@/components/chunky';
import { ColorPickerSheet } from '@/components/color-picker';
import { DragList } from '@/components/drag-list';
import { warmCelebrationAssets } from '@/components/emoji-confetti';
import { EmojiSheet } from '@/components/emoji-sheet';
import { IconAlarm, IconArchive, IconBell, IconChevR, IconPlus, IconRestart, IconTrash, IconX } from '@/components/icons';
import { MinutePicker, WheelPicker } from '@/components/minute-picker';
import { BottomSheet } from '@/components/sheet';
import { Slider } from '@/components/slider';
import { TimePicker } from '@/components/time-picker';
import { useToast } from '@/components/toast';
import { Body, Chip, Display, FlintInput, Label, Segmented, Toggle, useTimeFmt } from '@/components/ui';
import { buildPomodoroSteps, COLOR_CHOICES, DEFAULT_POMODORO_CFG, EMOJI_CHOICES, getTemplate, routineMin, Routine, RoutinePomodoro } from '@/data/defaults';
import { confirmDestructive } from '@/lib/confirm';
import { tapHaptic } from '@/lib/haptics';
import { todayKey } from '@/lib/dates';
import { resolveRoutines, useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';
import { hexDarken } from '@/theme/colors';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday-first
const DAY_LABELS: Record<number, string> = { 0: 'S', 1: 'M', 2: 'T', 3: 'W', 4: 'T', 5: 'F', 6: 'S' };

interface DraftStep {
  t: string;
  min: number;
  sec: number;
  hint: string;
  _k: string;
}

const fmtStepTimeShort = (min: number, sec: number) => {
  if (min === 0) return `${sec}s`;
  if (sec === 0) return `${min}m`;
  return `${min}m ${sec}s`;
};



export default function Editor() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const fmtT = useTimeFmt();
  const insets = useSafeAreaInsets();
  const { id, focusStep, template, pick, fromOnboarding } = useLocalSearchParams<{
    id?: string;
    focusStep?: string;
    template?: string;
    pick?: string;
    fromOnboarding?: string;
  }>();

  const routine = useMemo(() => {
    if (!id) return null;
    const s = useStore.getState();
    return resolveRoutines({ custom: s.custom, overrides: s.overrides, order: s.order, archived: [], deleted: s.deleted }).find((r) => r.id === id) ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // a starter template preloads a brand-new routine (everything stays editable)
  const tpl = useMemo(() => (id ? undefined : getTemplate(template)), [id, template]);
  const seed = routine ?? tpl;

  // template steps the user chose to keep (?pick=0,2,3); absent = all of them
  const seedSteps = useMemo(() => {
    if (routine) return routine.steps;
    if (!tpl) return null;
    if (!pick) return tpl.steps;
    const keep = new Set(pick.split(',').map(Number));
    return tpl.steps.filter((_, i) => keep.has(i));
  }, [routine, tpl, pick]);

  const editing = !!routine;
  const [name, setName] = useState(seed?.name ?? '');
  const [emoji, setEmoji] = useState(seed?.emoji ?? '🧺');
  // new routines default to the system color (first choice = the app accent / ember)
  const [color, setColor] = useState<string>(seed?.color ?? COLOR_CHOICES[0]);
  const [steps, setSteps] = useState<DraftStep[]>(() =>
    seedSteps && seedSteps.length
      ? seedSteps.map((s, i) => ({ t: s.t, min: s.min, sec: s.sec ?? 0, hint: s.hint ?? '', _k: 'k' + i }))
      : [{ t: '', min: 2, sec: 0, hint: '', _k: 'k0' }]
  );
  // new blank routines default to a scheduled time — anytime is the opt-out
  const [reminder, setReminder] = useState<string | null>(
    routine ? routine.reminder ?? null : tpl ? tpl.reminder ?? null : '07:00'
  );
  const [alarm, setAlarm] = useState(!!seed?.alarm);
  const [alarmUri, setAlarmUri] = useState<string | null>(routine?.alarmRingtoneUri ?? null);
  const [days, setDays] = useState<number[]>(routine?.days?.length ? routine.days : [0, 1, 2, 3, 4, 5, 6]);
  // which step's edit sheet is open (its _k), or null
  const [editKey, setEditKey] = useState<string | null>(null);
  const [timeOpen, setTimeOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [draftTime, setDraftTime] = useState(reminder || '07:00');
  const kRef = useRef(steps.length);

  // Pomodoro routine? steps are derived from this config (W3). Seeds from the edited
  // routine or the Pomodoro template; null = an ordinary step-list routine.
  const pomoSeed = routine?.pomodoro
    ? { ...DEFAULT_POMODORO_CFG, ...routine.pomodoro } // backfill any new config fields
    : tpl?.pomodoro ?? null;
  const isPomo = !!pomoSeed;
  const [pomo, setPomo] = useState<RoutinePomodoro | null>(pomoSeed);
  const [pomoFieldOpen, setPomoFieldOpen] = useState<'sessions' | 'focusMin' | 'breakMin' | 'longBreakMin' | null>(null);
  // a slider change rebuilds the focus/break steps in place
  const setPomoField = (patch: Partial<RoutinePomodoro>) => {
    if (!pomo) return;
    const next = { ...pomo, ...patch };
    setPomo(next);
    setSteps(buildPomodoroSteps(next).map((s, i) => ({ t: s.t, min: s.min, sec: s.sec ?? 0, hint: s.hint ?? '', _k: 'k' + i })));
  };

  const customColor = !COLOR_CHOICES.includes(color as any);
  const customEmoji = !EMOJI_CHOICES.slice(0, 6).includes(emoji);
  const toggleDay = (d: number) =>
    setDays((cur) => {
      const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d];
      return next.length === 0 ? cur : next; // at least one day
    });

  const c = t.col(color);

  const setStep = (k: string, patch: Partial<DraftStep>) =>
    setSteps((s) => s.map((x) => (x._k === k ? { ...x, ...patch } : x)));
  // new steps open their sheet straight away so there's somewhere to name them
  const addStep = () => {
    const k = 'k' + kRef.current++;
    setSteps((s) => [...s, { t: '', min: 2, sec: 0, hint: '', _k: k }]);
    setEditKey(k);
  };
  const delStep = (k: string) => setSteps((s) => s.filter((x) => x._k !== k));
  const reorderSteps = (keys: string[]) =>
    setSteps((s) => keys.map((k) => s.find((x) => x._k === k)!).filter(Boolean));

  const editStep = editKey ? steps.find((s) => s._k === editKey) ?? null : null;

  // deep link from Insights (?focusStep=2) opens that step's sheet
  useEffect(() => {
    if (focusStep != null && routine) setEditKey('k' + focusStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const valid = name.trim().length > 0 && steps.some((s) => s.t.trim());

  // unsaved-changes guard (B4): serialize the editable fields, compare to the
  // baseline captured on first render. A quiet "Discard?" confirm — never a nag.
  const snapshot = () =>
    JSON.stringify({
      name: name.trim(),
      emoji,
      color,
      reminder,
      alarm,
      alarmUri,
      days: [...days].sort(),
      steps: steps.map((s) => ({ t: s.t.trim(), min: s.min, sec: s.sec, hint: s.hint.trim() })),
      pomo,
    });
  const baseline = useRef<string | null>(null);
  if (baseline.current === null) baseline.current = snapshot();
  const dirty = baseline.current !== snapshot();

  // when the editor is opened from onboarding it's a router.replace → there's no back
  // stack, so router.back() is a no-op (the X / discard / post-save back all looked dead).
  // safeBack falls back to Today when there's nothing to pop (S1).
  const safeBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  // Close button + Android hardware back route through here; intentional exits
  // (save/archive/delete) call the router directly and skip the guard.
  const leave = () => {
    if (dirty) confirmDestructive('Discard changes?', "Your edits won't be saved.", 'Discard', () => safeBack());
    else safeBack();
  };
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!dirty) return false;
        leave();
        return true;
      });
      return () => sub.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dirty])
  );

  // Android ringtone picker → per-routine alarm URI (iOS has no public API)
  const pickRingtone = async () => {
    if (Platform.OS !== 'android') {
      toast('Android only');
      return;
    }
    try {
      const res = await IntentLauncher.startActivityAsync('android.intent.action.RINGTONE_PICKER', {
        extra: {
          'android.intent.extra.ringtone.TYPE': 4, // TYPE_ALARM
          'android.intent.extra.ringtone.SHOW_DEFAULT': true,
          'android.intent.extra.ringtone.SHOW_SILENT': false,
          'android.intent.extra.ringtone.TITLE': 'Alarm sound',
        },
      });
      const picked = (res.extra as Record<string, any> | undefined)?.['android.intent.extra.ringtone.PICKED_URI'] ?? res.data;
      if (res.resultCode === IntentLauncher.ResultCode.Success && picked) {
        setAlarmUri(String(picked));
        toast('Alarm sound set');
      }
    } catch {
      toast("Couldn't open picker");
    }
  };

  const save = () => {
    const r: Routine = {
      id: routine ? routine.id : 'c' + Date.now(),
      createdAt: routine ? routine.createdAt : todayKey(),
      name: name.trim(),
      emoji,
      color,
      reminder,
      alarm: reminder ? alarm : false,
      days: days.length === 7 ? undefined : [...days].sort(),
      steps: steps.filter((s) => s.t.trim()).map((s) => ({
        t: s.t.trim(),
        min: s.min,
        sec: s.sec > 0 ? s.sec : undefined,
        hint: s.hint.trim() || undefined
      })),
      alarmRingtoneUri: reminder && alarm ? alarmUri : null,
      // pomodoro routines auto-advance through breaks; carry the config + flag (W1)
      pomodoro: isPomo && pomo ? pomo : undefined,
      autoAdvance: isPomo ? true : routine?.autoAdvance,
      warn30: routine?.warn30,
    };
    const st = useStore.getState();
    const firstEver = !editing && !st.celebratedFirst;
    st.saveRoutine(r);
    // warm the celebration lottie pool (idle) so the first party isn't sparse (QoL3)
    InteractionManager.runAfterInteractions(() => warmCelebrationAssets());
    if (fromOnboarding === 'true') {
      st.completeOnboarding();
      if (firstEver) {
        st.markFirstCelebrated();
        st.setShowCelebration(true);
      }
      router.replace('/(tabs)');
    } else {
      if (firstEver) {
        // the one-time first-routine party. Raise the full-screen overlay (rendered at the
        // app root) before navigating, so the user lands on it — never a flash of Today.
        st.markFirstCelebrated();
        st.setShowCelebration(true);
        safeBack();
      } else {
        toast('Saved');
        safeBack();
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
        <CircleBtn size={44} onPress={leave} label="Close">
          <IconX color={t.text} />
        </CircleBtn>
        <Display size={18}>{editing ? 'Edit routine' : 'New routine'}</Display>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Label style={{ marginBottom: 8 }}>Name</Label>
        <FlintInput placeholder="e.g. Laundry, but survivable" value={name} onChangeText={setName} maxLength={32} />

        {!isPomo && (
          /* Pomodoro's icon + color are locked (🍅 tomato) — hidden during edit */
          <>
        <Label style={{ marginTop: 20, marginBottom: 8 }}>Icon</Label>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {EMOJI_CHOICES.slice(0, 6).map((em) => (
            <Pressable
              key={em}
              onPressIn={() => tapHaptic()}
              onPress={() => setEmoji(em)}
              style={{
                flex: 1, height: 46, borderRadius: 14,
                backgroundColor: t.raised, borderWidth: 2,
                borderColor: em === emoji ? t.accent.main : t.lineSoft,
                alignItems: 'center', justifyContent: 'center',
                transform: [{ scale: em === emoji ? 1.06 : 1 }],
              }}
            >
              <Text style={{ fontSize: 21, fontFamily: 'NotoColorEmoji' }}>{em}</Text>
            </Pressable>
          ))}
          {/* a chosen custom emoji shows as its own selected tile… */}
          {customEmoji && (
            <Pressable
              accessibilityLabel="Custom emoji"
              onPressIn={() => tapHaptic()}
              onPress={() => setEmojiOpen(true)}
              style={{
                flex: 1, height: 46, borderRadius: 14,
                backgroundColor: t.raised, borderWidth: 2, borderColor: t.accent.main,
                alignItems: 'center', justifyContent: 'center',
                transform: [{ scale: 1.06 }],
              }}
            >
              <Text style={{ fontSize: 21, fontFamily: 'NotoColorEmoji' }}>{emoji}</Text>
            </Pressable>
          )}
          {/* …and the "+" opens the picker sheet (type or browse) */}
          <Pressable
            accessibilityLabel="More emoji"
            onPressIn={() => tapHaptic()}
            onPress={() => setEmojiOpen(true)}
            style={{
              flex: 1, height: 46, borderRadius: 14,
              backgroundColor: t.raised, borderWidth: 2, borderColor: t.line,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <IconPlus size={16} color={t.muted} />
          </Pressable>
        </View>

        <Label style={{ marginTop: 20, marginBottom: 8 }}>Color</Label>
        <View style={{ flexDirection: 'row', gap: 12, rowGap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {COLOR_CHOICES.map((cn) => {
            const active = cn === color;
            const swatchColor = t.col(cn).main;
            const dark = hexDarken(swatchColor, 0.55);
            return (
              <Pressable
                key={cn}
                accessibilityLabel={cn}
                onPressIn={() => tapHaptic()}
                onPress={() => setColor(cn)}
                style={{
                  width: 40, height: 40, borderRadius: 20, backgroundColor: swatchColor,
                  borderWidth: active ? 2.5 : 1.5,
                  borderColor: active ? dark : t.line,
                  alignItems: 'center', justifyContent: 'center',
                  transform: [{ scale: active ? 1.12 : 1 }],
                }}
              >
                {active && (
                  <View style={{ width: 15, height: 15, borderRadius: 8, backgroundColor: dark }} />
                )}
              </Pressable>
            );
          })}
          {/* one fixed trailing slot: shows the chosen custom color (re-opens picker) or "+".
              recoloring in place means picking a custom color never reflows the row */}
          <Pressable
            accessibilityLabel={customColor ? 'Edit custom color' : 'Custom color'}
            onPressIn={() => tapHaptic()}
            onPress={() => setColorOpen(true)}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: customColor ? c.main : t.raised,
              borderWidth: 2,
              borderColor: customColor ? hexDarken(c.main, 0.55) : t.line,
              alignItems: 'center', justifyContent: 'center',
              transform: [{ scale: customColor ? 1.12 : 1 }],
            }}
          >
            <IconPlus size={16} color={customColor ? c.ink : t.muted} />
          </Pressable>
        </View>
          </>
        )}

        <Label style={{ marginTop: 20, marginBottom: 8 }}>Schedule</Label>
        <Segmented
          value={reminder ? 'timed' : 'anytime'}
          onChange={(v) => {
            if (v === 'anytime') setReminder(null);
            // reveal the time row; user taps "Change" to open the dial (no auto-open)
            else setReminder(draftTime || '07:00');
          }}
          options={[
            { value: 'anytime', label: 'Anytime' },
            { value: 'timed', label: 'At a time' },
          ]}
        />
        {reminder ? (
          <>
            <View
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 10,
                backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18,
              }}
            >
              <IconBell size={17} color={t.muted} />
              <Display size={15} style={{ flex: 1 }}>{fmtT(reminder)}</Display>
              <Chip
                onPress={() => {
                  setDraftTime(reminder);
                  setTimeOpen(true);
                }}
              >
                Change
              </Chip>
            </View>
            <View
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 10,
                backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18,
              }}
            >
              <IconAlarm size={17} color={alarm ? t.accent.main : t.muted} />
              <View style={{ flex: 1 }}>
                <Display size={15}>Full-screen alarm</Display>
                <Body size={12} color={t.faint} style={{ marginTop: 2 }}>Opens right into step one.</Body>
              </View>
              <Toggle on={alarm} onChange={setAlarm} />
            </View>
            {alarm ? (
              <>
                <Pressable
                  onPress={pickRingtone}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 8,
                    backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Display size={15}>Alarm sound</Display>
                    <Body size={12} color={t.faint} style={{ marginTop: 2 }}>
                      {alarmUri ? 'Custom ringtone' : 'Marimba (default)'}
                    </Body>
                  </View>
                  <IconChevR size={18} color={t.faint} />
                </Pressable>
                {alarmUri ? (
                  <Pressable
                    onPress={() => {
                      setAlarmUri(null);
                      toast('Back to default');
                    }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 8,
                      backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Display size={15}>Use app default</Display>
                      <Body size={12} color={t.faint} style={{ marginTop: 2 }}>Bundled marimba</Body>
                    </View>
                    <IconRestart size={16} color={t.faint} />
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}

        <Label style={{ marginTop: 20, marginBottom: 8 }}>Days</Label>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {DAY_ORDER.map((d) => {
            const on = days.includes(d);
            return (
              <Pressable
                key={d}
                accessibilityLabel={`Day ${DAY_LABELS[d]}`}
                onPressIn={() => tapHaptic()}
                onPress={() => toggleDay(d)}
                style={{
                  flex: 1, height: 42, borderRadius: 14,
                  backgroundColor: on ? c.main : t.raised,
                  borderWidth: 2, borderColor: on ? c.deep : t.lineSoft,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: on ? c.ink : t.faint }}>
                  {DAY_LABELS[d]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {isPomo && pomo ? (
          /* Pomodoro: sliders regenerate the focus/break steps; no manual list (W3) */
          <>
            <Label style={{ marginTop: 22, marginBottom: 8 }}>Pomodoro</Label>
            <View style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18 }}>
              <Pressable
                onPressIn={() => tapHaptic()}
                onPress={() => setPomoFieldOpen('sessions')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Display size={15}>Sessions</Display>
                  <Body size={12} color={t.faint} style={{ marginTop: 2 }}>focus blocks</Body>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Display size={15} style={{ color: c.main }}>{pomo.sessions} sets</Display>
                  <IconChevR size={18} color={t.faint} />
                </View>
              </Pressable>

              <Pressable
                onPressIn={() => tapHaptic()}
                onPress={() => setPomoFieldOpen('focusMin')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderTopWidth: 2, borderColor: t.lineSoft }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Display size={15}>Focus</Display>
                  <Body size={12} color={t.faint} style={{ marginTop: 2 }}>duration</Body>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Display size={15} style={{ color: c.main }}>{pomo.focusMin} min</Display>
                  <IconChevR size={18} color={t.faint} />
                </View>
              </Pressable>

              <Pressable
                onPressIn={() => tapHaptic()}
                onPress={() => setPomoFieldOpen('breakMin')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderTopWidth: 2, borderColor: t.lineSoft }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Display size={15}>Short break</Display>
                  <Body size={12} color={t.faint} style={{ marginTop: 2 }}>between sessions</Body>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Display size={15} style={{ color: c.main }}>{pomo.breakMin} min</Display>
                  <IconChevR size={18} color={t.faint} />
                </View>
              </Pressable>

              <Pressable
                onPressIn={() => tapHaptic()}
                onPress={() => setPomoFieldOpen('longBreakMin')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderTopWidth: 2, borderColor: t.lineSoft }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Display size={15}>Long break</Display>
                  <Body size={12} color={t.faint} style={{ marginTop: 2 }}>{`after every ${pomo.longEvery} focus`}</Body>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Display size={15} style={{ color: c.main }}>{pomo.longBreakMin} min</Display>
                  <IconChevR size={18} color={t.faint} />
                </View>
              </Pressable>
            </View>
            <Body size={12} color={t.faint} style={{ marginTop: 10, textAlign: 'center' }}>
              {steps.filter((s) => s.t === 'Focus').length} focus · {steps.filter((s) => s.t !== 'Focus').length} break{steps.filter((s) => s.t !== 'Focus').length === 1 ? '' : 's'} · {routineMin({ steps })} min total
            </Body>
          </>
        ) : (
          <>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 8 }}>
          <Label>Steps</Label>
          <Body size={12} color={t.faint}>Tap to set time</Body>
        </View>
        <DragList
          items={steps}
          keyOf={(s) => s._k}
          onReorder={reorderSteps}
          renderRow={(s, handle, dragging) => (
            <View
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingVertical: 4, paddingRight: 12, backgroundColor: t.surface, borderRadius: 18,
                borderWidth: 2, borderColor: dragging ? c.main : t.lineSoft,
              }}
            >
              {handle}
              <Pressable
                onPressIn={() => tapHaptic()}
                onPress={() => setEditKey(s._k)}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Body
                    size={15}
                    numberOfLines={1}
                    color={s.t.trim() ? t.text : t.faint}
                    style={{ fontFamily: 'BeVietnamPro_600SemiBold' }}
                  >
                    {s.t.trim() || 'One tiny step…'}
                  </Body>
                  {s.hint ? (
                    <Body size={12} color={t.faint} numberOfLines={1} style={{ marginTop: 1 }}>{s.hint}</Body>
                  ) : null}
                </View>
                <Label color={t.muted}>{fmtStepTimeShort(s.min, s.sec)}</Label>
                <IconChevR size={16} color={t.faint} />
              </Pressable>
            </View>
          )}
        />

        <ChunkyButton ghost fontSize={14} pad={[13, 20]} style={{ marginTop: 10 }} onPress={addStep}>
          <IconPlus size={16} color={t.text} />
          <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: t.text, textTransform: 'uppercase', letterSpacing: 0.7 }}>
            Add step
          </Text>
        </ChunkyButton>
          </>
        )}

        {editing && (
          <View style={{ marginTop: 22, gap: 10 }}>
            {routine?.builtin && (
              <ChunkyButton
                ghost
                fontSize={14}
                pad={[13, 20]}
                onPress={() => {
                  useStore.getState().resetRoutine(routine.id);
                  toast('Reset');
                  router.back();
                }}
              >
                <IconRestart size={15} color={t.text} />
                <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: t.text, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                  Reset
                </Text>
              </ChunkyButton>
            )}
            <ChunkyButton
              ghost
              fontSize={14}
              pad={[13, 20]}
              onPress={() => {
                useStore.getState().archiveRoutine(routine!.id);
                toast('Archived');
                router.dismissAll();
              }}
            >
              <IconArchive size={15} color={t.text} />
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: t.text, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                Archive
              </Text>
            </ChunkyButton>
            <ChunkyButton
              ghost
              fontSize={14}
              pad={[13, 20]}
              onPress={() =>
                confirmDestructive('Delete routine?', `"${routine!.name}" and its history stay gone.`, 'Delete', () => {
                  useStore.getState().deleteRoutine(routine!.id);
                  toast('Deleted');
                  router.dismissAll();
                })
              }
            >
              <IconTrash size={15} color={t.accent.main} />
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: t.accent.main, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                Delete
              </Text>
            </ChunkyButton>
          </View>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 18 }}>
        <ChunkyButton color={c.main} deep={c.deep} ink={c.ink} fontSize={17} pad={[17, 24]} disabled={!valid} onPress={save}>
          {editing ? 'Save changes' : 'Save routine'}
        </ChunkyButton>
      </View>

      <BottomSheet open={timeOpen} onClose={() => setTimeOpen(false)} title="Reminder time">
        <TimePicker value={draftTime} onChange={setDraftTime} />
        <ChunkyButton
          color={c.main}
          deep={c.deep}
          ink={c.ink}
          fontSize={16}
          pad={[15, 24]}
          style={{ marginTop: 22 }}
          onPress={() => {
            setReminder(draftTime);
            setTimeOpen(false);
          }}
        >
          Set time
        </ChunkyButton>
      </BottomSheet>

      <ColorPickerSheet
        open={colorOpen}
        initial={customColor ? color : t.col(color).main}
        onClose={() => setColorOpen(false)}
        onPick={setColor}
      />

      <EmojiSheet open={emojiOpen} value={emoji} onClose={() => setEmojiOpen(false)} onPick={setEmoji} />

      {/* per-step editor: name, hint, swipe-to-pick time, delete */}
      <BottomSheet open={!!editKey} onClose={() => setEditKey(null)} title="Step">
        {editStep && (
          <View>
            <Label style={{ marginBottom: 8 }}>What to do</Label>
            <FlintInput
              autoFocus={!editStep.t.trim()}
              placeholder="One tiny step…"
              value={editStep.t}
              onChangeText={(v) => setStep(editStep._k, { t: v })}
              maxLength={48}
            />

            <Label style={{ marginTop: 18, marginBottom: 8 }}>Hint (optional)</Label>
            <FlintInput
              placeholder="A nudge for future you"
              value={editStep.hint}
              onChangeText={(v) => setStep(editStep._k, { hint: v })}
              maxLength={60}
            />

            <Label style={{ marginTop: 20, marginBottom: 12 }}>Time</Label>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <WheelPicker
                value={editStep.min}
                options={Array.from({ length: 91 }, (_, i) => i)} // 0 to 90
                unit="min"
                onChange={(m) => setStep(editStep._k, { min: m })}
              />
              <WheelPicker
                value={editStep.sec}
                options={Array.from({ length: 12 }, (_, i) => i * 5)} // 0 to 55, step 5
                unit="sec"
                onChange={(s) => setStep(editStep._k, { sec: s })}
              />
            </View>

            {steps.length > 1 && (
              <ChunkyButton
                ghost
                fontSize={14}
                pad={[13, 20]}
                style={{ marginTop: 24 }}
                onPress={() => {
                  delStep(editStep._k);
                  setEditKey(null);
                }}
              >
                <IconTrash size={15} color={t.accent.main} />
                <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: t.accent.main, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                  Delete step
                </Text>
              </ChunkyButton>
            )}

            <ChunkyButton
              color={c.main}
              deep={c.deep}
              ink={c.ink}
              fontSize={16}
              pad={[15, 24]}
              style={{ marginTop: 10 }}
              onPress={() => setEditKey(null)}
            >
              Done
            </ChunkyButton>
          </View>
        )}
      </BottomSheet>

      <BottomSheet
        open={pomoFieldOpen !== null}
        onClose={() => setPomoFieldOpen(null)}
        title={
          pomoFieldOpen === 'sessions' ? 'Sessions' :
          pomoFieldOpen === 'focusMin' ? 'Focus duration' :
          pomoFieldOpen === 'breakMin' ? 'Short break' :
          pomoFieldOpen === 'longBreakMin' ? 'Long break' :
          ''
        }
      >
        {pomo && pomoFieldOpen && (
          <View style={{ gap: 20 }}>
            {pomoFieldOpen === 'sessions' && (
              <WheelPicker
                value={pomo.sessions}
                options={Array.from({ length: 7 }, (_, i) => i + 2)}
                unit="sets"
                onChange={(v) => setPomoField({ sessions: v })}
              />
            )}
            {pomoFieldOpen === 'focusMin' && (
              <WheelPicker
                value={pomo.focusMin}
                options={Array.from({ length: 12 }, (_, i) => (i + 1) * 5)}
                unit="min"
                onChange={(v) => setPomoField({ focusMin: v })}
              />
            )}
            {pomoFieldOpen === 'breakMin' && (
              <WheelPicker
                value={pomo.breakMin}
                options={Array.from({ length: 20 }, (_, i) => i + 1)}
                unit="min"
                onChange={(v) => setPomoField({ breakMin: v })}
              />
            )}
            {pomoFieldOpen === 'longBreakMin' && (
              <WheelPicker
                value={pomo.longBreakMin}
                options={Array.from({ length: 9 }, (_, i) => (i + 1) * 5)}
                unit="min"
                onChange={(v) => setPomoField({ longBreakMin: v })}
              />
            )}
            <ChunkyButton
              color={c.main}
              deep={c.deep}
              ink={c.ink}
              fontSize={16}
              pad={[15, 24]}
              onPress={() => setPomoFieldOpen(null)}
            >
              Done
            </ChunkyButton>
          </View>
        )}
      </BottomSheet>
    </View>
  );
}
