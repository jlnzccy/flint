import React from 'react';
import { Text, View } from 'react-native';

import { ChunkyButton, ChunkyCard } from '@/components/chunky';
import { IconAlarm, IconArchive, IconBell, IconCheck, IconDrag, IconPencil, IconPlay, IconPlus, IconShare, IconTrash } from '@/components/icons';
import { BottomSheet } from '@/components/sheet';
import { Body, Chip, Display, EmojiTile, Label, useTimeFmt } from '@/components/ui';
import { Routine, routineMin } from '@/data/defaults';
import { addMins } from '@/lib/dates';
import { useTheme } from '@/theme/theme';

export function metaOf(r: Routine): string {
  return `${r.steps.length} steps · ${routineMin(r)} min`;
}

/* ── one routine row on Today ── */
interface RoutineCardProps {
  routine: Routine;
  done?: boolean;
  bumped?: boolean;
  remindersOn?: boolean;
  readonly?: boolean; // preview of another day — no "GO" call to action
  onPress: () => void;
  onLongPress: () => void;
}

export function RoutineCard({ routine, done, bumped, remindersOn, readonly, onPress, onLongPress }: RoutineCardProps) {
  const t = useTheme();
  const fmtT = useTimeFmt();
  const c = t.col(routine.color);
  return (
    <ChunkyCard
      onPress={onPress}
      onLongPress={onLongPress}
      backColor={done || bumped ? t.lineSoft : undefined}
      faceStyle={[
        done && { backgroundColor: t.raised, borderColor: t.lineSoft },
        bumped && { opacity: 0.5 },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }}>
        <EmojiTile emoji={routine.emoji} soft={c.soft} border={done || bumped ? t.lineSoft : c.main} dim={done || bumped} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Display size={16} style={{ color: done ? t.faint : t.text }}>{routine.name}</Display>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
            <Body size={12} color={t.faint}>
              {bumped ? 'tomorrow' : metaOf(routine)}
            </Body>
            {!done && !bumped && remindersOn && routine.reminder ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                {routine.alarm ? <IconAlarm size={13} color={t.faint} /> : <IconBell size={13} color={t.faint} />}
                {/* estimated window — start → start + total (N1) */}
                <Body size={12} color={t.faint}>{fmtT(routine.reminder)} – {fmtT(addMins(routine.reminder, routineMin(routine)))}</Body>
              </View>
            ) : null}
            {!done && !bumped && !routine.reminder ? (
              <Body size={12} color={t.faint}>· anytime</Body>
            ) : null}
          </View>
        </View>
        {done ? (
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.green.main, alignItems: 'center', justifyContent: 'center' }}>
            <IconCheck size={16} color={t.green.ink} />
          </View>
        ) : !bumped && !readonly ? (
          // bold-ring play circle with centered triangle (matches onboarding preview)
          <View
            style={{
              width: 32, height: 32, borderRadius: 16,
              borderWidth: 2.5, borderColor: c.main,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <IconPlay size={16} color={c.main} />
          </View>
        ) : null}
      </View>
    </ChunkyCard>
  );
}

/* ── numbered step row (shared look) ── */
export function StepRow({
  index, text, min, first, color, last,
}: { index: number; text: string; min?: number; first?: boolean; color?: { main: string; ink: string }; last?: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9,
        borderTopWidth: index === 0 ? 0 : 2, borderColor: t.lineSoft,
      }}
    >
      <View
        style={{
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: first && color ? color.main : t.surface,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 11, fontFamily: 'Nunito_800ExtraBold', color: first && color ? color.ink : t.faint }}>{index + 1}</Text>
      </View>
      <Body size={14} style={{ flex: 1 }}>{text}</Body>
      {min != null && <Body size={12} color={t.faint}>{min}m</Body>}
    </View>
  );
}

