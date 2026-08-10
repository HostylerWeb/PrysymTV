"use client"

import { useEffect, useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import {
  fetchAdminContentServicesConfig,
  fetchAdminUsers,
  fetchApiHealth,
  updateAdminContentServicesConfig,
} from "@/lib/api/admin"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  CONTENT_SERVICE_KEYS,
  CONTENT_SERVICE_LABELS,
  type ContentServiceKey,
} from "@/lib/content-services"

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
  const {
    data: contentServices,
    loading: servicesLoading,
    error: servicesError,
    reload: reloadServices,
  } = useAdminQuery(fetchAdminContentServicesConfig, [])
  const [servicesForm, setServicesForm] = useState<Record<ContentServiceKey, boolean>>({
    videos: true,
    movies: true,
    shorts: true,
    verticals: true,
    podcasts: true,
  })
  const [servicesBusy, setServicesBusy] = useState(false)
  const [servicesMessage, setServicesMessage] = useState<string | null>(null)

  useEffect(() => {
    if (contentServices) setServicesForm(contentServices)
  }, [contentServices])

  const admins = teamData?.items ?? []

  const saveContentServices = async () => {
    setServicesBusy(true)
    setServicesMessage(null)
    try {
      await updateAdminContentServicesConfig(servicesForm)
      await reloadServices()
      setServicesMessage("API control settings saved. Web and mobile apps update within a few minutes.")
    } catch (e) {
      setServicesMessage(e instanceof Error ? e.message : "Save failed")
    } finally {
      setServicesBusy(false)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Admin account, team, system health, and consumer API visibility."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]}
      />

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">My account</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="api-control">API Control</TabsTrigger>
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

        <TabsContent value="api-control" className="mt-4 max-w-xl space-y-4">
          <p className="text-sm text-muted-foreground">
            Enable or disable consumer sections on the website and mobile app. Disabled
            sections are hidden from navigation and return unavailable if opened directly.
          </p>
          {servicesError && <p className="text-sm text-destructive">{servicesError}</p>}
          {servicesMessage && (
            <p className="text-sm text-muted-foreground">{servicesMessage}</p>
          )}
          {servicesLoading && !contentServices ? (
            <p className="text-sm text-muted-foreground">Loading API control…</p>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {CONTENT_SERVICE_KEYS.map((key) => (
                <div key={key} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium">{CONTENT_SERVICE_LABELS[key]}</p>
                    <p className="text-xs text-muted-foreground">
                      {key === "videos"
                        ? "Long-form videos and watch pages"
                        : key === "movies"
                          ? "Movies browse and detail pages"
                          : key === "shorts"
                            ? "Shorts feed and player"
                            : key === "verticals"
                              ? "Vertical series and episodes"
                              : "Podcast shows and episodes"}
                    </p>
                  </div>
                  <Switch
                    checked={servicesForm[key]}
                    onCheckedChange={(checked) =>
                      setServicesForm((prev) => ({ ...prev, [key]: checked }))
                    }
                    aria-label={`Toggle ${CONTENT_SERVICE_LABELS[key]}`}
                  />
                </div>
              ))}
            </div>
          )}
          <Button
            className="rounded-full"
            onClick={() => void saveContentServices()}
            disabled={servicesBusy || servicesLoading}
          >
            {servicesBusy ? "Saving…" : "Save API control"}
          </Button>
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
