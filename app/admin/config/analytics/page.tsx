"use client"

import { useEffect, useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminAnalyticsConfig, updateAdminAnalyticsConfig } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const KPI_TOGGLES = [
  { key: "dau" as const, label: "DAU" },
  { key: "liveNow" as const, label: "Live now" },
  { key: "revenueToday" as const, label: "Revenue today" },
  { key: "pendingReports" as const, label: "Pending reports" },
  { key: "pendingPayouts" as const, label: "Pending payouts" },
]

export default function AdminConfigAnalyticsPage() {
  const { data, loading, error, reload } = useAdminQuery(fetchAdminAnalyticsConfig, [])
  const [form, setForm] = useState({
    defaultRange: "30d" as "today" | "7d" | "30d",
    kpiVisibility: {
      dau: true,
      liveNow: true,
      revenueToday: true,
      pendingReports: true,
      pendingPayouts: true,
    },
    alertPendingReportsThreshold: 50,
  })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const save = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await updateAdminAnalyticsConfig(form)
      await reload()
      setMessage("Analytics settings saved.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  if (loading && !data) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Loading analytics config…</p>
  }

  return (
    <>
      <AdminPageHeader
        title="Configuration — Analytics defaults"
        description="Dashboard time range, KPI visibility, alert thresholds."
      />
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {message && <p className="text-sm text-muted-foreground mb-4">{message}</p>}

      <div className="max-w-lg space-y-6 rounded-xl border border-border bg-card p-6">
        <div>
          <Label>Default dashboard range</Label>
          <select
            className="mt-1 w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm"
            value={form.defaultRange}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                defaultRange: e.target.value as "today" | "7d" | "30d",
              }))
            }
          >
            <option value="today">Today</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
          </select>
        </div>
        <div>
          <Label className="mb-3 block">KPI cards on dashboard</Label>
          <div className="space-y-3">
            {KPI_TOGGLES.map((k) => (
              <div key={k.key} className="flex items-center justify-between">
                <span className="text-sm">{k.label}</span>
                <Switch
                  checked={form.kpiVisibility[k.key]}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({
                      ...f,
                      kpiVisibility: { ...f.kpiVisibility, [k.key]: checked },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label>Alert: pending reports above</Label>
          <input
            type="number"
            className="mt-1 w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm"
            value={form.alertPendingReportsThreshold}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                alertPendingReportsThreshold: Number(e.target.value),
              }))
            }
          />
        </div>
        <Button className="rounded-full" disabled={busy} onClick={() => void save()}>
          Save analytics settings
        </Button>
      </div>
    </>
  )
}
