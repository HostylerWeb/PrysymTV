"use client"

import { CreateMenuSheet, type CreateMenuAction } from "@/components/create-menu-sheet"
import {
  CreatorUploadSheet,
  type CreatorUploadKind,
} from "@/components/creator-upload-sheet"
import {
  UnlockFeaturesModal,
  type CreatorVerificationContext,
} from "@/components/unlock-features-modal"
import { AuthModal } from "@/components/auth-modal"
import { VerticalSeriesWizard } from "@/components/vertical-series-wizard"
import type { ProfileSettingsScreen } from "@/components/profile-settings-sheet"
import type { CreateFlowState } from "@/hooks/use-create-flow"
import type { User } from "@/contexts/auth-context"

export type { CreateFlowState }

/** What the header + button should do on a given page */
export type ContextualCreateTarget = "menu" | "short" | "video" | "podcast" | "vertical"

function canUploadVerticals(user: User | null) {
  return (
    user?.isVerticalCreator || user?.verticalCreatorStatus === "approved"
  )
}

/** Page-scoped create: skips the full menu when context is clear (shorts, podcasts, etc.) */
export function triggerContextualCreate(
  target: ContextualCreateTarget,
  flow: CreateFlowState,
  opts: {
    isAuthenticated: boolean
    user: User | null
    onOpenSettings?: (screen: ProfileSettingsScreen) => void
    verticalIntent?: "new_series" | "add_episode"
  },
) {
  if (!opts.isAuthenticated) {
    flow.setAuthOpen(true)
    return
  }

  switch (target) {
    case "menu":
      flow.setMenuOpen(true)
      break
    case "short":
      flow.setUploadKind("short")
      break
    case "video":
      flow.setUploadKind("video")
      break
    case "podcast":
      flow.setUploadKind("podcast")
      break
    case "vertical":
      if (!canUploadVerticals(opts.user)) {
        flow.setUnlockPreselect("vertical")
        flow.setUnlockOpen(true)
        return
      }
      flow.setVerticalWizardIntent(opts.verticalIntent ?? "add_episode")
      flow.setVerticalWizardOpen(true)
      break
  }
}

interface CreateFlowModalsProps {
  flow: CreateFlowState
  menuHighlight?: CreatorUploadKind
  onOpenSettings?: (screen: ProfileSettingsScreen) => void
  onNeedCreatorVerification?: (context: CreatorVerificationContext) => void
  onUploadSuccess?: () => void
}

export function handleCreateMenuAction(
  action: CreateMenuAction,
  flow: CreateFlowState,
  handlers: {
    onOpenSettings?: (screen: ProfileSettingsScreen) => void
  },
) {
  switch (action.type) {
    case "upload":
      flow.setUploadKind(action.kind)
      break
    case "vertical-wizard":
      flow.setVerticalWizardIntent(undefined)
      flow.setVerticalWizardOpen(true)
      break
    case "go-live":
      handlers.onOpenSettings?.("go-live")
      break
    case "unlock":
      flow.setUnlockPreselect(action.feature)
      flow.setUnlockOpen(true)
      break
    case "auth":
      flow.setAuthOpen(true)
      break
  }
}

export function CreateFlowModals({
  flow,
  menuHighlight,
  onOpenSettings,
  onNeedCreatorVerification,
  onUploadSuccess,
}: CreateFlowModalsProps) {
  return (
    <>
      <CreateMenuSheet
        isOpen={flow.menuOpen}
        onClose={() => flow.setMenuOpen(false)}
        highlight={menuHighlight}
        onAction={(action) => {
          handleCreateMenuAction(action, flow, { onOpenSettings })
          if (action.type !== "unlock") flow.setMenuOpen(false)
        }}
      />

      {flow.uploadKind && (
        <CreatorUploadSheet
          isOpen={!!flow.uploadKind}
          onClose={() => flow.setUploadKind(null)}
          kind={flow.uploadKind}
          onSuccess={onUploadSuccess}
        />
      )}

      <VerticalSeriesWizard
        isOpen={flow.verticalWizardOpen}
        initialIntent={flow.verticalWizardIntent}
        onClose={() => {
          flow.setVerticalWizardOpen(false)
          flow.setVerticalWizardIntent(undefined)
        }}
        onSuccess={onUploadSuccess}
      />

      <UnlockFeaturesModal
        isOpen={flow.unlockOpen}
        onClose={() => {
          flow.setUnlockOpen(false)
          flow.setUnlockPreselect(undefined)
        }}
        preselect={flow.unlockPreselect}
        onNeedCreatorVerification={(ctx) => {
          flow.setUnlockOpen(false)
          onNeedCreatorVerification?.(ctx)
        }}
      />

      <AuthModal
        isOpen={flow.authOpen}
        onClose={() => flow.setAuthOpen(false)}
      />
    </>
  )
}

/** Open vertical wizard from profile permissions card etc. */
export function openVerticalWizard(
  flow: CreateFlowState,
  intent?: "new_series" | "add_episode",
) {
  flow.setVerticalWizardIntent(intent)
  flow.setVerticalWizardOpen(true)
}
