import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorPickerSheet } from '@/components/color-picker';
import { IconChevL, IconPlus } from '@/components/icons';
import { tapHaptic } from '@/lib/haptics';
import { useToast } from '@/components/toast';
import { Body, Display, Label, Segmented, Toggle } from '@/components/ui';
import { ACCENT_CHOICES, hexDarken, inkOn } from '@/theme/colors';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';
import { CircleBtn } from '@/components/chunky';
import { isDynamicColorAvailable, hexToHsl, hslToHex } from '@/theme/material';

function Card({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <View style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18 }}>{children}</View>;
}

// Split-circle palette option for the wallpaper variations picker
function PaletteOption({
  label,
  primary,
  secondary,
  tertiary,
  active,
  onPress,
}: {
  label: string;
  primary: string;
  secondary: string;
  tertiary: string;
  active: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => tapHaptic()}
      style={{
        width: 80,
        height: 106,
        borderRadius: 14,
        backgroundColor: active ? t.lineSoft : t.surface,
        borderWidth: 2.5,
        borderColor: active ? t.accent.main : t.lineSoft,
        alignItems: 'center',
        paddingTop: 10,
        gap: 6,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: t.line,
        }}
      >
        {/* Top half: Primary color */}
        <View style={{ flex: 1, backgroundColor: primary }} />
        {/* Bottom half: Left is Secondary, Right is Tertiary */}
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1, backgroundColor: secondary }} />
          <View style={{ flex: 1, backgroundColor: tertiary }} />
        </View>
      </View>
      <Display size={11} style={{ textAlign: 'center', textTransform: 'uppercase', color: active ? t.text : t.muted }}>
        {label}
      </Display>
      
      {active && (
        <View
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: t.accent.main,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: t.bg,
          }}
        >
          {/* Small check dot */}
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.accent.ink }} />
        </View>
      )}
    </Pressable>
  );
}

