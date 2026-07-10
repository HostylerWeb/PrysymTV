import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { CreateMenuModal } from '@/components/modals/CreateMenuModal';
import { VerticalSeriesWizard } from '@/components/modals/VerticalSeriesWizard';
import { UnlockFeaturesModal, type CreatorVerificationContext } from '@/components/modals/UnlockFeaturesModal';
import { StreamerApplicationModal } from '@/components/modals/StreamerApplicationModal';
import { CreatorUploadSheet, type CreatorUploadKind } from '@/components/modals/CreatorUploadSheet';
import { useMockAuth } from '@/context/MockAuthContext';

export type CreateTarget = 'menu' | 'short' | 'video' | 'podcast' | 'vertical';

export function useCreateFlow() {
  const router = useRouter();
  const { user, requireAuth } = useMockAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [streamerOpen, setStreamerOpen] = useState(false);
  const [unlockFeature, setUnlockFeature] = useState<'vertical' | 'live' | 'store'>('vertical');
  const [verifyContext, setVerifyContext] = useState<CreatorVerificationContext | null>(null);
  const [uploadKind, setUploadKind] = useState<CreatorUploadKind | null>(null);

  const openUpload = useCallback((kind: CreatorUploadKind) => {
    setUploadKind(kind);
  }, []);

  const trigger = useCallback((target: CreateTarget) => {
    requireAuth(() => {
      if (target === 'menu') {
        setMenuOpen(true);
        return;
      }
      if (target === 'short' || target === 'video' || target === 'podcast') {
        openUpload(target);
        return;
      }
      if (target === 'vertical') {
        if (user?.verticalCreatorStatus !== 'approved') {
          setUnlockFeature('vertical');
          setUnlockOpen(true);
          return;
        }
        setWizardOpen(true);
      }
    });
  }, [openUpload, user?.verticalCreatorStatus, requireAuth]);

  const flowHost = useMemo(() => (
    <>
      <CreateMenuModal
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenUpload={openUpload}
        onOpenWizard={() => setWizardOpen(true)}
        onOpenUnlock={(feature) => {
          setUnlockFeature(feature);
          setUnlockOpen(true);
        }}
      />
      <VerticalSeriesWizard
        visible={wizardOpen}
        onClose={() => setWizardOpen(false)}
        initialIntent="choose"
        onComplete={() => router.push('/settings/verticals')}
      />
      {user ? (
        <>
          <UnlockFeaturesModal
            visible={unlockOpen}
            user={user}
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
            user={user}
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
            portfolioUrl={verifyContext?.portfolioUrl}
          />
        </>
      ) : null}
      {uploadKind ? (
        <CreatorUploadSheet
          visible={!!uploadKind}
          kind={uploadKind}
          onClose={() => setUploadKind(null)}
        />
      ) : null}
    </>
  ), [
    menuOpen,
    wizardOpen,
    unlockOpen,
    streamerOpen,
    unlockFeature,
    verifyContext,
    uploadKind,
    user,
    router,
    openUpload,
  ]);

  return { trigger, flowHost, openUpload };
}
