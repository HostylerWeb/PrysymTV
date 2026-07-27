import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StreamerApplicationModal } from '@/components/modals/StreamerApplicationModal';
import { useMockAuth } from '@/context/MockAuthContext';
import { fetchPublicConfig } from '@/lib/api/public-config';
import { fetchVideoCategories, type ContentCategory } from '@/lib/api/categories';
import { fetchStreamIngestHealth, initStream, type StreamIngestHealth } from '@/lib/api/streams';
import { colors, radius } from '@/theme/tokens';

type StreamMode = 'camera' | 'obs';
type AccessType = 'free' | 'paid';

export default function GoLiveScreen() {
  const { user } = useMockAuth();
  const router = useRouter();
  const [applyOpen, setApplyOpen] = useState(false);
  const [mode, setMode] = useState<StreamMode>('camera');
  const [accessType, setAccessType] = useState<AccessType>('free');
  const [entryPriceUsd, setEntryPriceUsd] = useState('');
  const [minPaidStreamUsd, setMinPaidStreamUsd] = useState(5);
  const [title, setTitle] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<ContentCategory[]>([]);
  const [category, setCategory] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [streamId, setStreamId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ingestHealth, setIngestHealth] = useState<StreamIngestHealth | null>(null);
  const approved = user?.streamerStatus === 'approved';

  useEffect(() => {
    void fetchPublicConfig()
      .then((cfg) => {
        if (cfg.live?.minPaidStreamUsd != null) {
          setMinPaidStreamUsd(cfg.live.minPaidStreamUsd);
        }
      })
      .catch(() => {});
    void fetchVideoCategories()
      .then((res) => {
        if (res.items.length > 0) {
          setCategoryOptions(res.items);
          setCategory((prev) =>
            res.items.some((item) => item.label === prev) ? prev : res.items[0].label,
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode !== 'obs') {
      setIngestHealth(null);
      return;
    }
    let cancelled = false;
    void fetchStreamIngestHealth()
      .then((h) => {
        if (!cancelled) setIngestHealth(h);
      })
      .catch(() => {
        if (!cancelled) {
          setIngestHealth({
            rtmpUrl: '',
            hlsPublicUrl: '',
            rtmpReachable: false,
            mediamtxRequired: true,
            hint: 'Could not check RTMP ingest. Ensure MediaMTX is running.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const validatePaidPrice = () => {
    if (accessType !== 'paid') return true;
    const price = parseFloat(entryPriceUsd);
    if (!Number.isFinite(price) || price < minPaidStreamUsd) {
      Alert.alert(
        'Price required',
        `Enter a price of at least $${minPaidStreamUsd.toFixed(2)} for paid streams.`,
      );
      return false;
    }
    return true;
  };

  const buildInitBody = () => ({
    title: title.trim(),
    category: category.trim() || undefined,
    ...(accessType === 'paid'
      ? { accessType: 'paid' as const, entryPriceUsd: parseFloat(entryPriceUsd) }
      : { accessType: 'free' as const }),
  });

  const openStudio = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Enter a stream title before opening Live Studio.');
      return;
    }
    if (!validatePaidPrice()) return;
    if (streamId && mode === 'camera') {
      router.push(`/live/${streamId}?studio=camera` as never);
      return;
    }
    if (streamId && mode === 'obs') {
      router.push(`/live/${streamId}?studio=obs` as never);
      return;
    }
    setBusy(true);
    try {
      const res = await initStream(buildInitBody());
      setStreamId(res.streamId);
      setStreamKey(res.streamKey);
      setServerUrl(res.rtmpUrl);
      router.push(`/live/${res.streamId}?studio=${mode}` as never);
    } catch (e) {
      Alert.alert('Could not start', e instanceof Error ? e.message : 'Stream init failed');
    } finally {
      setBusy(false);
    }
  };

  const generateObsKey = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Enter a stream title first.');
      return;
    }
    if (!validatePaidPrice()) return;
    setBusy(true);
    try {
      const res = await initStream(buildInitBody());
      setStreamId(res.streamId);
      setStreamKey(res.streamKey);
      setServerUrl(res.rtmpUrl);
    } catch (e) {
      Alert.alert('Could not start', e instanceof Error ? e.message : 'Stream init failed');
    } finally {
      setBusy(false);
    }
  };

  const copyIngest = () => {
    Alert.alert('RTMP settings', `Server: ${serverUrl}\nStream key: ${streamKey}`);
  };

  const parsedEntryPrice = parseFloat(entryPriceUsd);
  const entryPriceTooLow =
    accessType === 'paid' &&
    entryPriceUsd.trim() !== '' &&
    Number.isFinite(parsedEntryPrice) &&
    parsedEntryPrice < minPaidStreamUsd;

  const primaryActionLabel = (() => {
    if (busy) return mode === 'obs' && !streamKey ? 'Generating…' : 'Opening…';
    if (!title.trim()) return 'Enter a stream title';
    if (accessType === 'paid') {
      if (!entryPriceUsd.trim()) return 'Enter VIP entry price';
      if (!Number.isFinite(parsedEntryPrice)) return 'Enter a valid VIP price';
      if (parsedEntryPrice < minPaidStreamUsd) {
        return `Minimum VIP price is $${minPaidStreamUsd.toFixed(2)}`;
      }
    }
    if (mode === 'camera') return 'Open Live Studio';
    return streamKey ? 'Open Live Studio' : 'Generate stream key';
  })();

  return (
    <>
      <ScrollView style={styles.screen}>
        <View style={styles.pad}>
          <AppHeader showBack title="Go Live" showSearch={false} showNotifications={false} />
          {!approved ? (
            <Card>
              <Text style={styles.title}>Streamer access required</Text>
              <Text style={styles.sub}>Apply for live streaming before you can broadcast.</Text>
              <Button label="Apply to stream" onPress={() => setApplyOpen(true)} style={{ marginTop: 12 }} />
            </Card>
          ) : (
            <Card>
              <Text style={styles.sub}>
                Go live from your phone with camera and mic — no extra software required. OBS is optional
                for creators who need scenes, overlays, or capture hardware.
              </Text>

              <View style={styles.accessSection}>
                <View style={styles.accessHeader}>
                  <View style={styles.requiredPill}>
                    <Text style={styles.requiredPillText}>REQUIRED</Text>
                  </View>
                  <View
                    style={[
                      styles.selectionPill,
                      accessType === 'paid' ? styles.selectionPillPaid : styles.selectionPillFree,
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectionPillText,
                        accessType === 'paid' ? styles.selectionPillTextPaid : styles.selectionPillTextFree,
                      ]}
                    >
                      {accessType === 'paid' ? 'VIP · Paid' : 'Free · Open'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.accessTitle}>Who can watch your stream?</Text>
                <Text style={styles.accessSub}>
                  Choose Free for everyone, or Paid VIP so viewers unlock with coins.
                </Text>

                <View style={styles.accessRow}>
                  <Pressable
                    style={[styles.accessCard, accessType === 'free' && styles.accessCardFreeOn]}
                    onPress={() => setAccessType('free')}
                  >
                    {accessType === 'free' ? (
                      <View style={styles.accessCheckFree}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    ) : null}
                    <View style={[styles.accessIconWrap, styles.accessIconFree]}>
                      <Ionicons name="earth" size={26} color="#10b981" />
                    </View>
                    <Text style={styles.accessCardTitle}>Free stream</Text>
                    <Text style={styles.accessCardHint}>
                      Open to everyone. No coin unlock needed.
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.accessCard, accessType === 'paid' && styles.accessCardPaidOn]}
                    onPress={() => setAccessType('paid')}
                  >
                    {accessType === 'paid' ? (
                      <View style={styles.accessCheckPaid}>
                        <Ionicons name="checkmark" size={14} color="#000" />
                      </View>
                    ) : null}
                    <View style={[styles.accessIconWrap, styles.accessIconPaid]}>
                      <Ionicons name="lock-closed" size={26} color="#f59e0b" />
                    </View>
                    <Text style={styles.accessCardTitle}>Paid VIP</Text>
                    <Text style={styles.accessCardHint}>
                      Viewers pay coins to watch or listen.
                    </Text>
                  </Pressable>
                </View>

                {accessType === 'paid' ? (
                  <View style={styles.paidPriceBox}>
                    <View style={styles.paidPriceHeader}>
                      <Ionicons name="logo-bitcoin" size={18} color="#f59e0b" />
                      <Text style={styles.paidPriceLabel}>VIP entry price (USD)</Text>
                    </View>
                    <TextInput
                      style={[
                        styles.paidPriceInput,
                        entryPriceTooLow && styles.paidPriceInputInvalid,
                      ]}
                      placeholder={`Minimum $${minPaidStreamUsd.toFixed(2)}`}
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="decimal-pad"
                      value={entryPriceUsd}
                      onChangeText={setEntryPriceUsd}
                    />
                    {entryPriceTooLow ? (
                      <Text style={styles.paidPriceError}>
                        Price must be at least ${minPaidStreamUsd.toFixed(2)} for paid VIP streams.
                      </Text>
                    ) : (
                      <Text style={styles.paidPriceHint}>
                        Minimum ${minPaidStreamUsd.toFixed(2)}. Viewers pay the equivalent in coins.
                      </Text>
                    )}
                  </View>
                ) : null}
              </View>

              <Text style={styles.sectionLabel}>Broadcast method</Text>
              <View style={styles.modeRow}>
                {(['camera', 'obs'] as const).map((m) => (
                  <Pressable
                    key={m}
                    style={[styles.modeCard, mode === m && styles.modeCardOn]}
                    onPress={() => setMode(m)}
                  >
                    <Text style={[styles.modeTitle, mode === m && styles.modeTitleOn]}>
                      {m === 'camera' ? 'Camera & mic' : 'OBS Studio'}
                    </Text>
                    <Text style={styles.modeHint}>
                      {m === 'camera'
                        ? 'Recommended — open Live Studio on your phone.'
                        : 'Optional — multi-source layouts and overlays.'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {mode === 'obs' && ingestHealth ? (
                <View
                  style={[
                    styles.ingestBanner,
                    ingestHealth.rtmpReachable ? styles.ingestOk : styles.ingestWarn,
                  ]}
                >
                  <Text
                    style={[
                      styles.ingestText,
                      ingestHealth.rtmpReachable ? styles.ingestTextOk : styles.ingestTextWarn,
                    ]}
                  >
                    {ingestHealth.hint}
                  </Text>
                </View>
              ) : null}

              <View style={styles.detailsSection}>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>REQUIRED</Text>
                </View>
                <Text style={styles.detailsTitle}>Stream details</Text>
                <Text style={styles.detailsSub}>
                  Add a title and category so viewers know what your broadcast is about.
                </Text>

                <View style={styles.fieldBlock}>
                  <View style={styles.fieldLabelRow}>
                    <Ionicons name="text-outline" size={18} color="#10b981" />
                    <Text style={styles.fieldLabel}>Stream title *</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputProminent,
                      !title.trim() && styles.inputAttention,
                    ]}
                    placeholder="e.g. Friday night gaming session"
                    placeholderTextColor={colors.mutedForeground}
                    value={title}
                    onChangeText={setTitle}
                  />
                  {!title.trim() ? (
                    <Text style={styles.fieldHintWarn}>
                      Required — shown on your live card and in browse.
                    </Text>
                  ) : null}
                </View>

                <View style={styles.fieldBlock}>
                  <View style={styles.fieldLabelRow}>
                    <Ionicons name="grid-outline" size={18} color="#10b981" />
                    <Text style={styles.fieldLabel}>Category *</Text>
                  </View>
                  <View style={styles.categoryRow}>
                    {categoryOptions.map((c) => (
                      <Pressable
                        key={c.slug}
                        style={[styles.categoryChip, category === c.label && styles.categoryChipOn]}
                        onPress={() => setCategory(c.label)}
                      >
                        <Text style={[styles.categoryText, category === c.label && styles.categoryTextOn]}>
                          {c.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.fieldHint}>
                    Tap a category so viewers can find your stream in browse.
                  </Text>
                </View>
              </View>

              {mode === 'obs' && streamKey ? (
                <View style={styles.rtmpBox}>
                  <Text style={styles.rtmpLabel}>Server</Text>
                  <Text style={styles.code}>{serverUrl}</Text>
                  <Text style={[styles.rtmpLabel, { marginTop: 8 }]}>Stream key</Text>
                  <Text style={styles.code}>{streamKey}</Text>
                </View>
              ) : null}

              {mode === 'camera' ? (
                <Button
                  label={primaryActionLabel}
                  onPress={() => void openStudio()}
                  disabled={busy}
                  style={{ marginTop: 16 }}
                />
              ) : streamKey ? (
                <View style={styles.row}>
                  <Button label="Copy server & key" variant="secondary" onPress={copyIngest} style={styles.flex} />
                  <Button
                    label={primaryActionLabel}
                    onPress={() => void openStudio()}
                    disabled={busy}
                    style={styles.flex}
                  />
                </View>
              ) : (
                <Button
                  label={primaryActionLabel}
                  onPress={() => void generateObsKey()}
                  disabled={busy}
                  style={{ marginTop: 16 }}
                />
              )}

              <Text style={styles.hint}>
                {mode === 'camera'
                  ? Platform.OS === 'web'
                    ? 'Enter a title and open Live Studio to preview your camera and mic. Tap Go Live when ready. For the most reliable broadcast, use the Prysym TV website or an Android/iOS build — Expo web preview depends on MediaMTX accepting your browser origin.'
                    : 'Enter a title and open Live Studio to preview your camera and mic. When everything looks good, tap Go Live in the studio — viewers won\'t see you until then.'
                  : 'In OBS use Custom service with the server URL and stream key above. Keep Live Studio open for chat and gifts.'}
              </Text>

              {busy ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : null}
            </Card>
          )}
        </View>
      </ScrollView>
      <StreamerApplicationModal visible={applyOpen} onClose={() => setApplyOpen(false)} features={['live']} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16, paddingBottom: 32 },
  title: { color: colors.foreground, fontSize: 18, fontWeight: '700' },
  sub: { color: colors.mutedForeground, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  accessSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.primary + '66',
    backgroundColor: colors.primary + '0c',
  },
  accessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  requiredPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  requiredPillText: {
    color: colors.primaryForeground,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  selectionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  selectionPillFree: {
    backgroundColor: '#10b98122',
    borderWidth: 1,
    borderColor: '#10b98166',
  },
  selectionPillPaid: {
    backgroundColor: '#f59e0b',
  },
  selectionPillText: { fontSize: 11, fontWeight: '800' },
  selectionPillTextFree: { color: '#10b981' },
  selectionPillTextPaid: { color: '#000' },
  accessTitle: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  accessSub: {
    color: colors.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  accessRow: { flexDirection: 'row', gap: 10 },
  accessCard: {
    flex: 1,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    minHeight: 148,
  },
  accessCardFreeOn: {
    borderColor: '#10b981',
    backgroundColor: '#10b98118',
  },
  accessCardPaidOn: {
    borderColor: '#f59e0b',
    backgroundColor: '#f59e0b18',
  },
  accessCheckFree: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessCheckPaid: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  accessIconFree: { backgroundColor: '#10b98122' },
  accessIconPaid: { backgroundColor: '#f59e0b33' },
  accessCardTitle: { color: colors.foreground, fontSize: 16, fontWeight: '800' },
  accessCardHint: { color: colors.mutedForeground, fontSize: 12, lineHeight: 17, marginTop: 6 },
  paidPriceBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: '#f59e0b66',
    backgroundColor: '#f59e0b14',
    gap: 8,
  },
  paidPriceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  paidPriceLabel: { color: colors.foreground, fontSize: 14, fontWeight: '700' },
  paidPriceInput: {
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#f59e0b44',
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  paidPriceInputInvalid: {
    borderColor: colors.destructive,
  },
  paidPriceHint: { color: colors.mutedForeground, fontSize: 12, lineHeight: 17 },
  paidPriceError: { color: colors.destructive, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  sectionLabel: { color: colors.foreground, fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  detailsSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: '#10b98166',
    backgroundColor: '#10b98112',
    gap: 10,
  },
  requiredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  requiredBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  detailsTitle: { color: colors.foreground, fontSize: 18, fontWeight: '800', marginTop: 2 },
  detailsSub: { color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  fieldBlock: { gap: 8, marginTop: 4 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldLabel: { color: colors.foreground, fontSize: 14, fontWeight: '700' },
  fieldHint: { color: colors.mutedForeground, fontSize: 12, lineHeight: 17 },
  fieldHintWarn: { color: '#d97706', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeCard: {
    flex: 1,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary + '55',
  },
  modeCardOn: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  paidCardOn: { borderColor: '#f59e0b', backgroundColor: '#f59e0b18' },
  modeTitle: { color: colors.foreground, fontSize: 14, fontWeight: '700' },
  modeTitleOn: { color: colors.primary },
  modeHint: { color: colors.mutedForeground, fontSize: 11, lineHeight: 15, marginTop: 4 },
  input: {
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 2,
    borderColor: '#10b98155',
  },
  inputProminent: {
    minHeight: 52,
  },
  inputAttention: {
    borderColor: '#f59e0b88',
    backgroundColor: '#f59e0b0a',
  },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
  },
  categoryChipOn: {
    backgroundColor: colors.primary + '22',
    borderColor: colors.primary,
  },
  categoryText: { color: colors.mutedForeground, fontSize: 13, fontWeight: '700' },
  categoryTextOn: { color: colors.primary },
  rtmpBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary + '88',
  },
  rtmpLabel: { color: colors.mutedForeground, fontSize: 11, fontWeight: '600' },
  code: { color: colors.foreground, fontFamily: 'monospace', fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', gap: 8, marginTop: 16 },
  flex: { flex: 1 },
  hint: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 16 },
  ingestBanner: {
    marginBottom: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  ingestOk: {
    borderColor: '#10b98155',
    backgroundColor: '#10b98118',
  },
  ingestWarn: {
    borderColor: '#f59e0b66',
    backgroundColor: '#f59e0b14',
  },
  ingestText: { fontSize: 12, lineHeight: 17 },
  ingestTextOk: { color: '#10b981' },
  ingestTextWarn: { color: '#d97706' },
});
