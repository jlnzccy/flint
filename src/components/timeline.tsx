import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Pressable, Text, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing, runOnJS } from 'react-native-reanimated';

import { IconCheck, IconPlay } from '@/components/icons';
import { Body, Display, useTimeFmt } from '@/components/ui';
import { Routine, routineMin } from '@/data/defaults';
import { Todo, todoDoneOn } from '@/state/store';
import { AgendaItem, buildAgenda } from '@/lib/agenda';
import { tapHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { addDays, dateKey, daysBetween, fmtDate, keyToDate } from '@/lib/dates';
import { ChunkyButton } from '@/components/chunky';

const HOUR_LEVELS = [32, 48, 64, 96, 132]; // px-per-hour zoom stops (pinch snaps to nearest)
const DEFAULT_HOUR_H = 64;                 // calendar-standard density
const GUTTER = 50;                 // left hour-label column width
const RAIL_X = GUTTER - 1;         // vertical rail x
const BLOCK_PAD = 8;               // gap between rail and a block's left edge
const RIGHT_PAD = 2;
const COL_GAP = 4;                 // gap between side-by-side overlap columns
const LINE_H = 24;                 // below this a routine collapses to a labelled rule
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
  viewKey?: string;
  onViewKeyChange?: (key: string) => void;
  onRoutineLongPress?: (r: Routine) => void;
  style?: ViewStyle;
}

interface Placed {
  item: AgendaItem;
  start: number;
  top: number;
  height: number;
  line: boolean;   // render as a labelled rule instead of a block (too short to read)
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

function placeDay(timed: AgendaItem[], pxPerMin: number): Placed[] {
  const sorted = [...timed].sort((a, b) => toMins(a.time!) - toMins(b.time!));
  const intervals = sorted.map((it) => {
    const s = toMins(it.time!);
    const dur = it.kind === 'routine' ? Math.max(it.durationMin, 1) : 1;
    return { start: s, end: s + dur };
  });
  const packed = packColumns(intervals);
  return sorted.map((it, idx) => {
    const s = toMins(it.time!);
    const naturalH = it.kind === 'routine' ? it.durationMin * pxPerMin : TASK_H;
    const line = it.kind === 'routine' && naturalH < LINE_H;
    return {
      item: it,
      start: s,
      top: s * pxPerMin,
      height: it.kind === 'routine' ? (line ? 0 : naturalH) : TASK_H,
      line,
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
  viewKey,
  onViewKeyChange,
  onRoutineLongPress,
  style,
}: TimelineProps) {
  const t = useTheme();
  const router = useRouter();
  const fmtT = useTimeFmt();
  const reducedMotion = useReducedMotion();
  const listRef = useRef<FlatList<string>>(null);

  const dotScale = useSharedValue(1);
  useEffect(() => {
    if (reducedMotion) {
      dotScale.value = 1;
      return;
    }
    dotScale.value = 1;
    dotScale.value = withRepeat(
      withTiming(1.5, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [reducedMotion]);

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  // ── zoom: px-per-hour, driven by pinch; snaps to HOUR_LEVELS ──
  const [hourH, setHourH] = useState(DEFAULT_HOUR_H);
  const hourHRef = useRef(DEFAULT_HOUR_H);
  const pxPerMin = hourH / 60;
  const dayH = 24 * hourH;

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
  const atNowRef = useRef(true);
  const setAtNowBoth = useCallback((v: boolean) => { atNowRef.current = v; setAtNow(v); }, []);
  const didInit = useRef(false);
  const scrollYRef = useRef(0);

  const offsetForNow = useCallback(() => {
    const idx = keys.indexOf(todayK);
    if (idx < 0) return 0;
    const anchorPx = viewH * ANCHOR;
    return Math.max(0, idx * dayH + nowMins * pxPerMin - anchorPx);
  }, [keys, todayK, viewH, nowMins, dayH, pxPerMin]);

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

  // while pinned, re-anchor on each 30s tick so the line stays put as the grid creeps
  useEffect(() => {
    if (atNowRef.current && didInit.current && viewH > 0) scrollToNow(!reducedMotion);
  }, [nowMins, viewH, reducedMotion, scrollToNow]);

  // Scroll to day when viewKey changes externally
  useEffect(() => {
    if (!didInit.current || viewH <= 0 || !viewKey) return;
    const idx = keys.indexOf(viewKey);
    if (idx >= 0) {
      const targetOffset = idx * dayH + (viewKey === todayK ? nowMins * pxPerMin - viewH * ANCHOR : 0);
      const diff = Math.abs(scrollYRef.current - targetOffset);
      if (diff > 10) {
        listRef.current?.scrollToOffset({ offset: targetOffset, animated: true });
      }
    }
  }, [viewKey, viewH, dayH, todayK, nowMins, pxPerMin, keys]);

  const pendingZoom = useRef<{ di: number; mins: number } | null>(null);

  const applyZoom = useCallback((nextH: number) => {
    const oldH = hourHRef.current;
    const oldDayH = 24 * oldH;
    const oldPx = oldH / 60;
    const absCenter = scrollYRef.current + viewH * ANCHOR;
    const di = Math.floor(absCenter / oldDayH);
    const mins = (absCenter - di * oldDayH) / oldPx;
    hourHRef.current = nextH;
    pendingZoom.current = { di, mins };
    setHourH(nextH);
  }, [viewH]);

  const startHourH = useRef(DEFAULT_HOUR_H);

  const onPinchStart = useCallback(() => {
    startHourH.current = hourHRef.current;
  }, []);

  const onPinchChange = useCallback((scale: number) => {
    let nextH = startHourH.current * scale;
    nextH = Math.max(24, Math.min(180, nextH));
    nextH = Math.round(nextH);
    if (nextH !== hourHRef.current) {
      applyZoom(nextH);
    }
  }, [applyZoom]);

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          runOnJS(onPinchStart)();
        })
        .onChange((e) => {
          runOnJS(onPinchChange)(e.scale);
        }),
    [onPinchStart, onPinchChange]
  );

  // after a zoom re-render, restore the centred time (or re-pin to now)
  useEffect(() => {
    const p = pendingZoom.current;
    if (!p || viewH <= 0) return;
    pendingZoom.current = null;
    if (atNowRef.current) { requestAnimationFrame(() => scrollToNow(false)); return; }
    const offset = Math.max(0, p.di * dayH + p.mins * pxPerMin - viewH * ANCHOR);
    requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset, animated: false }));
  }, [hourH, viewH, dayH, pxPerMin, scrollToNow]);

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

