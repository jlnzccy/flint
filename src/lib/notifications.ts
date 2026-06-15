import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { Routine } from '@/data/defaults';
import { keyToDate, todayKey } from '@/lib/dates';
import { nextOccurrence } from '@/lib/repeat';
import type { Todo } from '@/state/store';

import type * as NotificationsModule from 'expo-notifications';

/* expo-notifications runs a push-token auto-registration side effect on import
   (DevicePushTokenAutoRegistration.fx) that THROWS on Android in Expo Go — SDK 53
   removed remote push from Expo Go. A static top-level import therefore crashed the
   root layout on launch. Flint only schedules LOCAL notifications, so we lazy-load the
   module and no-op in Expo Go on Android. Notifications still work in a dev build
   (`npx expo run:android`); on iOS Expo Go local notifications work as before. */
const SKIP = isRunningInExpoGo() && Platform.OS === 'android';

let _N: typeof NotificationsModule | null = null;
let _handlerSet = false;

function getN(): typeof NotificationsModule | null {
  if (SKIP) return null;
  if (!_N) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _N = require('expo-notifications') as typeof NotificationsModule;
    if (!_handlerSet) {
      _N.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      _handlerSet = true;
    }
  }
  return _N;
}

/* One-shot alert for the in-player step timer. Fires when the step's set duration
   is reached (countdown hits zero / count-up passes the target) so the user still
   gets pinged if they've tabbed away. Returns an id to cancel on pause/skip/exit. */
export async function scheduleTimerAlert(seconds: number, title: string, body: string): Promise<string | null> {
  const N = getN();
  if (!N || seconds <= 0) return null;
  try {
    const granted = await ensurePermission();
    if (!granted) return null;
    await ensureChannel(N);
    return await N.scheduleNotificationAsync({
      content: { title, body, data: { timer: true } },
      trigger: {
        type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(seconds)),
        channelId: 'routines',
      },
    });
  } catch {
    return null;
  }
}

export async function cancelTimerAlert(id: string | null) {
  if (!id) return;
  const N = getN();
  if (!N) return;
  try {
    await N.cancelScheduledNotificationAsync(id);
  } catch {
    // ignore
  }
}

/* read-only: is the OS notification permission already granted? Used by onboarding so
   the "Notifications on" button reflects reality instead of the remindersOn default. */