export default function ThemeLabs() {
  const t = useTheme();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const settings = useStore((s) => s.settings);
  const accent = useStore((s) => s.accent);
  const { setSettings, setAccent } = useStore.getState();

  const [accentOpen, setAccentOpen] = useState(false);

  const themeStyle = settings.themeStyle ?? 'ember';
  const isEnabled = themeStyle === 'material' || themeStyle === 'wallpaper';
  const isWallpaperMode = themeStyle === 'wallpaper';
  const currentProfile = settings.materialProfile ?? 'spot';
  const customAccent = !ACCENT_CHOICES.includes(accent as (typeof ACCENT_CHOICES)[number]) && accent !== 'wallpaper';

  // Resolve base seed color for dynamic previews
  const baseSeedHex = isWallpaperMode ? (t.accent.main || '#ff6b35') : accent;
  const isDark = t.theme === 'dark';

  // Compute preview colors for Spot, Vibrant, Expressive, Muted
  const getPreviewColors = (profile: 'spot' | 'vibrant' | 'expressive' | 'muted') => {
    try {
      const clean = baseSeedHex.startsWith('#') ? baseSeedHex.slice(0, 7) : '#ff6b35';
      const [h, s, l] = hexToHsl(clean);
      
      let hue1 = h, sat1 = s, lit1 = isDark ? 75 : 45;
      let hue2 = h, sat2 = s, lit2 = isDark ? 65 : 55;
      let hue3 = h, sat3 = s, lit3 = isDark ? 60 : 60;

      if (profile === 'spot') {
        sat2 = Math.max(s - 20, 10);
        hue3 = (h + 60) % 360;
        sat3 = Math.max(s - 10, 15);
      } else if (profile === 'vibrant') {
        sat1 = Math.min(s + 20, 100);
        hue2 = (h + 30) % 360;
        sat2 = Math.min(s + 10, 100);
        hue3 = (h + 120) % 360;
        sat3 = Math.min(s + 15, 100);
      } else if (profile === 'expressive') {
        hue2 = (h + 120) % 360;
        hue3 = (h + 240) % 360;
      } else if (profile === 'muted') {
        sat1 = Math.max(s - 35, 5);
        sat2 = Math.max(s - 45, 5);
        sat3 = Math.max(s - 50, 5);
      }

      return {
        primary: hslToHex(hue1, sat1, lit1),
        secondary: hslToHex(hue2, sat2, lit2),
        tertiary: hslToHex(hue3, sat3, lit3),
      };
    } catch {
      return { primary: '#ff6b35', secondary: '#ffb627', tertiary: '#2ec4b6' };
    }
  };

  const spotPreviews = getPreviewColors('spot');
  const vibrantPreviews = getPreviewColors('vibrant');
  const expressivePreviews = getPreviewColors('expressive');
  const mutedPreviews = getPreviewColors('muted');

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 2 }}>
        <CircleBtn size={44} onPress={() => router.back()} label="Back">
          <IconChevL color={t.text} />
        </CircleBtn>
      </View>
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
        <Display size={30}>Theming Labs</Display>
        <Body size={14} color={t.faint} style={{ marginTop: 4 }}>
          Tweak experimental Material M3 colors and custom wallpaper-dynamic profiles.
        </Body>

        <Label style={{ marginTop: 20, marginBottom: 8 }}>Labs Layout Engine</Label>
        <Card>
          <View style={{ padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Display size={16}>Enable Dynamic Theming</Display>
                <Body size={13} color={t.faint} style={{ marginTop: 3 }}>
                  Replaces Ember/Neutral with Material M3 layouts
                </Body>
              </View>
              <Toggle
                on={isEnabled}
                onChange={(on) => {
                  tapHaptic();
                  if (on) {
                    setSettings({ themeStyle: 'wallpaper' });
                    setAccent('wallpaper');
                    if (!isDynamicColorAvailable) {
                      toast('Wallpaper colors unsupported. Using M3 seed fallback.');
                    }
                  } else {
                    setSettings({ themeStyle: 'ember' });
                    setAccent('#ff6b35');
                  }
                }}
              />
            </View>
          </View>
        </Card>

        {isEnabled ? (
          <>
            <Label style={{ marginTop: 22, marginBottom: 8 }}>Material Theme Profile</Label>
            <Card>
              <View style={{ padding: 16, gap: 12 }}>
                <Display size={16}>Active Material Style</Display>
                <Segmented
                  value={isWallpaperMode ? 'wallpaper' : 'material'}
                  onChange={(v) => {
                    tapHaptic();
                    if (v === 'wallpaper') {
                      setSettings({ themeStyle: 'wallpaper' });
                      setAccent('wallpaper');
                      if (!isDynamicColorAvailable) {
                        toast('Wallpaper colors unsupported. Using M3 seed fallback.');
                      }
                    } else {
                      setSettings({ themeStyle: 'material' });
                      setAccent('#ff6b35'); // reset to default Ember Orange seed
                    }
                  }}
                  options={[
                    { value: 'wallpaper', label: 'Match Wallpaper' },
                    { value: 'material', label: 'Material M3 Style' },
                  ]}
                />
              </View>
            </Card>

            <Label style={{ marginTop: 22, marginBottom: 8 }}>Wallpaper Color Variation Profile</Label>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
              style={{ overflow: 'visible' }}
            >
              <PaletteOption
                label="Spot"
                primary={spotPreviews.primary}
                secondary={spotPreviews.secondary}
                tertiary={spotPreviews.tertiary}
                active={currentProfile === 'spot'}
                onPress={() => setSettings({ materialProfile: 'spot' })}
              />
              <PaletteOption
                label="Vibrant"
                primary={vibrantPreviews.primary}
                secondary={vibrantPreviews.secondary}
                tertiary={vibrantPreviews.tertiary}
                active={currentProfile === 'vibrant'}
                onPress={() => setSettings({ materialProfile: 'vibrant' })}
              />
              <PaletteOption
                label="Expressive"
                primary={expressivePreviews.primary}
                secondary={expressivePreviews.secondary}
                tertiary={expressivePreviews.tertiary}
                active={currentProfile === 'expressive'}
                onPress={() => setSettings({ materialProfile: 'expressive' })}
              />
              <PaletteOption
                label="Muted"
                primary={mutedPreviews.primary}
                secondary={mutedPreviews.secondary}
                tertiary={mutedPreviews.tertiary}
                active={currentProfile === 'muted'}
                onPress={() => setSettings({ materialProfile: 'muted' })}
              />
            </ScrollView>

            {!isWallpaperMode ? (
              <>
                <Label style={{ marginTop: 22, marginBottom: 8 }}>Custom Seed Color Choice</Label>
                <Card>
                  <View style={{ padding: 16, gap: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                      {ACCENT_CHOICES.map((a) => {
                        const active = a === accent;
                        const dark = hexDarken(a, 0.55);
                        return (
                          <Pressable
                            key={a}
                            accessibilityLabel={a}
                            onPressIn={() => tapHaptic()}
                            onPress={() => setAccent(a)}
                            style={{
                              width: 40, height: 40, borderRadius: 20, backgroundColor: a,
                              borderWidth: active ? 3 : 1.5,
                              borderColor: active ? dark : t.line,
                              alignItems: 'center', justifyContent: 'center',
                              transform: [{ scale: active ? 1.12 : 1 }],
                            }}
                          >
                            <View style={{ width: 15, height: 15, borderRadius: 8, backgroundColor: dark }} />
                          </Pressable>
                        );
                      })}
                      <Pressable
                        accessibilityLabel={customAccent ? 'Edit custom accent' : 'Custom accent'}
                        onPressIn={() => tapHaptic()}
                        onPress={() => setAccentOpen(true)}
                        style={{
                          width: 40, height: 40, borderRadius: 20,
                          backgroundColor: customAccent ? accent : t.raised,
                          borderWidth: 2,
                          borderColor: customAccent ? hexDarken(accent, 0.55) : t.line,
                          alignItems: 'center', justifyContent: 'center',
                          transform: [{ scale: customAccent ? 1.12 : 1 }],
                        }}
                      >
                        <IconPlus size={16} color={customAccent ? inkOn(accent) : t.muted} />
                      </Pressable>
                    </View>
                  </View>
                </Card>
              </>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <ColorPickerSheet
        open={accentOpen}
        initial={accent === 'wallpaper' ? '#ff6b35' : accent}
        onClose={() => setAccentOpen(false)}
        onPick={setAccent}
      />
    </View>
  );
}
