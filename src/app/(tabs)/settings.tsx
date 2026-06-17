import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  IconArchive,
  IconBell,
  IconChevR,
  IconFlag,
  IconPencil,
  IconWaves,
} from '@/components/icons';
import { Body, Display } from '@/components/ui';
import { useTheme } from '@/theme/theme';

function Row({
  title,
  sub,
  icon,
  children,
  top,
}: {
  title: string;
  sub?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  top?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderTopWidth: top ? 0 : 2,
        borderColor: t.lineSoft,
      }}
    >
      {icon}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Display size={16}>{title}</Display>
        {sub ? (
          <Body size={13} color={t.faint} style={{ marginTop: 3 }}>
            {sub}
          </Body>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderWidth: 2,
        borderColor: t.lineSoft,
        borderRadius: 18,
      }}
    >
      {children}
    </View>
  );
}

export default function Settings() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
        <Display size={30}>Settings</Display>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 0, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <Pressable onPress={() => router.push('/settings/preferences')}>
            <Row
              title="Preferences"
              sub="Theme, accent color, clock format, motion"
              icon={
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: t.purple.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconPencil size={18} color={t.purple.main} />
                </View>
              }
              top
            >
              <IconChevR size={18} color={t.faint} />
            </Row>
          </Pressable>

          <Pressable onPress={() => router.push('/settings/notifications')}>
            <Row
              title="Notifications & Feedback"
              sub="Daily reminders, voice guide, haptic cues"
              icon={
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: t.rose.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconBell size={18} color={t.rose.main} />
                </View>
              }
            >
              <IconChevR size={18} color={t.faint} />
            </Row>
          </Pressable>

          <Pressable onPress={() => router.push('/settings/progress')}>
            <Row
              title="Progress & Streaks"
              sub="Streak counting and preservation rules"
              icon={
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: t.green.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconFlag size={18} color={t.green.main} />
                </View>
              }
            >
              <IconChevR size={18} color={t.faint} />
            </Row>
          </Pressable>

          <Pressable onPress={() => router.push('/settings/labs')}>
            <Row
              title="Experimental Labs"
              sub="Brainwave sounds, haptic feedback test bed"
              icon={
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: t.teal.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconWaves size={18} color={t.teal.main} />
                </View>
              }
            >
              <IconChevR size={18} color={t.faint} />
            </Row>
          </Pressable>

          <Pressable onPress={() => router.push('/settings/data')}>
            <Row
              title="System & Data"
              sub="Manage and erase your data"
              icon={
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: t.gold.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconArchive size={18} color={t.gold.main} />
                </View>
              }
            >
              <IconChevR size={18} color={t.faint} />
            </Row>
          </Pressable>
        </Card>

        <View
          style={{
            backgroundColor: t.surface,
            borderWidth: 2,
            borderColor: t.lineSoft,
            borderRadius: 18,
            padding: 18,
            marginTop: 26,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 26 }}>🔥</Text>
          <Body size={14} color={t.muted} style={{ textAlign: 'center', marginTop: 8 }}>
            Free, forever.
          </Body>
          <Display size={14} style={{ marginTop: 2 }}>
            Built by an ADHD brain, for ADHD brains
          </Display>
        </View>
      </ScrollView>
    </View>
  );
}