export async function hasNotificationPermission(): Promise<boolean> {
  const N = getN();
  if (!N) return false;
  try {
    return (await N.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function ensurePermission(): Promise<boolean> {
  const N = getN();
  if (!N) return false;
  try {
    const cur = await N.getPermissionsAsync();
    if (cur.granted) return true;
    const req = await N.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

async function ensureChannel(N: typeof NotificationsModule) {
  if (Platform.OS !== 'android') return;
  await N.setNotificationChannelAsync('routines', {
    name: 'Routine reminders',
    importance: N.AndroidImportance.HIGH,
    vibrationPattern: [0, 220, 120, 220],
  });
  await N.setNotificationChannelAsync('tasks', {
    name: 'Task reminders',
    importance: N.AndroidImportance.HIGH,
    vibrationPattern: [0, 220, 120, 220],
  });
}

/* next fire Date for a task, or null */
function taskFireDate(t: Todo): Date | null {
  let day: string | null = null;
  let time: string | null = null;
  if (t.repeat) {
    day = nextOccurrence(t.repeat, todayKey());
    time = t.repeat.time;
  } else if (!t.done && t.reminderDate) {
    day = t.reminderDate;
    time = t.reminderTime;
  }
  if (!day) return null;
  const d = keyToDate(day);
  const [h, m] = (time || '09:00').split(':').map(Number);
  d.setHours(h, m, 0, 0);
  // if today's slot already passed, try the next repeat occurrence tomorrow
  if (d.getTime() <= Date.now()) {
    if (!t.repeat) return null;
    const next = nextOccurrence(t.repeat, todayKey()) === day ? nextOccurrence(t.repeat, addDayKey(day)) : null;
    if (!next) return null;
    const nd = keyToDate(next);
    nd.setHours(h, m, 0, 0);
    return nd.getTime() > Date.now() ? nd : null;
  }
  return d;
}

/* same text every day = brain tunes it out in a week. rotate terse variants;
   syncReminders re-runs on every app open, so the pick rolls forward. */
const ROUTINE_BODIES = [
  'Starts with step one.',
  'Step one is tiny.',
  'Two minutes counts.',
  'Just open it.',
];

function routineBody(id: string): string {
  const dayN = Math.floor(Date.now() / 86400000);
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ROUTINE_BODIES[Math.abs(dayN + hash) % ROUTINE_BODIES.length];
}

function addDayKey(k: string): string {
  const d = keyToDate(k);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* Reschedule everything from current state. Cheap enough to call after any change.
   One-shot task triggers are re-derived on every app open, so repeats roll forward. */
export async function syncReminders(routines: Routine[], todos: Todo[], remindersOn: boolean) {
  const N = getN();
  if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
    if (!remindersOn) return;
    const granted = await ensurePermission();
    if (!granted) return;
    await ensureChannel(N);
    for (const t of todos) {
      const fire = taskFireDate(t);
      if (!fire) continue;
      // only tasks with an explicit time get a notification; date-only tasks just appear on Today
      if (!(t.repeat ? t.repeat.time : t.reminderTime)) continue;
      await N.scheduleNotificationAsync({
        content: {
          title: `📝 ${t.title}`,
          body: t.details || 'On your list.',
          data: { todoId: t.id },
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DATE,
          date: fire,
          channelId: 'tasks',
        },
      });
    }
    for (const r of routines) {
      if (!r.reminder) continue;
      const [hour, minute] = r.reminder.split(':').map(Number);
      const content = {
        title: `${r.emoji} ${r.name}`,
        body: routineBody(r.id),
        data: { routineId: r.id, alarm: !!r.alarm },
      };
      if (r.days && r.days.length > 0 && r.days.length < 7) {
        // day-limited routines: one weekly trigger per chosen day (expo weekday: 1=Sunday)
        for (const d of r.days) {
          await N.scheduleNotificationAsync({
            content,
            trigger: {
              type: N.SchedulableTriggerInputTypes.WEEKLY,
              weekday: d + 1,
              hour,
              minute,
              channelId: 'routines',
            },
          });
        }
      } else {
        await N.scheduleNotificationAsync({
          content,
          trigger: {
            type: N.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: 'routines',
          },
        });
      }
    }
  } catch {
    // never let notification plumbing crash the app
  }
}

/* ── routing taps → screens ──
   A reminder is just a banner until tapped; tapping a routine reminder should take
   you somewhere. Alarm-flagged routines open the full-screen alarm; the rest open
   the routine. These wire expo-notifications' listeners; all no-op in Expo Go. */

type AlarmHandler = (routineId: string, alarm: boolean) => void;

export function addNotificationTapListener(handler: AlarmHandler): () => void {
  const N = getN();
  if (!N) return () => {};
  const sub = N.addNotificationResponseReceivedListener((resp) => {
    const data = resp.notification.request.content.data as { routineId?: string; alarm?: boolean } | undefined;
    if (data?.routineId) handler(String(data.routineId), !!data.alarm);
  });
  return () => sub.remove();
}

/* app already open when an alarm fires → surface the alarm screen instead of a banner */
export function addForegroundAlarmListener(handler: (routineId: string) => void): () => void {
  const N = getN();
  if (!N) return () => {};
  const sub = N.addNotificationReceivedListener((notif) => {
    const data = notif.request.content.data as { routineId?: string; alarm?: boolean } | undefined;
    if (data?.routineId && data.alarm) handler(String(data.routineId));
  });
  return () => sub.remove();
}

/* cold start: app launched by tapping a notification. getLastNotificationResponseAsync
   can return a *stale* tap on a normal relaunch, which would pop the alarm on every
   launch — so only act if the notification fired in the last couple of minutes. */
export async function getLaunchRoutine(): Promise<{ routineId: string; alarm: boolean } | null> {
  const N = getN();
  if (!N) return null;
  try {
    const resp = await N.getLastNotificationResponseAsync();
    const notif = resp?.notification;
    const data = notif?.request?.content?.data as { routineId?: string; alarm?: boolean } | undefined;
    if (!data?.routineId) return null;
    const raw = (notif as { date?: number })?.date ?? 0;
    const ms = raw > 1e12 ? raw : raw * 1000; // normalize seconds → ms across platforms
    if (raw && Date.now() - ms > 120000) return null; // older than 2 min = stale relaunch
    return { routineId: String(data.routineId), alarm: !!data.alarm };
  } catch {
    // ignore
  }
  return null;
}
