import Constants from 'expo-constants';

import { todayKey } from '@/lib/dates';
import { useStore } from '@/state/store';

/* Full-state backup: export every persisted field as one JSON document and restore
   it wholesale. The field list mirrors the store's `partialize` — keep them in sync
   so a backup is a faithful snapshot of what lives in AsyncStorage. */

const BACKUP_KIND = 'flint-backup';
const SCHEMA = 9; // matches the persist `version` in src/state/store.ts

/* the persisted data domains (same set the store writes to storage) */
const FIELDS = [
  'custom',
  'overrides',
  'order',
  'archived',
  'deleted',
  'doneMap',
  'bumped',
  'todos',
  'history',
  'appDays',
  'skips',
  'lastDay',
  'accent',
  'onboarded',
  'celebratedFirst',
  'settings',
  'sound',
  'pomodoro',
  'recentColors',
] as const;

export interface Backup {
  kind: string;
  schema: number;
  app: string;
  appVersion: string | null;
  exportedAt: string;
  data: Record<string, unknown>;
}

/* snapshot the live store into a backup envelope */
export function buildBackup(): Backup {
  const s = useStore.getState() as unknown as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const k of FIELDS) data[k] = s[k];
  return {
    kind: BACKUP_KIND,
    schema: SCHEMA,
    app: 'flint',
    appVersion: Constants.expoConfig?.version ?? null,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function serializeBackup(): string {
  return JSON.stringify(buildBackup(), null, 2);
}

export function backupFilename(): string {
  return `flint-backup-${todayKey()}.json`;
}

export interface ImportResult {
  ok: boolean;
  error?: string;
  counts?: { routines: number; tasks: number; days: number };
}

/* Restore from a backup string. Accepts either the wrapped envelope ({ kind, data })
   or a bare data object, and sets only the fields it recognizes. This is a *replace*:
   the imported domains overwrite whatever is in the store. Returns ok:false (without
   touching state) when the text isn't a usable Flint backup. */
export function applyBackup(text: string): ImportResult {
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Not valid JSON' };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Empty file' };
  }

  // unwrap the envelope if present; otherwise treat the object itself as the data
  const src: Record<string, unknown> =
    parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;

  const patch: Record<string, unknown> = {};
  for (const k of FIELDS) {
    if (src[k] !== undefined) patch[k] = src[k];
  }
  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "Doesn't look like a Flint backup" };
  }

  // a restored backup has met its routines — never bounce the user into onboarding
  if (patch.onboarded === undefined) patch.onboarded = true;

  useStore.setState(patch);

  const custom = Array.isArray(patch.custom) ? patch.custom : [];
  const todos = Array.isArray(patch.todos) ? patch.todos : [];
  const history = (patch.history && typeof patch.history === 'object' ? patch.history : {}) as Record<string, unknown>;
  return {
    ok: true,
    counts: { routines: custom.length, tasks: todos.length, days: Object.keys(history).length },
  };
}
