import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/chunky';
import { IconPlus } from '@/components/icons';
import { TodoRow } from '@/components/todo-row';
import { Body, Display, FlintInput, Label } from '@/components/ui';
import { parseTaskTime, todayKey } from '@/lib/dates';
import { nextOccurrence } from '@/lib/repeat';
import { Todo, todoIsToday, useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';

function Section({ title, items, showDate }: { title: string; items: Todo[]; showDate?: boolean }) {
  const t = useTheme();
  if (!items.length) return null;
  return (
    <>
      <Label style={{ marginTop: 22, marginBottom: 8 }}>{title}</Label>
      <View style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, paddingHorizontal: 14 }}>
        {items.map((todo, i) => (
          <View key={todo.id} style={{ borderTopWidth: i ? 2 : 0, borderColor: t.lineSoft }}>
            <TodoRow todo={todo} showDate={showDate} />
          </View>
        ))}
      </View>
    </>
  );
}

export default function Tasks() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const todos = useStore((s) => s.todos);
  const addTodo = useStore((s) => s.addTodo);

  const [text, setText] = useState('');

  const submit = () => {
    const v = text.trim();
    if (!v) return;
    const parsed = parseTaskTime(v);
    addTodo({
      title: parsed.text,
      details: '',
      reminderDate: parsed.time ? todayKey() : null,
      reminderTime: parsed.time,
      deadline: null,
      repeat: null,
      subtasks: [],
    });
    setText('');
  };

  const groups = useMemo(() => {
    const today = todayKey();
    const todayList: Todo[] = [];
    const scheduled: Todo[] = [];
    const anytime: Todo[] = [];
    const doneList: Todo[] = [];
    for (const td of todos) {
      if (!td.repeat && td.done) {
        doneList.push(td);
        continue;
      }
      if (todoIsToday(td, today)) {
        todayList.push(td);
        continue;
      }
      const next = td.repeat
        ? nextOccurrence(td.repeat, today)
        : td.reminderDate && td.reminderDate > today
          ? td.reminderDate
          : td.deadline && td.deadline > today
            ? td.deadline
            : null;
      if (next) scheduled.push(td);
      else if (td.repeat) doneList.push(td); // repeat that ended
      else anytime.push(td);
    }
    const key = (td: Todo) =>
      td.repeat ? nextOccurrence(td.repeat, today) || '9999' : td.reminderDate || td.deadline || '9999';
    scheduled.sort((a, b) => key(a).localeCompare(key(b)));
    return { todayList, scheduled, anytime, doneList };
  }, [todos]);

  const empty = !todos.length;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
        <Display size={30}>Tasks</Display>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 0, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <FlintInput
            style={{ flex: 1, paddingVertical: 9, paddingHorizontal: 13, fontSize: 15 }}
            placeholder='Quick add — "Meds @ 9am"'
            value={text}
            onChangeText={setText}
            onSubmitEditing={submit}
            maxLength={80}
            returnKeyType="done"
            submitBehavior="submit"
          />
          <ChunkyButton
            pad={[0, 14]}
            radius={12}
            onPress={text.trim() ? submit : () => router.push('/task')}
            faceStyle={{ height: 44 }}
            accessibilityLabel={text.trim() ? 'Add task' : 'New detailed task'}
          >
            <IconPlus color={t.accent.ink} />
          </ChunkyButton>
        </View>
        <Text
          onPress={() => router.push('/task')}
          style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.muted, marginTop: 10, paddingVertical: 2 }}
        >
          + Detailed task — reminder, deadline, repeat
        </Text>

        {empty ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 8 }}>
            <Text style={{ fontSize: 30 }}>📝</Text>
            <Body size={14} color={t.muted}>No tasks. Enjoy it.</Body>
          </View>
        ) : (
          <>
            <Section title="Today" items={groups.todayList} />
            <Section title="Scheduled" items={groups.scheduled} showDate />
            <Section title="Anytime" items={groups.anytime} />
            <Section title="Done" items={groups.doneList} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
