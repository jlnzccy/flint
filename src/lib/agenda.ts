import { Routine, routineMin } from '@/data/defaults';
import { Todo, todoDoneOn, todoIsToday } from '@/state/store';
import { occursOn } from '@/lib/repeat';
import { keyToDate } from '@/lib/dates';
import { ColorName } from '@/theme/colors';

export interface AgendaItem {
  kind: 'routine' | 'task';
  id: string;
  title: string;
  emoji: string;
  color: ColorName | string;
  time: string | null;     // "HH:MM" — null routes to the anytime lane
  durationMin: number;     // routineMin(r) for routines; 0 for tasks (markers)
  done: boolean;
  due?: boolean;           // task at/over its deadline → quiet badge, NOT a shame color
}

export function buildAgenda(
  day: string,                          // dateKey
  routines: Routine[],                  // already resolveRoutines(...)-filtered
  todos: Todo[],
  doneFor: (item: AgendaItem) => boolean
): { timed: AgendaItem[]; anytime: AgendaItem[] } {
  const dow = keyToDate(day).getDay();
  const timed: AgendaItem[] = [];
  const anytime: AgendaItem[] = [];

  // 1. Process Routines
  for (const r of routines) {
    if (r.createdAt && day < r.createdAt) continue;
    const days = r.days;
    const activeOnDay = !days || days.length === 0 || days.includes(dow);
    if (!activeOnDay) continue;

    const item: AgendaItem = {
      kind: 'routine',
      id: r.id,
      title: r.name,
      emoji: r.emoji,
      color: r.color,
      time: r.reminder || null,
      durationMin: routineMin(r),
      done: false,
    };
    item.done = doneFor(item);

    if (item.time) {
      timed.push(item);
    } else {
      anytime.push(item);
    }
  }

  // 2. Process Tasks
  for (const t of todos) {
    const isRepeating = !!t.repeat;
    const isDone = isRepeating ? t.doneDates.includes(day) : t.done;
    const time = t.reminderTime || t.repeat?.time || null;

    if (time) {
      let qualifies = false;
      if (isRepeating && t.repeat) {
        qualifies = occursOn(t.repeat, day);
      } else {
        if (!isDone) {
          qualifies = todoIsToday(t, day);
        } else {
          qualifies = t.reminderDate === day;
        }
      }

      if (qualifies) {
        const item: AgendaItem = {
          kind: 'task',
          id: t.id,
          title: t.title,
          emoji: '📝',
          color: 'accent',
          time,
          durationMin: 0,
          done: isDone,
        };
        timed.push(item);
      }
    } else {
      let qualifies = false;
      let isDue = false;

      if (t.deadline) {
        if (isRepeating && t.repeat) {
          qualifies = occursOn(t.repeat, day);
          isDue = !isDone && t.deadline <= day;
        } else {
          if (!isDone) {
            qualifies = t.deadline <= day;
            isDue = true;
          } else {
            qualifies = t.deadline === day;
            isDue = false;
          }
        }
      }

      if (qualifies) {
        const item: AgendaItem = {
          kind: 'task',
          id: t.id,
          title: t.title,
          emoji: '📝',
          color: 'accent',
          time: null,
          durationMin: 0,
          done: isDone,
          due: isDue,
        };
        anytime.push(item);
      }
    }
  }

  // Sort timed array ascending by time ("HH:MM")
  timed.sort((a, b) => a.time!.localeCompare(b.time!));

  return { timed, anytime };
}
