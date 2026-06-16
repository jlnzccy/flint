import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, Keyframe, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton, ChunkyCard } from '@/components/chunky';
import { IconArchive, IconCal, IconClock, IconDots, IconDrag, IconPlus } from '@/components/icons';
import { NewRoutineSheet } from '@/components/new-routine-sheet';
import { PreviewSheet, RoutineCard } from '@/components/routine-bits';
import { BottomSheet } from '@/components/sheet';
import { DragList } from '@/components/drag-list';
import { useToast } from '@/components/toast';
import { Body, Chip, Display, Label, useTimeFmt } from '@/components/ui';
import { Routine, routineOnDay } from '@/data/defaults';
import { confirmDestructive } from '@/lib/confirm';
import { addDays, dateKey, greetingNow, keyToDate, minsUntil, todayKey } from '@/lib/dates';
import { finishHaptic, tapHaptic } from '@/lib/haptics';
import { mergedHistory, resolveRoutines, streakOf, useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';

const SWIPE = 48; // px of horizontal drag before the day flips
const SLIDE_R = new Keyframe({
  0: { opacity: 0, transform: [{ translateX: 26 }] },
  100: { opacity: 1, transform: [{ translateX: 0 }], easing: Easing.out(Easing.cubic) },
}).duration(200);
const SLIDE_L = new Keyframe({
  0: { opacity: 0, transform: [{ translateX: -26 }] },
  100: { opacity: 1, transform: [{ translateX: 0 }], easing: Easing.out(Easing.cubic) },
}).duration(200);

/* Always-on streak chip. Greyed (fire dimmed, count faint) at 0 so it never reads
   as failure — it just sits there until there's something to count. */
function StreakBadge({ n }: { n: number }) {
  const t = useTheme();
  const active = n >= 1;
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: active ? t.accent.soft : t.raised,
        borderWidth: 2, borderColor: active ? t.accent.main : t.lineSoft,
        borderRadius: 99, paddingVertical: 6, paddingHorizontal: 12,
      }}
    >
      <Text style={{ fontSize: 14, opacity: active ? 1 : 0.4 }}>🔥</Text>
      <Text style={{ fontFamily: 'Nunito_900Black', fontSize: 15, color: active ? t.accent.main : t.faint }}>{n}</Text>
    </View>
  );
}

