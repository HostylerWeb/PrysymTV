"use client"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminUsers, fetchApiHealth } from "@/lib/api/admin"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const { data: health, loading: healthLoading, error: healthError } = useAdminQuery(
    fetchApiHealth,
    [],
  )
  const { data: teamData, loading: teamLoading } = useAdminQuery(
    () => fetchAdminUsers({ type: "admin", limit: 50 }),
    [],
  )

  const admins = teamData?.items ?? []

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Admin account, team, system health."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]}
      />

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">My account</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="health">System health</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4 max-w-md space-y-4">
          <div>
            <Label>Display name</Label>
            <Input className="mt-1" value={user?.name ?? ""} readOnly />
          </div>
          <div>
            <Label>Username</Label>
            <Input className="mt-1" value={user ? `@${user.username}` : ""} readOnly />
          </div>
          <div>
            <Label>Email</Label>
            <Input className="mt-1" type="email" value={user?.email ?? ""} disabled />
          </div>
          <Button className="rounded-full" disabled>
            Change password
          </Button>
          <p className="text-xs text-muted-foreground">
            Password changes use the standard account flow (not yet in admin).
          </p>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Users with <code className="text-xs bg-secondary px-1 rounded">role: admin</code>
          </p>
          {teamLoading && (
            <p className="text-sm text-muted-foreground">Loading team…</p>
          )}
          <ul className="rounded-xl border border-border divide-y divide-border">
            {admins.length === 0 && !teamLoading ? (
              <li className="p-4 text-sm text-muted-foreground">No admin users found.</li>
            ) : (
              admins.map((a) => (
                <li key={a.id} className="p-4 flex justify-between text-sm">
                  <span>@{a.username}</span>
                  <span className="text-muted-foreground">{a.role}</span>
                </li>
              ))
            )}
          </ul>
        </TabsContent>

        <TabsContent value="health" className="mt-4 grid sm:grid-cols-2 gap-4">
          {healthLoading && (
            <p className="text-sm text-muted-foreground col-span-2">Checking services…</p>
          )}
          {healthError && (
            <p className="text-sm text-destructive col-span-2">{healthError}</p>
          )}
          {health && (
            <>
              <div className="rounded-xl border border-border p-4">
                <div className="flex justify-between items-center">
                  <p className="font-medium">API</p>
                  <span className="text-emerald-400 text-xs">{health.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Build {health.build} · checked {new Date(health.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="flex justify-between items-center">
                  <p className="font-medium">PostgreSQL</p>
                  <span className="text-emerald-400 text-xs">ok</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Connected (via health probe)</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="flex justify-between items-center">
                  <p className="font-medium">SMTP</p>
                  <span
                    className={
                      health.smtp === "ready"
                        ? "text-emerald-400 text-xs"
                        : "text-amber-400 text-xs"
                    }
                  >
                    {health.smtp}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Mail delivery configuration</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Storage</p>
                  <span className="text-muted-foreground text-xs">{health.storage}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Video processing: {health.videoProcessing}
                </p>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
