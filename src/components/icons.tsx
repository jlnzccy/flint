import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color: string;
}

export const IconX = ({ size = 20, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Path d="M5 5l10 10M15 5L5 15" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
  </Svg>
);

export const IconCheck = ({ size = 18, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Path d="M4 10.5l4.2 4L16 6" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconPlus = ({ size = 20, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Path d="M10 4v12M4 10h12" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
  </Svg>
);

export const IconPause = ({ size = 22, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <Path d="M7 5v12M15 5v12" stroke={color} strokeWidth={3.4} strokeLinecap="round" />
  </Svg>
);

export const IconPlay = ({ size = 22, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <Path d="M7 4.5v13l11-6.5z" fill={color} />
  </Svg>
);

export const IconSkip = ({ size = 22, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <Path d="M5 4.5v13l9-6.5z" fill={color} />
    <Path d="M16.5 5v12" stroke={color} strokeWidth={3} strokeLinecap="round" />
  </Svg>
);

export const IconRestart = ({ size = 16, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08C16.73 16.07 14.59 18 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
      fill={color}
    />
  </Svg>
);

export const IconHome = ({ size = 22, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <Path d="M3.5 10L11 3l7.5 7v7.5a1.5 1.5 0 01-1.5 1.5h-3.5v-5h-5v5H5a1.5 1.5 0 01-1.5-1.5z" fill={color} />
  </Svg>
);

export const IconGear = ({ size = 22, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 8.4a3.6 3.6 0 100 7.2 3.6 3.6 0 000-7.2zm8.6 3.6a6.9 6.9 0 00-.1-1.2l2-1.5-2-3.4-2.3 1a7.6 7.6 0 00-2-1.2L15.8 3h-4l-.4 2.7a7.6 7.6 0 00-2 1.2l-2.3-1-2 3.4 2 1.5a6.9 6.9 0 000 2.4l-2 1.5 2 3.4 2.3-1c.6.5 1.3.9 2 1.2l.4 2.7h4l.4-2.7a7.6 7.6 0 002-1.2l2.3 1 2-3.4-2-1.5c0-.4.1-.8.1-1.2z"
      fill={color}
    />
  </Svg>
);

export const IconPencil = ({ size = 18, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Path d="M3 17l1-4L14.5 2.5a1.8 1.8 0 012.6 0l.4.4a1.8 1.8 0 010 2.6L7 16z" fill={color} />
  </Svg>
);

export const IconTrash = ({ size = 18, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Path
      d="M4 6h12M8 6V4h4v2M6 6l.8 10.5A1.5 1.5 0 008.3 18h3.4a1.5 1.5 0 001.5-1.4L14 6"
      stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

export const IconChart = ({ size = 22, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <G fill={color}>
      <Rect x={3} y={11} width={4} height={8} rx={1} />
      <Rect x={9} y={6} width={4} height={13} rx={1} />
      <Rect x={15} y={9} width={4} height={10} rx={1} />
    </G>
  </Svg>
);

export const IconCal = ({ size = 20, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <G stroke={color} strokeWidth={2} fill="none">
      <Rect x={3} y={4.5} width={16} height={14.5} rx={2.5} />
      <Path d="M3 8.5h16M7 3v3M15 3v3" strokeLinecap="round" />
    </G>
  </Svg>
);

export const IconClock = ({ size = 15, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <G stroke={color} strokeWidth={1.8} fill="none">
      <Circle cx={10} cy={10} r={7.2} />
      <Path d="M10 6v4.2l2.8 1.8" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  </Svg>
);

export const IconDots = ({ size = 20, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <G fill={color}>
      <Circle cx={4} cy={10} r={1.8} />
      <Circle cx={10} cy={10} r={1.8} />
      <Circle cx={16} cy={10} r={1.8} />
    </G>
  </Svg>
);

export const IconChevL = ({ size = 20, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Path d="M12.5 4L6.5 10l6 6" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconChevR = ({ size = 20, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Path d="M7.5 4l6 6-6 6" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconChevD = ({ size = 18, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Path d="M5 8l5 5 5-5" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconBell = ({ size = 18, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Path
      d="M10 2.5a4.5 4.5 0 014.5 4.5c0 4 1.5 5.5 1.5 5.5H4s1.5-1.5 1.5-5.5A4.5 4.5 0 0110 2.5zM8 16a2 2 0 004 0"
      stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

export const IconAlarm = ({ size = 18, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <G stroke={color} strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={11} cy={12} r={6.5} />
      <Path d="M11 9v3l2 1.6M3.5 5.5l3-2.4M18.5 5.5l-3-2.4" />
    </G>
  </Svg>
);

export const IconMoon = ({ size = 18, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <Path d="M18 13.4A7.2 7.2 0 018.6 4 7.2 7.2 0 1018 13.4z" fill={color} />
  </Svg>
);

export const IconArchive = ({ size = 18, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <G fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3.5} y={4} width={15} height={4} />
      <Path d="M5 8v9.5h12V8M9 11.5h4" />
    </G>
  </Svg>
);

export const IconList = ({ size = 22, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <G stroke={color} strokeWidth={2.4} strokeLinecap="round">
      <Path d="M8 5.5h10M8 11h10M8 16.5h10" />
      <Path d="M3.5 5.5h.01M3.5 11h.01M3.5 16.5h.01" strokeWidth={3.2} />
    </G>
  </Svg>
);

export const IconRepeat = ({ size = 18, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <G stroke={color} strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 8a4 4 0 014-4h8M16 4l-2.5-2.5M16 4l-2.5 2.5" />
      <Path d="M16 12a4 4 0 01-4 4H4M4 16l2.5-2.5M4 16l2.5 2.5" />
    </G>
  </Svg>
);

export const IconFlag = ({ size = 18, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Path
      d="M4.5 2.5v15M4.5 3.5h10.5l-2.5 3.5 2.5 3.5H4.5"
      stroke={color} strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

export const IconDrag = ({ size = 20, color }: IconProps) => (
  <Svg width={(size * 14) / 20} height={size} viewBox="0 0 14 20">
    <G fill={color}>
      <Circle cx={4} cy={4} r={1.6} />
      <Circle cx={10} cy={4} r={1.6} />
      <Circle cx={4} cy={10} r={1.6} />
      <Circle cx={10} cy={10} r={1.6} />
      <Circle cx={4} cy={16} r={1.6} />
      <Circle cx={10} cy={16} r={1.6} />
    </G>
  </Svg>
);

export const IconShare = ({ size = 18, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <G stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={15} cy={4.5} r={2.2} />
      <Circle cx={5} cy={10} r={2.2} />
      <Circle cx={15} cy={15.5} r={2.2} />
      <Path d="M6.9 8.9l6.2-3.3M6.9 11.1l6.2 3.3" />
    </G>
  </Svg>
);

/* sound waves radiating from a source — the Sounds tab */
export const IconWaves = ({ size = 22, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <G stroke={color} strokeWidth={2} fill="none" strokeLinecap="round">
      <Path d="M11 7v8" />
      <Path d="M7.5 9v4M14.5 9v4" />
      <Path d="M4 10v2M18 10v2" />
    </G>
  </Svg>
);
