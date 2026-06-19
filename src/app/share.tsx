import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Path } from 'react-native-svg';

import { ChunkyButton, CircleBtn } from '@/components/chunky';
import { IconChevL } from '@/components/icons';
import { useToast } from '@/components/toast';
import { Body, Display } from '@/components/ui';
import { routineMin } from '@/data/defaults';
import { serializeRoutine } from '@/lib/share';
import { resolveRoutines, useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';
import { tapHaptic } from '@/lib/haptics';

const { width } = Dimensions.get('window');
const TICKET_WIDTH = Math.min(width - 40, 360);

function StarIcon({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192z" fill={color} />
    </Svg>
  );
}

function Barcode({ color, serial, style }: { color: string; serial: string; style?: any }) {
  const pattern = [2, 1, 4, 1.5, 2, 1, 3, 1, 2, 4, 1.5, 2, 1, 3, 2, 1, 4, 1.5, 2, 1, 3, 1, 2, 4, 1.5, 2, 1, 3, 2, 1, 4, 1.5, 2];
  return (
    <View style={[{ alignItems: 'center', gap: 4 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 24, opacity: 0.8, gap: 1.5 }}>
        {pattern.map((w, i) => (
          <View key={i} style={{ width: w, height: '100%', backgroundColor: color }} />
        ))}
      </View>
      <Text style={{ fontFamily: 'Nunito_900Black', fontSize: 10, color, letterSpacing: 1 }}>
        {serial}
      </Text>
    </View>
  );
}

// Serrated edge SVG for the retro arcade ticket look
function SerratedBorder({ color, position }: { color: string; position: 'top' | 'bottom' }) {
  const steps = 14;
  const stepWidth = TICKET_WIDTH / steps;
  let d = `M 0 ${position === 'top' ? 10 : 0} `;
  
  for (let i = 0; i < steps; i++) {
    const x1 = i * stepWidth + stepWidth / 2;
    const x2 = (i + 1) * stepWidth;
    if (position === 'top') {
      d += `L ${x1} 0 L ${x2} 10 `;
    } else {
      d += `L ${x1} 10 L ${x2} 0 `;
    }
  }
  d += `L ${TICKET_WIDTH} ${position === 'top' ? 10 : 0} L ${TICKET_WIDTH} ${position === 'top' ? 10 : 0} L 0 ${position === 'top' ? 10 : 0} Z`;

  return (
    <View style={{ height: 10, width: '100%', overflow: 'hidden' }}>
      <Svg width={TICKET_WIDTH} height="10" viewBox={`0 0 ${TICKET_WIDTH} 10`}>
        <Path d={d} fill={color} />
      </Svg>
    </View>
  );
}

const fmtStepTime = (min: number, sec?: number) => {
  if (!sec) return `${min}m`;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
};

export default function ShareScreen() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewShotRef = useRef<any>(null);
  const [flipped, setFlipped] = useState(false);

  const custom = useStore((s) => s.custom);
  const overrides = useStore((s) => s.overrides);
  const order = useStore((s) => s.order);

  const routine = useMemo(
    () => resolveRoutines({ custom, overrides, order, archived: [], deleted: [] }).find((r) => r.id === id),
    [custom, overrides, order, id]
  );

  const qrPayload = useMemo(() => {
    return routine ? serializeRoutine(routine) : '';
  }, [routine]);

  if (!routine) {
    router.back();
    return null;
  }

  const c = t.col(routine.color);
  const totalMin = routineMin(routine);

  const handleShareImage = async () => {
    if (!viewShotRef.current) return;
    try {
      const uri = await viewShotRef.current.capture();
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Share ${routine.name} Routine`,
          UTI: 'public.png',
        });
      } else {
        toast('Sharing unavailable');
      }
    } catch (error) {
      toast('Failed to share');
    }
  };

  const handleSaveToDevice = async () => {
    if (!viewShotRef.current) return;
    try {
      const uri = await viewShotRef.current.capture();
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status === 'granted') {
        await MediaLibrary.createAssetAsync(uri);
        toast('Saved to gallery');
      } else {
        toast('Permission denied');
      }
    } catch (error) {
      toast('Failed to save');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      {/* Header bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
        <CircleBtn size={40} onPress={() => router.back()} label="Back">
          <IconChevL color={t.text} />
        </CircleBtn>
        <Display size={20} style={{ color: t.text }}>Routine Ticket</Display>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 30, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {/* ViewShot encapsulates the entire ticket stub card */}
        <ViewShot 
          ref={viewShotRef} 
          options={{ format: 'png', quality: 0.95 }}
          style={{ backgroundColor: t.bg, padding: 12, width: TICKET_WIDTH + 24, alignItems: 'center' }}
        >
          {/* Main Ticket Stub Card Wrapper wrapped in Pressable to toggle flip */}
          <Pressable 
            onPressIn={() => tapHaptic()} 
            onPress={() => setFlipped((f) => !f)} 
            style={{ width: TICKET_WIDTH, position: 'relative' }}
          >
            <View 
              style={{ 
                width: TICKET_WIDTH, 
                backgroundColor: t.surface, 
                borderWidth: 3, 
                borderColor: c.main, 
                borderRadius: 24, 
                overflow: 'hidden',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 4
              }}
            >
              {/* Top Serrated Edge */}
              <SerratedBorder color={t.bg} position="top" />

              <View style={{ padding: 20, alignItems: 'center', position: 'relative' }}>
                
                {/* Dotted margin stripes for admission style */}
                <View style={{ position: 'absolute', left: 10, top: 20, bottom: 20, width: 1, borderWidth: 1, borderColor: c.main, borderStyle: 'dashed', opacity: 0.25 }} />
                <View style={{ position: 'absolute', right: 10, top: 20, bottom: 20, width: 1, borderWidth: 1, borderColor: c.main, borderStyle: 'dashed', opacity: 0.25 }} />

                {/* Stars decoration */}
                <View style={{ position: 'absolute', left: 24, top: 24 }}>
                  <StarIcon color={c.main} size={13} />
                </View>
                <View style={{ position: 'absolute', right: 24, top: 24 }}>
                  <StarIcon color={c.main} size={13} />
                </View>

                {!flipped ? (
                  <>
                    {/* Styled Header Badge */}
                    <View 
                      style={{ 
                        borderWidth: 2, 
                        borderColor: c.main, 
                        borderRadius: 6, 
                        paddingVertical: 3, 
                        paddingHorizontal: 10, 
                        backgroundColor: c.soft, 
                        marginBottom: 14 
                      }}
                    >
                      <Text style={{ fontFamily: 'Nunito_900Black', fontSize: 10, color: c.main, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                        Flint Ticket
                      </Text>
                    </View>

                    {/* Routine Emoji & Name Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', paddingHorizontal: 4 }}>
                      <View 
                        style={{ 
                          width: 50, 
                          height: 50, 
                          borderRadius: 14, 
                          backgroundColor: c.soft, 
                          borderWidth: 2, 
                          borderColor: c.main, 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}
                      >
                        <Text style={{ fontSize: 28 }}>{routine.emoji}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Display size={18} style={{ color: t.text }} numberOfLines={1}>
                          {routine.name}
                        </Display>
                        <Body size={12} color={t.muted}>
                          {routine.steps.length} steps · {totalMin}m duration
                        </Body>
                      </View>
                    </View>

                    {/* Ticket stub perforations (Left & Right Cutouts) + Dashed divider */}
                    <View style={{ width: '100%', height: 20, justifyContent: 'center', marginVertical: 14, position: 'relative' }}>
                      <View style={{ borderStyle: 'dashed', borderWidth: 1, borderColor: t.line, borderRadius: 1, width: '100%', height: 0 }} />
                      <View style={{ position: 'absolute', left: -32, width: 22, height: 22, borderRadius: 11, backgroundColor: t.bg, borderWidth: 3, borderColor: c.main }} />
                      <View style={{ position: 'absolute', right: -32, width: 22, height: 22, borderRadius: 11, backgroundColor: t.bg, borderWidth: 3, borderColor: c.main }} />
                    </View>

                    {/* Routine checklist steps printout */}
                    <View style={{ width: '100%', paddingHorizontal: 4, gap: 8, marginBottom: 16 }}>
                      <Text style={{ fontFamily: 'Nunito_900Black', fontSize: 10, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
                        Routine Steps
                      </Text>
                      {routine.steps.slice(0, 4).map((step, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={{ width: 14, height: 14, borderWidth: 2, borderColor: c.main, borderRadius: 3, backgroundColor: t.raised }} />
                          <Body size={13.5} style={{ flex: 1, fontFamily: 'BeVietnamPro_600SemiBold', color: t.text }} numberOfLines={1}>
                            {step.t}
                          </Body>
                          <Body size={12} color={t.muted}>{fmtStepTime(step.min, step.sec)}</Body>
                        </View>
                      ))}
                      {routine.steps.length > 4 && (
                        <Body size={12} color={t.faint} style={{ marginLeft: 24, fontStyle: 'italic' }}>
                          + {routine.steps.length - 4} more steps...
                        </Body>
                      )}
                    </View>

                    {/* QR Code Container */}
                    <View 
                      style={{ 
                        padding: 12, 
                        backgroundColor: '#ffffff', 
                        borderRadius: 16, 
                        borderWidth: 3, 
                        borderColor: c.main,
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 6,
                        elevation: 3,
                        marginVertical: 4,
                      }}
                    >
                      <QRCode
                        value={qrPayload}
                        size={160}
                        backgroundColor="#ffffff"
                        color="#000000"
                      />
                    </View>
                  </>
                ) : (
                  <>
                    {/* Back Side */}
                    <View 
                      style={{ 
                        borderWidth: 2, 
                        borderColor: c.main, 
                        borderRadius: 6, 
                        paddingVertical: 3, 
                        paddingHorizontal: 10, 
                        backgroundColor: c.soft, 
                        marginBottom: 14 
                      }}
                    >
                      <Text style={{ fontFamily: 'Nunito_900Black', fontSize: 10, color: c.main, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                        Admission Back
                      </Text>
                    </View>

                    {/* Complete Steps List */}
                    <View style={{ width: '100%', paddingHorizontal: 4, gap: 8, marginBottom: 16 }}>
                      <Text style={{ fontFamily: 'Nunito_900Black', fontSize: 10, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                        Complete Steps ({routine.steps.length})
                      </Text>
                      {routine.steps.map((step, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 }}>
                          <View style={{ width: 14, height: 14, borderWidth: 2, borderColor: c.main, borderRadius: 3, backgroundColor: t.raised }} />
                          <Body size={13.5} style={{ flex: 1, fontFamily: 'BeVietnamPro_600SemiBold', color: t.text }} numberOfLines={1}>
                            {idx + 1}. {step.t}
                          </Body>
                          <Body size={12} color={t.muted}>{fmtStepTime(step.min, step.sec)}</Body>
                        </View>
                      ))}
                    </View>

                    {/* Stamp or Arcade decoration */}
                    <View 
                      style={{ 
                        marginVertical: 12, 
                        borderWidth: 3, 
                        borderColor: c.main, 
                        borderStyle: 'dashed', 
                        borderRadius: 12, 
                        paddingVertical: 8, 
                        paddingHorizontal: 20,
                        transform: [{ rotate: '-4deg' }],
                        opacity: 0.8
                      }}
                    >
                      <Text style={{ fontFamily: 'Nunito_900Black', fontSize: 14, color: c.main, textTransform: 'uppercase', letterSpacing: 2 }}>
                        ★ ADMIT ONE ★
                      </Text>
                    </View>
                  </>
                )}

                {/* Barcode & serial at bottom */}
                <Barcode 
                  color={t.muted} 
                  serial={`№ ${routine.steps.length}${totalMin}-${routine.color.slice(0, 3).toUpperCase()}`}
                  style={{ marginTop: 16 }}
                />

                <Body size={11} color={t.faint} style={{ textAlign: 'center', marginTop: 14, fontFamily: 'BeVietnamPro_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {flipped ? 'TAP TICKET TO FLIP FRONT' : 'Sync in Flint app'}
                </Body>

              </View>

              {/* Bottom Serrated Edge */}
              <SerratedBorder color={t.bg} position="bottom" />
            </View>
          </Pressable>
        </ViewShot>

        {/* Flip Assist Visual Label */}
        <Body size={12} color={t.faint} style={{ textAlign: 'center', marginTop: 4 }}>
          Tap to flip 🔄
        </Body>

        {/* Action Buttons (Properly aligned with TICKET_WIDTH) */}
        <View style={{ width: TICKET_WIDTH, marginTop: 14, gap: 12 }}>
          <ChunkyButton
            color={c.main}
            deep={c.deep}
            ink={c.ink}
            fontSize={16}
            pad={[16, 24]}
            onPress={handleShareImage}
          >
            Share Ticket Image
          </ChunkyButton>

          <ChunkyButton
            ghost
            fontSize={16}
            pad={[16, 24]}
            onPress={handleSaveToDevice}
          >
            Save to Device
          </ChunkyButton>
        </View>
      </ScrollView>
    </View>
  );
}
