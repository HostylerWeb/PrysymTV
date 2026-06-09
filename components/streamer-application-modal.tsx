"use client"

import { useEffect, useState } from "react"
import {
  X,
  Upload,
  FileCheck,
  Loader2,
  CheckCircle,
  Clock,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth, getAuthErrorMessage } from "@/contexts/auth-context"
import {
  initStreamerIdUpload,
  uploadProfileImage,
} from "@/lib/api/profile-upload"

const MIN_DESCRIPTION = 20

export type CreatorVerificationFeatures = Array<"live" | "vertical">

interface StreamerApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  /** Prefill from unlock-permissions flow */
  initialDescription?: string
  portfolioUrl?: string
  /** Which permissions to apply for (default: live only) */
  features?: CreatorVerificationFeatures
  /** e.g. vertical request already submitted */
  bannerMessage?: string
}

export function StreamerApplicationModal({
  isOpen,
  onClose,
  initialDescription,
  portfolioUrl,
  features = ["live"],
  bannerMessage,
}: StreamerApplicationModalProps) {
  const { user, applyForStreamer, applyForVerticalCreator } = useAuth()
  const [step, setStep] = useState(1)
  const [description, setDescription] = useState(initialDescription ?? "")
  const [idFile, setIdFile] = useState<File | null>(null)
  const [idFileName, setIdFileName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen && initialDescription) {
      setDescription(initialDescription)
    }
  }, [isOpen, initialDescription])

  if (!isOpen) return null

  const wantsLive = features.includes("live")
  const wantsVertical = features.includes("vertical")
  const descriptionOk = description.trim().length >= MIN_DESCRIPTION

  const title = wantsLive && wantsVertical
    ? "Verify your identity"
    : wantsVertical
      ? "Apply for vertical series"
      : "Become a Streamer"

  const subtitle = wantsLive && wantsVertical
    ? "One ID upload covers live streaming and vertical series access"
    : wantsVertical
      ? "Upload your ID to publish micro-drama series"
      : "Apply to start live streaming on Prysym TV"

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIdFile(file)
      setIdFileName(file.name)
    }
  }

  const handleSubmit = async () => {
    if (!descriptionOk || !idFile) return

    setIsSubmitting(true)
    setError("")
    try {
      const init = await initStreamerIdUpload(idFile)
      const publicUrl = await uploadProfileImage(init, idFile)
      const desc = description.trim()

      if (
        wantsLive &&
        user?.streamerStatus !== "approved" &&
        user?.streamerStatus !== "pending"
      ) {
        await applyForStreamer(desc, publicUrl)
      }
      if (
        wantsVertical &&
        user?.verticalCreatorStatus !== "approved" &&
        user?.verticalCreatorStatus !== "pending"
      ) {
        await applyForVerticalCreator(desc, publicUrl, portfolioUrl)
      }
      setStep(3)
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setDescription("")
    setIdFile(null)
    setIdFileName("")
    setError("")
    onClose()
  }

  if (
    wantsLive &&
    !wantsVertical &&
    user?.streamerStatus === "approved"
  ) {
    return (
      <div
        className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center"
        onClick={handleClose}
      >
        <div
          className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-8 text-center">
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>

            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Video className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              You&apos;re a Streamer!
            </h2>
            <p className="text-muted-foreground mb-6">
              Your application has been approved. You can now start live streaming.
            </p>
            <Button onClick={handleClose} className="w-full rounded-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const anyPending =
    (wantsLive && user?.streamerStatus === "pending") ||
    (wantsVertical && user?.verticalCreatorStatus === "pending")

  if (anyPending) {
    return (
      <div
        className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center"
        onClick={handleClose}
      >
        <div
          className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-8 text-center">
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
              Your request is being reviewed. We&apos;ll notify you once it&apos;s
              approved.
            </p>
            <Button
              variant="secondary"
              onClick={handleClose}
              className="w-full rounded-full"
            >
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
            <Video className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground text-center">{title}</h2>
          <p className="text-sm text-muted-foreground text-center mt-1">{subtitle}</p>
        </div>

        <div className="px-6 pb-4">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      "w-8 h-1 mx-1",
                      step > s ? "bg-primary" : "bg-secondary",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-8">
          {bannerMessage && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-foreground text-center">{bannerMessage}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tell us about yourself
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What kind of content will you stream? Gaming, music, cooking, talk shows...?"
                  className="w-full h-32 px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  maxLength={2000}
                />
                <p
                  className={cn(
                    "text-xs mt-1",
                    descriptionOk
                      ? "text-muted-foreground"
                      : "text-destructive",
                  )}
                >
                  {description.trim().length}/{MIN_DESCRIPTION} characters minimum
                </p>
              </div>
              <Button
                onClick={() => setStep(2)}
                className="w-full rounded-full"
                disabled={!descriptionOk}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Upload ID verification
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Upload a photo of your government-issued ID. Your document is
                  stored securely and reviewed by our team.
                </p>

                <label
                  className={cn(
                    "block w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                    idFile
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {idFile ? (
                    <div className="space-y-2">
                      <FileCheck className="w-12 h-12 text-primary mx-auto" />
                      <p className="text-sm font-medium text-foreground">
                        {idFileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click to change
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                      <p className="text-sm font-medium text-foreground">
                        Click to upload
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-full"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 rounded-full"
                  disabled={!idFile || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Application submitted
              </h3>
              <p className="text-muted-foreground mb-6">
                Status is now <strong>pending</strong>. Our team will review your ID
                and application details.
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
