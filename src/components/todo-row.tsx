import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { IconCheck, IconClock, IconFlag, IconRepeat } from '@/components/icons';
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

/* small inline subtask check (K1) — lighter than the row's main Checkbox */
function SubCheck({ on }: { on: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: 18, height: 18, borderRadius: 6,
        borderWidth: 2, borderColor: on ? t.green.deep : t.line,
        backgroundColor: on ? t.green.main : t.raised,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {on && <IconCheck size={11} color={t.green.ink} />}
    </View>
  );
}

/* one task row — used on Today and the Tasks tab */
export function TodoRow({ todo, showDate }: { todo: Todo; showDate?: boolean }) {
  const t = useTheme();
  const router = useRouter();
  const fmtT = useTimeFmt();
  const toggleTodo = useStore((s) => s.toggleTodo);
  const toggleSubtask = useStore((s) => s.toggleSubtask);
  const done = todoDoneOn(todo);
  const today = todayKey();
  const overdue = !done && !!todo.deadline && todo.deadline < today;
  const dueToday = !done && todo.deadline === today;

  const time = todo.repeat ? todo.repeat.time : todo.reminderTime;
  const dateLabel = showDate && todo.reminderDate ? fmtKey(todo.reminderDate) : null;

  return (
    <View style={{ paddingVertical: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 7 }}>
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
          {(todo.repeat || dateLabel) && (
            <Body size={11.5} color={t.faint} style={{ marginTop: 2 }}>
              {[dateLabel, todo.repeat ? describeRepeat(todo.repeat) : null].filter(Boolean).join(' · ')}
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

      {/* every subtask, checkable, inline (K1) — indented under the title */}
      {todo.subtasks.length > 0 && (
        <View style={{ paddingLeft: 37, paddingBottom: 5, gap: 2 }}>
          {todo.subtasks.map((sub) => (
            <Pressable
              key={sub.id}
              onPress={() => {
                if (!sub.done) doneHaptic();
                toggleSubtask(todo.id, sub.id);
              }}
              hitSlop={6}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 4 }}
            >
              <SubCheck on={sub.done} />
              <Body
                size={13.5}
                color={sub.done ? t.faint : t.muted}
                numberOfLines={1}
                style={{ flex: 1, textDecorationLine: sub.done ? 'line-through' : 'none' }}
              >
                {sub.text}
              </Body>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
