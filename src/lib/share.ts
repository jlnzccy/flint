import { Routine } from '@/data/defaults';

/**
 * Encodes a routine object into a sharing payload string.
 * Uses a safe base64 encoding scheme that handles UTF-8 characters like emojis correctly.
 */
export function serializeRoutine(r: Routine): string {
  const payload = {
    name: r.name,
    emoji: r.emoji,
    color: r.color,
    steps: r.steps.map((s) => ({ t: s.t, min: s.min, hint: s.hint })),
    autoAdvance: r.autoAdvance,
    warn30: r.warn30,
  };
  const json = JSON.stringify(payload);
  const base64 = btoa(encodeURIComponent(json));
  return `FLINT_RT:${base64}`;
}

/**
 * Decodes a sharing payload string back into a routine object.
 * Returns null if the payload is invalid or corrupted.
 */
export function deserializeRoutine(str: string): Omit<Routine, 'id'> | null {
  if (!str || !str.startsWith('FLINT_RT:')) return null;
  try {
    const base64 = str.slice('FLINT_RT:'.length);
    const json = decodeURIComponent(atob(base64));
    const data = JSON.parse(json);
    
    if (!data.name || !Array.isArray(data.steps) || data.steps.length === 0) {
      return null;
    }
    
    return {
      name: data.name.trim(),
      emoji: data.emoji || '📅',
      color: data.color || 'accent',
      steps: data.steps.map((s: any) => ({
        t: (s.t || 'Step').trim(),
        min: Math.max(1, typeof s.min === 'number' ? s.min : 1),
        hint: s.hint ? s.hint.trim() : undefined,
      })),
      autoAdvance: !!data.autoAdvance,
      warn30: !!data.warn30,
    };
  } catch (e) {
    return null;
  }
}
