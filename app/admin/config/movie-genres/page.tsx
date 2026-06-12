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
  fetchAdminMovieGenresConfig,
  updateAdminMovieGenresConfig,
} from "@/lib/api/admin"
import { Button } from "@/components/ui/button"

export default function AdminConfigMovieGenresPage() {
  const { data: genres, loading, error, reload } = useAdminQuery(
    fetchAdminMovieGenresConfig,
    [],
  )
  const [rows, setRows] = useState<TaxonomyRow[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (genres) setRows(withClientIds(genres))
  }, [genres])

  const save = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const payload = rows.map(({ _clientId: _, ...row }) => row)
      await updateAdminMovieGenresConfig(payload)
      await reload()
      setMessage("Movie genres saved.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  if (loading && !genres) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        Loading movie genres…
      </p>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive py-12 text-center">{error}</p>
  }

  return (
    <>
      <AdminPageHeader
        title="Configuration — Movie genres"
        description="Genres for the /movies catalog, admin movie upload, and browse filters."
        actions={
          <Button className="rounded-full" size="sm" disabled={busy} onClick={() => void save()}>
            Save genres
          </Button>
        }
      />
      {message && <p className="text-sm text-muted-foreground mb-4">{message}</p>}
      <TaxonomyConfigTable rows={rows} onChange={setRows} addLabel="Add genre" />
    </>
  )
}
