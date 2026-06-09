"use client"

import { useState } from "react"
import type { CreatorUploadKind } from "@/components/creator-upload-sheet"

export type CreateFlowState = {
  menuOpen: boolean
  setMenuOpen: (v: boolean) => void
  uploadKind: CreatorUploadKind | null
  setUploadKind: (v: CreatorUploadKind | null) => void
  verticalWizardOpen: boolean
  setVerticalWizardOpen: (v: boolean) => void
  verticalWizardIntent?: "new_series" | "add_episode"
  setVerticalWizardIntent: (v: "new_series" | "add_episode" | undefined) => void
  unlockOpen: boolean
  setUnlockOpen: (v: boolean) => void
  unlockPreselect?: "vertical" | "live"
  setUnlockPreselect: (v: "vertical" | "live" | undefined) => void
  authOpen: boolean
  setAuthOpen: (v: boolean) => void
}

export function useCreateFlow(): CreateFlowState {
  const [menuOpen, setMenuOpen] = useState(false)
  const [uploadKind, setUploadKind] = useState<CreatorUploadKind | null>(null)
  const [verticalWizardOpen, setVerticalWizardOpen] = useState(false)
  const [verticalWizardIntent, setVerticalWizardIntent] = useState<
    "new_series" | "add_episode" | undefined
  >()
  const [unlockOpen, setUnlockOpen] = useState(false)
  const [unlockPreselect, setUnlockPreselect] = useState<
    "vertical" | "live" | undefined
  >()
  const [authOpen, setAuthOpen] = useState(false)

  return {
    menuOpen,
    setMenuOpen,
    uploadKind,
    setUploadKind,
    verticalWizardOpen,
    setVerticalWizardOpen,
    verticalWizardIntent,
    setVerticalWizardIntent,
    unlockOpen,
    setUnlockOpen,
    unlockPreselect,
    setUnlockPreselect,
    authOpen,
    setAuthOpen,
  }
}
