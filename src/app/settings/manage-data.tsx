import { File, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconChevL, IconRestart, IconShare } from '@/components/icons';
import { finishHaptic, tapHaptic, warnHaptic } from '@/lib/haptics';
import { applyBackup, backupFilename, serializeBackup } from '@/lib/backup';
import { useToast } from '@/components/toast';
import { Body, Display, Label } from '@/components/ui';
import { useTheme } from '@/theme/theme';
import { ChunkyButton, CircleBtn } from '@/components/chunky';
import { BottomSheet } from '@/components/sheet';

function Card({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderWidth: 2,
        borderColor: t.lineSoft,
        borderRadius: 18,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

export default function ManageDataScreen() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const exportData = async () => {
    if (busy) return;
    setBusy(true);
    try {
      tapHaptic();
      const json = serializeBackup();
      const file = new File(Paths.cache, backupFilename());
      if (file.exists) file.delete();
      file.create();
      file.write(json);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Flint data',
          UTI: 'public.json',
        });
      } else {
        toast('Sharing unavailable');
      }
    } catch (e) {
      console.error('[Export]', e);
      toast('Export failed');
    } finally {
      setBusy(false);
    }
  };

  const importData = async () => {
    if (busy) return;
    setBusy(true);
    try {
      tapHaptic();
      const res = await File.pickFileAsync({
        mimeTypes: ['application/json', 'application/octet-stream', 'text/plain'],
      });
      if (res.canceled || !res.result) return;
      const text = await res.result.text();
      const result = applyBackup(text);
      if (result.ok) {
        finishHaptic();
        setImportOpen(false);
        toast('Restored');
      } else {
        warnHaptic();
        toast('Invalid file');
      }
    } catch (e) {
      console.error('[Import]', e);
      toast('Import failed');
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
        <Display size={30}>Manage Data</Display>
        <Body size={14} color={t.faint} style={{ marginTop: 4 }}>
          Export or import backup files.
        </Body>

        <Label style={{ marginTop: 22, marginBottom: 8 }}>Backup &amp; Restore</Label>
        <Card>
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.green.soft, alignItems: 'center', justifyContent: 'center' }}>
                <IconShare size={20} color={t.green.main} />
              </View>
              <View style={{ flex: 1 }}>
                <Display size={16}>Export Backup</Display>
                <Body size={13} color={t.faint} style={{ marginTop: 2 }}>
                  Save all routines, tasks, and history to a JSON file.
                </Body>
              </View>
            </View>
            <ChunkyButton
              color={t.green.main}
              deep={t.green.deep}
              ink={t.green.ink}
              fontSize={14}
              pad={[11, 16]}
              disabled={busy}
              onPress={exportData}
              accessibilityLabel="Export backup"
            >
              Export data
            </ChunkyButton>
          </View>

          <View style={{ borderTopWidth: 2, borderColor: t.lineSoft, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.purple.soft, alignItems: 'center', justifyContent: 'center' }}>
                <IconRestart size={20} color={t.purple.main} />
              </View>
              <View style={{ flex: 1 }}>
                <Display size={16}>Import Backup</Display>
                <Body size={13} color={t.faint} style={{ marginTop: 2 }}>
                  Restore your workspace state from an exported file.
                </Body>
              </View>
            </View>
            <ChunkyButton
              ghost
              fontSize={14}
              pad={[11, 16]}
              disabled={busy}
              onPress={() => setImportOpen(true)}
              accessibilityLabel="Import backup"
            >
              Import data
            </ChunkyButton>
          </View>
        </Card>
      </ScrollView>

      {/* Import File Confirmation */}
      <BottomSheet open={importOpen} onClose={() => setImportOpen(false)} title="Import data" scroll={false}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          <Body size={14} color={t.text} style={{ lineHeight: 20, marginBottom: 12 }}>
            Importing replaces everything currently in the app with the contents of the file. Export first if you want to keep what you have.
          </Body>
          <ChunkyButton
            color={t.accent.main}
            deep={t.accent.deep}
            ink={t.accent.ink}
            fontSize={14}
            pad={[14, 18]}
            disabled={busy}
            onPress={importData}
          >
            Choose a file
          </ChunkyButton>
        </View>
      </BottomSheet>
    </View>
  );
}
