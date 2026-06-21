import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme, View } from 'react-native';
import { vars } from 'nativewind';

import { buildPalette, Palette, hexDarken, hexAlpha, ColorSet } from './colors';
import { useStore } from '@/state/store';
import { useSafeMaterialColors, hexToHsl, hslToHex } from './material';

const ThemeContext = createContext<Palette>(buildPalette('dark', 'ember', '#ff6b35'));

export function useTheme(): Palette {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themePref = useStore((s) => s.settings.theme);
  const themeStyle = useStore((s) => s.settings.themeStyle ?? 'ember');
  const accent = useStore((s) => s.accent);
  const materialProfile = useStore((s) => s.settings.materialProfile ?? 'spot');
  const system = useColorScheme();

  const eff = themePref === 'system' ? (system === 'light' ? 'light' : 'dark') : themePref;
  const materialColors = useSafeMaterialColors(eff, themeStyle === 'wallpaper' ? 'wallpaper' : accent);

  const palette = useMemo(() => {
    if ((themeStyle === 'material' || themeStyle === 'wallpaper') && materialColors) {
      const adjustColor = (hex: string, satShift: number, hueShift: number): string => {
        try {
          const clean = hex.slice(0, 7);
          const [h, s, l] = hexToHsl(clean);
          const newH = (h + hueShift + 360) % 360;
          const newS = Math.max(0, Math.min(100, s + satShift));
          return hslToHex(newH, newS, l);
        } catch (e) {
          return hex;
        }
      };

      const satShift = materialProfile === 'vibrant' ? 20 : materialProfile === 'muted' ? -35 : 0;
      const pColor = adjustColor(materialColors.primary, satShift, 0);
      const pCont = adjustColor(materialColors.primaryContainer, satShift, 0);
      const sColor = adjustColor(materialColors.secondary, satShift, materialProfile === 'expressive' ? 30 : 0);
      const sCont = adjustColor(materialColors.secondaryContainer, satShift, materialProfile === 'expressive' ? 30 : 0);
      const tColor = adjustColor(materialColors.tertiary, satShift, materialProfile === 'expressive' ? 120 : 0);
      const tCont = adjustColor(materialColors.tertiaryContainer, satShift, materialProfile === 'expressive' ? 120 : 0);

      const bg = materialColors.background;
      const surface = materialColors.surfaceContainer;
      const raised = materialColors.surfaceContainerHigh;
      const line = materialColors.outline;
      const lineSoft = materialColors.outlineVariant;
      const text = materialColors.onSurface;
      const muted = materialColors.onSurfaceVariant;
      const faint = materialColors.outline;

      const mkSet = (main: string, soft: string, ink: string): ColorSet => ({
        main,
        deep: hexDarken(main, 0.62),
        soft,
        ink,
      });

      const accentSet = {
        main: pColor,
        deep: hexDarken(pColor, 0.62),
        soft: pCont,
        ink: materialColors.onPrimary,
      };

      const tealSet = mkSet(
        sColor,
        sCont,
        materialColors.onSecondary
      );

      const purpleSet = mkSet(
        tColor,
        tCont,
        materialColors.onTertiary
      );

      const roseSet = mkSet(
        materialColors.error,
        materialColors.errorContainer,
        materialColors.onError
      );

      const goldSet = {
        main: '#ffb627',
        deep: '#b97e0e',
        soft: hexAlpha('#ffb627', 0.13),
        ink: '#231703',
      };

      const greenSet = {
        main: '#6bc46d',
        deep: '#3f8f41',
        soft: hexAlpha('#6bc46d', 0.13),
        ink: '#0a2410',
      };

      const sets = {
        accent: accentSet,
        gold: goldSet,
        teal: tealSet,
        purple: purpleSet,
        green: greenSet,
        rose: roseSet,
      };

      const customCache: Record<string, ColorSet> = {};

      return {
        theme: eff,
        bg,
        surface,
        raised,
        line,
        lineSoft,
        text,
        muted,
        faint,
        ...sets,
        col: (name: string) => {
          const preset = sets[name as keyof typeof sets];
          if (preset) return preset;
          if (name.startsWith('#') && name.length === 7) {
            if (!customCache[name]) {
              customCache[name] = {
                main: name,
                deep: hexDarken(name, 0.62),
                soft: hexAlpha(name, 0.13),
                ink: '#f7f1e8',
              };
            }
            return customCache[name];
          }
          return sets.accent;
        },
      };
    }

    return buildPalette(eff, (themeStyle === 'material' || themeStyle === 'wallpaper') ? 'ember' : themeStyle, accent);
  }, [themePref, themeStyle, eff, accent, materialColors, materialProfile]);

  const cssVars = useMemo(
    () =>
      vars({
        '--bg': palette.bg,
        '--surface': palette.surface,
        '--raised': palette.raised,
        '--line': palette.line,
        '--line-soft': palette.lineSoft,
        '--text': palette.text,
        '--muted': palette.muted,
        '--faint': palette.faint,
        '--accent': palette.accent.main,
        '--accent-deep': palette.accent.deep,
        '--accent-soft': palette.accent.soft,
        '--gold': palette.gold.main,
        '--gold-deep': palette.gold.deep,
        '--gold-soft': palette.gold.soft,
        '--teal': palette.teal.main,
        '--teal-deep': palette.teal.deep,
        '--teal-soft': palette.teal.soft,
        '--purple': palette.purple.main,
        '--purple-deep': palette.purple.deep,
        '--purple-soft': palette.purple.soft,
        '--green': palette.green.main,
        '--green-deep': palette.green.deep,
        '--green-soft': palette.green.soft,
        '--rose': palette.rose.main,
        '--rose-deep': palette.rose.deep,
        '--rose-soft': palette.rose.soft,
      }),
    [palette]
  );

  return (
    <ThemeContext.Provider value={palette}>
      <View style={[{ flex: 1, backgroundColor: palette.bg }, cssVars]}>{children}</View>
    </ThemeContext.Provider>
  );
}
