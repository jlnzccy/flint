import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Pressable, Text, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

import { IconCheck, IconPlay } from '@/components/icons';
import { Body, Display, useTimeFmt } from '@/components/ui';
import { Routine, routineMin } from '@/data/defaults';
import { Todo, todoDoneOn } from '@/state/store';
import { AgendaItem, buildAgenda } from '@/lib/agenda';
import { tapHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { addDays, dateKey, daysBetween, keyToDate } from '@/lib/dates';

const HOUR_H = 64;                 // px per hour — calendar-standard density
const PX_PER_MIN = HOUR_H / 60;
const DAY_H = 24 * HOUR_H;         // one full day section
const GUTTER = 50;                 // left hour-label column width
const RAIL_X = GUTTER - 1;         // vertical rail x
const BLOCK_PAD = 8;               // gap between rail and a block's left edge
const RIGHT_PAD = 2;
const COL_GAP = 4;                 // gap between side-by-side overlap columns
const MIN_BLOCK_H = 40;            // smallest a routine block shrinks to
const TASK_H = 24;                 // slim task marker height
const SPAN = 14;                   // days loaded each side of today at start
const CHUNK = 14;                  // days added per lazy extend
const ANCHOR = 0.4;                // now-line resting position (fraction of viewport height)

interface TimelineProps {
  routines: Routine[];
  todos: Todo[];
  todayK: string;
  doneMap: Record<string, boolean>;
  history: Record<string, string[]>;
  onRoutineLongPress?: (r: Routine) => void;
  style?: ViewStyle;
}

interface Placed {
  item: AgendaItem;
  start: number;
  top: number;
  height: number;
  col: number;
  cols: number;
}

const toMins = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const minsToHHMM = (mins: number): string => {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.floor(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Interval-graph column packing: side-by-side lanes for overlapping events.
function packColumns(intervals: { start: number; end: number }[]): { col: number; cols: number }[] {
  const out = intervals.map(() => ({ col: 0, cols: 1 }));
  let i = 0;
  while (i < intervals.length) {
    const colEnds: number[] = [];
    const members: number[] = [];
    let clusterEnd = intervals[i].end;
    let j = i;
    while (j < intervals.length && intervals[j].start < clusterEnd) {
      let placed = false;
      for (let c = 0; c < colEnds.length; c++) {
        if (colEnds[c] <= intervals[j].start) {
          out[j].col = c;
          colEnds[c] = intervals[j].end;
          placed = true;
          break;
        }
      }
      if (!placed) {
        out[j].col = colEnds.length;
        colEnds.push(intervals[j].end);
      }
      clusterEnd = Math.max(clusterEnd, intervals[j].end);
      members.push(j);
      j++;
    }
    const cols = colEnds.length;
    members.forEach((m) => { out[m].cols = cols; });
    i = j;
  }
  return out;
}

// Lay a day's timed items out as absolute-positioned blocks (overlap columns packed).
function placeDay(timed: AgendaItem[]): Placed[] {
  const sorted = [...timed].sort((a, b) => toMins(a.time!) - toMins(b.time!));
  const intervals = sorted.map((it) => {
    const s = toMins(it.time!);
    const dur = it.kind === 'routine' ? Math.max(it.durationMin, 1) : 1;
    return { start: s, end: s + dur };
  });
  const packed = packColumns(intervals);
  return sorted.map((it, idx) => {
    const s = toMins(it.time!);
    return {
      item: it,
      start: s,
      top: s * PX_PER_MIN,
      height: it.kind === 'routine' ? Math.max(it.durationMin * PX_PER_MIN, MIN_BLOCK_H) : TASK_H,
      col: packed[idx].col,
      cols: packed[idx].cols,
    };
  });
}

export function Timeline({
  routines,
  todos,
  todayK,
  doneMap,
  history,
  onRoutineLongPress,
  style,
}: TimelineProps) {
  const t = useTheme();
  const router = useRouter();
  const fmtT = useTimeFmt();
  const reducedMotion = useReducedMotion();
  const listRef = useRef<FlatList<string>>(null);

  // wall-clock minutes, refreshed every 30s
  const [nowMins, setNowMins] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  // measured viewport + grid width
  const [viewH, setViewH] = useState(0);
  const [trackW, setTrackW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    setViewH(e.nativeEvent.layout.height);
    setTrackW(e.nativeEvent.layout.width);
  };

  // continuous day-key window centered on today; lazily extended both ways
  const [keys, setKeys] = useState<string[]>(() => {
    const base = keyToDate(todayK);
    return Array.from({ length: SPAN * 2 + 1 }, (_, i) => dateKey(addDays(base, i - SPAN)));
  });

  // per-day agenda builder, cached by key; cache resets when inputs change
  const buildDay = useMemo(() => {
    const cache = new Map<string, ReturnType<typeof buildAgenda>>();
    return (key: string) => {
      const hit = cache.get(key);
      if (hit) return hit;
      const doneFor = (item: AgendaItem): boolean => {
        if (item.kind === 'routine') {
          return key === todayK ? !!doneMap[item.id] : (history[key] || []).includes(item.id);
        }
        const td = todos.find((x) => x.id === item.id);
        return td ? todoDoneOn(td, key) : false;
      };
      const res = buildAgenda(key, routines, todos, doneFor);
      cache.set(key, res);
      return res;
    };
  }, [routines, todos, doneMap, history, todayK]);

  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNowMins(d.getHours() * 60 + d.getMinutes());
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // ── scroll bookkeeping: keep "now" pinned at a fixed screen anchor ──
  const [atNow, setAtNow] = useState(true);
  const didInit = useRef(false);

  const offsetForNow = useCallback(() => {
    const idx = keys.indexOf(todayK);
    if (idx < 0) return 0;
    const anchorPx = viewH * ANCHOR;
    return Math.max(0, idx * DAY_H + nowMins * PX_PER_MIN - anchorPx);
  }, [keys, todayK, viewH, nowMins]);

  const scrollToNow = useCallback((animated: boolean) => {
    listRef.current?.scrollToOffset({ offset: offsetForNow(), animated });
  }, [offsetForNow]);

  // first real layout → land on now
  useEffect(() => {
    if (!didInit.current && viewH > 0) {
      didInit.current = true;
      requestAnimationFrame(() => scrollToNow(false));
    }
  }, [viewH, scrollToNow]);

  // while pinned, re-anchor on each tick so the line stays put as the grid creeps
  useEffect(() => {
    if (atNow && didInit.current && viewH > 0) scrollToNow(!reducedMotion);
  }, [nowMins, atNow, viewH, reducedMotion, scrollToNow]);

  const extendFuture = useCallback(() => {
    setKeys((k) => {
      const base = keyToDate(k[k.length - 1]);
      const add = Array.from({ length: CHUNK }, (_, i) => dateKey(addDays(base, i + 1)));
      return [...k, ...add];
    });
  }, []);

  // guard so a burst of scroll events near the top only prepends one chunk
  const prependingRef = useRef(false);
  useEffect(() => { prependingRef.current = false; }, [keys]);

  const extendPast = useCallback(() => {
    setKeys((k) => {
      const base = keyToDate(k[0]);
      const add = Array.from({ length: CHUNK }, (_, i) => dateKey(addDays(base, -(CHUNK - i))));
      return [...add, ...k];
    });
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (e.nativeEvent.contentOffset.y < DAY_H && !prependingRef.current) {
      prependingRef.current = true;
      extendPast();
    }
  };

  const getItemLayout = useCallback(
    (_: ArrayLike<string> | null | undefined, i: number) => ({ length: DAY_H, offset: i * DAY_H, index: i }),
    []
  );

  // geometry for a block given its overlap cluster
  const track = Math.max(0, trackW - GUTTER - BLOCK_PAD - RIGHT_PAD);
  const geom = useCallback(
    (b: Placed): { left: number; width?: number; right?: number } => {
      if (!trackW || b.cols <= 1) return { left: GUTTER + BLOCK_PAD, right: RIGHT_PAD };
      const colW = (track - (b.cols - 1) * COL_GAP) / b.cols;
      return { left: GUTTER + BLOCK_PAD + b.col * (colW + COL_GAP), width: colW };
    },
    [trackW, track]
  );

  const hourLabel = (h: number) => fmtT(minsToHHMM(h * 60)).replace(/[:.]00/, '').trim();

  const dayLabel = (key: string): string => {
    const diff = daysBetween(todayK, key);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    return keyToDate(key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const renderDay = useCallback(
    ({ item: key }: { item: string }) => {
      const { timed } = buildDay(key);
      const blocks = placeDay(timed);
      const isToday = key === todayK;
      const isPast = key < todayK;

      return (
        <View style={{ height: DAY_H, position: 'relative' }}>
          {/* hour gridlines + gutter labels (skip 0 — the date divider sits there) */}
          {Array.from({ length: 23 }, (_, idx) => idx + 1).map((h) => {
            const y = h * 60 * PX_PER_MIN;
            return (
              <View key={`h-${h}`} pointerEvents="none" style={{ position: 'absolute', top: y, left: 0, right: 0 }}>
                <View style={{ position: 'absolute', left: GUTTER, right: 0, top: 0, height: 1, backgroundColor: t.lineSoft }} />
                <Text
                  style={{
                    position: 'absolute', left: 0, top: -7, width: GUTTER - 10, textAlign: 'right',
                    fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: t.faint,
                  }}
                >
                  {hourLabel(h)}
                </Text>
              </View>
            );
          })}

          {/* vertical rail */}
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: RAIL_X, width: 2, backgroundColor: t.lineSoft }} />

          {/* midnight + date divider */}
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            <View style={{ position: 'absolute', left: GUTTER, right: 0, top: 0, height: 2, backgroundColor: t.line }} />
            <View style={{ position: 'absolute', top: 4, left: GUTTER + BLOCK_PAD, backgroundColor: t.bg, paddingRight: 8 }}>
              <Display size={12} style={{ color: isToday ? t.text : t.muted }}>{dayLabel(key)}</Display>
            </View>
          </View>

          {/* event blocks */}
          {blocks.map((b) => {
            const g = geom(b);
            const endMins = b.start + (b.item.kind === 'routine' ? b.item.durationMin : 0);
            const isDrift = !b.item.done && (isPast || (isToday && endMins < nowMins));

            if (b.item.kind === 'routine') {
              const r = routines.find((x) => x.id === b.item.id);
              if (!r) return null;
              const done = b.item.done;
              const c = t.col(r.color);
              const isSmall = b.height < 52;
              return (
                <Pressable
                  key={b.item.id}
                  onPress={() => router.push(`/routine/${r.id}`)}
                  onLongPress={() => onRoutineLongPress?.(r)}
                  style={{ position: 'absolute', top: b.top, left: g.left, width: g.width, right: g.right, height: b.height, opacity: isDrift ? 0.4 : 1 }}
                >
                  <View
                    style={{
                      flex: 1, flexDirection: 'row', borderRadius: 14,
                      backgroundColor: done ? t.raised : t.surface,
                      borderWidth: 2, borderColor: done ? t.lineSoft : c.main,
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: isSmall ? 2 : 6 }}>
                      <Text style={{ fontSize: isSmall ? 15 : 20 }}>{r.emoji}</Text>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Display size={isSmall ? 13 : 15} numberOfLines={1} style={{ color: done ? t.faint : t.text }}>
                          {r.name}
                        </Display>
                        {!isSmall && (
                          <Body size={11} color={t.faint} numberOfLines={1}>
                            {r.steps.length} steps · {routineMin(r)}m
                          </Body>
                        )}
                      </View>
                      {done ? (
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: t.green.main, alignItems: 'center', justifyContent: 'center' }}>
                          <IconCheck size={11} color={t.green.ink} />
                        </View>
                      ) : isToday ? (
                        <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: c.main, alignItems: 'center', justifyContent: 'center' }}>
                          <IconPlay size={9} color={c.main} />
                        </View>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            }

            // task marker — slim row pinned to its minute
            const todo = todos.find((x) => x.id === b.item.id);
            if (!todo) return null;
            const done = b.item.done;
            return (
              <Pressable
                key={b.item.id}
                onPress={() => router.push(`/task?id=${todo.id}`)}
                style={{
                  position: 'absolute', top: b.top - TASK_H / 2, left: g.left, width: g.width, right: g.right,
                  height: TASK_H, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: done || isDrift ? 0.45 : 1,
                }}
              >
                <View
                  style={{
                    width: 10, height: 10, borderRadius: 5,
                    backgroundColor: done ? t.green.main : t.accent.main,
                    borderWidth: 2, borderColor: done ? t.green.deep : t.accent.deep,
                  }}
                />
                <Body size={14} color={done ? t.faint : t.text} style={[{ flex: 1 }, done && { textDecorationLine: 'line-through' }]} numberOfLines={1}>
                  {todo.title}
                </Body>
              </Pressable>
            );
          })}

          {/* NOW indicator — only on today's section */}
          {isToday && <NowLine top={nowMins * PX_PER_MIN} label={fmtT(minsToHHMM(nowMins))} />}
        </View>
      );
    },
    [buildDay, todayK, t, geom, hourLabel, nowMins, routines, todos, onRoutineLongPress, router, fmtT]
  );

  return (
    <View style={[{ flex: 1, position: 'relative' }, style]} onLayout={onLayout}>
      <FlatList
        ref={listRef}
        data={keys}
        keyExtractor={(k) => k}
        renderItem={renderDay}
        getItemLayout={getItemLayout}
        initialScrollIndex={SPAN}
        showsVerticalScrollIndicator={false}
        extraData={`${nowMins}|${trackW}|${atNow}`}
        initialNumToRender={3}
        windowSize={9}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => setAtNow(false)}
        onEndReached={extendFuture}
        onEndReachedThreshold={1.5}
      />

      {!atNow && (
        <Pressable
          onPressIn={() => tapHaptic()}
          onPress={() => { setAtNow(true); scrollToNow(!reducedMotion); }}
          accessibilityLabel="Jump to now"
          style={{
            position: 'absolute', right: 16, bottom: 20,
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: t.accent.main, borderRadius: 99,
            paddingVertical: 9, paddingHorizontal: 16,
            shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
          }}
        >
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.accent.ink }} />
          <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.accent.ink, textTransform: 'uppercase', letterSpacing: 0.5 }}>Now</Text>
        </Pressable>
      )}
    </View>
  );
}

