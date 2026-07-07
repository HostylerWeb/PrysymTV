"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"

/** Deep-link entry: /shorts/:id → vertical feed scrolled to that short. */
export default function ShortDeepLinkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(`/shorts?start=${encodeURIComponent(id)}`)
  }, [id, router])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center md:pl-20">
      <p className="text-muted-foreground text-sm">Opening short…</p>
    </main>
  )
}
