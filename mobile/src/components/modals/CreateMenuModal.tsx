import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMockAuth } from '@/context/MockAuthContext';
import { VerticalSeriesWizard } from '@/components/modals/VerticalSeriesWizard';
import { UnlockFeaturesModal, type CreatorVerificationContext } from '@/components/modals/UnlockFeaturesModal';
import { StreamerApplicationModal } from '@/components/modals/StreamerApplicationModal';
import { CreatorUploadSheet, type CreatorUploadKind } from '@/components/modals/CreatorUploadSheet';
import { mockUser } from '@/mocks';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type { ThemeColors } from '@/theme/tokens';
import { radius } from '@/theme/tokens';

const ITEMS = [
  { id: 'short', label: 'Short', description: 'Quick vertical clip', icon: 'videocam-outline' as const, uploadType: 'short' as const },
  { id: 'video', label: 'Long video', description: 'Standard upload', icon: 'play-circle-outline' as const, uploadType: 'video' as const },
  { id: 'podcast', label: 'Podcast episode', description: 'Audio or video episode', icon: 'headset-outline' as const, uploadType: 'podcast' as const },
  { id: 'vertical', label: 'Micro-drama series', description: 'Create series & episodes', icon: 'grid-outline' as const, requires: 'vertical' as const },
  { id: 'live', label: 'Go live', description: 'Stream with camera or OBS', icon: 'radio-outline' as const, requires: 'live' as const },
] as const;

type Props = {
  visible: boolean;
  onClose: () => void;
  highlight?: 'short' | 'video' | 'podcast';
  onOpenUpload?: (kind: CreatorUploadKind) => void;
  onOpenWizard?: () => void;
  onOpenUnlock?: (feature: 'vertical' | 'live' | 'store') => void;
};

export function CreateMenuModal({
  visible,
  onClose,
  highlight,
  onOpenUpload,
  onOpenWizard,
  onOpenUnlock,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { user, requireAuth } = useMockAuth();
  const profile = user ?? mockUser;
  const [wizardOpen, setWizardOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [streamerOpen, setStreamerOpen] = useState(false);
  const [uploadKind, setUploadKind] = useState<CreatorUploadKind | null>(null);
  const [unlockFeature, setUnlockFeature] = useState<'vertical' | 'live' | 'store'>('vertical');
  const [verifyContext, setVerifyContext] = useState<CreatorVerificationContext | null>(null);

  const canVertical = profile.verticalCreatorStatus === 'approved';
  const canLive = profile.streamerStatus === 'approved';

  const openUnlock = (feature: 'vertical' | 'live' | 'store') => {
    setUnlockFeature(feature);
    setUnlockOpen(true);
    onOpenUnlock?.(feature);
    onClose();
  };

  const handleItem = (item: (typeof ITEMS)[number]) => {
    requireAuth(() => {
      if ('requires' in item && item.requires === 'vertical') {
        if (!canVertical) {
          openUnlock('vertical');
          return;
        }
        setWizardOpen(true);
        onOpenWizard?.();
        onClose();
        return;
      }
      if ('requires' in item && item.requires === 'live') {
        if (!canLive) {
          openUnlock('live');
          return;
        }
        onClose();
        router.push('/go-live');
        return;
      }
      if ('uploadType' in item) {
        onClose();
        if (onOpenUpload) onOpenUpload(item.uploadType);
        else setUploadKind(item.uploadType);
      }
    });
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <Pressable style={[styles.overlay, { backgroundColor: colors.scrim }]} onPress={onClose}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Create</Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.foreground} />
              </Pressable>
            </View>
            <View style={styles.list}>
              {ITEMS.map((item) => {
                const locked =
                  ('requires' in item && item.requires === 'vertical' && !canVertical) ||
                  ('requires' in item && item.requires === 'live' && !canLive);
                const isHighlight = highlight && 'uploadType' in item && item.uploadType === highlight;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.row, isHighlight && styles.rowHighlight]}
                    onPress={() => handleItem(item)}
                  >
                    <View style={[styles.iconWrap, locked && styles.iconLocked]}>
                      <Ionicons name={item.icon} size={22} color={locked ? colors.mutedForeground : colors.primary} />
                    </View>
                    <View style={styles.copy}>
                      <View style={styles.labelRow}>
                        <Text style={styles.label}>{item.label}</Text>
                        {locked ? <Ionicons name="lock-closed" size={14} color={colors.mutedForeground} /> : null}
                      </View>
                      <Text style={styles.desc}>{item.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <VerticalSeriesWizard
        visible={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={() => router.push('/settings/verticals')}
      />
      <UnlockFeaturesModal
        visible={unlockOpen}
        user={profile}
        preselect={unlockFeature}
        onClose={() => setUnlockOpen(false)}
        onNeedVerification={(ctx) => {
          setVerifyContext(ctx);
          setUnlockOpen(false);
          setStreamerOpen(true);
        }}
      />
      <StreamerApplicationModal
        visible={streamerOpen}
        user={profile}
        onClose={() => {
          setStreamerOpen(false);
          setVerifyContext(null);
        }}
        features={
          verifyContext?.features.includes('live') && verifyContext?.features.includes('vertical')
            ? ['live', 'vertical']
            : verifyContext?.features.includes('vertical')
              ? ['vertical']
              : ['live', 'vertical']
        }
        initialDescription={verifyContext?.description}
      />
      {uploadKind && (
        <CreatorUploadSheet visible={!!uploadKind} kind={uploadKind} onClose={() => setUploadKind(null)} />
      )}
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      maxHeight: '75%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { color: colors.foreground, fontSize: 18, fontWeight: '700' },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    list: { padding: 12, gap: 4 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: radius.lg,
    },
    rowHighlight: { backgroundColor: colors.primary + '12', borderWidth: 1, borderColor: colors.primary + '44' },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconLocked: { backgroundColor: colors.muted },
    copy: { flex: 1 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    label: { color: colors.foreground, fontSize: 15, fontWeight: '600' },
    desc: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  });
}
