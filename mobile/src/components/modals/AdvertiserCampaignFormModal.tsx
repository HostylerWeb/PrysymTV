import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import {
  createAdvertiserCampaign,
  initAdvertiserAdMediaUpload,
  updateAdvertiserCampaign,
  type AdvertiserCampaign,
} from '@/lib/api/advertisers';
import { HOME_BANNER_SIZE_OPTIONS } from '@/lib/ad-banner-size';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

const PLACEMENTS = [
  { value: 'home_banner', label: 'Home banner' },
  { value: 'shorts_interstitial', label: 'Shorts interstitial' },
  { value: 'movie_preroll', label: 'Movie preroll' },
  { value: 'vertical_episode', label: 'Vertical episode gate' },
] as const;

type Props = {
  visible: boolean;
  onClose: () => void;
  accountId: string;
  campaign?: AdvertiserCampaign | null;
  onSaved: () => void;
};

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toIsoDate(value: string) {
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function AdvertiserCampaignFormModal({
  visible,
  onClose,
  accountId,
  campaign,
  onSaved,
}: Props) {
  const { colors } = useTheme();
  const isEdit = Boolean(campaign);
  const [title, setTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [clickThroughUrl, setClickThroughUrl] = useState('');
  const [placement, setPlacement] = useState<(typeof PLACEMENTS)[number]['value']>('home_banner');
  const [bannerSize, setBannerSize] = useState<'strip' | 'standard' | 'hero'>('strip');
  const [targetImpressions, setTargetImpressions] = useState('100000');
  const [budgetUsd, setBudgetUsd] = useState('5000');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (campaign) {
      setTitle(campaign.title);
      setMediaUrl('');
      setClickThroughUrl('');
      setPlacement(campaign.placement as (typeof PLACEMENTS)[number]['value']);
      setTargetImpressions(String(campaign.targetImpressions));
      setBudgetUsd(String(campaign.budgetUsd));
      setStartsAt(toLocalInputValue(campaign.startsAt));
      setEndsAt(toLocalInputValue(campaign.endsAt));
    } else {
      setTitle('');
      setMediaUrl('');
      setClickThroughUrl('');
      setPlacement('home_banner');
      setBannerSize('strip');
      setTargetImpressions('100000');
      setBudgetUsd('5000');
      const today = toLocalInputValue(new Date().toISOString());
      setStartsAt(today);
      setEndsAt(today);
    }
  }, [visible, campaign]);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploadBusy(true);
    try {
      const init = await initAdvertiserAdMediaUpload(accountId, {
        mimeType: asset.mimeType ?? 'image/jpeg',
        fileName: asset.fileName ?? 'campaign-media',
      });
      const fileRes = await fetch(asset.uri);
      const blob = await fileRes.blob();
      const upload = await fetch(init.uploadUrl, {
        method: init.uploadMethod,
        body: blob,
        headers: {
          ...init.uploadHeaders,
          'Content-Type': asset.mimeType ?? 'image/jpeg',
        },
      });
      if (!upload.ok) throw new Error('Upload failed');
      setMediaUrl(init.publicUrl);
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Could not upload media');
    } finally {
      setUploadBusy(false);
    }
  };

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Enter a campaign title.');
      return;
    }
    if (!isEdit && !mediaUrl.trim()) {
      Alert.alert('Missing media', 'Upload campaign creative.');
      return;
    }
    if (!clickThroughUrl.trim() && !isEdit) {
      Alert.alert('Missing URL', 'Enter a click-through URL.');
      return;
    }

    setBusy(true);
    try {
      if (campaign) {
        const patch: Record<string, unknown> = {
          title: title.trim(),
          placement,
          targetImpressions: parseInt(targetImpressions, 10),
          budgetUsd: parseFloat(budgetUsd),
          startsAt: toIsoDate(startsAt),
          endsAt: toIsoDate(endsAt),
        };
        if (mediaUrl.trim()) patch.mediaUrl = mediaUrl.trim();
        if (clickThroughUrl.trim()) patch.clickThroughUrl = clickThroughUrl.trim();
        if (placement === 'home_banner') patch.bannerSize = bannerSize;
        await updateAdvertiserCampaign(accountId, campaign.id, patch);
      } else {
        await createAdvertiserCampaign(accountId, {
          title: title.trim(),
          mediaUrl: mediaUrl.trim(),
          clickThroughUrl: clickThroughUrl.trim(),
          placement,
          targetImpressions: parseInt(targetImpressions, 10),
          budgetUsd: parseFloat(budgetUsd),
          startsAt: toIsoDate(startsAt),
          endsAt: toIsoDate(endsAt),
          ...(placement === 'home_banner' ? { bannerSize } : {}),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Could not save campaign');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={isEdit ? 'Edit campaign' : 'New campaign'}>
      <ScrollView style={{ maxHeight: 480 }} keyboardShouldPersistTaps="handled">
        <TextInput
          style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground }]}
          placeholder="Campaign title"
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground }]}
          placeholder={isEdit ? 'Click-through URL (leave blank to keep)' : 'Click-through URL'}
          placeholderTextColor={colors.mutedForeground}
          value={clickThroughUrl}
          onChangeText={setClickThroughUrl}
          autoCapitalize="none"
        />
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Placement</Text>
        <View style={styles.chips}>
          {PLACEMENTS.map((p) => (
            <Button
              key={p.value}
              label={p.label}
              size="sm"
              variant={placement === p.value ? 'primary' : 'outline'}
              onPress={() => setPlacement(p.value)}
              style={styles.chip}
            />
          ))}
        </View>
        {placement === 'home_banner' ? (
          <>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Banner size</Text>
            <View style={styles.chips}>
              {HOME_BANNER_SIZE_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  label={opt.label}
                  size="sm"
                  variant={bannerSize === opt.value ? 'primary' : 'outline'}
                  onPress={() => setBannerSize(opt.value)}
                  style={styles.chip}
                />
              ))}
            </View>
          </>
        ) : null}
        <TextInput
          style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground }]}
          placeholder="Target impressions"
          placeholderTextColor={colors.mutedForeground}
          value={targetImpressions}
          onChangeText={setTargetImpressions}
          keyboardType="number-pad"
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground }]}
          placeholder="Budget (USD)"
          placeholderTextColor={colors.mutedForeground}
          value={budgetUsd}
          onChangeText={setBudgetUsd}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground }]}
          placeholder="Start date (YYYY-MM-DD)"
          placeholderTextColor={colors.mutedForeground}
          value={startsAt}
          onChangeText={setStartsAt}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground }]}
          placeholder="End date (YYYY-MM-DD)"
          placeholderTextColor={colors.mutedForeground}
          value={endsAt}
          onChangeText={setEndsAt}
        />
        <Button
          label={uploadBusy ? 'Uploading…' : mediaUrl ? 'Media uploaded' : isEdit ? 'Replace creative' : 'Upload creative'}
          variant="secondary"
          onPress={() => void pickMedia()}
          disabled={uploadBusy}
          style={{ marginBottom: 8 }}
        />
        {mediaUrl ? (
          <Text style={{ color: colors.success, fontSize: 12, marginBottom: 8 }} numberOfLines={1}>
            {mediaUrl}
          </Text>
        ) : null}
        <Button label={busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create draft campaign'} onPress={() => void submit()} disabled={busy} />
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 15,
  },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { marginBottom: 4 },
});
