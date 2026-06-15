import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { IconDrag } from '@/components/icons';
import { tapHaptic } from '@/lib/haptics';
import { SPRING } from '@/theme/motion';
import { useTheme } from '@/theme/theme';

/* Reorderable vertical list. Rows can vary in height.
   The drag handle activates after a short hold so the parent ScrollView still scrolls. */

interface DragListProps<T> {
  items: T[];
  keyOf: (item: T) => string;
  onReorder: (keys: string[]) => void;
  renderRow: (item: T, handle: React.ReactNode, dragging: boolean) => React.ReactNode;
  gap?: number;
}

export function DragList<T>({ items, keyOf, onReorder, renderRow, gap = 10 }: DragListProps<T>) {
  const [order, setOrder] = useState<string[]>(() => items.map(keyOf));
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const orderRef = useRef(order);
  orderRef.current = order;

  // resync when items change while not dragging
  useEffect(() => {
    if (activeKey) return;
    const keys = items.map(keyOf);
    setOrder((prev) => (prev.length === keys.length && prev.every((k) => keys.includes(k)) ? prev : keys));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, activeKey]);

  const byKey: Record<string, T> = {};
  items.forEach((it) => (byKey[keyOf(it)] = it));

  const offsetOf = (key: string, ord: string[]) => {
    let y = 0;
    for (const k of ord) {
      if (k === key) return y;
      y += (heights[k] ?? 60) + gap;
    }
    return y;
  };

  const totalH = order.reduce((a, k) => a + (heights[k] ?? 60) + gap, 0) - gap;

  const moveTo = useCallback((key: string, centerY: number) => {
    const ord = orderRef.current;
    let y = 0;
    let target = ord.length - 1;
    for (let i = 0; i < ord.length; i++) {
      const h = (heights[ord[i]] ?? 60) + gap;
      if (centerY < y + h / 2) {
        target = i;
        break;
      }
      y += h;
    }
    const from = ord.indexOf(key);
    if (from === -1 || from === target) return;
    const next = ord.slice();
    next.splice(from, 1);
    next.splice(target, 0, key);
    setOrder(next);
  }, [heights, gap]);

  const commit = useCallback(() => {
    setActiveKey(null);
    onReorder(orderRef.current);
  }, [onReorder]);

  return (
    <View style={{ height: Math.max(totalH, 0) }}>
      {order.map((key) => {
        const item = byKey[key];
        if (!item) return null;
        return (
          <Row
            key={key}
            offset={offsetOf(key, order)}
            dragging={activeKey === key}
            onHeight={(h) => setHeights((prev) => (prev[key] === h ? prev : { ...prev, [key]: h }))}
            onStart={() => setActiveKey(key)}
            onMove={(centerOffset) => moveTo(key, centerOffset)}
            onEnd={commit}
            height={heights[key] ?? 60}
          >
            {(handle) => renderRow(item, handle, activeKey === key)}
          </Row>
        );
      })}
    </View>
  );
}

interface RowProps {
  offset: number;
  height: number;
  dragging: boolean;
  onHeight: (h: number) => void;
  onStart: () => void;
  onMove: (centerY: number) => void;
  onEnd: () => void;
  children: (handle: React.ReactNode) => React.ReactNode;
}

function Row({ offset, height, dragging, onHeight, onStart, onMove, onEnd, children }: RowProps) {
  const t = useTheme();
  const drag = useSharedValue(0);
  const startOffset = useSharedValue(0);
  const offsetSv = useSharedValue(offset);

  useEffect(() => {
    if (dragging) return;
    offsetSv.value = withSpring(offset, SPRING.gentle);
  }, [offset, dragging, offsetSv]);

  const pan = Gesture.Pan()
    .activateAfterLongPress(160)
    .onStart(() => {
      startOffset.value = offsetSv.value;
      drag.value = 0;
      runOnJS(onStart)();
      runOnJS(tapHaptic)();
    })
    .onUpdate((e) => {
      drag.value = e.translationY;
      runOnJS(onMove)(startOffset.value + e.translationY + height / 2);
    })
    .onFinalize(() => {
      runOnJS(onEnd)();
    });

  const style = useAnimatedStyle(() => ({
    top: dragging ? startOffset.value + drag.value : offsetSv.value,
    zIndex: dragging ? 30 : 0,
    opacity: dragging ? 0.96 : 1,
    transform: [{ scale: withSpring(dragging ? 1.02 : 1, SPRING.press) }],
  }));

  const handle = (
    <GestureDetector gesture={pan}>
      <View
        accessibilityLabel="Drag to reorder"
        style={{ width: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' }}
        collapsable={false}
      >
        <IconDrag color={t.faint} />
      </View>
    </GestureDetector>
  );

  return (
    <Animated.View
      onLayout={(e) => onHeight(Math.round(e.nativeEvent.layout.height))}
      style={[{ position: 'absolute', left: 0, right: 0 }, style]}
    >
      {children(handle)}
    </Animated.View>
  );
}