  // ── pinned time cursor: a fixed-screen rule whose label tracks the scroll ──
  const [scrubMin, setScrubMin] = useState(nowMins);
  const scrubRef = useRef(nowMins);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    scrollYRef.current = y;
    if (y < dayH && !prependingRef.current) {
      prependingRef.current = true;
      extendPast();
    }
    if (viewH > 0) {
      const absCenter = y + viewH * ANCHOR;
      const di = Math.floor(absCenter / dayH);
      const mins = Math.max(0, Math.min(1439, Math.round((absCenter - di * dayH) / pxPerMin)));
      if (mins !== scrubRef.current) { scrubRef.current = mins; setScrubMin(mins); }
      if (di >= 0 && di < keys.length) {
        const k = keys[di];
        if (k && k !== viewKey && onViewKeyChange) {
          onViewKeyChange(k);
        }
      }
    }
  };

  const getItemLayout = useCallback(
    (_: ArrayLike<string> | null | undefined, i: number) => ({ length: dayH, offset: i * dayH, index: i }),
    [dayH]
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
    return fmtDate(keyToDate(key), { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const renderDay = useCallback(
    ({ item: key }: { item: string }) => {
      const { timed } = buildDay(key);
      const blocks = placeDay(timed, pxPerMin);
      const isToday = key === todayK;
      const isPast = key < todayK;

      return (
        <View style={{ height: dayH, position: 'relative' }}>
          {/* hour gridlines + gutter labels (skip 0 — the date divider sits there) */}
          {Array.from({ length: 23 }, (_, idx) => idx + 1).map((h) => {
            const y = h * 60 * pxPerMin;
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

          {/* midnight divider — date label sits inline on the rule, 00 label in the gutter */}
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            <View style={{ position: 'absolute', left: GUTTER, right: 0, top: 0, height: 2, backgroundColor: t.line }} />
            <Text
              style={{
                position: 'absolute', left: 0, top: -7, width: GUTTER - 10, textAlign: 'right',
                fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: t.faint,
              }}
            >
              {hourLabel(0)}
            </Text>
            <View style={{ position: 'absolute', top: -8, left: GUTTER + 12, backgroundColor: t.bg, paddingHorizontal: 6 }}>
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

              if (b.line) {
                return (
                  <Pressable
                    key={b.item.id}
                    onPress={() => router.push(`/routine/${r.id}`)}
                    onLongPress={() => onRoutineLongPress?.(r)}
                    style={{ position: 'absolute', top: b.top - 9, left: GUTTER, right: 0, height: 18, opacity: isDrift ? 0.4 : 1 }}
                  >
                    <View style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 2, borderRadius: 1, backgroundColor: done ? t.lineSoft : c.main, opacity: done ? 1 : 0.55 }} />
                    <View style={{ position: 'absolute', left: BLOCK_PAD, top: 0, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.bg, paddingRight: 8 }}>
                      <Text style={{ fontSize: 13 }}>{r.emoji}</Text>
                      <Display size={12} numberOfLines={1} style={{ color: done ? t.faint : c.main }}>{r.name}</Display>
                      {done && (
                        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: t.green.main, alignItems: 'center', justifyContent: 'center' }}>
                          <IconCheck size={8} color={t.green.ink} />
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              }

              const startTime = b.item.time || r.reminder || "00:00";
              const duration = routineMin(r);
              const startMins = toMins(startTime);
              const endMins = startMins + duration;
              const endTime = minsToHHMM(endMins);
              const timeStr = `${fmtT(startTime)} - ${fmtT(endTime)}`;

              const isSmall = b.height < 52;
              const showIcons = b.height >= 32;
              return (
                <Pressable
                  key={b.item.id}
                  onPress={() => router.push(`/routine/${r.id}`)}
                  onLongPress={() => onRoutineLongPress?.(r)}
                  style={{
                    position: 'absolute', top: b.top, left: g.left, width: g.width, right: g.right, height: b.height,
                    opacity: isDrift ? 0.4 : 1, overflow: 'visible',
                  }}
                >
                  <View
                    style={{
                      flex: 1, flexDirection: 'row', borderRadius: Math.min(14, Math.max(4, b.height / 2)),
                      backgroundColor: done ? t.raised : t.surface,
                      borderWidth: 2, borderColor: done ? t.lineSoft : c.main,
                      overflow: 'visible',
                    }}
                  >
                    <View
                      style={{
                        flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8,
                        paddingHorizontal: 12, paddingVertical: b.height < 32 ? 0 : (isSmall ? 2 : 6),
                        overflow: 'visible',
                      }}
                    >
                      <Text style={{ fontSize: isSmall ? 13 : 20 }}>{r.emoji}</Text>
                      <View style={{ flex: 1, minWidth: 0, overflow: 'visible' }}>
                        <Display size={isSmall ? 12 : 15} numberOfLines={1} style={{ color: done ? t.faint : t.text }}>
                          {r.name}
                        </Display>
                        <Body size={isSmall ? 9 : 11} color={t.faint} numberOfLines={1}>
                          {isSmall ? `${timeStr} · ${duration}m` : `${r.steps.length} steps · ${duration}m (${timeStr})`}
                        </Body>
                      </View>
                      {showIcons && (done ? (
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: t.green.main, alignItems: 'center', justifyContent: 'center' }}>
                          <IconCheck size={11} color={t.green.ink} />
                        </View>
                      ) : isToday ? (
                        <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: c.main, alignItems: 'center', justifyContent: 'center' }}>
                          <IconPlay size={9} color={c.main} />
                        </View>
                      ) : null)}
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
        </View>
      );
    },
    [buildDay, todayK, t, geom, hourLabel, dayLabel, nowMins, pxPerMin, dayH, routines, todos, onRoutineLongPress, router, fmtT]
  );

  return (
    <View style={[{ flex: 1, position: 'relative' }, style]} onLayout={onLayout}>
      <GestureDetector gesture={pinch}>
        <FlatList
          ref={listRef}
          data={keys}
          keyExtractor={(k) => k}
          renderItem={renderDay}
          getItemLayout={getItemLayout}
          initialScrollIndex={SPAN}
          showsVerticalScrollIndicator={false}
          extraData={`${nowMins}|${trackW}|${hourH}`}
          initialNumToRender={3}
          windowSize={9}
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => setAtNowBoth(false)}
          onEndReached={extendFuture}
          onEndReachedThreshold={1.5}
        />
      </GestureDetector>

      {/* Pinned bright now-line / time cursor */}
      {viewH > 0 && (
        <NowLine
          top={viewH * ANCHOR}
          label={fmtT(minsToHHMM(scrubMin))}
        />
      )}

      {!atNow && (
        <Pressable
          onPressIn={() => tapHaptic()}
          onPress={() => { setAtNowBoth(true); scrollToNow(!reducedMotion); }}
          accessibilityLabel="Jump to now"
          style={{
            position: 'absolute', right: 16, bottom: 20,
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: t.accent.main, borderRadius: 99,
            paddingVertical: 10, paddingHorizontal: 16,
            borderWidth: 2, borderColor: t.accent.deep,
            zIndex: 60,
          }}
        >
          <Animated.View
            style={[
              { width: 7, height: 7, borderRadius: 4, backgroundColor: t.accent.ink },
              dotAnimatedStyle,
            ]}
          />
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
