// Fallback for iOS, Web, and testing environments where @expo/ui/jetpack-compose is unavailable.
export const isDynamicColorAvailable = false;

export type RgbaHex = `#${string}`;

export type MaterialColors = {
  primary: RgbaHex;
  onPrimary: RgbaHex;
  primaryContainer: RgbaHex;
  onPrimaryContainer: RgbaHex;
  inversePrimary: RgbaHex;
  secondary: RgbaHex;
  onSecondary: RgbaHex;
  secondaryContainer: RgbaHex;
  onSecondaryContainer: RgbaHex;
  tertiary: RgbaHex;
  onTertiary: RgbaHex;
  tertiaryContainer: RgbaHex;
  onTertiaryContainer: RgbaHex;
  background: RgbaHex;
  onBackground: RgbaHex;
  surface: RgbaHex;
  onSurface: RgbaHex;
  surfaceVariant: RgbaHex;
  onSurfaceVariant: RgbaHex;
  surfaceTint: RgbaHex;
  inverseSurface: RgbaHex;
  inverseOnSurface: RgbaHex;
  error: RgbaHex;
  onError: RgbaHex;
  errorContainer: RgbaHex;
  onErrorContainer: RgbaHex;
  outline: RgbaHex;
  outlineVariant: RgbaHex;
  scrim: RgbaHex;
  surfaceBright: RgbaHex;
  surfaceDim: RgbaHex;
  surfaceContainer: RgbaHex;
  surfaceContainerHigh: RgbaHex;
  surfaceContainerHighest: RgbaHex;
  surfaceContainerLow: RgbaHex;
  surfaceContainerLowest: RgbaHex;
  primaryFixed: RgbaHex;
  primaryFixedDim: RgbaHex;
  onPrimaryFixed: RgbaHex;
  onPrimaryFixedVariant: RgbaHex;
  secondaryFixed: RgbaHex;
  secondaryFixedDim: RgbaHex;
  onSecondaryFixed: RgbaHex;
  onSecondaryFixedVariant: RgbaHex;
  tertiaryFixed: RgbaHex;
  tertiaryFixedDim: RgbaHex;
  onTertiaryFixed: RgbaHex;
  onTertiaryFixedVariant: RgbaHex;
};

