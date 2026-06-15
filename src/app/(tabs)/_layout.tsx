import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconChart, IconGear, IconHome, IconList, IconWaves } from '@/components/icons';
import { tapHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme/theme';

const TABS = [
  { name: 'index', label: 'Routine', Icon: IconHome },
  { name: 'tasks', label: 'Tasks', Icon: IconList },
  { name: 'insights', label: 'Insights', Icon: IconChart },
  { name: 'sounds', label: 'Sounds', Icon: IconWaves },
  { name: 'settings', label: 'Settings', Icon: IconGear },
];

function TabBar({ state, navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopWidth: 2,
        borderColor: t.lineSoft,
        backgroundColor: t.surface,
        paddingBottom: insets.bottom,
      }}
    >
      {state.routes.map((route: any, i: number) => {
        const def = TABS.find((x) => x.name === route.name);
        if (!def) return null;
        const active = state.index === i;
        const color = active ? t.accent.main : t.faint;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              tapHaptic();
              if (!active) navigation.navigate(route.name);
            }}
            style={{ flex: 1, alignItems: 'center', gap: 3, paddingTop: 10, paddingBottom: 12 }}
          >
            <def.Icon color={color} />
            <Text
              style={{
                fontFamily: 'Nunito_800ExtraBold',
                fontSize: 11,
                letterSpacing: 0.66,
                textTransform: 'uppercase',
                color,
              }}
            >
              {def.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      // tabs are top-level destinations — switch instantly, no cross-fade
      screenOptions={{ headerShown: false, animation: 'none', sceneStyle: { backgroundColor: t.bg } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="sounds" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
