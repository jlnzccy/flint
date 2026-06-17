import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';

import { ChunkyButton, CircleBtn } from '@/components/chunky';
import { IconChevL } from '@/components/icons';
import { BottomSheet } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { Body, Display, Label } from '@/components/ui';
import { deserializeRoutine } from '@/lib/share';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/theme';
import { Routine } from '@/data/defaults';

const { width } = Dimensions.get('window');
const CRT_WIDTH = width - 32;
const CRT_HEIGHT = CRT_WIDTH * 1.15;
const TARGET_SIZE = CRT_WIDTH * 0.62;

export default function ScanScreen() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState<Omit<Routine, 'id'> | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(true);

  // Animations
  const scanLinePos = useSharedValue(0);
  const ledBlink = useSharedValue(1);
  const targetPulse = useSharedValue(1);
  
  useEffect(() => {
    scanLinePos.value = withRepeat(
      withTiming(TARGET_SIZE, {
        duration: 2200,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
    
    ledBlink.value = withRepeat(
      withTiming(0.2, { duration: 700 }),
      -1,
      true
    );

    targetPulse.value = withRepeat(
      withTiming(1.1, { duration: 1200 }),
      -1,
      true
    );
  }, []);

  const animatedScanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLinePos.value }],
  }));

  const animatedLedStyle = useAnimatedStyle(() => ({
    opacity: ledBlink.value,
  }));

  const animatedTargetStyle = useAnimatedStyle(() => ({
    transform: [{ scale: targetPulse.value }],
  }));

  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Body size={16} color={t.muted}>Loading console...</Body>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' }}>
        <View 
          style={{ 
            borderWidth: 2, 
            borderColor: t.accent.main, 
            borderRadius: 18, 
            padding: 24, 
            backgroundColor: t.surface,
            alignItems: 'center',
            width: '100%',
            maxWidth: 320
          }}
        >
          <Display size={22} style={{ marginBottom: 12, textAlign: 'center', color: t.text }}>CAMERA OFFLINE</Display>
          <Body size={13.5} color={t.muted} style={{ textAlign: 'center', marginBottom: 24, lineHeight: 18 }}>
            We need camera access to read routine tickets and sync them to your Flint storage.
          </Body>
          <ChunkyButton
            color={t.accent.main}
            deep={t.accent.deep}
            ink={t.accent.ink}
            fontSize={15}
            pad={[14, 20]}
            style={{ width: '100%' }}
            onPress={requestPermission}
          >
            Grant Permission
          </ChunkyButton>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16, padding: 4 }}>
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', color: t.muted, fontSize: 13.5, textTransform: 'uppercase' }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!isScanningActive) return;
    
    const decoded = deserializeRoutine(data);
    if (decoded) {
      setIsScanningActive(false);
      setScannedData(decoded);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;
      const uri = result.assets[0].uri;

      const scanned = await Camera.scanFromURLAsync(uri, ['qr']);
      if (scanned && scanned.length > 0) {
        const data = scanned[0].data;
        const decoded = deserializeRoutine(data);
        if (decoded) {
          setIsScanningActive(false);
          setScannedData(decoded);
        } else {
          toast('Invalid routine ticket');
        }
      } else {
        toast('No QR code found');
      }
    } catch (e) {
      toast('Failed to scan image');
    }
  };

  const handleImport = () => {
    if (!scannedData) return;

    const newId = 'c' + Date.now();
    const importedRoutine: Routine = {
      ...scannedData,
      id: newId,
    };

    useStore.getState().saveRoutine(importedRoutine);
    toast('Routine imported!');
    router.replace('/(tabs)');
  };

  const handleCloseImportSheet = () => {
    setScannedData(null);
    setTimeout(() => {
      setIsScanningActive(true);
    }, 1000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      
      {/* Header bar (Properly padded above status bar) */}
      <View 
        style={{ 
          paddingTop: insets.top + 14, 
          paddingBottom: 14, 
          paddingHorizontal: 20, 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: t.bg,
          borderBottomWidth: 2,
          borderColor: t.lineSoft
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CircleBtn size={40} onPress={() => router.back()} label="Back">
            <IconChevL color={t.text} />
          </CircleBtn>
          <Display size={20} style={{ color: t.text }}>Scan Ticket</Display>
        </View>
        <ChunkyButton
          ghost
          fontSize={13}
          pad={[8, 14]}
          onPress={handlePickImage}
        >
          Import
        </ChunkyButton>
      </View>

      {/* Main retro cabinet viewport */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ alignItems: 'center', paddingTop: 24, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* CRT Monitor Outer Bezel */}
        <View 
          style={{ 
            width: CRT_WIDTH, 
            height: CRT_HEIGHT, 
            backgroundColor: t.raised, 
            borderRadius: 24, 
            borderWidth: 4, 
            borderColor: t.line,
            padding: 10,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* CRT Monitor Screen Frame */}
          <View 
            style={{ 
              width: '100%', 
              height: '100%', 
              backgroundColor: '#000000', 
              borderRadius: 16, 
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: t.lineSoft
            }}
          >
            {isScanningActive && (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={handleBarcodeScanned}
              />
            )}

            {/* Viewfinder Target */}
            <View 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: TARGET_SIZE,
                height: TARGET_SIZE,
                marginLeft: -TARGET_SIZE / 2,
                marginTop: -TARGET_SIZE / 2,
                justifyContent: 'flex-start',
              }}
            >
              {/* Scan laser line */}
              <Animated.View
                style={[
                  {
                    height: 2,
                    backgroundColor: t.accent.main,
                    width: '100%',
                    shadowColor: t.accent.main,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.9,
                    shadowRadius: 6,
                  },
                  animatedScanLineStyle,
                ]}
              />

              {/* Viewfinder corners */}
              <Animated.View style={[{ width: '100%', height: '100%', position: 'absolute' }, animatedTargetStyle]}>
                <View style={[styles.corner, { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderColor: t.accent.main }]} />
                <View style={[styles.corner, { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderColor: t.accent.main }]} />
                <View style={[styles.corner, { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: t.accent.main }]} />
                <View style={[styles.corner, { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderColor: t.accent.main }]} />
              </Animated.View>
            </View>

            {/* Retro CRT Scanlines filter */}
            <View style={[StyleSheet.absoluteFill, { opacity: 0.08, backgroundColor: '#000000' }]} pointerEvents="none" />
          </View>
        </View>

        {/* Dashboard/LED Panel below CRT monitor */}
        <View 
          style={{ 
            width: CRT_WIDTH, 
            backgroundColor: t.surface, 
            borderWidth: 2, 
            borderColor: t.lineSoft, 
            borderRadius: 16, 
            padding: 16, 
            marginTop: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12
          }}
        >
          {/* LED blink indicator */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Animated.View 
              style={[
                { 
                  width: 8, 
                  height: 8, 
                  borderRadius: 4, 
                  backgroundColor: '#4ade80',
                  shadowColor: '#4ade80',
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 4,
                  shadowOpacity: 0.6
                }, 
                animatedLedStyle
              ]} 
            />
            <Text style={{ fontFamily: 'Nunito_900Black', fontSize: 10.5, color: t.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
              Ready
            </Text>
          </View>
          
          <View style={{ width: 2, height: 14, backgroundColor: t.lineSoft }} />
          
          <Body size={13} color={t.muted} style={{ flex: 1, fontFamily: 'BeVietnamPro_600SemiBold' }}>
            Position QR code inside the viewport brackets
          </Body>
        </View>

      </ScrollView>

      {/* Import Preview Sheet */}
      <BottomSheet
        open={scannedData !== null}
        onClose={handleCloseImportSheet}
        title={scannedData ? `${scannedData.emoji} ${scannedData.name}` : 'Import Routine'}
      >
        {scannedData && (
          <View style={{ gap: 14 }}>
            <Label>Steps to import</Label>
            <View style={{ gap: 8, maxHeight: 240 }}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {scannedData.steps.map((step, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      backgroundColor: t.surface,
                      borderWidth: 2,
                      borderColor: t.lineSoft,
                      borderRadius: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: t.raised,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: 'Nunito_900Black', fontSize: 13, color: t.faint }}>
                        {idx + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Body size={14} style={{ fontFamily: 'BeVietnamPro_600SemiBold' }}>
                        {step.t}
                      </Body>
                      {step.hint && <Body size={11} color={t.faint}>{step.hint}</Body>}
                    </View>
                    <Body size={12} color={t.muted}>{step.min}m</Body>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <ChunkyButton
                  ghost
                  fontSize={15}
                  pad={[14, 18]}
                  onPress={handleCloseImportSheet}
                >
                  Cancel
                </ChunkyButton>
              </View>
              <View style={{ flex: 1.5 }}>
                <ChunkyButton
                  color={t.col(scannedData.color).main}
                  deep={t.col(scannedData.color).deep}
                  ink={t.col(scannedData.color).ink}
                  fontSize={15}
                  pad={[14, 18]}
                  onPress={handleImport}
                >
                  Import Routine
                </ChunkyButton>
              </View>
            </View>
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
  },
});
