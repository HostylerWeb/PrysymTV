"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminProgramsConfig, updateAdminProgramsConfig } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ProgramRow = Awaited<ReturnType<typeof fetchAdminProgramsConfig>>[number]

export default function AdminConfigProgramsPage() {
  const { data: programs, loading, error, reload } = useAdminQuery(fetchAdminProgramsConfig, [])
  const [rows, setRows] = useState<ProgramRow[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (programs) setRows(programs)
  }, [programs])

  const save = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await updateAdminProgramsConfig(rows)
      await reload()
      setMessage("Programs saved.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  if (loading && !programs) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Loading programs…</p>
  }

  if (error) {
    return <p className="text-sm text-destructive py-12 text-center">{error}</p>
  }

  return (
    <>
      <AdminPageHeader
        title="Configuration — Programs"
        description="Content pillar categories shown on /videos and program hubs."
        actions={
          <Button className="rounded-full" size="sm" disabled={busy} onClick={() => void save()}>
            Save programs
          </Button>
        }
      />
      {message && <p className="text-sm text-muted-foreground mb-4">{message}</p>}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Consumer link</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p, index) => (
              <TableRow key={p.slug}>
                <TableCell>
                  <Input
                    className="h-8"
                    value={p.label}
                    onChange={(e) => {
                      const next = [...rows]
                      next[index] = { ...p, label: e.target.value }
                      setRows(next)
                    }}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">{p.slug}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="h-8 w-16"
                    value={p.sortOrder}
                    onChange={(e) => {
                      const next = [...rows]
                      next[index] = { ...p, sortOrder: Number(e.target.value) }
                      setRows(next)
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={p.isActive}
                    onCheckedChange={(checked) => {
                      const next = [...rows]
                      next[index] = { ...p, isActive: checked }
                      setRows(next)
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Link href={p.href} className="text-primary hover:underline text-sm">
                    {p.href}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[240px]">
                  {p.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
