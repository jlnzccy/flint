import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconChevL, IconChevR } from '@/components/icons';
import { Body, Display, Label } from '@/components/ui';
import { useTheme } from '@/theme/theme';
import { CircleBtn, ChunkyButton } from '@/components/chunky';
import { BottomSheet } from '@/components/sheet';
import { useStore, Todo } from '@/state/store';
import { addDays, dateKey, todayKey } from '@/lib/dates';
import { tapHaptic, finishHaptic } from '@/lib/haptics';
import { useToast } from '@/components/toast';

function Row({ title, sub, children, top }: { title: string; sub?: string; children?: React.ReactNode; top?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderTopWidth: top ? 0 : 2, borderColor: t.lineSoft }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Display size={16}>{title}</Display>
        {sub ? <Body size={13} color={t.faint} style={{ marginTop: 3 }}>{sub}</Body> : null}
      </View>
      {children}
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <View style={{ backgroundColor: t.surface, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18 }}>{children}</View>;
}

export default function Labs() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [demoOpen, setDemoOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const generateDemoData = () => {
    if (busy) return;
    setBusy(true);
    try {
      tapHaptic();
      
      // 1. Reset everything to start clean
      useStore.getState().resetAll();

      // 2. Define rich, premium sample routines matching the Ember Arcade theme
      const demoRoutines = [
        {
          id: 'c-demo-morning',
          name: 'Morning Wakeup',
          emoji: '🌅',
          color: 'accent',
          reminder: '07:00',
          alarm: true,
          warn30: true,
          steps: [
            { t: 'Drink water', min: 1, hint: 'A full glass wakes you up.' },
            { t: 'Stretch body', min: 3, hint: 'Reach high, touch toes.' },
            { t: 'Brush teeth', min: 2 },
            { t: 'Journal goals', min: 5, hint: 'Terse bullet points only.' },
          ]
        },
        {
          id: 'c-demo-focus',
          name: 'Deep Focus',
          emoji: '🎯',
          color: 'teal',
          autoAdvance: true,
          warn30: true,
          steps: [
            { t: 'Clear workspace', min: 2 },
            { t: 'Write one main goal', min: 2, hint: 'Keep it to one sentence.' },
            { t: 'Focus block', min: 25, hint: 'Phone in another room.' },
            { t: 'Stretch break', min: 5 },
            { t: 'Focus block', min: 25 },
          ]
        },
        {
          id: 'c-demo-tidy',
          name: 'Quick Tidy',
          emoji: '🧹',
          color: 'green',
          steps: [
            { t: 'Collect clothes', min: 3 },
            { t: 'Wipe surfaces', min: 2 },
            { t: 'Take out trash', min: 2 },
          ]
        },
        {
          id: 'c-demo-evening',
          name: 'Evening Unwind',
          emoji: '🌙',
          color: 'purple',
          reminder: '21:30',
          alarm: true,
          steps: [
            { t: 'Phone to charger', min: 1, hint: 'Far from your bed.' },
            { t: 'Brush teeth', min: 2 },
            { t: 'Read book', min: 15, hint: 'Paperback, no screens.' },
            { t: 'Deep breathing', min: 3 },
          ]
        }
      ];

      // 3. Define sample tasks (todos)
      const demoTodos: Todo[] = [
        {
          id: 'todo-1',
          title: 'Buy groceries',
          details: 'Milk, eggs, apples, whole bread',
          reminderDate: null,
          reminderTime: null,
          deadline: null,
          repeat: null,
          subtasks: [
            { id: 'sub-1', text: 'Milk', done: false },
            { id: 'sub-2', text: 'Eggs', done: false },
            { id: 'sub-3', text: 'Apples', done: false }
          ],
          done: false,
          doneDates: [] as string[],
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'todo-2',
          title: 'Schedule dentist appointment',
          details: 'Dr. Smith - 555-0192',
          reminderDate: null,
          reminderTime: null,
          deadline: null,
          repeat: null,
          subtasks: [],
          done: true,
          doneDates: [] as string[],
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'todo-3',
          title: 'Water the plants',
          details: 'Fern in living room, succulent in bedroom',
          reminderDate: null,
          reminderTime: null,
          deadline: null,
          repeat: {
            every: 1,
            unit: 'week',
            weekdays: [6],
            time: null,
            start: dateKey(addDays(new Date(), -30)),
            end: { type: 'never' }
          },
          subtasks: [],
          done: false,
          doneDates: [
            dateKey(addDays(new Date(), -7)),
            dateKey(addDays(new Date(), -14))
          ] as string[],
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'todo-4',
          title: 'Read 10 pages',
          details: 'Current book: Atomic Habits',
          reminderDate: null,
          reminderTime: null,
          deadline: null,
          repeat: {
            every: 1,
            unit: 'day',
            weekdays: [],
            time: null,
            start: dateKey(addDays(new Date(), -30)),
            end: { type: 'never' }
          },
          subtasks: [],
          done: false,
          doneDates: Array.from({ length: 30 }, (_, i) => {
            const d = addDays(new Date(), -i - 1);
            return Math.random() < 0.6 ? dateKey(d) : null;
          }).filter(Boolean) as string[],
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      // 4. Generate random completion history for past 60 days
      const history: Record<string, string[]> = {};
      const appDays: Record<string, 1> = {};
      const today = new Date();

      for (let i = 60; i >= 0; i--) {
        const d = addDays(today, -i);
        const k = dateKey(d);
        
        // 20% rest day (no app open, no completed routines)
        // 80% active day
        const active = Math.random() > 0.2;
        if (active) {
          appDays[k] = 1;
          
          // Complete random routines:
          // 30% -> 0 completed
          // 40% -> 1 completed
          // 25% -> 2 completed
          // 5% -> 3 completed
          const r = Math.random();
          let count = 0;
          if (r < 0.3) count = 0;
          else if (r < 0.7) count = 1;
          else if (r < 0.95) count = 2;
          else count = 3;

          if (count > 0) {
            const shuffled = [...demoRoutines].sort(() => 0.5 - Math.random());
            history[k] = shuffled.slice(0, count).map(x => x.id);
          }
        }
      }

      // Today's doneMap: let's mark morning wakeup done so today has immediate visual progress
      const doneMap: Record<string, boolean> = {
        'c-demo-morning': true
      };
      
      const todayK = todayKey();
      if (!history[todayK]) history[todayK] = [];
      if (!history[todayK].includes('c-demo-morning')) {
        history[todayK].push('c-demo-morning');
      }
      appDays[todayK] = 1;

      // 5. Update the store
      useStore.setState({
        custom: demoRoutines,
        order: demoRoutines.map(r => r.id),
        todos: demoTodos,
        history,
        appDays,
        doneMap,
        onboarded: true, // Bypass onboarding
        lastDay: todayK,
      });

      finishHaptic();
      setDemoOpen(false);
      toast('Demo data loaded');
    } catch (e) {
      console.error('[Demo Data]', e);
      toast('Failed to load demo');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 2 }}>
        <CircleBtn size={44} onPress={() => router.back()} label="Back">
          <IconChevL color={t.text} />
        </CircleBtn>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
        <Display size={30}>Experimental Labs</Display>
        <Body size={14} color={t.faint} style={{ marginTop: 4 }}>
          Try out experimental features and sensory helpers.
        </Body>

        <Label style={{ marginTop: 20, marginBottom: 8 }}>Sensory Labs</Label>
        <Card>
          <Pressable onPress={() => router.push('/sounds' as never)}>
            <Row title="Sounds" sub="Brainwave tones to settle in or lock on" top>
              <IconChevR size={18} color={t.faint} />
            </Row>
          </Pressable>
        </Card>

        <Label style={{ marginTop: 22, marginBottom: 8 }}>Theming Labs</Label>
        <Card>
          <Pressable onPress={() => router.push('/settings/theme-labs' as never)}>
            <Row title="Dynamic Theming" sub="Wallpaper matching and Material M3 profiles" top>
              <IconChevR size={18} color={t.faint} />
            </Row>
          </Pressable>
        </Card>

        <Label style={{ marginTop: 22, marginBottom: 8 }}>Data Labs</Label>
        <Card>
          <Pressable onPress={() => setDemoOpen(true)}>
            <Row title="Generate Demo Data" sub="Seed 60 days of random history & sample routines" top>
              <IconChevR size={18} color={t.faint} />
            </Row>
          </Pressable>
        </Card>
      </ScrollView>

      {/* Demo Data Confirmation */}
      <BottomSheet open={demoOpen} onClose={() => setDemoOpen(false)} title="Load demo data" scroll={false}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          <Body size={14} color={t.text} style={{ lineHeight: 20, marginBottom: 12 }}>
            This will replace all your current routines, tasks, and history with a sample 60-day dataset. Export first if you want to keep your current data.
          </Body>
          <ChunkyButton
            color={t.accent.main}
            deep={t.accent.deep}
            ink={t.accent.ink}
            fontSize={14}
            pad={[14, 18]}
            disabled={busy}
            onPress={generateDemoData}
          >
            Yes, generate demo data
          </ChunkyButton>
        </View>
      </BottomSheet>
    </View>
  );
}