// NOW line: gutter dot + pulse, accent rule across the grid, time pill.
function NowLine({ top, label }: { top: number; label: string }) {
  const t = useTheme();
  const reducedMotion = useReducedMotion();

  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.6);

  useEffect(() => {
    if (reducedMotion) {
      ringScale.value = 1;
      ringOpacity.value = 0.5;
      return;
    }
    ringScale.value = 1;
    ringOpacity.value = 0.6;
    ringScale.value = withRepeat(withTiming(2.4, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false);
    ringOpacity.value = withRepeat(withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false);
  }, [reducedMotion]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: top - 9, left: 0, right: 0, height: 18, zIndex: 50 }}>
      {/* accent rule across the grid */}
      <View style={{ position: 'absolute', top: 8, left: RAIL_X, right: 0, height: 2, backgroundColor: t.accent.main }} />
      {/* time pill in the gutter */}
      <View style={{ position: 'absolute', top: 0, left: 0, backgroundColor: t.accent.main, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 }}>
        <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 10, color: t.accent.ink }}>{label}</Text>
      </View>
      {/* pulsing ring + solid dot on the rail */}
      <Animated.View
        style={[
          { position: 'absolute', top: 1, left: RAIL_X - 7, width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: t.accent.main },
          ringStyle,
        ]}
      />
      <View style={{ position: 'absolute', top: 5, left: RAIL_X - 3, width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent.main }} />
    </View>
  );
}