export default function TodayScreen() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const fmtT = useTimeFmt();
  const insets = useSafeAreaInsets();

  const custom = useStore((s) => s.custom);
  const overrides = useStore((s) => s.overrides);
  const order = useStore((s) => s.order);
  const archived = useStore((s) => s.archived);
  const deleted = useStore((s) => s.deleted);
  const doneMap = useStore((s) => s.doneMap);
  const bumped = useStore((s) => s.bumped);
  const history = useStore((s) => s.history);
  const settings = useStore((s) => s.settings);
  const { markDone, bump, unbump, archiveRoutine, deleteRoutine, restoreRoutine, reorder, duplicateRoutine } = useStore.getState();

  const routines = useMemo(
    () => resolveRoutines({ custom, overrides, order, archived, deleted }),
    [custom, overrides, order, archived, deleted]
  );

  const [preview, setPreview] = useState<Routine | null>(null);
  const [reordering, setReordering] = useState(false);
  const [archOpen, setArchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  // which day is on screen — defaults to today; pager looks ahead/behind
  const todayK = todayKey();
  const [viewKey, setViewKey] = useState(todayK);
  const [dir, setDir] = useState(1); // slide direction for the day transition
  const viewDate = keyToDate(viewKey);
  const dow = viewDate.getDay();
  const isToday = viewKey === todayK;
  const isFuture = viewKey > todayK;
  const isPast = viewKey < todayK;
  const goDay = (k: string) => {
    if (k === viewKey) return;
    setDir(k > viewKey ? 1 : -1);
    setReordering(false);
    setViewKey(k);
  };
  const shiftDay = (n: number) => goDay(dateKey(addDays(viewDate, n)));

  // swipe left/right to walk days; vertical scroll still wins (failOffsetY)
  const panX = useSharedValue(0);
  const swipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-14, 14])
    .onUpdate((e) => {
      panX.value = e.translationX * 0.28;
    })
    .onEnd((e) => {
      if (e.translationX <= -SWIPE || e.velocityX <= -650) runOnJS(shiftDay)(1);
      else if (e.translationX >= SWIPE || e.velocityX >= 650) runOnJS(shiftDay)(-1);
      panX.value = withTiming(0, { duration: 160 });
    });
  const panStyle = useAnimatedStyle(() => ({ transform: [{ translateX: panX.value }] }));

  // re-render every 30s so the "Next: …" countdown stays honest
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // ── today (interactive) ──
  const todayRoutines = routines.filter((r) => routineOnDay(r));
  const open = todayRoutines.filter((r) => !doneMap[r.id]);
  const scheduled = open.filter((r) => r.reminder).sort((a, b) => a.reminder!.localeCompare(b.reminder!));
  const flexible = open.filter((r) => !r.reminder);
  const completed = todayRoutines.filter((r) => doneMap[r.id]);

  // time-blindness anchor: the next scheduled thing still ahead of now
  const nextUp = scheduled.filter((r) => !bumped[r.id]).find((r) => minsUntil(r.reminder) > 0);
  const nextMins = nextUp ? minsUntil(nextUp.reminder) : 0;
  const nextWhen = nextMins >= 60 ? `${Math.floor(nextMins / 60)}h ${nextMins % 60}m` : `${nextMins}m`;

  // ── another day (read-only preview) ──
  const dayRoutines = useMemo(() => routines.filter((r) => routineOnDay(r, dow)), [routines, dow]);
  const dayDone = useMemo(() => (isPast ? new Set(history[viewKey] || []) : new Set<string>()), [isPast, history, viewKey]);
  const dayScheduled = dayRoutines.filter((r) => r.reminder).sort((a, b) => a.reminder!.localeCompare(b.reminder!));
  const dayFlexible = dayRoutines.filter((r) => !r.reminder);
  const dayDoneCount = dayRoutines.filter((r) => dayDone.has(r.id)).length;

  const merged = useMemo(() => mergedHistory({ history, doneMap }), [history, doneMap]);
  const streak = useMemo(
    () => (settings.streaks ? streakOf(merged, settings.streakNeverDies) : 0),
    [settings.streaks, settings.streakNeverDies, merged]
  );

  const archivedList = useMemo(() => {
    const all = resolveRoutines({ custom, overrides, order, archived: [], deleted });
    return archived.map((id) => all.find((r) => r.id === id)).filter(Boolean) as Routine[];
  }, [custom, overrides, order, archived, deleted]);

  const confirmDelete = (r: Routine, after?: () => void) =>
    confirmDestructive('Delete routine?', `"${r.name}" and its history stay gone.`, 'Delete', () => {
      deleteRoutine(r.id);
      toast('Deleted');
      after?.();
    });

  const renderCards = (list: Routine[]) => (
    <View style={{ gap: 12 }}>
      {list.map((r) => (
        <RoutineCard
          key={r.id}
          routine={r}
          done={doneMap[r.id]}
          bumped={bumped[r.id]}
          remindersOn={settings.remindersOn}
          onPress={() => router.push(`/routine/${r.id}`)}
          onLongPress={() => {
            tapHaptic();
            setPreview(r);
          }}
        />
      ))}
    </View>
  );

  const renderDayCards = (list: Routine[]) => (
    <View style={{ gap: 12 }}>
      {list.map((r) => (
        <RoutineCard
          key={r.id}
          routine={r}
          done={dayDone.has(r.id)}
          readonly
          remindersOn={settings.remindersOn}
          onPress={() => router.push(`/routine/${r.id}`)}
          onLongPress={() => {}}
        />
      ))}
    </View>
  );

  const dateLabel = viewDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const heroTitle = isToday ? greetingNow() : viewDate.toLocaleDateString('en-US', { weekday: 'long' });
  const routinesLabel = isToday
    ? `Routines${todayRoutines.length ? ` · ${completed.length}/${todayRoutines.length}` : ''}`
    : isPast
      ? `Routines${dayRoutines.length ? ` · ${dayDoneCount}/${dayRoutines.length}` : ''}`
      : `Routines${dayRoutines.length ? ` · ${dayRoutines.length}` : ''}`;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <GestureDetector gesture={swipe}>
      <View style={{ flex: 1 }}>
        {/* pinned hero header — stays put while the day's list slides on swipe */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Pressable
                onPressIn={() => tapHaptic()}
                onPress={() => router.push('/calendar')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                accessibilityLabel="Open calendar"
              >
                <Label>{dateLabel}</Label>
                <IconCal size={15} color={t.faint} />
              </Pressable>
              <Display size={30} style={{ marginTop: 8 }}>{heroTitle}</Display>
              {isToday && nextUp ? (
                <Body size={13} color={t.muted} style={{ marginTop: 5 }}>Next: {nextUp.name} · {nextWhen}</Body>
              ) : isFuture ? (
                <Body size={13} color={t.muted} style={{ marginTop: 5 }}>Coming up</Body>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              {isToday && settings.streaks && <StreakBadge n={streak} />}
              {!isToday && (
                <Chip onPress={() => goDay(todayK)} style={{ paddingVertical: 6, paddingHorizontal: 12 }}>
                  <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: t.muted }}>Today</Text>
                </Chip>
              )}
            </View>
          </View>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <Animated.View style={panStyle}>
          <Animated.View key={viewKey} entering={dir > 0 ? SLIDE_R : SLIDE_L}>

        {/* routines header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 12 }}>
          <Label color={t.muted}>{routinesLabel}</Label>
          {isToday && (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {reordering ? (
                <Chip active onPress={() => setReordering(false)}>Done</Chip>
              ) : (
                <>
                  <Chip onPress={() => router.push('/timer')} style={{ paddingVertical: 6, paddingHorizontal: 10 }}>
                    <IconClock size={16} color={t.muted} />
                  </Chip>
                  {(routines.length > 1 || archivedList.length > 0) && (
                    <Chip onPress={() => setMenuOpen(true)} style={{ paddingVertical: 6, paddingHorizontal: 10 }}>
                      <IconDots size={16} color={t.muted} />
                    </Chip>
                  )}
                  <Chip onPress={() => setNewOpen(true)} style={{ paddingVertical: 6, paddingHorizontal: 10 }}>
                    <IconPlus size={16} color={t.muted} />
                  </Chip>
                </>
              )}
            </View>
          )}
        </View>

        {isToday ? (
          reordering ? (
            <DragList
              items={routines}
              keyOf={(r) => r.id}
              onReorder={reorder}
              renderRow={(r, handle, dragging) => {
                const c = t.col(r.color);
                return (
                  <View
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
                      backgroundColor: t.surface, borderWidth: 2, borderColor: dragging ? c.main : t.lineSoft, borderRadius: 18,
                    }}
                  >
                    {handle}
                    <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
                    <Display size={15} style={{ flex: 1 }}>{r.name}</Display>
                    <Label>{r.reminder ? fmtT(r.reminder) : 'anytime'}</Label>
                  </View>
                );
              }}
            />
          ) : routines.length === 0 ? (
            <ChunkyCard onPress={() => setNewOpen(true)}>
              <View style={{ alignItems: 'center', padding: 22, gap: 8 }}>
                <Text style={{ fontSize: 30 }}>🌱</Text>
                <Body size={14} color={t.muted}>No routines yet. Tap to make one.</Body>
              </View>
            </ChunkyCard>
          ) : todayRoutines.length === 0 ? (
            <Body size={14} color={t.faint} style={{ textAlign: 'center', paddingVertical: 18 }}>
              Nothing scheduled today.
            </Body>
          ) : (
            <>
              {scheduled.length > 0 && (
                <>
                  <Label style={{ marginBottom: 8, fontSize: 11 }}>Scheduled</Label>
                  {renderCards(scheduled)}
                </>
              )}
              {flexible.length > 0 && (
                <>
                  <Label style={{ marginTop: scheduled.length ? 18 : 0, marginBottom: 8, fontSize: 11 }}>Anytime</Label>
                  {renderCards(flexible)}
                </>
              )}
              {completed.length > 0 && (
                <>
                  <Label style={{ marginTop: scheduled.length + flexible.length ? 18 : 0, marginBottom: 8, fontSize: 11 }} color={t.green.main}>
                    Completed
                  </Label>
                  {renderCards(completed)}
                </>
              )}
            </>
          )
        ) : dayRoutines.length === 0 ? (
          <Body size={14} color={t.faint} style={{ textAlign: 'center', paddingVertical: 18 }}>
            Nothing scheduled.
          </Body>
        ) : (
          <>
            {dayScheduled.length > 0 && (
              <>
                <Label style={{ marginBottom: 8, fontSize: 11 }}>Scheduled</Label>
                {renderDayCards(dayScheduled)}
              </>
            )}
            {dayFlexible.length > 0 && (
              <>
                <Label style={{ marginTop: dayScheduled.length ? 18 : 0, marginBottom: 8, fontSize: 11 }}>Anytime</Label>
                {renderDayCards(dayFlexible)}
              </>
            )}
          </>
        )}
          </Animated.View>
        </Animated.View>
      </ScrollView>
      </View>
      </GestureDetector>

      {/* ⋯ menu */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Routines">
        <View style={{ gap: 10 }}>
          {routines.length > 1 && (
            <ChunkyButton
              ghost
              fontSize={15}
              pad={[14, 18]}
              faceStyle={{ justifyContent: 'flex-start' }}
              onPress={() => {
                setMenuOpen(false);
                setReordering(true);
              }}
            >
              <IconDrag size={16} color={t.text} />
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: t.text, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                Reorder
              </Text>
            </ChunkyButton>
          )}
          {archivedList.length > 0 && (
            <ChunkyButton
              ghost
              fontSize={15}
              pad={[14, 18]}
              faceStyle={{ justifyContent: 'flex-start' }}
              onPress={() => {
                setMenuOpen(false);
                setArchOpen(true);
              }}
            >
              <IconArchive size={16} color={t.text} />
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: t.text, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                Archived ({archivedList.length})
              </Text>
            </ChunkyButton>
          )}
        </View>
      </BottomSheet>

      <NewRoutineSheet open={newOpen} onClose={() => setNewOpen(false)} />

      <PreviewSheet
        routine={preview}
        done={preview ? doneMap[preview.id] : false}
        bumped={preview ? bumped[preview.id] : false}
        onClose={() => setPreview(null)}
        onOpen={(r) => router.push(`/routine/${r.id}`)}
        onStartOne={(r) => router.push(`/player/${r.id}?limit=1`)}
        onMarkDone={(r) => {
          markDone(r.id);
          finishHaptic();
          toast('Done ✓');
        }}
        onEdit={(r) => router.push(`/editor?id=${r.id}`)}
        onDuplicate={(r) => {
          duplicateRoutine(r.id);
          toast('Duplicated');
        }}
        onShare={() => toast('Coming soon')}
        onBump={(r) => {
          bump(r.id);
          toast('See you tomorrow');
        }}
        onUnbump={(r) => unbump(r.id)}
        onArchive={(r) => {
          archiveRoutine(r.id);
          toast('Archived');
        }}
        onDelete={(r) => confirmDelete(r)}
        onPreviewAlarm={(r) => router.push(`/alarm/${r.id}`)}
      />

      <BottomSheet open={archOpen} onClose={() => setArchOpen(false)} title="Archived">
        {archivedList.length === 0 ? (
          <Body size={13.5} color={t.faint} style={{ textAlign: 'center', padding: 16 }}>
            Nothing archived.
          </Body>
        ) : (
          <View>
            {archivedList.map((r, i) => (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 2 : 0, borderColor: t.lineSoft }}>
                <Text style={{ fontSize: 20, opacity: 0.7 }}>{r.emoji}</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Display size={15}>{r.name}</Display>
                  <Body size={12} color={t.faint}>{r.steps.length} steps</Body>
                </View>
                <Chip
                  onPress={() => confirmDelete(r, () => archivedList.length <= 1 && setArchOpen(false))}
                >
                  <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.muted }}>Delete</Text>
                </Chip>
                <Chip
                  active
                  onPress={() => {
                    restoreRoutine(r.id);
                    toast('Restored');
                    if (archivedList.length <= 1) setArchOpen(false);
                  }}
                >
                  Restore
                </Chip>
              </View>
            ))}
          </View>
        )}
      </BottomSheet>

    </View>
  );
}
