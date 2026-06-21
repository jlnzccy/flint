/* Flint — Ember Arcade tokens, ported 1:1 from the mockup CSS */

export type ColorName = 'accent' | 'gold' | 'teal' | 'purple' | 'green' | 'rose';
export type ThemeName = 'dark' | 'light';

export const CHUNK = 4; // pressed-edge depth
export const RADIUS = 18;
export const RADIUS_SM = 12;

export function hexDarken(hex: string, f = 0.62): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function hexAlpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export interface BaseColors {
  bg: string;
  surface: string;
  raised: string;
  line: string;
  lineSoft: string;
  text: string;
  muted: string;
  faint: string;
}

export const DARK: BaseColors = {
  bg: '#171210',
  surface: '#211b16',
  raised: '#2b231c',
  line: '#3a3128',
  lineSoft: '#2f2820',
  text: '#f7f1e8',
  muted: '#a99c8e',
  faint: '#71665c',
};

export const NEUTRAL_DARK: BaseColors = {
  bg: '#121214',
  surface: '#1a1a1e',
  raised: '#242429',
  line: '#323239',
  lineSoft: '#212126',
  text: '#f5f5f7',
  muted: '#9ea0a5',
  faint: '#686a6e',
};

export const LIGHT: BaseColors = {
  bg: '#faf8f5',
  surface: '#ffffff',
  raised: '#f2ece3',
  line: '#e2d8c9',
  lineSoft: '#ece4d8',
  text: '#2a2018',
  muted: '#756758',
  faint: '#a99b89',
};

export const NEUTRAL_LIGHT: BaseColors = {
  bg: '#f5f6f8',
  surface: '#ffffff',
  raised: '#ebecee',
  line: '#dcdde1',
  lineSoft: '#e8e9ec',
  text: '#1c1e21',
  muted: '#686a6e',
  faint: '#9ea0a5',
};

interface AccentDef {
  main: string;
  deep: string;
  ink: string; // text color on top of main
}

const STATIC_ACCENTS: Record<Exclude<ColorName, 'accent'>, AccentDef> = {
  gold: { main: '#ffb627', deep: '#b97e0e', ink: '#231703' },
  teal: { main: '#2ec4b6', deep: '#1b8e83', ink: '#04211e' },
  purple: { main: '#a06cd5', deep: '#6f3fa0', ink: '#f7f1e8' },
  green: { main: '#6bc46d', deep: '#3f8f41', ink: '#0a2410' },
  rose: { main: '#e85d75', deep: '#a83a52', ink: '#f7f1e8' },
};

export const ACCENT_CHOICES = [
  '#ff6b35', // Ember (Orange)
  '#1CB0F6', // Macaw (Blue)
  '#FF4B4B', // Cardinal (Red)
  '#FFC800', // Bee (Yellow)
  '#CE82FF', // Beetle (Purple)
  '#58CC02'  // Feather Green (Green)
];

export interface ColorSet {
  main: string;
  deep: string;
  soft: string;
  ink: string;
}

export interface Palette extends BaseColors {
  theme: ThemeName;
  accent: ColorSet;
  gold: ColorSet;
  teal: ColorSet;
  purple: ColorSet;
  green: ColorSet;
  rose: ColorSet;
  col: (name: string) => ColorSet; // preset name or custom "#rrggbb"
}

/* readable text color on top of a solid fill.
   Uses gamma-correct relative luminance (sRGB) so saturated mids land in the
   right bucket — crude weighted-RGB rated orange/blue as "light" and stuck dark
   text on them. Threshold leans white (0.4, above the ~0.18 WCAG crossover) to
   match the design's taste: white ink on purple/rose/orange, dark on gold/teal/green. */
export function inkOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const L =
    0.2126 * lin((n >> 16) & 255) +
    0.7152 * lin((n >> 8) & 255) +
    0.0722 * lin(n & 255);
  return L > 0.4 ? '#1b1109' : '#f7f1e8';
}

function softOf(def: AccentDef, theme: ThemeName): string {
  // mockup: dark soft = main @ .13; light soft leans on the deep hue for contrast
  return theme === 'light' ? hexAlpha(def.deep, 0.13) : hexAlpha(def.main, 0.13);
}

export function buildPalette(theme: ThemeName, style: 'ember' | 'neutral', accentHex: string): Palette {
  const resolvedAccent = accentHex === 'wallpaper' ? '#ff6b35' : accentHex;
  const base = style === 'neutral'
    ? (theme === 'light' ? NEUTRAL_LIGHT : NEUTRAL_DARK)
    : (theme === 'light' ? LIGHT : DARK);
  const matchedPreset = Object.values(STATIC_ACCENTS).find(
    (preset) => preset.main.toLowerCase() === resolvedAccent.toLowerCase()
  );
  const accentDef: AccentDef = matchedPreset
    ? { main: resolvedAccent, deep: matchedPreset.deep, ink: matchedPreset.ink }
    : { main: resolvedAccent, deep: hexDarken(resolvedAccent, 0.62), ink: inkOn(resolvedAccent) };
  const mk = (def: AccentDef, soft?: string): ColorSet => ({
    main: def.main,
    deep: def.deep,
    soft: soft ?? softOf(def, theme),
    ink: def.ink,
  });
  const sets: Record<ColorName, ColorSet> = {
    accent: mk(accentDef, hexAlpha(accentHex, theme === 'light' ? 0.12 : 0.13)),
    gold: mk(STATIC_ACCENTS.gold),
    teal: mk(STATIC_ACCENTS.teal),
    purple: mk(STATIC_ACCENTS.purple),
    green: mk(STATIC_ACCENTS.green),
    rose: mk(STATIC_ACCENTS.rose),
  };
  const customCache: Record<string, ColorSet> = {};
  return {
    ...base,
    theme,
    ...sets,
    col: (name: string) => {
      const preset = sets[name as ColorName];
      if (preset) return preset;
      if (name.startsWith('#') && name.length === 7) {
        if (!customCache[name]) {
          customCache[name] = mk({ main: name, deep: hexDarken(name, 0.62), ink: inkOn(name) });
        }
        return customCache[name];
      }
      return sets.accent;
    },
  };
}

/* HSL (h 0-360, s/l 0-1) → "#rrggbb" — for the custom color picker */
export function hslToHex(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