export function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export function generateMaterialColors(scheme: 'light' | 'dark', seedHex: string): MaterialColors {
  const seed = seedHex.startsWith('#') && seedHex.length === 7 ? seedHex : '#ff6b35';
  const [h, s, l] = hexToHsl(seed);

  const isDark = scheme === 'dark';
  const primaryHue = h;
  const secondaryHue = h;
  const tertiaryHue = (h + 60) % 360;
  const errorHue = 0;

  const primarySat = s;
  const secondarySat = Math.max(s - 20, 10);
  const tertiarySat = Math.max(s - 10, 15);
  const errorSat = 75;

  const mk = (hue: number, sat: number, lit: number): RgbaHex => {
    return (hslToHex(hue, sat, lit) + 'FF') as RgbaHex;
  };

  if (isDark) {
    return {
      primary: mk(primaryHue, primarySat, 80),
      onPrimary: mk(primaryHue, primarySat, 20),
      primaryContainer: mk(primaryHue, primarySat, 30),
      onPrimaryContainer: mk(primaryHue, primarySat, 90),
      inversePrimary: mk(primaryHue, primarySat, 40),

      secondary: mk(secondaryHue, secondarySat, 80),
      onSecondary: mk(secondaryHue, secondarySat, 20),
      secondaryContainer: mk(secondaryHue, secondarySat, 30),
      onSecondaryContainer: mk(secondaryHue, secondarySat, 90),

      tertiary: mk(tertiaryHue, tertiarySat, 80),
      onTertiary: mk(tertiaryHue, tertiarySat, 20),
      tertiaryContainer: mk(tertiaryHue, tertiarySat, 30),
      onTertiaryContainer: mk(tertiaryHue, tertiarySat, 90),

      background: mk(primaryHue, 10, 6),
      onBackground: mk(primaryHue, 10, 90),

      surface: mk(primaryHue, 8, 12),
      onSurface: mk(primaryHue, 8, 90),
      surfaceVariant: mk(primaryHue, 8, 20),
      onSurfaceVariant: mk(primaryHue, 8, 80),
      surfaceTint: mk(primaryHue, primarySat, 80),
      inverseSurface: mk(primaryHue, 8, 90),
      inverseOnSurface: mk(primaryHue, 8, 20),

      error: mk(errorHue, errorSat, 80),
      onError: mk(errorHue, errorSat, 20),
      errorContainer: mk(errorHue, errorSat, 30),
      onErrorContainer: mk(errorHue, errorSat, 90),

      outline: mk(primaryHue, 15, 60),
      outlineVariant: mk(primaryHue, 10, 30),
      scrim: '#000000FF',

      surfaceBright: mk(primaryHue, 8, 24),
      surfaceDim: mk(primaryHue, 8, 10),
      surfaceContainer: mk(primaryHue, 8, 14),
      surfaceContainerHigh: mk(primaryHue, 8, 18),
      surfaceContainerHighest: mk(primaryHue, 8, 22),
      surfaceContainerLow: mk(primaryHue, 8, 10),
      surfaceContainerLowest: mk(primaryHue, 8, 4),

      primaryFixed: mk(primaryHue, primarySat, 90),
      primaryFixedDim: mk(primaryHue, primarySat, 80),
      onPrimaryFixed: mk(primaryHue, primarySat, 10),
      onPrimaryFixedVariant: mk(primaryHue, primarySat, 30),

      secondaryFixed: mk(secondaryHue, secondarySat, 90),
      secondaryFixedDim: mk(secondaryHue, secondarySat, 80),
      onSecondaryFixed: mk(secondaryHue, secondarySat, 10),
      onSecondaryFixedVariant: mk(secondaryHue, secondarySat, 30),

      tertiaryFixed: mk(tertiaryHue, tertiarySat, 90),
      tertiaryFixedDim: mk(tertiaryHue, tertiarySat, 80),
      onTertiaryFixed: mk(tertiaryHue, tertiarySat, 10),
      onTertiaryFixedVariant: mk(tertiaryHue, tertiarySat, 30),
    };
  } else {
    return {
      primary: mk(primaryHue, primarySat, 40),
      onPrimary: mk(primaryHue, primarySat, 100),
      primaryContainer: mk(primaryHue, primarySat, 90),
      onPrimaryContainer: mk(primaryHue, primarySat, 10),
      inversePrimary: mk(primaryHue, primarySat, 80),

      secondary: mk(secondaryHue, secondarySat, 40),
      onSecondary: mk(secondaryHue, secondarySat, 100),
      secondaryContainer: mk(secondaryHue, secondarySat, 90),
      onSecondaryContainer: mk(secondaryHue, secondarySat, 10),

      tertiary: mk(tertiaryHue, tertiarySat, 40),
      onTertiary: mk(tertiaryHue, tertiarySat, 100),
      tertiaryContainer: mk(tertiaryHue, tertiarySat, 90),
      onTertiaryContainer: mk(tertiaryHue, tertiarySat, 10),

      background: mk(primaryHue, 10, 98),
      onBackground: mk(primaryHue, 10, 10),

      surface: mk(primaryHue, 8, 98),
      onSurface: mk(primaryHue, 8, 10),
      surfaceVariant: mk(primaryHue, 8, 90),
      onSurfaceVariant: mk(primaryHue, 8, 30),
      surfaceTint: mk(primaryHue, primarySat, 40),
      inverseSurface: mk(primaryHue, 8, 20),
      inverseOnSurface: mk(primaryHue, 8, 95),

      error: mk(errorHue, errorSat, 40),
      onError: mk(errorHue, errorSat, 100),
      errorContainer: mk(errorHue, errorSat, 90),
      onErrorContainer: mk(errorHue, errorSat, 10),

      outline: mk(primaryHue, 15, 50),
      outlineVariant: mk(primaryHue, 10, 80),
      scrim: '#000000FF',

      surfaceBright: mk(primaryHue, 8, 98),
      surfaceDim: mk(primaryHue, 8, 88),
      surfaceContainer: mk(primaryHue, 8, 94),
      surfaceContainerHigh: mk(primaryHue, 8, 92),
      surfaceContainerHighest: mk(primaryHue, 8, 90),
      surfaceContainerLow: mk(primaryHue, 8, 96),
      surfaceContainerLowest: mk(primaryHue, 8, 100),

      primaryFixed: mk(primaryHue, primarySat, 90),
      primaryFixedDim: mk(primaryHue, primarySat, 80),
      onPrimaryFixed: mk(primaryHue, primarySat, 10),
      onPrimaryFixedVariant: mk(primaryHue, primarySat, 30),

      secondaryFixed: mk(secondaryHue, secondarySat, 90),
      secondaryFixedDim: mk(secondaryHue, secondarySat, 80),
      onSecondaryFixed: mk(secondaryHue, secondarySat, 10),
      onSecondaryFixedVariant: mk(secondaryHue, secondarySat, 30),

      tertiaryFixed: mk(tertiaryHue, tertiarySat, 90),
      tertiaryFixedDim: mk(tertiaryHue, tertiarySat, 80),
      onTertiaryFixed: mk(tertiaryHue, tertiarySat, 10),
      onTertiaryFixedVariant: mk(tertiaryHue, tertiarySat, 30),
    };
  }
}

export function useSafeMaterialColors(
  scheme: 'light' | 'dark',
  seedColor?: string
): MaterialColors {
  const seed = seedColor === 'wallpaper' ? '#FF6B35' : (seedColor ?? '#FF6B35');
  return generateMaterialColors(scheme, seed);
}
