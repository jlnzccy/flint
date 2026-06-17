/* Native: react-native-audio-api is Web Audio for React Native — same node graph
   (Oscillator / Gain / StereoPanner) so tones.ts stays platform-agnostic. The web
   twin (audio-context.web.ts) uses the browser's built-in AudioContext instead. */
import { AudioContext, AudioManager } from 'react-native-audio-api';

let configured = false;

/* The engine stays silent until the OS audio session is set to a playback category
   and activated: iOS otherwise defaults to a silent/ambient category (the mute
   switch kills output) and Android needs the audio-focus request. Call before every
   play so a session deactivated by an interruption gets reclaimed. */
export function activateAudioSession(): void {
  try {
    if (!configured) {
      AudioManager.setAudioSessionOptions({ iosCategory: 'playback', iosMode: 'default', iosOptions: ['mixWithOthers'] });
      // Android: claim media audio focus ('gain'). setAudioSession* above are iOS-only
      // no-ops, so without this nothing tells the OS we're playing media — output can
      // land on a silent/wrong route on the built-in speaker.
      AudioManager.observeAudioInterruptions('gain');
      configured = true;
    }
    AudioManager.setAudioSessionActivity(true);
  } catch {}
}

/* Create the context at the device's preferred sample rate. On Android the engine
   uses Oboe/AAudio; leaving the rate unset lets the built-in-speaker path open at a
   rate it silently rejects (no output) while Bluetooth resamples and works anyway —
   so tones only came out over Bluetooth. Matching the device rate fixes speaker out.
   Frequencies are in Hz, independent of sample rate, so the tones sound identical. */
export function createAudioContext(): any {
  let sampleRate: number | undefined;
  try {
    const r = AudioManager.getDevicePreferredSampleRate();
    if (r && r > 0) sampleRate = r;
  } catch {}
  return sampleRate ? new AudioContext({ sampleRate }) : new AudioContext();
}
