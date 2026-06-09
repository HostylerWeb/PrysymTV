"use client"

import { Plus, Trash2 } from "lucide-react"
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

export type TaxonomyRow = {
  slug: string
  label: string
  isActive: boolean
  sortOrder: number
}

function slugify(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "category"
  )
}

type TaxonomyConfigTableProps = {
  rows: TaxonomyRow[]
  onChange: (rows: TaxonomyRow[]) => void
  addLabel?: string
}

export function TaxonomyConfigTable({
  rows,
  onChange,
  addLabel = "Add category",
}: TaxonomyConfigTableProps) {
  const updateRow = (index: number, patch: Partial<TaxonomyRow>) => {
    const next = [...rows]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index))
  }

  const addRow = () => {
    const label = "New category"
    onChange([
      ...rows,
      {
        slug: slugify(label),
        label,
        isActive: true,
        sortOrder: rows.length,
      },
    ])
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={`${row.slug}-${index}`}>
                <TableCell>
                  <Input
                    className="h-8"
                    value={row.label}
                    onChange={(e) => {
                      const label = e.target.value
                      const patch: Partial<TaxonomyRow> = { label }
                      if (row.slug === slugify(row.label)) {
                        patch.slug = slugify(label)
                      }
                      updateRow(index, patch)
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="h-8 font-mono text-xs"
                    value={row.slug}
                    onChange={(e) =>
                      updateRow(index, {
                        slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="h-8 w-16"
                    value={row.sortOrder}
                    onChange={(e) =>
                      updateRow(index, { sortOrder: Number(e.target.value) })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={row.isActive}
                    onCheckedChange={(checked) =>
                      updateRow(index, { isActive: checked })
                    }
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
      <Button type="button" variant="secondary" size="sm" className="rounded-full gap-1.5" onClick={addRow}>
        <Plus className="w-4 h-4" />
        {addLabel}
      </Button>
    </div>
  )
}
