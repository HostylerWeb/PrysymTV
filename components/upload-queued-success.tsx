"use client"

import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  UPLOAD_QUEUED_BODY,
  UPLOAD_QUEUED_TITLE,
  uploadQueuedBodyFor,
  uploadQueuedTitleFor,
} from "@/lib/upload-processing-copy"

type UploadQueuedSuccessProps = {
  contentLabel?: string
  title?: string
  body?: string
  onClose: () => void
  closeLabel?: string
}

export function UploadQueuedSuccess({
  contentLabel,
  title,
  body,
  onClose,
  closeLabel = "Done",
}: UploadQueuedSuccessProps) {
  const heading =
    title ?? (contentLabel ? uploadQueuedTitleFor(contentLabel) : UPLOAD_QUEUED_TITLE)
  const message =
    body ?? (contentLabel ? uploadQueuedBodyFor(contentLabel) : UPLOAD_QUEUED_BODY)

  return (
    <div className="py-10 text-center px-2">
      <div className="relative w-14 h-14 mx-auto mb-4">
        <Check className="w-12 h-12 text-primary mx-auto" />
        <Loader2 className="w-5 h-5 text-primary absolute -bottom-1 -right-1 animate-spin bg-background rounded-full" />
      </div>
      <p className="font-semibold">{heading}</p>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-md mx-auto">
        {message}
      </p>
      <Button onClick={onClose} className="mt-6 rounded-full w-full">
        {closeLabel}
      </Button>
    </div>
  )
}
