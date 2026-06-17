"use client"

import { useState } from "react"
import { AdminContentVideoPage } from "@/components/admin/admin-content-video-page"
import { AdminVideoEditSheet } from "@/components/admin/admin-video-edit-sheet"

export default function AdminContentVideosPage() {
  const [editId, setEditId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  return (
    <>
      <AdminContentVideoPage
        key={reloadKey}
        title="Videos"
        description="Long-form uploads from creators."
        breadcrumbLabel="Videos"
        videoType="video"
        onEditItem={(id) => setEditId(id)}
      />
      {editId && (
        <AdminVideoEditSheet
          videoId={editId}
          contentLabel="video"
          isOpen
          onClose={() => setEditId(null)}
          onSuccess={() => setReloadKey((k) => k + 1)}
        />
      )}
    </>
  )
}
