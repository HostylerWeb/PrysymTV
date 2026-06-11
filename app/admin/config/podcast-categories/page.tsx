"use client"

import { useEffect, useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import {
  TaxonomyConfigTable,
  withClientIds,
  type TaxonomyRow,
} from "@/components/admin/taxonomy-config-table"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import {
  fetchAdminPodcastCategoriesConfig,
  updateAdminPodcastCategoriesConfig,
} from "@/lib/api/admin"
import { Button } from "@/components/ui/button"

export default function AdminConfigPodcastCategoriesPage() {
  const { data: categories, loading, error, reload } = useAdminQuery(
    fetchAdminPodcastCategoriesConfig,
    [],
  )
  const [rows, setRows] = useState<TaxonomyRow[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (categories) setRows(withClientIds(categories))
  }, [categories])

  const save = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const payload = rows.map(({ _clientId: _, ...row }) => row)
      await updateAdminPodcastCategoriesConfig(payload)
      await reload()
      setMessage("Podcast categories saved.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  if (loading && !categories) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        Loading podcast categories…
      </p>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive py-12 text-center">{error}</p>
  }

  return (
    <>
      <AdminPageHeader
        title="Configuration — Podcast categories"
        description="Taxonomy for podcast shows, /podcasts filters, and upload forms."
        actions={
          <Button className="rounded-full" size="sm" disabled={busy} onClick={() => void save()}>
            Save categories
          </Button>
        }
      />
      {message && <p className="text-sm text-muted-foreground mb-4">{message}</p>}
      <TaxonomyConfigTable rows={rows} onChange={setRows} addLabel="Add podcast category" />
    </>
  )
}
