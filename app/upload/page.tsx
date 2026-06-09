"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Legacy URL — creation lives under the header + menu. */
export default function UploadPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/profile?create=1")
  }, [router])

  return null
}
