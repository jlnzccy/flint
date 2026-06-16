/* ── Sound effects ──
   File-based one-shots + the looping alarm, played through expo-audio. Distinct
   from src/lib/tones.ts, which *synthesizes* the Sounds-tab brainwave tones via
   react-native-audio-api. Here we just play the bundled mp3s (or a user-picked
   ringtone URI for the alarm). */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const ALARM_DEFAULT = require('../../assets/sounds/alarm-marimba.mp3');
const CELEBRATIONS = [require('../../assets/sounds/celebration-fanfare.mp3')];
const STEP_DONE = require('../../assets/sounds/step-done.mp3');

let modeReady = false;
function ensureMode() {
  if (modeReady) return;
  modeReady = true;
  // an alarm / celebration should fire even with the mute switch on
  setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }).catch(() => {});
}

let alarmPlayer: AudioPlayer | null = null;

/* ── Warm one-shot players ──
   The Done chime + celebration sting are short and fire on a tight beat, so we
   keep a persistent, pre-decoded AudioPlayer alive for each instead of building
   one per hit (createAudioPlayer decodes lazily → ~100–300ms late on first play).
   Replay is just seekTo(0)+play(). Built once at module load, after ensureMode()
   so setAudioModeAsync has a head start before the first play. */
let stepDonePlayer: AudioPlayer | null = null;
let celebrationPlayer: AudioPlayer | null = null;

(function warmOneShots() {
  ensureMode();
  try {
    stepDonePlayer = createAudioPlayer(STEP_DONE);
    stepDonePlayer.volume = 0.8;
  } catch {}
  try {
    celebrationPlayer = createAudioPlayer(CELEBRATIONS[0]);
    celebrationPlayer.volume = 1;
  } catch {}
})();

/* Replay a warmed player from the top. seekTo(0) lets rapid taps re-trigger
   without waiting for the previous play to finish (short clips, rare overlap). */
function fireWarm(player: AudioPlayer | null): void {
  if (!player) return;
  try {
    player.seekTo(0);
    player.play();
  } catch {}
}

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

/* Celebration sting — fires instantly off the warmed player. */
export function playCelebration(): void {
  fireWarm(celebrationPlayer);
}

/* Soft tick when a routine step is marked done (the final step plays the
   celebration sting instead). Quieter than the celebration so it stays gentle. */
export function playStepDone(): void {
  fireWarm(stepDonePlayer);
}
