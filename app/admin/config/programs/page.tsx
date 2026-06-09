"use client"

import Link from "next/link"
import { Plus, Trash2 } from "lucide-react"
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

const VERTICAL_OPTIONS = [
  { value: "general", label: "General" },
  { value: "sports", label: "Sports" },
  { value: "concert", label: "Concerts" },
  { value: "community_event", label: "Community" },
  { value: "education", label: "Education" },
  { value: "podcast", label: "Podcast hub" },
] as const

function slugify(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "category"
  )
}

function defaultHref(slug: string): string {
  return slug === "podcasts" ? "/podcasts" : `/videos?category=${slug}`
}

export default function AdminConfigProgramsPage() {
  const { data: programs, loading, error, reload } = useAdminQuery(fetchAdminProgramsConfig, [])
  const [rows, setRows] = useState<ProgramRow[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (programs) setRows(programs)
  }, [programs])

  const updateRow = (index: number, patch: Partial<ProgramRow>) => {
    const next = [...rows]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  const onChange = (next: ProgramRow[]) => {
    setRows(next)
  }

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index))
  }

  const addRow = () => {
    const label = "New category"
    const slug = slugify(label)
    onChange([
      ...rows,
      {
        slug,
        label,
        vertical: "general",
        description: "",
        href: defaultHref(slug),
        isActive: true,
        sortOrder: rows.length,
      },
    ])
  }

  const save = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await updateAdminProgramsConfig(rows)
      await reload()
      setMessage("Video categories saved.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  if (loading && !programs) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Loading categories…</p>
  }

  if (error) {
    return <p className="text-sm text-destructive py-12 text-center">{error}</p>
  }

  return (
    <>
      <AdminPageHeader
        title="Configuration — Video categories"
        description="Long-form video categories for /videos, uploads, and program hubs. Vertical maps each category to a content pillar in the database (used to filter /videos and live browse). Podcast hub entries link to /podcasts."
        actions={
          <Button className="rounded-full" size="sm" disabled={busy} onClick={() => void save()}>
            Save categories
          </Button>
        }
      />
      {message && <p className="text-sm text-muted-foreground mb-4">{message}</p>}

      <div className="space-y-3">
        <div className="rounded-xl border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead title="Content pillar used for API filtering (sports, concert, etc.)">
                  Vertical
                </TableHead>
                <TableHead>Sort</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p, index) => (
                <TableRow key={`${p.slug}-${index}`}>
                  <TableCell>
                    <Input
                      className="h-8 min-w-[120px]"
                      value={p.label}
                      onChange={(e) => {
                        const label = e.target.value
                        const patch: Partial<ProgramRow> = { label }
                        if (p.slug === slugify(p.label)) {
                          const slug = slugify(label)
                          patch.slug = slug
                          patch.href = defaultHref(slug)
                        }
                        updateRow(index, patch)
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 min-w-[100px] font-mono text-xs"
                      value={p.slug}
                      onChange={(e) => {
                        const slug = e.target.value.toLowerCase().replace(/\s+/g, "-")
                        updateRow(index, { slug, href: defaultHref(slug) })
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      value={p.vertical}
                      onChange={(e) => updateRow(index, { vertical: e.target.value })}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {VERTICAL_OPTIONS.map((v) => (
                        <option key={v.value} value={v.value}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-8 w-16"
                      value={p.sortOrder}
                      onChange={(e) =>
                        updateRow(index, { sortOrder: Number(e.target.value) })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={p.isActive}
                      onCheckedChange={(checked) => updateRow(index, { isActive: checked })}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={p.href} className="text-primary hover:underline text-xs whitespace-nowrap">
                      {p.href}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 min-w-[160px]"
                      value={p.description}
                      onChange={(e) => updateRow(index, { description: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeRow(index)}
                      aria-label="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-full gap-1.5"
          onClick={addRow}
        >
          <Plus className="w-4 h-4" />
          Add video category
        </Button>
      </div>
    </>
  )
}
