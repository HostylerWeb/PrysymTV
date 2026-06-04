"use client"

import { useEffect, useRef, useState } from "react"
import { X, Loader2, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth, getAuthErrorMessage } from "@/contexts/auth-context"
import { updateMe } from "@/lib/api/users"
import {
  initAvatarUpload,
  initBannerUpload,
  uploadProfileImage,
} from "@/lib/api/profile-upload"
interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, refreshUser } = useAuth()
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null)
  const [pendingBannerUrl, setPendingBannerUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [error, setError] = useState("")
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name)
      setBio(user.bio ?? "")
      setAvatarPreview(user.avatar)
      setBannerPreview(user.bannerUrl)
      setPendingAvatarUrl(null)
      setPendingBannerUrl(null)
      setError("")
    }
  }, [isOpen, user])

  if (!isOpen) return null

  const handleImagePick = async (
    file: File,
    kind: "avatar" | "banner",
  ) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose a JPEG, PNG, or WebP image.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Images must be 10 MB or smaller.")
      return
    }

    const preview = URL.createObjectURL(file)
    if (kind === "avatar") {
      setAvatarPreview(preview)
      setUploadingAvatar(true)
    } else {
      setBannerPreview(preview)
      setUploadingBanner(true)
    }
    setError("")

    try {
      const init =
        kind === "avatar"
          ? await initAvatarUpload(file)
          : await initBannerUpload(file)
      const publicUrl = await uploadProfileImage(init, file)
      if (kind === "avatar") setPendingAvatarUrl(publicUrl)
      else setPendingBannerUrl(publicUrl)
    } catch (err) {
      setError(getAuthErrorMessage(err))
      if (kind === "avatar") setAvatarPreview(user?.avatar ?? null)
      else setBannerPreview(user?.bannerUrl ?? null)
    } finally {
      if (kind === "avatar") setUploadingAvatar(false)
      else setUploadingBanner(false)
    }
  }

  const handleSave = async () => {
    const displayName = name.trim()
    if (!displayName) {
      setError("Display name is required.")
      return
    }

    setIsSaving(true)
    setError("")
    try {
      await updateMe({
        displayName,
        bio: bio.trim() || undefined,
        ...(pendingAvatarUrl ? { avatarUrl: pendingAvatarUrl } : {}),
        ...(pendingBannerUrl ? { bannerUrl: pendingBannerUrl } : {}),
      })
      await refreshUser()
      onClose()
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const busy = isSaving || uploadingAvatar || uploadingBanner

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md bg-background rounded-t-3xl md:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-foreground">Edit Profile</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Display name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="w-full h-12 px-4 rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell viewers about yourself..."
              maxLength={500}
              className="w-full h-24 px-4 py-3 rounded-xl bg-secondary resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {bio.length}/500
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Avatar
            </label>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleImagePick(f, "avatar")
                e.target.value = ""
              }}
            />
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full overflow-hidden bg-secondary border border-border mx-auto block group"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-2xl font-bold text-muted-foreground">
                  {user?.name?.[0] ?? "?"}
                </span>
              )}
              <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </span>
            </button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Tap to upload · max 10 MB
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Banner
            </label>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleImagePick(f, "banner")
                e.target.value = ""
              }}
            />
            <button
              type="button"
              disabled={uploadingBanner}
              onClick={() => bannerInputRef.current?.click()}
              className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-secondary border border-dashed border-border group"
            >
              {bannerPreview ? (
                <img
                  src={bannerPreview}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-sm text-muted-foreground">
                  Add a banner image
                </span>
              )}
              <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingBanner ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </span>
            </button>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={busy}
          className="w-full rounded-full mt-6"
        >
          {busy ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  )
}
