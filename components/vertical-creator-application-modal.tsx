"use client"

import { useState } from "react"
import { X, Loader2, CheckCircle, Clock, Film, Upload, FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth, getAuthErrorMessage } from "@/contexts/auth-context"
import {
  initStreamerIdUpload,
  uploadProfileImage,
} from "@/lib/api/profile-upload"

const MIN_DESCRIPTION = 20

interface VerticalCreatorApplicationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function VerticalCreatorApplicationModal({
  isOpen,
  onClose,
}: VerticalCreatorApplicationModalProps) {
  const { user, applyForVerticalCreator } = useAuth()
  const [description, setDescription] = useState("")
  const [portfolioUrl, setPortfolioUrl] = useState("")
  const [idFile, setIdFile] = useState<File | null>(null)
  const [idFileName, setIdFileName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const descriptionOk = description.trim().length >= MIN_DESCRIPTION

  const handleSubmit = async () => {
    if (!descriptionOk || !idFile) return

    setIsSubmitting(true)
    setError("")
    try {
      const init = await initStreamerIdUpload(idFile)
      const publicUrl = await uploadProfileImage(init, idFile)
      await applyForVerticalCreator(
        description.trim(),
        publicUrl,
        portfolioUrl.trim() || undefined,
      )
      setSubmitted(true)
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setDescription("")
    setPortfolioUrl("")
    setIdFile(null)
    setIdFileName("")
    setError("")
    setSubmitted(false)
    onClose()
  }

  if (user?.verticalCreatorStatus === "approved") {
    return (
      <div
        className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center"
        onClick={handleClose}
      >
        <div
          className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-8 text-center relative">
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Film className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Vertical creator approved
            </h2>
            <p className="text-muted-foreground mb-6">
              You can create micro-drama series from the + menu.
            </p>
            <Button onClick={handleClose} className="w-full rounded-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (user?.verticalCreatorStatus === "pending") {
    return (
      <div
        className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center"
        onClick={handleClose}
      >
        <div
          className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-8 text-center relative">
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Application pending
            </h2>
            <p className="text-muted-foreground mb-6">
              Your vertical series application is being reviewed.
            </p>
            <Button variant="secondary" onClick={handleClose} className="w-full rounded-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center"
      onClick={handleClose}
    >
      <div
        className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 pt-6 pb-4">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground text-center">
            Apply for vertical series
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Government ID required for review
          </p>
        </div>

        <div className="px-6 pb-8 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}

          {!submitted ? (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tell us about your series plans
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Genre, episode format, production schedule..."
                  className="w-full h-28 px-4 py-3 rounded-xl bg-secondary text-foreground resize-none"
                  maxLength={2000}
                />
                <p
                  className={cn(
                    "text-xs mt-1",
                    descriptionOk ? "text-muted-foreground" : "text-destructive",
                  )}
                >
                  {description.trim().length}/{MIN_DESCRIPTION} characters minimum
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Government ID
                </label>
                <label
                  className={cn(
                    "block w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer",
                    idFile ? "border-primary bg-primary/5" : "border-border",
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setIdFile(file)
                        setIdFileName(file.name)
                      }
                    }}
                  />
                  {idFile ? (
                    <>
                      <FileCheck className="w-10 h-10 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">{idFileName}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Upload ID photo</p>
                    </>
                  )}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Portfolio link (optional)
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                />
              </div>

              <Button
                onClick={() => void handleSubmit()}
                className="w-full rounded-full"
                disabled={!descriptionOk || !idFile || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Submit application"
                )}
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Application submitted</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Status is <strong>pending</strong> until admin review.
              </p>
              <Button onClick={handleClose} className="w-full rounded-full">
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
