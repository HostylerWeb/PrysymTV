"use client"

import { useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { AdminDeleteButton } from "@/components/admin/admin-confirm-dialog"
import { deleteAdminAdvertiser, fetchAdminAdvertisers, verifyAdminAdvertiser } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminAdvertisersPage() {
  const [busyId, setBusyId] = useState<string | null>(null)
  const { data: advertisers, loading, error, reload } = useAdminQuery(
    fetchAdminAdvertisers,
    [],
  )

  const toggleVerify = async (id: string, verified: boolean) => {
    setBusyId(id)
    try {
      await verifyAdminAdvertiser(id, verified)
      await reload()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Advertiser accounts"
        description="Registered advertisers and verification status."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Advertisers" }]}
      />

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading advertisers…</p>}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Campaigns</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(advertisers ?? []).map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.companyName}</TableCell>
                <TableCell className="text-sm">{a.contactEmail}</TableCell>
                <TableCell className="text-sm">
                  {a.owner?.displayName ?? a.owner?.username ?? "—"}
                </TableCell>
                <TableCell>{a._count.campaigns}</TableCell>
                <TableCell>
                  <AdminStatusPill status={a.isVerified ? "active" : "pending"} />
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={busyId === a.id}
                    onClick={() => void toggleVerify(a.id, !a.isVerified)}
                  >
                    {a.isVerified ? "Revoke" : "Verify"}
                  </Button>
                  <AdminDeleteButton
                    itemLabel="advertiser"
                    onConfirm={async () => {
                      setBusyId(a.id)
                      try {
                        await deleteAdminAdvertiser(a.id)
                        await reload()
                      } finally {
                        setBusyId(null)
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
