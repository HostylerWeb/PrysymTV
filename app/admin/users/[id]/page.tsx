"use client"

import Link from "next/link"
import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog"
import { AdminUserImpactTab } from "@/components/admin/admin-user-impact-tab"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import {
  adjustAdminUserCoins,
  banAdminUser,
  deleteAdminUser,
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
import { formatUserGenderLabel } from "@/lib/user-gender"
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
  const router = useRouter()
  const [tab, setTab] = useState("overview")
  const [deleteBusy, setDeleteBusy] = useState(false)
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
          <TabsTrigger value="store">Store</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="impact">Impact scorecard</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={`/creator/${user.username}`} target="_blank" rel="noopener noreferrer">
                Public profile
              </Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Gender" value={formatUserGenderLabel(user.gender)} />
            <Field label="Birth date" value={user.birthDate ?? "Not set"} />
            <Field label="Role" value={user.role} />
            <Field label="Partner tier" value={user.partnerTier} />
            <Field label="Premium" value={user.premiumTier} />
            <Field label="Coins" value={String(user.coins)} />
            <Field label="Joined" value={user.joinedAt} />
            <Field label="Followers" value={String(user.counts.followers)} />
            <Field label="Following" value={String(user.counts.following)} />
            <Field label="Live streams" value={String(user.counts.streams)} />
          </div>
          {user.bio && (
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">Bio</p>
              <p className="text-sm">{user.bio}</p>
            </div>
          )}
          {user.socialLinks.length > 0 && (
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground mb-2">Social links</p>
              <ul className="space-y-1 text-sm">
                {user.socialLinks.map((l) => (
                  <li key={l.url}>
                    <span className="text-muted-foreground">{l.label}:</span>{" "}
                    <a href={l.url} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      {l.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">Videos / shorts / movies</p>
              <p className="text-2xl font-bold mt-1">{user.counts.videos}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">Vertical series</p>
              <p className="text-2xl font-bold mt-1">{user.counts.verticalSeries}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">Podcast shows</p>
              <p className="text-2xl font-bold mt-1">{user.counts.podcastShows}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-2xl font-bold mt-1">${user.financial.balanceUsd.toLocaleString()}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="streamer">
          <p className="text-sm text-muted-foreground mb-4">
            Streamer status: <AdminStatusPill status={user.streamerStatus} />
          </p>
          {user.streamerApplication && (
            <Button asChild variant="outline" className="rounded-full mb-6">
              <Link href={`/admin/applications/streamer/${user.streamerApplication.id}`}>
                Open live streaming application
              </Link>
            </Button>
          )}
          <p className="text-sm text-muted-foreground mb-4">
            Vertical creator:{" "}
            <AdminStatusPill status={user.verticalCreatorStatus ?? "none"} />
          </p>
          {user.verticalCreatorApplication && (
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/admin/applications/vertical/${user.verticalCreatorApplication.id}`}>
                Open vertical series application
              </Link>
            </Button>
          )}
        </TabsContent>

        <TabsContent value="store" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Store access:{" "}
            <AdminStatusPill status={user.storeCreatorStatus ?? "none"} />
          </p>
          {user.storeCreatorApplication && (
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/admin/applications/store/${user.storeCreatorApplication.id}`}>
                Open Creator Store application
              </Link>
            </Button>
          )}
          {(user.storeProducts?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No store products listed.</p>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(user.storeProducts ?? []).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="capitalize">
                        {p.productType === "merchandise" ? "Physical" : p.productType}
                      </TableCell>
                      <TableCell>${p.priceUsd.toFixed(2)}</TableCell>
                      <TableCell>{p.inventory ?? "—"}</TableCell>
                      <TableCell>
                        <AdminStatusPill status={p.status === "active" ? "active" : "pending"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {user.verticalSeries.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Vertical series</h3>
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Series</TableHead>
                      <TableHead className="text-right">Episodes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.verticalSeries.map((s) => (
                      <TableRow key={s.slug}>
                        <TableCell className="font-medium">{s.title}</TableCell>
                        <TableCell className="text-right">{s.episodeCount}</TableCell>
                        <TableCell>
                          <AdminStatusPill status={s.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline" className="rounded-full">
                            <Link href={s.siteHref} target="_blank" rel="noopener noreferrer">
                              Open
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {user.content.length === 0 ? (
            <p className="text-sm text-muted-foreground">No uploaded content.</p>
          ) : (
            <div>
              <h3 className="font-semibold mb-3">All content</h3>
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.content.map((item) => (
                      <TableRow key={`${item.type}-${item.id}`}>
                        <TableCell className="capitalize text-xs">
                          {item.type.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="font-medium max-w-[240px] truncate">{item.title}</TableCell>
                        <TableCell className="text-right tabular-nums">{item.views.toLocaleString()}</TableCell>
                        <TableCell>
                          <AdminStatusPill status={item.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline" className="rounded-full">
                            <Link href={item.siteHref} target="_blank" rel="noopener noreferrer">
                              Open
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="rounded-xl border border-border p-5 space-y-3">
            <h3 className="font-semibold">Saved payout method</h3>
            {user.payoutProfile ? (
              <>
                <p className="text-sm text-muted-foreground capitalize">
                  {user.payoutProfile.method.replace(/_/g, " ")} · updated{" "}
                  {new Date(user.payoutProfile.updatedAt).toLocaleDateString()}
                </p>
                <ul className="text-sm space-y-1">
                  {Object.entries(user.payoutProfile.details).map(([key, value]) => (
                    <li key={key} className="flex gap-2">
                      <span className="text-muted-foreground capitalize shrink-0">
                        {key.replace(/([A-Z])/g, " $1")}:
                      </span>
                      <span className="font-medium break-all">{value}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not configured — creator must set this in Performance &amp; Revenue before
                requesting payouts.
              </p>
            )}
          </div>

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
                      <TableHead>Method</TableHead>
                      <TableHead>Pay to</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.financial.payouts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.id.slice(0, 8)}…</TableCell>
                        <TableCell className="text-right">${p.amountUsd}</TableCell>
                        <TableCell className="capitalize text-xs">
                          {p.method.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px]">
                          {p.payoutDetails ? (
                            <ul className="space-y-0.5">
                              {Object.entries(p.payoutDetails).map(([k, v]) => (
                                <li key={k} className="truncate">
                                  <span className="text-muted-foreground">{k}:</span> {v}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            "—"
                          )}
                        </TableCell>
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

        <TabsContent value="impact">
          <AdminUserImpactTab userId={id} />
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
            <AdminConfirmDialog
              title={`Delete @${user.username}?`}
              description="Permanently removes the account and cascades their content. This cannot be undone."
              confirmLabel="Delete account"
              onConfirm={async () => {
                setDeleteBusy(true)
                try {
                  await deleteAdminUser(id)
                  router.push("/admin/users")
                } finally {
                  setDeleteBusy(false)
                }
              }}
              trigger={
                <Button variant="destructive" className="rounded-full w-full mt-3" disabled={deleteBusy}>
                  Delete account
                </Button>
              }
            />
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
