/* Web: the browser ships a real Web Audio API. react-native-audio-api mirrors
   this exact shape, so tones.ts is written once against the shared graph API and
   metro picks this file on web, the native module on device. No session to manage
   here — the browser handles output once a user gesture resumes the context. */
export function activateAudioSession(): void {}

export function createAudioContext(): any {
  const Ctor = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
  return new Ctor();
}
