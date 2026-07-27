import React, { useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { buildShareLinks, type SharePlatform } from '@/lib/share-links';
import { buildShareUrl } from '@/lib/share-url';
import { trackShare } from '@/lib/api/analytics';
import { radius } from '@/theme/tokens';
import type { ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  url?: string;
  targetId?: string;
};

function shareIconName(id: SharePlatform): keyof typeof Ionicons.glyphMap {
  switch (id) {
    case 'whatsapp': return 'logo-whatsapp';
    case 'facebook': return 'logo-facebook';
    case 'twitter': return 'logo-twitter';
    case 'telegram': return 'paper-plane';
    case 'linkedin': return 'logo-linkedin';
    case 'email': return 'mail';
    case 'reddit': return 'logo-reddit';
    default: return 'share-social';
  }
}

export function ShareModal({ visible, onClose, title, url, targetId }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  const shareUrl = url ?? buildShareUrl('/');
  const links = buildShareLinks(shareUrl, title);

  const copyLink = async () => {
    try {
      if (targetId) {
        void trackShare(targetId, { platform: 'copy', title });
      }
      await Share.share({ message: `${title}\n${shareUrl}` });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* cancelled */
    }
  };

  const openLink = async (href: string, platform?: SharePlatform) => {
    try {
      if (targetId) {
        void trackShare(targetId, { platform, title });
      }
      await Linking.openURL(href);
      onClose();
    } catch {
      /* unavailable */
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Share</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.foreground} />
            </Pressable>
          </View>
          <Text style={styles.preview} numberOfLines={2}>{title}</Text>
          <Text style={styles.urlPreview} numberOfLines={2} selectable>
            {shareUrl}
          </Text>

          <View style={styles.grid}>
            {links.map((link) => (
              <Pressable key={link.id} style={styles.gridItem} onPress={() => openLink(link.href, link.id)}>
                <View style={[styles.iconCircle, { backgroundColor: link.color }]}>
                  <Ionicons name={shareIconName(link.id)} size={22} color="#fff" />
                </View>
                <Text style={styles.gridLabel}>{link.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.copyBtn} onPress={copyLink}>
            <Ionicons name={copied ? 'checkmark' : 'link'} size={20} color={copied ? colors.primary : colors.foreground} />
            <Text style={styles.copyText}>{copied ? 'Link copied!' : 'Copy link'}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    title: { color: colors.foreground, fontSize: 18, fontWeight: '800' },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    preview: { color: colors.mutedForeground, fontSize: 14, marginBottom: 8, lineHeight: 20 },
    urlPreview: { color: colors.primary, fontSize: 12, marginBottom: 20, lineHeight: 18 },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    gridItem: { width: '22%', alignItems: 'center', gap: 6 },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridLabel: { color: colors.mutedForeground, fontSize: 10, fontWeight: '600', textAlign: 'center' },
    copyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.secondary,
      borderRadius: radius.lg,
      paddingVertical: 14,
    },
    copyText: { color: colors.foreground, fontWeight: '600', fontSize: 15 },
  });
}
