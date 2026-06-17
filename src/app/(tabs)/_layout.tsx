import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/chunky';
import { IconChart, IconGear, IconHome, IconList, IconPlus } from '@/components/icons';
import { NewRoutineSheet } from '@/components/new-routine-sheet';
import { tapHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme/theme';

const TABS = [
  { name: 'index', label: 'Routine', Icon: IconHome },
  { name: 'tasks', label: 'Tasks', Icon: IconList },
  { name: 'insights', label: 'Insights', Icon: IconChart },
  { name: 'settings', label: 'Settings', Icon: IconGear },
];

function TabBar({ state, navigation, onAdd }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const tabs = state.routes
    .map((route: any, i: number) => {
      const def = TABS.find((x) => x.name === route.name);
      if (!def) return null; // sounds is a pushed route now — not in the bar
      const active = state.index === i;
      return (
        <Pressable
          key={route.key}
          accessibilityRole="tab"
          accessibilityLabel={def.label}
          accessibilityState={{ selected: active }}
          onPress={() => {
            tapHaptic();
            if (!active) navigation.navigate(route.name);
          }}
          style={{ width: '20%', alignItems: 'center', paddingTop: 16, paddingBottom: 18 }}
        >
          {/* icon-only — active tab = rounded square, 2px accent outline + soft fill.
             inactive keeps a transparent 2px border so the icon never shifts. */}
          <View
            style={{
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 14,
              borderWidth: 2,
              borderColor: active ? t.accent.main : 'transparent',
              backgroundColor: active ? t.accent.soft : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <def.Icon size={24} color={active ? t.accent.main : t.faint} />
          </View>
        </Pressable>
      );
    })
    .filter(Boolean);

  // prominent center "+" splits the row: Routine · Tasks · [ + ] · Insights · Settings.
  // sits flush inside the bar (no negative margin) — the row centers it against the icons.
  const mid = Math.ceil(tabs.length / 2);
  const addBtn = (
    <View key="add" style={{ width: '20%', alignItems: 'center', justifyContent: 'center' }}>
      <ChunkyButton
        color={t.accent.main}
        deep={t.accent.deep}
        ink={t.accent.ink}
        onPress={onAdd}
        accessibilityLabel="New routine"
        pad={[0, 0]}
        radius={16}
        style={{ width: 56 }}
        faceStyle={{ width: 56, height: 46, borderRadius: 16 }}
      >
        <IconPlus size={26} color={t.accent.ink} />
      </ChunkyButton>
    </View>
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 2,
        borderColor: t.lineSoft,
        backgroundColor: t.surface,
        paddingBottom: insets.bottom,
      }}
    >
      {[...tabs.slice(0, mid), addBtn, ...tabs.slice(mid)]}
    </View>
  );
}

export default function TabsLayout() {
  const t = useTheme();
  const [newOpen, setNewOpen] = useState(false);
  return (
    <>
      <Tabs
        tabBar={(props) => <TabBar {...props} onAdd={() => setNewOpen(true)} />}
        // tabs cross-fade between destinations — buttery, not a hard snap
        screenOptions={{ headerShown: false, animation: 'fade', sceneStyle: { backgroundColor: t.bg } }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="tasks" />
        <Tabs.Screen name="insights" />
        <Tabs.Screen name="settings" />
      </Tabs>
      <NewRoutineSheet open={newOpen} onClose={() => setNewOpen(false)} />
    </>
  );
}
