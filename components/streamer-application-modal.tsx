"use client"

import { useState } from "react"
import { X, Upload, FileCheck, Loader2, CheckCircle, Clock, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

interface StreamerApplicationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function StreamerApplicationModal({ isOpen, onClose }: StreamerApplicationModalProps) {
  const { user, applyForStreamer } = useAuth()
  const [step, setStep] = useState(1)
  const [description, setDescription] = useState("")
  const [idPhoto, setIdPhoto] = useState<string | null>(null)
  const [idFileName, setIdFileName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real app, you'd upload to a server
      // For demo, we'll create a fake URL
      setIdPhoto(`uploaded_${file.name}`)
      setIdFileName(file.name)
    }
  }

  const handleSubmit = async () => {
    if (!description || !idPhoto) return
    
    setIsSubmitting(true)
    try {
      await applyForStreamer(description, idPhoto)
      setStep(3) // Success step
    } catch {
      // Handle error
    } finally {
      setIsSubmitting(false)
    }
  }

  // If user is already a streamer or has pending application
  if (user?.streamerStatus === "approved") {
    return (
      <div 
        className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div 
          className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-8 text-center">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>

            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Video className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">You&apos;re a Streamer!</h2>
            <p className="text-muted-foreground mb-6">
              Your application has been approved. You can now start live streaming.
            </p>
            <Button onClick={onClose} className="w-full rounded-full">
              Go Live
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (user?.streamerStatus === "pending") {
    return (
      <div 
        className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div 
          className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-8 text-center">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>

            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Application Pending</h2>
            <p className="text-muted-foreground mb-6">
              Your streamer application is being reviewed. We&apos;ll notify you once it&apos;s approved.
            </p>
            <Button variant="secondary" onClick={onClose} className="w-full rounded-full">
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
      onClick={onClose}
    >
      <div 
        className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
          
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground text-center">Become a Streamer</h2>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Apply to start live streaming on Prysym TV
          </p>
        </div>

        {/* Progress indicator */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  step >= s 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-muted-foreground"
                )}>
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={cn(
                    "w-8 h-1 mx-1",
                    step > s ? "bg-primary" : "bg-secondary"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-8">
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
                />
              </div>
              <Button 
                onClick={() => setStep(2)} 
                className="w-full rounded-full"
                disabled={!description.trim()}
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
                  Upload a photo of your government-issued ID for verification.
                </p>
                
                <label className={cn(
                  "block w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                  idPhoto 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {idPhoto ? (
                    <div className="space-y-2">
                      <FileCheck className="w-12 h-12 text-primary mx-auto" />
                      <p className="text-sm font-medium text-foreground">{idFileName}</p>
                      <p className="text-xs text-muted-foreground">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                      <p className="text-sm font-medium text-foreground">Click to upload</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
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
                  disabled={!idPhoto || isSubmitting}
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
              <h3 className="text-xl font-bold text-foreground mb-2">Application Submitted!</h3>
              <p className="text-muted-foreground mb-6">
                We&apos;ll review your application and get back to you within 24-48 hours.
              </p>
              <Button onClick={onClose} className="w-full rounded-full">
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
