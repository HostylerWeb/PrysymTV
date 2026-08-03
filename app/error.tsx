"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-background">
      <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted-foreground max-w-md">
        We could not load this page. Please try again.
      </p>
      <Button type="button" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  )
}
