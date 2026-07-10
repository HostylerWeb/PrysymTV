"use client"

import { Button } from "@/components/ui/button"

type Props = {
  message?: string
  onRetry?: () => void
}

export function FeedErrorBanner({
  message = "We could not reach the server. Check your connection and try again.",
  onRetry,
}: Props) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <p className="text-sm text-foreground">{message}</p>
      {onRetry ? (
        <Button size="sm" variant="outline" className="rounded-full shrink-0" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  )
}
