import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, Keyframe, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton, ChunkyCard } from '@/components/chunky';
import { IconCal, IconClock, IconList } from '@/components/icons';
import { NewRoutineSheet } from '@/components/new-routine-sheet';
import { PreviewSheet, RoutineCard } from '@/components/routine-bits';
import { TodoRow } from '@/components/todo-row';
import { Timeline } from '@/components/timeline';
import { BottomSheet } from '@/components/sheet';
import { DragList } from '@/components/drag-list';
import { useToast } from '@/components/toast';
import { Body, Chip, Display, Label, useTimeFmt } from '@/components/ui';
import { Routine, routineOnDay } from '@/data/defaults';
import { confirmDestructive } from '@/lib/confirm';
import { addDays, dateKey, fmtDate, greetingNow, keyToDate, minsUntil, todayKey } from '@/lib/dates';
import { finishHaptic, tapHaptic } from '@/lib/haptics';
import { buildAgenda, AgendaItem } from '@/lib/agenda';
import { mergedHistory, resolveRoutines, streakOf, useStore, todoDoneOn, todoIsToday } from '@/state/store';
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
  const todos = useStore((s) => s.todos);
  const { markDone, bump, unbump, archiveRoutine, deleteRoutine, restoreRoutine, reorder, duplicateRoutine, setSettings } = useStore.getState();

  const routines = useMemo(
    () => resolveRoutines({ custom, overrides, order, archived, deleted }),
    [custom, overrides, order, archived, deleted]
  );

  const [preview, setPreview] = useState<Routine | null>(null);
  const [reordering, setReordering] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);


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

  // ── agenda (interactive / preview) ──
  const agenda = useMemo(() => {
    return buildAgenda(
      viewKey,
      routines,
      todos,
      (item) => {
        if (item.kind === 'routine') {
          return isToday ? !!doneMap[item.id] : !!(history[viewKey] || []).includes(item.id);
        } else {
          const todo = todos.find((x) => x.id === item.id);
          return todo ? todoDoneOn(todo, viewKey) : false;
        }
      }
    );
  }, [viewKey, routines, todos, doneMap, history, isToday]);

  const scheduled = agenda.timed.filter((item) => !item.done);
  const flexible = agenda.anytime.filter((item) => !item.done);
  const completed = [...agenda.timed, ...agenda.anytime].filter((item) => item.done);

  // time-blindness anchor: the next scheduled thing still ahead of now
  const nextUp = agenda.timed
    .filter((item) => !item.done && (item.kind === 'task' || !bumped[item.id]))
    .find((item) => minsUntil(item.time) > 0);
  const nextMins = nextUp ? minsUntil(nextUp.time) : 0;
  const nextWhen = nextMins >= 60 ? `${Math.floor(nextMins / 60)}h ${nextMins % 60}m` : `${nextMins}m`;

  // ── another day (read-only preview) ──
  const dayScheduled = agenda.timed;
  const dayFlexible = agenda.anytime;
  const totalCount = agenda.timed.length + agenda.anytime.length;
  const doneCount = [...agenda.timed, ...agenda.anytime].filter((x) => x.done).length;

  const merged = useMemo(() => mergedHistory({ history, doneMap }), [history, doneMap]);
  const streak = useMemo(
    () => (settings.streaks ? streakOf(merged, settings.streakNeverDies) : 0),
    [settings.streaks, settings.streakNeverDies, merged]
  );

  const confirmDelete = (r: Routine, after?: () => void) =>
    confirmDestructive('Delete routine?', `"${r.name}" and its history stay gone.`, 'Delete', () => {
      deleteRoutine(r.id);
      toast('Deleted');
      after?.();
    });

  const renderCards = (list: AgendaItem[]) => (
    <View style={{ gap: 12 }}>
      {list.map((item) => {
        if (item.kind === 'routine') {
          const r = routines.find((x) => x.id === item.id);
          if (!r) return null;
          return (
            <RoutineCard
              key={item.id}
              routine={r}
              done={item.done}
              bumped={bumped[r.id]}
              remindersOn={settings.remindersOn}
              onPress={() => router.push(`/routine/${r.id}`)}
              onLongPress={() => {
                tapHaptic();
                setPreview(r);
              }}
            />
          );
        } else {
          const todo = todos.find((x) => x.id === item.id);
          if (!todo) return null;
          return (
            <View
              key={item.id}
              style={{
                backgroundColor: t.surface,
                borderWidth: 2,
                borderColor: t.lineSoft,
                borderRadius: 18,
                paddingHorizontal: 14,
                paddingVertical: 2,
              }}
            >
              <TodoRow todo={todo} />
            </View>
          );
        }
      })}
    </View>
  );

  const renderDayCards = (list: AgendaItem[]) => (
    <View style={{ gap: 12 }}>
      {list.map((item) => {
        if (item.kind === 'routine') {
          const r = routines.find((x) => x.id === item.id);
          if (!r) return null;
          return (
            <RoutineCard
              key={item.id}
              routine={r}
              done={item.done}
              readonly
              remindersOn={settings.remindersOn}
              onPress={() => router.push(`/routine/${r.id}`)}
              onLongPress={() => {}}
            />
          );
        } else {
          const todo = todos.find((x) => x.id === item.id);
          if (!todo) return null;
          return (
            <View
              key={item.id}
              pointerEvents="none"
              style={{
                backgroundColor: t.surface,
                borderWidth: 2,
                borderColor: t.lineSoft,
                borderRadius: 18,
                paddingHorizontal: 14,
                paddingVertical: 2,
                opacity: 0.7,
              }}
            >
              <TodoRow todo={todo} />
            </View>
          );
        }
      })}
    </View>
  );

  const dateLabel = fmtDate(viewDate, { weekday: 'short', month: 'short', day: 'numeric' });
  const heroTitle = isToday ? greetingNow() : fmtDate(viewDate, { weekday: 'long' });
  const routinesLabel = isToday
    ? `Routines${totalCount ? ` · ${doneCount}/${totalCount}` : ''}`
    : isPast
      ? `Routines${totalCount ? ` · ${doneCount}/${totalCount}` : ''}`
      : `Routines${totalCount ? ` · ${totalCount}` : ''}`;

  const isTimeline = (settings.todayView ?? 'list') === 'timeline';

  // shared bar: ROUTINES counter inline with the list/timeline switcher (or Done while reordering)
  const sharedBar = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 12 }}>
      <Label color={t.muted}>{routinesLabel}</Label>
      {reordering ? (
        <Chip active onPress={() => setReordering(false)}>Done</Chip>
      ) : (
        <View style={{ flexDirection: 'row', gap: 3, padding: 3, backgroundColor: t.raised, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 11 }}>
          {([['list', IconList], ['timeline', IconClock]] as const).map(([mode, Icon]) => {
            const active = (settings.todayView ?? 'list') === mode;
            return (
              <Pressable
                key={mode}
                onPressIn={() => tapHaptic()}
                onPress={() => {
                  // timeline always anchors on today — snap viewKey back when switching in
                  if (mode === 'timeline' && viewKey !== todayK) setViewKey(todayK);
                  setSettings({ todayView: mode });
                }}
                accessibilityLabel={mode === 'list' ? 'List view' : 'Timeline view'}
                style={{ borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: active ? t.accent.main : 'transparent' }}
              >
                <Icon size={15} color={active ? t.accent.ink : t.muted} />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );

  // pinned hero header — stays put across modes
  const heroHeader = (
    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPressIn={() => tapHaptic()}
              onPress={() => router.push('/calendar')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              accessibilityLabel="Open calendar"
            >
              <Label>{dateLabel}</Label>
              <IconCal size={15} color={t.faint} />
            </Pressable>
          </View>
          <Display size={30} style={{ marginTop: 8 }}>{heroTitle}</Display>
          {isToday && nextUp ? (
            <Body size={13} color={t.muted} style={{ marginTop: 5 }}>Next: {nextUp.title} · {nextWhen}</Body>
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
  );

  // Anytime strip for timeline mode — pinned at the bottom; active items lead, done sink to the end
  const anytimeSorted = useMemo(
    () => [...agenda.anytime].sort((a, b) => Number(a.done) - Number(b.done)),
    [agenda.anytime]
  );
  const anytimeStrip = agenda.anytime.length > 0 ? (
    <View style={{ paddingLeft: 20, paddingTop: 10, paddingBottom: 6 + insets.bottom, borderTopWidth: 2, borderTopColor: t.lineSoft, backgroundColor: t.bg }}>
      <Label style={{ marginBottom: 8, fontSize: 11 }}>Anytime</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
        {anytimeSorted.map((item) => {
          const done = item.done;
          const due = item.due;
          const color = item.kind === 'routine' ? t.col(item.color) : { main: t.accent.main, soft: t.accent.soft };
          return (
            <Pressable
              key={item.id}
              onPressIn={() => tapHaptic()}
              onPress={() => {
                if (item.kind === 'routine') router.push(`/routine/${item.id}`);
                else router.push(`/task?id=${item.id}`);
              }}
              onLongPress={() => {
                if (item.kind === 'routine') {
                  const r = routines.find((x) => x.id === item.id);
                  if (r) { tapHaptic(); setPreview(r); }
                }
              }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: done ? t.raised : t.surface,
                borderWidth: 2, borderColor: done ? t.lineSoft : color.main,
                borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10,
                opacity: done ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'NotoColorEmoji' }}>{item.emoji}</Text>
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: done ? t.faint : t.text }}>{item.title}</Text>
              {due && !done && (
                <View style={{ backgroundColor: t.accent.soft, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                  <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 9, color: t.accent.main, textTransform: 'uppercase' }}>Due</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      {heroHeader}

      {reordering ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {sharedBar}
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
                  <Text style={{ fontSize: 22, fontFamily: 'NotoColorEmoji' }}>{r.emoji}</Text>
                  <Display size={15} style={{ flex: 1 }}>{r.name}</Display>
                  <Label>{r.reminder ? fmtT(r.reminder) : 'anytime'}</Label>
                </View>
              );
            }}
          />
        </ScrollView>
      ) : isTimeline ? (
        // timeline owns its own vertical scroll — no outer ScrollView, no horizontal day-swipe
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 20 }}>{sharedBar}</View>
          <Timeline
            routines={routines}
            todos={todos}
            todayK={todayK}
            doneMap={doneMap}
            history={history}
            viewKey={viewKey}
            onViewKeyChange={setViewKey}
            onRoutineLongPress={(r) => {
              tapHaptic();
              setPreview(r);
            }}
          />
          {anytimeStrip}
        </View>
      ) : (
        <GestureDetector gesture={swipe}>
          <View style={{ flex: 1 }}>
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View style={panStyle}>
                <Animated.View key={viewKey} entering={dir > 0 ? SLIDE_R : SLIDE_L}>
                  {sharedBar}
                  <>
                    {isToday ? (
                      routines.length === 0 ? (
                        <ChunkyCard onPress={() => setNewOpen(true)}>
                          <View style={{ alignItems: 'center', padding: 22, gap: 8 }}>
                            <Text style={{ fontSize: 30 }}>🌱</Text>
                            <Body size={14} color={t.muted}>No routines yet. Tap to make one.</Body>
                          </View>
                        </ChunkyCard>
                      ) : (agenda.timed.length === 0 && agenda.anytime.length === 0) ? (
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
                    ) : (agenda.timed.length === 0 && agenda.anytime.length === 0) ? (
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
                  </>
                </Animated.View>
              </Animated.View>
            </ScrollView>
          </View>
        </GestureDetector>
      )}

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
        onShare={(r) => {
          setPreview(null);
          router.push(`/share?id=${r.id}`);
        }}
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
        onReorder={routines.length > 1 ? () => setReordering(true) : undefined}
      />

    </View>
  );
}
