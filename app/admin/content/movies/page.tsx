"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { AdminContentVideoPage } from "@/components/admin/admin-content-video-page"
import { AdminMovieUploadSheet } from "@/components/admin/admin-movie-upload-sheet"
import { Button } from "@/components/ui/button"

export default function AdminContentMoviesPage() {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  return (
    <>
      <AdminContentVideoPage
        key={reloadKey}
        title="Movies"
        description="Upload and manage feature-length titles for the public /movies catalog."
        breadcrumbLabel="Movies"
        videoType="movie"
        headerActions={
          <Button
            className="rounded-full gap-2"
            size="sm"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="w-4 h-4" />
            Upload movie
          </Button>
        }
      />
      <AdminMovieUploadSheet
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => {
          setReloadKey((k) => k + 1)
        }}
      />
    </>
  )
}
