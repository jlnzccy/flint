import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ChunkyButton, ChunkyCard } from '@/components/chunky';
import { IconChevL, IconPlus } from '@/components/icons';
import { BottomSheet } from '@/components/sheet';
import { Body, Checkbox, Display, EmojiTile, Label } from '@/components/ui';
import { ROUTINE_TEMPLATES, RoutineTemplate, routineMin } from '@/data/defaults';
import { tapHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme/theme';

export function NewRoutineSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTheme();
  const router = useRouter();
  // null = template list; a template = its step-picker
  const [picked, setPicked] = useState<RoutineTemplate | null>(null);

  // reset to the list whenever the sheet reopens
  useEffect(() => {
    if (open) setPicked(null);
  }, [open]);

  const go = (href: Parameters<typeof router.push>[0]) => {
    onClose();
    router.push(href);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={picked ? 'Choose steps' : 'New routine'} scroll={false}>
      {picked ? (
        <StepPicker
          template={picked}
          onBack={() => setPicked(null)}
          onUse={(idxs) => go(`/editor?template=${picked.id}&pick=${idxs.join(',')}`)}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
          <ChunkyButton
            ghost
            fontSize={15}
            pad={[14, 18]}
            faceStyle={{ justifyContent: 'flex-start' }}
            onPress={() => go('/editor')}
          >
            <IconPlus size={16} color={t.text} />
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: t.text, textTransform: 'uppercase', letterSpacing: 0.7 }}>
              Blank routine
            </Text>
          </ChunkyButton>

          <Label style={{ marginTop: 22, marginBottom: 10 }}>Start from a template</Label>
          <View style={{ gap: 10 }}>
            {ROUTINE_TEMPLATES.map((tpl) => {
              const c = t.col(tpl.color);
              return (
                <ChunkyCard
                  key={tpl.id}
                  // Pomodoro skips the step-picker — steps are generated, edited via sliders (W2)
                  onPress={() => (tpl.pomodoro ? go(`/editor?template=${tpl.id}`) : setPicked(tpl))}
                  faceStyle={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 }}
                >
                  <EmojiTile emoji={tpl.emoji} size={44} radius={13} soft={c.soft} border={c.main} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Display size={15}>{tpl.name}</Display>
                    <Body size={12} color={t.faint}>{tpl.steps.length} steps · {routineMin(tpl)} min</Body>
                  </View>
                </ChunkyCard>
              );
            })}
          </View>
        </ScrollView>
      )}
    </BottomSheet>
  );
}

/* pick which suggested steps to keep before opening the editor (start empty, opt in) */
export function StepPicker({
  template, onBack, onUse,
}: { template: RoutineTemplate; onBack: () => void; onUse: (idxs: number[]) => void }) {
  const t = useTheme();
  const c = t.col(template.color);
  const [sel, setSel] = useState<Set<number>>(() => new Set<number>());

  const toggle = (i: number) => {
    tapHaptic();
    setSel((cur) => {
      const next = new Set(cur);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const idxs = useMemo(() => [...sel].sort((a, b) => a - b), [sel]);
  const mins = idxs.reduce((a, i) => a + template.steps[i].min, 0);

  return (
    <View>
      <Pressable
        onPressIn={() => tapHaptic()}
        onPress={onBack}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}
        hitSlop={8}
      >
        <IconChevL size={16} color={t.muted} />
        <Body size={13.5} color={t.muted}>Templates</Body>
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <EmojiTile emoji={template.emoji} size={44} radius={13} soft={c.soft} border={c.main} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Display size={16}>{template.name}</Display>
          <Body size={12} color={t.faint}>Tap the ones you want.</Body>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 8 }}>
        {template.steps.map((s, i) => {
          const on = sel.has(i);
          return (
            <Pressable
              key={i}
              onPress={() => toggle(i)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
                backgroundColor: t.surface, borderWidth: 2, borderRadius: 16,
                borderColor: on ? c.main : t.lineSoft, opacity: on ? 1 : 0.55,
              }}
            >
              <Checkbox on={on} onPress={() => toggle(i)} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Body size={14.5} color={t.text} style={{ fontFamily: 'BeVietnamPro_600SemiBold' }}>{s.t}</Body>
                {s.hint ? <Body size={12} color={t.faint} numberOfLines={1}>{s.hint}</Body> : null}
              </View>
              <Body size={12} color={t.muted}>{s.min}m</Body>
            </Pressable>
          );
        })}
      </ScrollView>

      <ChunkyButton
        color={c.main}
        deep={c.deep}
        ink={c.ink}
        fontSize={16}
        pad={[15, 24]}
        style={{ marginTop: 16 }}
        disabled={idxs.length === 0}
        onPress={() => onUse(idxs)}
      >
        {idxs.length ? `Use ${idxs.length} ${idxs.length === 1 ? 'step' : 'steps'} · ${mins} min` : 'Pick a step'}
      </ChunkyButton>
    </View>
  );
}
