import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { IconClock, IconFlag, IconRepeat } from '@/components/icons';
import { Body, Checkbox, useTimeFmt } from '@/components/ui';
import { fmtKey, todayKey } from '@/lib/dates';
import { describeRepeat } from '@/lib/repeat';
import { doneHaptic, tapHaptic } from '@/lib/haptics';
import { Todo, todoDoneOn, useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';

function Badge({ icon, text, color, soft }: { icon: React.ReactNode; text: string; color: string; soft: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: soft, borderRadius: 99, paddingVertical: 2, paddingHorizontal: 7 }}>
      {icon}
      <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color }}>{text}</Text>
    </View>
  );
}

/* one task row — used on Today and the Tasks tab */
export function TodoRow({ todo, showDate }: { todo: Todo; showDate?: boolean }) {
  const t = useTheme();
  const router = useRouter();
  const fmtT = useTimeFmt();
  const toggleTodo = useStore((s) => s.toggleTodo);
  const done = todoDoneOn(todo);
  const today = todayKey();
  const overdue = !done && !!todo.deadline && todo.deadline < today;
  const dueToday = !done && todo.deadline === today;
  const subDone = todo.subtasks.filter((s) => s.done).length;

  const time = todo.repeat ? todo.repeat.time : todo.reminderTime;
  const dateLabel = showDate && todo.reminderDate ? fmtKey(todo.reminderDate) : null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11 }}>
      <Checkbox
        on={done}
        onPress={() => {
          if (!done) doneHaptic();
          toggleTodo(todo.id);
        }}
      />
      <Pressable style={{ flex: 1, minWidth: 0 }} onPressIn={() => tapHaptic()} onPress={() => router.push(`/task?id=${todo.id}`)}>
        <Body
          size={15}
          color={done ? t.faint : t.text}
          style={{ textDecorationLine: done ? 'line-through' : 'none' }}
        >
          {todo.title}
        </Body>
        {(todo.repeat || todo.subtasks.length > 0 || dateLabel) && (
          <Body size={11.5} color={t.faint} style={{ marginTop: 2 }}>
            {[
              dateLabel,
              todo.repeat ? describeRepeat(todo.repeat) : null,
              todo.subtasks.length ? `${subDone}/${todo.subtasks.length} subtasks` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Body>
        )}
      </Pressable>
      {(overdue || dueToday) && (
        <Badge
          icon={<IconFlag size={11} color={overdue ? t.accent.main : t.gold.main} />}
          text={overdue ? 'overdue' : 'today'}
          color={overdue ? t.accent.main : t.gold.main}
          soft={overdue ? t.accent.soft : t.gold.soft}
        />
      )}
      {!overdue && !dueToday && todo.deadline && !done ? (
        <Badge icon={<IconFlag size={11} color={t.muted} />} text={fmtKey(todo.deadline)} color={t.muted} soft={t.raised} />
      ) : null}
      {time && !done ? (
        <Badge icon={<IconClock size={11} color={t.accent.main} />} text={fmtT(time)} color={t.accent.main} soft={t.accent.soft} />
      ) : null}
      {todo.repeat && !time && !done ? <IconRepeat size={13} color={t.faint} /> : null}
    </View>
  );
}
