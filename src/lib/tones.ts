/* ── Tone engine ──
   Two synthesis modes, one shared graph, live-tweakable from the sliders.

   Binaural: two sine oscillators a few Hz apart, hard-panned L/R. The brain hears
   the *difference* as a phantom beat — needs headphones.
   Isochronic: a bank of carrier tones, each gated fully on/off by a square LFO at
   its band rate and scaled by its own level. You blend the bands like a mixer
   (mynoise-style); presets are just saved level sets. Audible on a speaker.

   Native uses react-native-audio-api, web uses the browser's AudioContext; both
   expose the same Web Audio node API, so this file never branches on platform. */
import { activateAudioSession, createAudioContext } from './audio-context';

export type ToneMode = 'binaural' | 'isochronic';

/* canonical band rates — index order is the contract between engine, store
   (isoLevels[]) and the Sounds screen's row metadata. */
export const ISO_BAND_HZ = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32] as const;
/* a distinct carrier pitch per band so a blend reads as a soft chord, not mud */
const ISO_CARRIERS = [144, 162, 180, 198, 216, 240, 270, 300, 342, 396];
const ISO_VOICE_GAIN = 0.18; // per-band ceiling — up to 10 sum into master

export interface ToneConfig {
  mode: ToneMode;
  baseHz: number; // binaural carrier, left ear
  beatHz: number; // binaural beat — right ear = base + beat
  isoLevels: number[]; // isochronic mix — one 0..1 level per ISO_BAND_HZ
  volume: number; // 0..1 master
}

/* The two backends ship different type names for the same nodes, so refs stay
   untyped at this boundary. */
/* eslint-disable @typescript-eslint/no-explicit-any */
let ctx: any = null;
let master: any = null; // master gain → destination (volume + fades live here)
let voices: any[] = []; // every oscillator, stopped on teardown
let leftOsc: any = null;
let rightOsc: any = null;
let isoLevelGains: any[] = []; // per-band level gain, indexed like ISO_BAND_HZ
let mode: ToneMode | null = null;
let gen = 0; // bumping this cancels a pending fade-out teardown

function ensureCtx() {
  activateAudioSession(); // no-op on web; sets playback category + focus on native
  if (!ctx) {
    ctx = createAudioContext();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  // web suspends the context until a user gesture resumes it (the Play tap is one)
  ctx.resume?.();
  return ctx;
}

function rampParam(param: any, target: number, dur: number) {
  const now = ctx.currentTime;
  const cur = typeof param.value === 'number' ? param.value : target;
  param.cancelScheduledValues?.(now);
  param.setValueAtTime(cur, now);
  param.linearRampToValueAtTime(target, now + dur);
}

function teardownVoices() {
  voices.forEach((v) => {
    try {
      v.stop();
    } catch {}
    try {
      v.disconnect?.();
    } catch {}
  });
  voices = [];
  leftOsc = rightOsc = null;
  isoLevelGains = [];
  mode = null;
}

function buildBinaural(cfg: ToneConfig) {
  leftOsc = ctx.createOscillator();
  leftOsc.type = 'sine';
  leftOsc.frequency.value = cfg.baseHz;
  rightOsc = ctx.createOscillator();
  rightOsc.type = 'sine';
  rightOsc.frequency.value = cfg.baseHz + cfg.beatHz;

  const lp = ctx.createStereoPanner();
  lp.pan.value = -1;
  const rp = ctx.createStereoPanner();
  rp.pan.value = 1;

  leftOsc.connect(lp);
  lp.connect(master);
  rightOsc.connect(rp);
  rp.connect(master);
  leftOsc.start();
  rightOsc.start();
  voices = [leftOsc, rightOsc];
}

function buildIsochronic(cfg: ToneConfig) {
  // one voice per band, always running; the level gain is what the slider drives.
  // carrier → modGain (gated 0↔1 by a square LFO) → levelGain → master
  isoLevelGains = ISO_BAND_HZ.map((hz, i) => {
    const carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = ISO_CARRIERS[i];

    const modGain = ctx.createGain();
    modGain.gain.value = 0.5; // DC offset the square LFO swings ±0.5 around → 0..1

    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = hz;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.5;
    lfo.connect(lfoGain);
    lfoGain.connect(modGain.gain); // node → AudioParam: amplitude modulation

    const levelGain = ctx.createGain();
    levelGain.gain.value = (cfg.isoLevels[i] ?? 0) * ISO_VOICE_GAIN;

    carrier.connect(modGain);
    modGain.connect(levelGain);
    levelGain.connect(master);
    carrier.start();
    lfo.start();
    voices.push(carrier, lfo);
    return levelGain;
  });
}

export function startTone(cfg: ToneConfig) {
  ensureCtx();
  gen++; // cancel any scheduled teardown from a recent stop
  teardownVoices();
  if (cfg.mode === 'binaural') buildBinaural(cfg);
  else buildIsochronic(cfg);
  mode = cfg.mode;
  rampParam(master.gain, cfg.volume, 0.6); // fade in — never startle
}

/* Live edit from the sliders without restarting the oscillators. Restarts only
   when the mode itself changes. Caller should only invoke this while playing. */
export function updateTone(cfg: ToneConfig) {
  if (!ctx || mode !== cfg.mode) {
    startTone(cfg);
    return;
  }
  if (cfg.mode === 'binaural' && leftOsc && rightOsc) {
    rampParam(leftOsc.frequency, cfg.baseHz, 0.06);
    rampParam(rightOsc.frequency, cfg.baseHz + cfg.beatHz, 0.06);
  } else if (cfg.mode === 'isochronic') {
    isoLevelGains.forEach((g, i) => rampParam(g.gain, (cfg.isoLevels[i] ?? 0) * ISO_VOICE_GAIN, 0.12));
  }
  rampParam(master.gain, cfg.volume, 0.1);
}

export function stopTone() {
  if (!ctx || !master) return;
  rampParam(master.gain, 0, 0.4);
  const myGen = ++gen;
  setTimeout(() => {
    if (myGen === gen) teardownVoices();
  }, 460);
}
