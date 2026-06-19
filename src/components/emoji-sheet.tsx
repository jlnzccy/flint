import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { ChunkyButton } from '@/components/chunky';
import { BottomSheet } from '@/components/sheet';
import { Body, Label } from '@/components/ui';
import { EMOJI_GROUPS } from '@/data/defaults';
import { tapHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme/theme';

const COLS = 6;

/* keep only the just-typed emoji from the system keyboard; ignore clearing/whitespace */
export function cleanEmoji(next: string, cur: string): string {
  const cleaned = next.replace(/\s/g, '');
  if (!cleaned) return cur;
  return cleaned === cur ? cur : cleaned.startsWith(cur) ? cleaned.slice(cur.length) : cleaned;
}

interface Props {
  open: boolean;
  value: string;
  onClose: () => void;
  onPick: (emoji: string) => void;
}

export function EmojiSheet({ open, value, onClose, onPick }: Props) {
  const t = useTheme();
  const [tab, setTab] = useState(0);
  const [typed, setTyped] = useState(value);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<string>>(null);

  useEffect(() => {
    if (open) {
      setTyped(value);
      setTab(0);
    }
  }, [open, value]);

  const group = EMOJI_GROUPS[tab];
  // pad to full rows so cells stay square (no stretched last row)
  const cells = useMemo(() => {
    const out = [...group.emoji];
    while (out.length % COLS) out.push('');
    return out;
  }, [group]);

  const choose = (em: string) => {
    const e = em.trim();
    if (!e) return;
    onPick(e);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Pick an icon" scroll={false}>
      <Label style={{ marginBottom: 8 }}>Type your own</Label>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <Pressable
          accessibilityLabel="Type an emoji"
          onPressIn={() => tapHaptic()}
          onPress={() => inputRef.current?.focus()}
          style={{
            width: 58, height: 58, borderRadius: 16, backgroundColor: t.raised,
            borderWidth: 2, borderColor: t.accent.main, alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <Text style={{ fontSize: 28, color: t.text }}>{typed}</Text>
          <TextInput
            ref={inputRef}
            value=""
            onChangeText={(v) => {
              const cleaned = v.trim();
              if (cleaned) {
                setTyped(cleaned);
              }
            }}
            caretHidden
            autoCorrect={false}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0,
              textAlign: 'center',
              fontSize: 28,
              padding: 0,
            }}
          />
        </Pressable>
        <Body size={13} color={t.muted} style={{ flex: 1 }}>
          Tap the tile, then hit your keyboard's emoji key.
        </Body>
        <ChunkyButton
          color={t.accent.main}
          deep={t.accent.deep}
          ink={t.accent.ink}
          fontSize={14}
          pad={[13, 18]}
          disabled={!typed.trim()}
          onPress={() => choose(typed)}
        >
          Use
        </ChunkyButton>
      </View>

      <Label style={{ marginBottom: 8 }}>Or pick one</Label>
      <FlatList
        horizontal
        data={EMOJI_GROUPS}
        keyExtractor={(g) => g.name}
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, marginBottom: 10 }}
        contentContainerStyle={{ gap: 8 }}
        renderItem={({ item, index }) => {
          const active = index === tab;
          return (
            <Pressable
              onPressIn={() => tapHaptic()}
              onPress={() => {
                setTab(index);
                listRef.current?.scrollToOffset({ offset: 0, animated: false });
              }}
              style={{
                paddingVertical: 7, paddingHorizontal: 13, borderRadius: 99,
                backgroundColor: active ? t.accent.main : t.raised,
                borderWidth: 2, borderColor: active ? t.accent.deep : t.lineSoft,
              }}
            >
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: active ? t.accent.ink : t.muted }}>
                {item.name}
              </Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        ref={listRef}
        key={group.name}
        data={cells}
        keyExtractor={(em, i) => em + i}
        numColumns={COLS}
        showsVerticalScrollIndicator={false}
        style={{ height: 300 }}
        columnWrapperStyle={{ gap: 8 }}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        initialNumToRender={36}
        windowSize={5}
        renderItem={({ item }) => {
          if (!item) return <View style={{ flex: 1, aspectRatio: 1 }} />;
          const selected = item === value;
          return (
            <Pressable
              onPressIn={() => tapHaptic()}
              onPress={() => choose(item)}
              style={{
                flex: 1, aspectRatio: 1, borderRadius: 14,
                backgroundColor: t.raised, borderWidth: 2,
                borderColor: selected ? t.accent.main : t.lineSoft,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 24 }}>{item}</Text>
            </Pressable>
          );
        }}
      />
    </BottomSheet>
  );
}
