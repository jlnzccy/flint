import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { activateAudioSession, createAudioContext } from './audio-context';

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

let sfxCtx: any = null;
async function getSfxCtx() {
  activateAudioSession();
  if (!sfxCtx) {
    sfxCtx = createAudioContext();
  }
  if (sfxCtx.state === 'suspended') {
    try {
      await sfxCtx.resume();
    } catch {}
  }
  return sfxCtx;
}

/* Celebration sting — synthesizes a beautiful chiptune / arcade victory fanfare in harmony */
interface ChiptuneNote {
  time: number;
  dur: number;
  freq: number;
  type?: 'sine' | 'square' | 'sawtooth' | 'triangle';
  vol: number;
  slideTo?: number;
  vibrato?: boolean;
}

async function playChiptune(tracks: ChiptuneNote[][]): Promise<void> {
  const context = await getSfxCtx();
  const now = context.currentTime;

  tracks.forEach((track) => {
    track.forEach((note) => {
      const osc = context.createOscillator();
      const gain = context.createGain();

      osc.type = note.type || 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      if (note.slideTo !== undefined) {
        osc.frequency.linearRampToValueAtTime(note.slideTo, now + note.time + note.dur);
      }

      let lfo: any = null;
      let lfoGain: any = null;
      if (note.vibrato) {
        try {
          lfo = context.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.setValueAtTime(10, now + note.time); // 10Hz vibrato
          
          lfoGain = context.createGain();
          lfoGain.gain.setValueAtTime(note.freq * 0.025, now + note.time); // 2.5% frequency depth
          
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
        } catch {}
      }

      const noteStart = now + note.time;
      const noteEnd = noteStart + note.dur;

      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(note.vol, noteStart + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      osc.connect(gain);
      gain.connect(context.destination);

      osc.start(noteStart);
      osc.stop(noteEnd);

      if (lfo && lfoGain) {
        lfo.start(noteStart);
        lfo.stop(noteEnd);
      }
    });
  });
}

/* Celebration sting — synthesizes a beautiful chiptune / arcade victory fanfare in harmony */
export async function playCelebration(): Promise<void> {
  try {
    // 6 cute randomized retro chiptune fanfare variations
    const styles: ChiptuneNote[][][] = [
      // 1. "The Grand Victory Ascent" (Ascending major arpeggio in tenths with a sustained chord)
      [
        // Lead (Square wave)
        [
          { time: 0.00, dur: 0.08, freq: 523.25, type: 'square', vol: 0.12 },
          { time: 0.08, dur: 0.08, freq: 659.25, type: 'square', vol: 0.12 },
          { time: 0.16, dur: 0.08, freq: 783.99, type: 'square', vol: 0.12 },
          { time: 0.24, dur: 0.08, freq: 1046.50, type: 'square', vol: 0.12 },
          { time: 0.32, dur: 0.08, freq: 1318.51, type: 'square', vol: 0.12 },
          { time: 0.40, dur: 0.08, freq: 1567.98, type: 'square', vol: 0.12 },
          { time: 0.48, dur: 0.70, freq: 2093.00, type: 'square', vol: 0.12, vibrato: true }
        ],
        // Harmony (Triangle wave)
        [
          { time: 0.48, dur: 0.70, freq: 1046.50, type: 'triangle', vol: 0.14 },
          { time: 0.48, dur: 0.70, freq: 1318.51, type: 'triangle', vol: 0.14 },
          { time: 0.48, dur: 0.70, freq: 1567.98, type: 'triangle', vol: 0.10 }
        ],
        // Bass (Triangle wave)
        [
          { time: 0.00, dur: 0.48, freq: 261.63, type: 'triangle', vol: 0.16 },
          { time: 0.48, dur: 0.70, freq: 523.25, type: 'triangle', vol: 0.18 }
        ]
      ],
      // 2. "The Sparkling Cascade" (Bouncing major 7th chord cascade)
      [
        // Lead
        [
          { time: 0.00, dur: 0.06, freq: 1046.50, type: 'square', vol: 0.10 },
          { time: 0.06, dur: 0.06, freq: 987.77, type: 'square', vol: 0.10 },
          { time: 0.12, dur: 0.06, freq: 783.99, type: 'square', vol: 0.10 },
          { time: 0.18, dur: 0.06, freq: 659.25, type: 'square', vol: 0.10 },
          { time: 0.24, dur: 0.06, freq: 987.77, type: 'square', vol: 0.10 },
          { time: 0.30, dur: 0.06, freq: 1046.50, type: 'square', vol: 0.10 },
          { time: 0.36, dur: 0.06, freq: 1318.51, type: 'square', vol: 0.10 },
          { time: 0.42, dur: 0.06, freq: 1567.98, type: 'square', vol: 0.10 },
          { time: 0.48, dur: 0.70, freq: 1975.53, type: 'square', vol: 0.10, vibrato: true }
        ],
        // Harmony
        [
          { time: 0.00, dur: 0.24, freq: 523.25, type: 'triangle', vol: 0.12 },
          { time: 0.24, dur: 0.24, freq: 587.33, type: 'triangle', vol: 0.12 },
          { time: 0.48, dur: 0.70, freq: 1046.50, type: 'triangle', vol: 0.12 },
          { time: 0.48, dur: 0.70, freq: 1318.51, type: 'triangle', vol: 0.12 },
          { time: 0.48, dur: 0.70, freq: 1567.98, type: 'triangle', vol: 0.10 }
        ],
        // Bass
        [
          { time: 0.00, dur: 0.48, freq: 261.63, type: 'triangle', vol: 0.15 },
          { time: 0.48, dur: 0.70, freq: 130.81, type: 'triangle', vol: 0.18 }
        ]
      ],
      // 3. "Dopamine Rush / Coin Shower" (Rapid coin pickup chime chain to massive high C chord)
      [
        // Lead (Square wave)
        [
          { time: 0.00, dur: 0.04, freq: 659.25, type: 'square', vol: 0.10 },
          { time: 0.04, dur: 0.04, freq: 783.99, type: 'square', vol: 0.10 },
          { time: 0.08, dur: 0.04, freq: 783.99, type: 'square', vol: 0.10 },
          { time: 0.12, dur: 0.04, freq: 987.77, type: 'square', vol: 0.10 },
          { time: 0.16, dur: 0.04, freq: 987.77, type: 'square', vol: 0.10 },
          { time: 0.20, dur: 0.04, freq: 1174.66, type: 'square', vol: 0.10 },
          { time: 0.24, dur: 0.04, freq: 1174.66, type: 'square', vol: 0.10 },
          { time: 0.28, dur: 0.04, freq: 1567.98, type: 'square', vol: 0.10 },
          { time: 0.32, dur: 0.04, freq: 1567.98, type: 'square', vol: 0.10 },
          { time: 0.36, dur: 0.04, freq: 1975.53, type: 'square', vol: 0.10 },
          { time: 0.40, dur: 0.04, freq: 1975.53, type: 'square', vol: 0.10 },
          { time: 0.44, dur: 0.04, freq: 2349.32, type: 'square', vol: 0.10 },
          { time: 0.48, dur: 0.70, freq: 3135.96, type: 'square', vol: 0.08, vibrato: true }
        ],
        // Harmony
        [
          { time: 0.48, dur: 0.70, freq: 1318.51, type: 'triangle', vol: 0.12 },
          { time: 0.48, dur: 0.70, freq: 1567.98, type: 'triangle', vol: 0.10 },
          { time: 0.48, dur: 0.70, freq: 1975.53, type: 'triangle', vol: 0.10 },
          { time: 0.48, dur: 0.70, freq: 2349.32, type: 'triangle', vol: 0.08 }
        ],
        // Bass
        [
          { time: 0.48, dur: 0.70, freq: 329.63, type: 'triangle', vol: 0.16 }
        ]
      ],
      // 4. "Bouncy Stage-Clear" (Cute rhythmic stage completion melody)
      [
        // Melody
        [
          { time: 0.00, dur: 0.08, freq: 523.25, type: 'square', vol: 0.12 },
          { time: 0.08, dur: 0.08, freq: 659.25, type: 'square', vol: 0.12 },
          { time: 0.16, dur: 0.08, freq: 783.99, type: 'square', vol: 0.12 },
          { time: 0.24, dur: 0.08, freq: 659.25, type: 'square', vol: 0.12 },
          { time: 0.32, dur: 0.08, freq: 783.99, type: 'square', vol: 0.12 },
          { time: 0.40, dur: 0.08, freq: 1046.50, type: 'square', vol: 0.12 },
          { time: 0.48, dur: 0.08, freq: 783.99, type: 'square', vol: 0.12 },
          { time: 0.56, dur: 0.08, freq: 1046.50, type: 'square', vol: 0.12 },
          { time: 0.64, dur: 0.70, freq: 1318.51, type: 'square', vol: 0.12, vibrato: true }
        ],
        // Harmony
        [
          { time: 0.00, dur: 0.16, freq: 329.63, type: 'triangle', vol: 0.14 },
          { time: 0.16, dur: 0.16, freq: 392.00, type: 'triangle', vol: 0.14 },
          { time: 0.32, dur: 0.16, freq: 523.25, type: 'triangle', vol: 0.14 },
          { time: 0.48, dur: 0.16, freq: 392.00, type: 'triangle', vol: 0.14 },
          { time: 0.64, dur: 0.70, freq: 783.99, type: 'triangle', vol: 0.14 },
          { time: 0.64, dur: 0.70, freq: 1046.50, type: 'triangle', vol: 0.12 }
        ],
        // Bass
        [
          { time: 0.00, dur: 0.32, freq: 130.81, type: 'triangle', vol: 0.18 },
          { time: 0.32, dur: 0.32, freq: 196.00, type: 'triangle', vol: 0.18 },
          { time: 0.64, dur: 0.70, freq: 261.63, type: 'triangle', vol: 0.18 }
        ]
      ],
      // 5. "Magical Star Glide" (Pitch sweeping arpeggio to high C7 resolution)
      [
        // Lead
        [
          { time: 0.00, dur: 0.12, freq: 523.25, slideTo: 659.25, type: 'square', vol: 0.10 },
          { time: 0.12, dur: 0.12, freq: 659.25, slideTo: 783.99, type: 'square', vol: 0.10 },
          { time: 0.24, dur: 0.12, freq: 783.99, slideTo: 1046.50, type: 'square', vol: 0.10 },
          { time: 0.36, dur: 0.12, freq: 1046.50, slideTo: 1318.51, type: 'square', vol: 0.10 },
          { time: 0.48, dur: 0.12, freq: 1318.51, slideTo: 1567.98, type: 'square', vol: 0.10 },
          { time: 0.60, dur: 0.70, freq: 2093.00, type: 'square', vol: 0.10, vibrato: true }
        ],
        // Harmony
        [
          { time: 0.60, dur: 0.70, freq: 783.99, type: 'triangle', vol: 0.14 },
          { time: 0.60, dur: 0.70, freq: 1046.50, type: 'triangle', vol: 0.14 },
          { time: 0.60, dur: 0.70, freq: 1318.51, type: 'triangle', vol: 0.12 }
        ],
        // Bass
        [
          { time: 0.00, dur: 0.60, freq: 130.81, slideTo: 261.63, type: 'triangle', vol: 0.18 },
          { time: 0.60, dur: 0.70, freq: 261.63, type: 'triangle', vol: 0.18 }
        ]
      ],
      // 6. "The Mega-Chime Level-Up" (Rapid high trills with big stereo resolve)
      [
        // Lead
        [
          { time: 0.00, dur: 0.04, freq: 1046.50, type: 'square', vol: 0.10 },
          { time: 0.04, dur: 0.04, freq: 1318.51, type: 'square', vol: 0.10 },
          { time: 0.08, dur: 0.04, freq: 1567.98, type: 'square', vol: 0.10 },
          { time: 0.12, dur: 0.04, freq: 2093.00, type: 'square', vol: 0.10 },
          { time: 0.16, dur: 0.04, freq: 1318.51, type: 'square', vol: 0.10 },
          { time: 0.20, dur: 0.04, freq: 1567.98, type: 'square', vol: 0.10 },
          { time: 0.24, dur: 0.04, freq: 2093.00, type: 'square', vol: 0.10 },
          { time: 0.28, dur: 0.70, freq: 2637.02, type: 'square', vol: 0.08, vibrato: true }
        ],
        // Harmony
        [
          { time: 0.28, dur: 0.70, freq: 1046.50, type: 'triangle', vol: 0.14 },
          { time: 0.28, dur: 0.70, freq: 1318.51, type: 'triangle', vol: 0.14 },
          { time: 0.28, dur: 0.70, freq: 1567.98, type: 'triangle', vol: 0.12 }
        ],
        // Bass
        [
          { time: 0.00, dur: 0.28, freq: 196.00, type: 'triangle', vol: 0.18 },
          { time: 0.28, dur: 0.70, freq: 261.63, type: 'triangle', vol: 0.18 }
        ]
      ]
    ];

    const style = styles[Math.floor(Math.random() * styles.length)];
    await playChiptune(style);
  } catch {
    // chiptune synth failed — fall back to the bundled mp3 sting
    fireWarm(celebrationPlayer);
  }
}

/* Soft tick when a routine step is marked done (the final step plays the
   celebration sting instead). Quieter than the celebration so it stays gentle. */
export function playStepDone(): void {
  fireWarm(stepDonePlayer);
}

/* Play a pleasant double-beep retro warning chime when 30 seconds remain. */
export async function playWarningChime(): Promise<void> {
  try {
    await playChiptune([
      [
        { time: 0.00, dur: 0.08, freq: 880, type: 'square', vol: 0.06 },
        { time: 0.12, dur: 0.08, freq: 1109.73, type: 'square', vol: 0.06 }
      ]
    ]);
  } catch {}
}


