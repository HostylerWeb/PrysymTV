"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name ?? "")
  const [bio, setBio] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setIsSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="w-full md:max-w-md bg-background rounded-t-3xl md:rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-foreground">Edit Profile</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell viewers about yourself..."
              className="w-full h-24 px-4 py-3 rounded-xl bg-secondary resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Avatar</label>
            <button className="w-full py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-secondary/50">
              Upload new photo (mock)
            </button>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Banner</label>
            <button className="w-full py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-secondary/50">
              Upload banner image (mock)
            </button>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="w-full rounded-full mt-6">
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
