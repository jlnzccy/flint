import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton, CircleBtn } from '@/components/chunky';
import { DatePicker } from '@/components/date-picker';
import { IconBell, IconFlag, IconPlus, IconRepeat, IconTrash, IconX } from '@/components/icons';
import { BottomSheet } from '@/components/sheet';
import { TimePicker } from '@/components/time-picker';
import { useToast } from '@/components/toast';
import { Body, Checkbox, Chip, Display, FlintInput, Label, Segmented, StepperBtn, Toggle, useTimeFmt } from '@/components/ui';
import { fmtKey, todayKey } from '@/lib/dates';
import { tapHaptic } from '@/lib/haptics';
import { Repeat, RepeatUnit } from '@/lib/repeat';
import { Subtask, useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';

const DOW1 = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function FieldRow({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub?: string; children?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 10,
        backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18,
      }}
    >
      {icon}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Display size={15}>{title}</Display>
        {sub ? <Body size={12} color={t.faint} style={{ marginTop: 2 }}>{sub}</Body> : null}
      </View>
      {children}
    </View>
  );
}

const DEFAULT_REPEAT: Repeat = {
  every: 1,
  unit: 'day',
  weekdays: [],
  time: null,
  start: todayKey(),
  end: { type: 'never' },
};

export default function TaskEditor() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const fmtT = useTimeFmt();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const existing = useMemo(() => (id ? useStore.getState().todos.find((x) => x.id === id) ?? null : null), [id]);
  const editing = !!existing;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [details, setDetails] = useState(existing?.details ?? '');
  const [reminderDate, setReminderDate] = useState<string | null>(existing?.reminderDate ?? null);
  const [reminderTime, setReminderTime] = useState<string | null>(existing?.reminderTime ?? null);
  const [deadline, setDeadline] = useState<string | null>(existing?.deadline ?? null);
  const [repeat, setRepeat] = useState<Repeat | null>(existing?.repeat ?? null);
  const [subtasks, setSubtasks] = useState<Subtask[]>(existing?.subtasks ?? []);
  const [newSub, setNewSub] = useState('');

  // which picker sheet is open
  const [sheet, setSheet] = useState<null | 'remDate' | 'remTime' | 'deadline' | 'repTime' | 'repStart' | 'repEndDate'>(null);
  const [draftTime, setDraftTime] = useState('09:00');

  const valid = title.trim().length > 0;

  const patchRepeat = (p: Partial<Repeat>) => setRepeat((r) => ({ ...(r ?? DEFAULT_REPEAT), ...p }));

  const save = () => {
    const data = {
      title: title.trim(),
      details: details.trim(),
      reminderDate,
      reminderTime,
      deadline,
      repeat,
      subtasks: subtasks.filter((s) => s.text.trim()),
    };
    if (existing) useStore.getState().updateTodo(existing.id, data);
    else useStore.getState().addTodo(data);
    toast('Saved');
    router.back();
  };

  const addSub = () => {
    const v = newSub.trim();
    if (!v) return;
    setSubtasks((s) => [...s, { id: 's' + Date.now(), text: v, done: false }]);
    setNewSub('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
        <CircleBtn size={44} onPress={() => router.back()} label="Close">
          <IconX color={t.text} />
        </CircleBtn>
        <Display size={18} style={{ flex: 1 }}>{editing ? 'Edit task' : 'New task'}</Display>
        {editing && (
          <CircleBtn
            size={44}
            label="Delete task"
            onPress={() => {
              useStore.getState().removeTodo(existing!.id);
              toast('Deleted');
              router.back();
            }}
          >
            <IconTrash size={18} color={t.muted} />
          </CircleBtn>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Label style={{ marginBottom: 8 }}>Task</Label>
        <FlintInput placeholder="What needs doing?" value={title} onChangeText={setTitle} maxLength={80} />
        <FlintInput
          placeholder="Add details"
          value={details}
          onChangeText={setDetails}
          maxLength={300}
          multiline
          style={{ marginTop: 10, minHeight: 64, textAlignVertical: 'top', fontSize: 14 }}
        />

        <Label style={{ marginTop: 22, marginBottom: 0 }}>When</Label>

        <FieldRow
          icon={<IconBell size={17} color={reminderDate ? t.accent.main : t.muted} />}
          title="Reminder"
          sub={reminderDate ? `${fmtKey(reminderDate)}${reminderTime ? ` · ${fmtT(reminderTime)}` : ''}` : 'No date'}
        >
          {reminderDate ? (
            <>
              <Chip
                onPress={() => {
                  setDraftTime(reminderTime || '09:00');
                  setSheet('remTime');
                }}
              >
                {reminderTime ? fmtT(reminderTime) : 'Time'}
              </Chip>
              <StepperBtn label="Clear reminder" onPress={() => { setReminderDate(null); setReminderTime(null); }}>
                <IconX size={14} color={t.faint} />
              </StepperBtn>
            </>
          ) : (
            <Chip onPress={() => setSheet('remDate')}>Pick date</Chip>
          )}
        </FieldRow>
        {reminderDate ? (
          <Pressable onPressIn={() => tapHaptic()} onPress={() => setSheet('remDate')} style={{ paddingTop: 6, paddingLeft: 14 }}>
            <Body size={13} color={t.faint}>Change date</Body>
          </Pressable>
        ) : null}

        <FieldRow
          icon={<IconFlag size={17} color={deadline ? t.gold.main : t.muted} />}
          title="Deadline"
          sub={deadline ? fmtKey(deadline) : 'None'}
        >
          {deadline ? (
            <StepperBtn label="Clear deadline" onPress={() => setDeadline(null)}>
              <IconX size={14} color={t.faint} />
            </StepperBtn>
          ) : null}
          <Chip onPress={() => setSheet('deadline')}>{deadline ? 'Change' : 'Pick date'}</Chip>
        </FieldRow>

        <FieldRow
          icon={<IconRepeat size={17} color={repeat ? t.accent.main : t.muted} />}
          title="Repeats"
        >
          <Toggle on={!!repeat} onChange={(v) => setRepeat(v ? { ...DEFAULT_REPEAT, start: todayKey() } : null)} />
        </FieldRow>

        {repeat && (
          <View style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, padding: 14, marginTop: 10, gap: 14 }}>
            {/* every N unit */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Body size={14} color={t.muted}>Every</Body>
              <StepperBtn label="Less" onPress={() => patchRepeat({ every: Math.max(1, repeat.every - 1) })}>−</StepperBtn>
              <Display size={16} style={{ width: 26, textAlign: 'center' }}>{repeat.every}</Display>
              <StepperBtn label="More" onPress={() => patchRepeat({ every: Math.min(99, repeat.every + 1) })}>+</StepperBtn>
            </View>
            <Segmented
              value={repeat.unit}
              onChange={(v: RepeatUnit) => patchRepeat({ unit: v })}
              options={[
                { value: 'day', label: repeat.every === 1 ? 'Day' : 'Days' },
                { value: 'week', label: repeat.every === 1 ? 'Week' : 'Weeks' },
                { value: 'month', label: repeat.every === 1 ? 'Month' : 'Months' },
                { value: 'year', label: repeat.every === 1 ? 'Year' : 'Years' },
              ]}
            />

            {/* weekday selector */}
            {repeat.unit === 'week' && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {DOW1.map((d, i) => {
                  const on = repeat.weekdays.includes(i);
                  return (
                    <Pressable
                      key={i}
                      onPressIn={() => tapHaptic()}
                      onPress={() =>
                        patchRepeat({
                          weekdays: on ? repeat.weekdays.filter((x) => x !== i) : [...repeat.weekdays, i],
                        })
                      }
                      style={{
                        flex: 1, aspectRatio: 1, borderRadius: 99,
                        backgroundColor: on ? t.accent.main : t.raised,
                        borderWidth: 2, borderColor: on ? t.accent.deep : t.lineSoft,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: on ? t.accent.ink : t.muted }}>{d}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* time + start */}
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Chip
                onPress={() => {
                  setDraftTime(repeat.time || '09:00');
                  setSheet('repTime');
                }}
              >
                {repeat.time ? `⏰ ${fmtT(repeat.time)}` : 'Set time'}
              </Chip>
              <Chip onPress={() => setSheet('repStart')}>{`Starts ${fmtKey(repeat.start)}`}</Chip>
            </View>

            {/* ends */}
            <View style={{ gap: 8 }}>
              <Label>Ends</Label>
              <Segmented
                value={repeat.end.type}
                onChange={(v: 'never' | 'on' | 'after') => {
                  if (v === 'never') patchRepeat({ end: { type: 'never' } });
                  else if (v === 'on') patchRepeat({ end: { type: 'on', date: repeat.end.date || repeat.start } });
                  else patchRepeat({ end: { type: 'after', count: repeat.end.count || 10 } });
                }}
                options={[
                  { value: 'never', label: 'Never' },
                  { value: 'on', label: 'On date' },
                  { value: 'after', label: 'After' },
                ]}
              />
              {repeat.end.type === 'on' && (
                <Chip onPress={() => setSheet('repEndDate')} style={{ alignSelf: 'flex-start' }}>
                  {fmtKey(repeat.end.date || repeat.start)}
                </Chip>
              )}
              {repeat.end.type === 'after' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <StepperBtn label="Fewer" onPress={() => patchRepeat({ end: { type: 'after', count: Math.max(1, (repeat.end.count || 10) - 1) } })}>−</StepperBtn>
                  <Display size={16} style={{ width: 30, textAlign: 'center' }}>{repeat.end.count || 10}</Display>
                  <StepperBtn label="More" onPress={() => patchRepeat({ end: { type: 'after', count: Math.min(999, (repeat.end.count || 10) + 1) } })}>+</StepperBtn>
                  <Body size={13} color={t.muted}>occurrences</Body>
                </View>
              )}
            </View>
          </View>
        )}

        <Label style={{ marginTop: 22, marginBottom: 8 }}>Subtasks</Label>
        {subtasks.length > 0 && (
          <View style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 8 }}>
            {subtasks.map((s, i) => (
              <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, borderTopWidth: i ? 2 : 0, borderColor: t.lineSoft }}>
                <Checkbox
                  on={s.done}
                  onPress={() => {
                    tapHaptic();
                    setSubtasks((xs) => xs.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)));
                  }}
                />
                <Body
                  size={14}
                  color={s.done ? t.faint : t.text}
                  style={{ flex: 1, textDecorationLine: s.done ? 'line-through' : 'none' }}
                >
                  {s.text}
                </Body>
                <StepperBtn label="Remove subtask" onPress={() => setSubtasks((xs) => xs.filter((x) => x.id !== s.id))}>
                  <IconX size={13} color={t.faint} />
                </StepperBtn>
              </View>
            ))}
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <FlintInput
            style={{ flex: 1, paddingVertical: 9, paddingHorizontal: 13, fontSize: 14 }}
            placeholder="Add subtask"
            value={newSub}
            onChangeText={setNewSub}
            onSubmitEditing={addSub}
            maxLength={60}
            returnKeyType="done"
            submitBehavior="submit"
          />
          <Pressable
            accessibilityLabel="Add subtask"
            onPressIn={() => newSub.trim() && tapHaptic()}
            onPress={addSub}
            disabled={!newSub.trim()}
            style={{
              alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 16, borderRadius: 14, borderWidth: 2,
              backgroundColor: newSub.trim() ? t.accent.main : t.raised,
              borderColor: newSub.trim() ? t.accent.deep : t.line,
            }}
          >
            <IconPlus size={16} color={newSub.trim() ? t.accent.ink : t.faint} />
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: newSub.trim() ? t.accent.ink : t.faint }}>Add</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 18 }}>
        <ChunkyButton fontSize={17} pad={[17, 24]} disabled={!valid} onPress={save}>
          {editing ? 'Save changes' : 'Save task'}
        </ChunkyButton>
      </View>

      {/* pickers */}
      <BottomSheet open={sheet === 'remDate'} onClose={() => setSheet(null)} title="Reminder date">
        <DatePicker
          value={reminderDate}
          onChange={(k) => {
            setReminderDate(k);
            setSheet(null);
          }}
        />
      </BottomSheet>
      <BottomSheet open={sheet === 'deadline'} onClose={() => setSheet(null)} title="Deadline">
        <DatePicker
          value={deadline}
          onChange={(k) => {
            setDeadline(k);
            setSheet(null);
          }}
        />
      </BottomSheet>
      <BottomSheet open={sheet === 'repStart'} onClose={() => setSheet(null)} title="Starting">
        <DatePicker
          value={repeat?.start ?? null}
          onChange={(k) => {
            patchRepeat({ start: k });
            setSheet(null);
          }}
        />
      </BottomSheet>
      <BottomSheet open={sheet === 'repEndDate'} onClose={() => setSheet(null)} title="Ends on">
        <DatePicker
          value={repeat?.end.date ?? null}
          onChange={(k) => {
            patchRepeat({ end: { type: 'on', date: k } });
            setSheet(null);
          }}
        />
      </BottomSheet>
      <BottomSheet open={sheet === 'remTime' || sheet === 'repTime'} onClose={() => setSheet(null)} title="Time">
        <TimePicker value={draftTime} onChange={setDraftTime} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
          <ChunkyButton
            ghost
            fontSize={15}
            pad={[13, 12]}
            style={{ flex: 1 }}
            onPress={() => {
              if (sheet === 'remTime') setReminderTime(null);
              else patchRepeat({ time: null });
              setSheet(null);
            }}
          >
            No time
          </ChunkyButton>
          <ChunkyButton
            fontSize={15}
            pad={[13, 20]}
            style={{ flex: 2 }}
            onPress={() => {
              if (sheet === 'remTime') setReminderTime(draftTime);
              else patchRepeat({ time: draftTime });
              setSheet(null);
            }}
          >
            {`Use ${fmtT(draftTime)}`}
          </ChunkyButton>
        </View>
      </BottomSheet>
    </View>
  );
}
