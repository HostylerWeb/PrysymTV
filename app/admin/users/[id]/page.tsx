"use client"

import Link from "next/link"
import { use, useState } from "react"
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import {
  adjustAdminUserCoins,
  banAdminUser,
  fetchAdminUser,
  updateAdminPartnerTier,
  verifyAdminUser,
} from "@/lib/api/admin"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [tab, setTab] = useState("overview")
  const [coinAdjust, setCoinAdjust] = useState("")
  const [partnerTier, setPartnerTier] = useState<string | null>(null)

  const { data: user, loading, error, reload } = useAdminQuery(
    () => fetchAdminUser(id),
    [id],
  )

  if (loading) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Loading user…</p>
  }

  if (error || !user) {
    return <p className="text-sm text-destructive py-12 text-center">{error ?? "User not found"}</p>
  }

  const tier = partnerTier ?? user.partnerTier

  return (
    <>
      <AdminPageHeader
        title={user.displayName ?? user.username}
        description={`@${user.username} · ${user.email}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Users", href: "/admin/users" },
          { label: user.username },
        ]}
        actions={
          <>
            <AdminStatusPill status={user.isBanned ? "banned" : "active"} />
            {user.isVerified && <AdminStatusPill status="approved" />}
          </>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="streamer">Streamer</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="impact">Impact scorecard</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Role" value={user.role} />
            <Field label="Partner tier" value={user.partnerTier} />
            <Field label="Coins" value={String(user.coins)} />
            <Field label="Joined" value={user.joinedAt} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">Content items</p>
              <p className="text-2xl font-bold mt-1">{user.counts.videos}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-2xl font-bold mt-1">${user.financial.balanceUsd.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">Reports received</p>
              <p className="text-2xl font-bold mt-1">{user.reports.received.length}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="streamer">
          <p className="text-sm text-muted-foreground mb-4">
            Streamer status: <AdminStatusPill status={user.streamerStatus} />
          </p>
          {user.streamerApplication && (
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/admin/streamers/${user.streamerApplication.id}`}>
                Open application
              </Link>
            </Button>
          )}
        </TabsContent>

        <TabsContent value="content">
          {user.content.length === 0 ? (
            <p className="text-sm text-muted-foreground">No uploaded content.</p>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.content.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="capitalize">{item.type}</TableCell>
                      <TableCell className="font-medium max-w-[240px] truncate">{item.title}</TableCell>
                      <TableCell className="text-right tabular-nums">{item.views.toLocaleString()}</TableCell>
                      <TableCell>
                        <AdminStatusPill status={item.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Available balance</p>
              <p className="text-2xl font-bold text-primary mt-1">
                ${user.financial.balanceUsd.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Lifetime earnings</p>
              <p className="text-2xl font-bold mt-1">
                ${user.financial.lifetimeEarningsUsd.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Coin balance</p>
              <p className="text-2xl font-bold mt-1">{user.financial.coins.toLocaleString()}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border p-5 max-w-md space-y-3">
            <Label htmlFor="coin-adjust">Adjust coins (admin)</Label>
            <div className="flex gap-2">
              <Input
                id="coin-adjust"
                type="number"
                placeholder="+100 or -50"
                value={coinAdjust}
                onChange={(e) => setCoinAdjust(e.target.value)}
              />
              <Button
                className="rounded-full shrink-0"
                onClick={() => {
                  const delta = parseInt(coinAdjust, 10)
                  if (!delta) return
                  void adjustAdminUserCoins(id, delta).then(() => {
                    setCoinAdjust("")
                    void reload()
                  })
                }}
              >
                Apply
              </Button>
            </div>
          </div>

          {user.financial.payouts.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Payout history</h3>
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.financial.payouts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.id}</TableCell>
                        <TableCell className="text-right">${p.amountUsd}</TableCell>
                        <TableCell>
                          <AdminStatusPill status={p.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ReportsTable title="Reports received" rows={user.reports.received} />
          <ReportsTable title="Reports filed by user" rows={user.reports.filed} />
        </TabsContent>

        <TabsContent value="impact" className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Jobs supported</Label>
              <Input type="number" defaultValue={0} className="mt-1" />
            </div>
            <div>
              <Label>Businesses funded</Label>
              <Input type="number" defaultValue={0} className="mt-1" />
            </div>
          </div>
          <Button className="rounded-full">Save impact metrics</Button>
          <p className="text-xs text-muted-foreground">Impact scorecard API — Phase 3.</p>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="rounded-xl border border-border p-5 space-y-4 max-w-lg">
            <div className="flex gap-2">
              <Button
                className="rounded-full flex-1"
                onClick={() => void verifyAdminUser(id, true).then(() => reload())}
              >
                Verify user
              </Button>
              <Button
                variant="outline"
                className="rounded-full flex-1"
                onClick={() => void verifyAdminUser(id, false).then(() => reload())}
              >
                Remove verify
              </Button>
            </div>
            <div>
              <Label>Partner tier</Label>
              <Select value={tier} onValueChange={setPartnerTier}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="rising">Rising</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="flagship">Flagship</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="rounded-full mt-3"
                onClick={() =>
                  void updateAdminPartnerTier(
                    id,
                    tier as "standard" | "rising" | "partner" | "flagship",
                  ).then(() => reload())
                }
              >
                Save tier
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 max-w-lg">
            <p className="font-semibold text-destructive mb-2">Danger zone</p>
            <AdminConfirmDialog
              title={`Ban @${user.username}?`}
              description="The user will lose access to the platform."
              confirmLabel="Ban permanently"
              onConfirm={() => void banAdminUser(id, true).then(() => reload())}
              trigger={
                <Button variant="destructive" className="rounded-full w-full">
                  Ban user permanently
                </Button>
              }
            />
            {user.isBanned && (
              <Button
                variant="outline"
                className="rounded-full w-full mt-2"
                onClick={() => void banAdminUser(id, false).then(() => reload())}
              >
                Unban user
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium capitalize">{value}</p>
    </div>
  )
}

function ReportsTable({
  title,
  rows,
}: {
  title: string
  rows: Array<{ id: string; target: string; reason: string; status: string; date: string }>
}) {
  return (
    <div>
      <h3 className="font-semibold mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">None</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.target}</TableCell>
                  <TableCell className="capitalize">{r.reason}</TableCell>
                  <TableCell>
                    <AdminStatusPill status={r.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.date}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <Link href={`/admin/moderation/${r.id}`}>Review</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
