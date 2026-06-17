"use client"

import { useState } from "react"
import { AdminContentVideoPage } from "@/components/admin/admin-content-video-page"
import { AdminVideoEditSheet } from "@/components/admin/admin-video-edit-sheet"

export default function AdminContentShortsPage() {
  const [editId, setEditId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  return (
    <>
      <AdminContentVideoPage
        key={reloadKey}
        title="Shorts"
        description="Vertical short-form video uploads."
        breadcrumbLabel="Shorts"
        videoType="short"
        onEditItem={(id) => setEditId(id)}
      />
      {editId && (
        <AdminVideoEditSheet
          videoId={editId}
          contentLabel="short"
          isOpen
          onClose={() => setEditId(null)}
          onSuccess={() => setReloadKey((k) => k + 1)}
        />
      )}
    </>
  )
}
