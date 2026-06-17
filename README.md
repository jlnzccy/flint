# Flint

ADHD routines app with step timers. No scrutiny, no shame, no guilt.

Reward showing up — never measure output.

## What it does

- **Routines** with individual step timers — start a routine, work through each step at your own pace
- **Tasks** (todos) with deadlines, reminders, subtasks, and repeat rules
- **Today view** — tasks due today, scheduled routines, anytime routines, completed items
- **Quiet attendance** — opening the app marks the day. Calendar never looks like failure; empty days are just "Rest"
- **Streaks** — opt-in only. "Streak never dies" mode pauses on gaps instead of resetting. Streaks off = zero streak UI anywhere
- **Skip is drama-free** — "Not today" bumps without penalty, forever

## Stack

- [Expo SDK 56](https://expo.dev) / React Native 0.85 / React 19
- [expo-router](https://docs.expo.dev/router/introduction/) for navigation
- [NativeWind 4](https://www.nativewind.dev/) + Tailwind CSS for styling
- [Reanimated 4](https://docs.swmansion.com/react-native-reanimated/) for animations
- [Zustand](https://zustand-demo.pmnd.rs/) + AsyncStorage for state
- React Native Gesture Handler for drag-to-reorder

## Design

Dark warm charcoal with chunky pressed-edge surfaces. Fonts: Nunito 800/900 for display, Be Vietnam Pro for body.

## Running locally

```bash
# Install dependencies
npm install

# Start dev server
npx expo start

# Android dev build (notifications require a dev build, not Expo Go)
npx expo run:android

# Type check
npx tsc --noEmit
```

## License

[Proprietary License](LICENSE)

