/* ── Sound effects ──
   File-based one-shots + the looping alarm, played through expo-audio. Distinct
   from src/lib/tones.ts, which *synthesizes* the Sounds-tab brainwave tones via
   react-native-audio-api. Here we just play the bundled mp3s (or a user-picked
   ringtone URI for the alarm). */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const ALARM_DEFAULT = require('../../assets/sounds/alarm-marimba.mp3');
const CELEBRATIONS = [
  require('../../assets/sounds/celebration-grand.mp3'),
  require('../../assets/sounds/celebration-mini.mp3'),
  require('../../assets/sounds/celebration-fanfare.mp3'),
];

let modeReady = false;
function ensureMode() {
  if (modeReady) return;
  modeReady = true;
  // an alarm / celebration should fire even with the mute switch on
  setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }).catch(() => {});
}

let alarmPlayer: AudioPlayer | null = null;

/* Loop the alarm tone until stopped. uri = a content:// ringtone the user picked
   in Settings, else the bundled marimba. */
export function playAlarm(uri?: string | null): void {
  ensureMode();
  stopAlarm();
  try {
    alarmPlayer = createAudioPlayer(uri ? { uri } : ALARM_DEFAULT);
    alarmPlayer.loop = true;
    alarmPlayer.volume = 1;
    alarmPlayer.play();
  } catch {}
}

export function stopAlarm(): void {
  if (!alarmPlayer) return;
  // null the singleton first so a re-entrant call can't double-stop, then unloop +
  // pause before remove() — remove() alone can leave a looping player audible if its
  // native teardown is deferred.
  const p = alarmPlayer;
  alarmPlayer = null;
  try {
    p.loop = false;
    p.pause();
  } catch {}
  try {
    p.remove();
  } catch {}
}

/* One random celebration sting, released when it finishes playing. */
export function playCelebration(): void {
  ensureMode();
  try {
    const src = CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
    const player = createAudioPlayer(src);
    player.volume = 1;
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        sub.remove();
        try {
          player.remove();
        } catch {}
      }
    });
    player.play();
  } catch {}
}
