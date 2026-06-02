"use client"

import { useEffect, useState } from "react"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth, getAuthErrorMessage } from "@/contexts/auth-context"
import { updateMe } from "@/lib/api/users"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, refreshUser } = useAuth()
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name)
      setBio(user.bio ?? "")
      setError("")
    }
  }, [isOpen, user])

  if (!isOpen) return null

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
      })
      await refreshUser()
      onClose()
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md bg-background rounded-t-3xl md:rounded-2xl p-6"
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
            <p className="text-xs text-muted-foreground py-3 rounded-xl border border-dashed border-border text-center">
              Photo upload comes in Phase B (cloud storage).
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Banner
            </label>
            <p className="text-xs text-muted-foreground py-3 rounded-xl border border-dashed border-border text-center">
              Banner upload comes in Phase B (cloud storage).
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-full mt-6"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  )
}
