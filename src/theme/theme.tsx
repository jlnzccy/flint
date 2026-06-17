import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme, View } from 'react-native';
import { vars } from 'nativewind';

import { buildPalette, Palette } from './colors';
import { useStore } from '@/state/store';

const ThemeContext = createContext<Palette>(buildPalette('dark', 'ember', '#ff6b35'));

export function useTheme(): Palette {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themePref = useStore((s) => s.settings.theme);
  const themeStyle = useStore((s) => s.settings.themeStyle ?? 'ember');
  const accent = useStore((s) => s.accent);
  const system = useColorScheme();

  const palette = useMemo(() => {
    const eff = themePref === 'system' ? (system === 'light' ? 'light' : 'dark') : themePref;
    return buildPalette(eff, themeStyle, accent);
  }, [themePref, themeStyle, system, accent]);

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