/* ── long-press preview / action sheet ── */
interface PreviewSheetProps {
  routine: Routine | null;
  done?: boolean;
  bumped?: boolean;
  onClose: () => void;
  onOpen: (r: Routine) => void;
  onStartOne: (r: Routine) => void;
  onMarkDone: (r: Routine) => void;
  onEdit: (r: Routine) => void;
  onDuplicate: (r: Routine) => void;
  onShare: (r: Routine) => void;
  onBump: (r: Routine) => void;
  onUnbump: (r: Routine) => void;
  onArchive: (r: Routine) => void;
  onDelete: (r: Routine) => void;
  onPreviewAlarm: (r: Routine) => void;
  onReorder?: () => void;
}

export function PreviewSheet({
  routine, done, bumped, onClose, onOpen, onStartOne, onMarkDone, onEdit, onDuplicate, onShare, onBump, onUnbump, onArchive, onDelete, onPreviewAlarm, onReorder,
}: PreviewSheetProps) {
  const t = useTheme();
  const fmtT = useTimeFmt();
  if (!routine) return null;
  const c = t.col(routine.color);
  const act = (fn: (r: Routine) => void) => () => {
    onClose();
    fn(routine);
  };
  return (
    <BottomSheet open={!!routine} onClose={onClose}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <EmojiTile emoji={routine.emoji} size={50} radius={15} soft={c.soft} border={c.main} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Display size={18}>{routine.name}</Display>
          <Body size={13} color={t.faint} style={{ marginTop: 2 }}>
            {metaOf(routine)}
            {routine.reminder ? ` · ${fmtT(routine.reminder)}` : ' · anytime'}
          </Body>
        </View>
      </View>

      <View style={{ backgroundColor: t.raised, borderWidth: 2, borderColor: t.lineSoft, borderRadius: 18, paddingVertical: 4, paddingHorizontal: 14, marginTop: 14, marginBottom: 16 }}>
        {routine.steps.map((s, i) => (
          <StepRow key={i} index={i} text={s.t} min={s.min} first={i === 0} color={c} />
        ))}
      </View>

      {!done && (
        <>
          <ChunkyButton color={c.main} deep={c.deep} ink={c.ink} fontSize={16} pad={[15, 24]} onPress={act(onOpen)}>
            Start
          </ChunkyButton>
          {routine.steps.length > 1 && (
            <ChunkyButton ghost fontSize={13} pad={[11, 18]} style={{ marginTop: 10 }} onPress={act(onStartOne)}>
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.text, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Just step one
              </Text>
              <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, color: t.faint }}>
                ~{routine.steps[0].min} min
              </Text>
            </ChunkyButton>
          )}
        </>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
        {!done && (
          <Chip onPress={act(onMarkDone)}>
            <IconCheck size={15} color={t.text} />
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.text }}>Mark done</Text>
          </Chip>
        )}
        <Chip onPress={act(onEdit)}>
          <IconPencil size={14} color={t.text} />
          <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.text }}>Edit</Text>
        </Chip>
        {onReorder && (
          <Chip onPress={act(onReorder)}>
            <IconDrag size={14} color={t.text} />
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.text }}>Reorder</Text>
          </Chip>
        )}
        <Chip onPress={act(onDuplicate)}>
          <IconPlus size={14} color={t.text} />
          <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.text }}>Duplicate</Text>
        </Chip>
        <Chip onPress={act(onShare)}>
          <IconShare size={14} color={t.text} />
          <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.text }}>Share</Text>
        </Chip>
        {routine.alarm && (
          <Chip onPress={act(onPreviewAlarm)}>
            <IconAlarm size={15} color={t.text} />
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.text }}>Alarm</Text>
          </Chip>
        )}
        {!done && !bumped && <Chip onPress={act(onBump)}>Not today</Chip>}
        {bumped && <Chip onPress={act(onUnbump)}>↺ Bring back</Chip>}
        <Chip onPress={act(onArchive)}>
          <IconArchive size={15} color={t.muted} />
          <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.muted }}>Archive</Text>
        </Chip>
        <Chip onPress={act(onDelete)}>
          <IconTrash size={15} color={t.muted} />
          <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: t.muted }}>Delete</Text>
        </Chip>
      </View>
    </BottomSheet>
  );
}
