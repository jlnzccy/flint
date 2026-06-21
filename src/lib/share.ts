import { Routine } from '@/data/defaults';

/**
 * Encodes a routine object into a sharing payload string.
 * Uses a safe base64 encoding scheme that handles UTF-8 characters like emojis correctly.
 */
export function serializeRoutine(r: Routine): string {
  const payload = {
    n: r.name,
    e: r.emoji,
    c: r.color,
    s: r.steps.map((s) => ({ t: s.t, m: s.min, h: s.hint })),
    a: r.autoAdvance ? 1 : 0,
    w: r.warn30 ? 1 : 0,
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
    
    // Support both new compact keys and old verbose keys
    const name = data.n || data.name;
    const emoji = data.e || data.emoji || '📅';
    const color = data.c || data.color || 'accent';
    const rawSteps = data.s || data.steps;
    const autoAdvance = data.a !== undefined ? !!data.a : !!data.autoAdvance;
    const warn30 = data.w !== undefined ? !!data.w : !!data.warn30;

    if (!name || !Array.isArray(rawSteps) || rawSteps.length === 0) {
      return null;
    }
    
    return {
      name: name.trim(),
      emoji: emoji,
      color: color,
      steps: rawSteps.map((s: any) => ({
        t: (s.t || s.title || 'Step').trim(),
        min: Math.max(1, typeof s.m === 'number' ? s.m : typeof s.min === 'number' ? s.min : 1),
        hint: s.h ? s.h.trim() : s.hint ? s.hint.trim() : undefined,
      })),
      autoAdvance: !!autoAdvance,
      warn30: !!warn30,
    };
  } catch (e) {
    return null;
  }
}
