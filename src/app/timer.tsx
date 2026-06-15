import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton, CircleBtn } from '@/components/chunky';
import { IconPause, IconPlay, IconRestart, IconX } from '@/components/icons';
import { TimerRing } from '@/components/timer-ring';
import { Body, Display } from '@/components/ui';
import { fmtSec } from '@/lib/dates';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';

function KeepAwake() {
  useKeepAwake();
  return null;
}

/* body-double timer: no routine, no record, no history. pure ignition. */
export default function Timer() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const keepOn = useStore((s) => s.settings.keepOn);

  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      {keepOn && <KeepAwake />}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
        <CircleBtn size={44} onPress={() => router.back()} label="Exit">
          <IconX color={t.text} />
        </CircleBtn>
        <Display size={16} style={{ color: t.muted, flex: 1 }}>Timer</Display>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center' }}>
          <Display size={26} style={{ textAlign: 'center' }}>Just start something</Display>
          <Body size={14} color={t.muted} style={{ marginTop: 8, textAlign: 'center' }}>
            No routine. No record. Just company.
          </Body>
        </View>

        <TimerRing progress={(elapsed % 60) / 60} color={t.accent.main} size={208} pulsing={!paused}>
          <Display size={46}>{fmtSec(elapsed)}</Display>
        </TimerRing>

        <ChunkyButton
          ghost
          fontSize={13}
          pad={[10, 16]}
          onPress={() => {
            setElapsed(0);
            setPaused(false);
          }}
        >
          <IconRestart color={t.text} />
        </ChunkyButton>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 18, flexDirection: 'row', gap: 14 }}>
        <CircleBtn onPress={() => setPaused((p) => !p)} label={paused ? 'Resume' : 'Pause'}>
          {paused ? <IconPlay color={t.text} /> : <IconPause color={t.text} />}
        </CircleBtn>
        <ChunkyButton
          color={t.accent.main}
          deep={t.accent.deep}
          ink={t.accent.ink}
          fontSize={18}
          pad={[17, 24]}
          style={{ flex: 1 }}
          onPress={() => router.back()}
        >
          Done
        </ChunkyButton>
      </View>
    </View>
  );
}
