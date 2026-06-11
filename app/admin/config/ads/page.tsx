"use client"

import { useEffect, useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminAdsConfig, updateAdminAdsConfig } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const PLACEMENTS = [
  { id: "home_banner" as const, label: "Home banner" },
  { id: "shorts_interstitial" as const, label: "Shorts interstitial" },
  { id: "movie_preroll" as const, label: "Movie preroll" },
  { id: "vertical_episode" as const, label: "Vertical episode" },
]

export default function AdminConfigAdsPage() {
  const { data, loading, error, reload } = useAdminQuery(fetchAdminAdsConfig, [])
  const [form, setForm] = useState({
    shortsInterstitialEveryNSwipes: 8,
    moviePrerollSkipSeconds: 15,
    shortsSkipSeconds: 5,
    gafRuleKey: "ad_gaf_allocation",
    impressionRevenueCpmUsd: 2.5,
    placements: {
      home_banner: true,
      shorts_interstitial: true,
      movie_preroll: true,
      vertical_episode: true,
    },
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
      await updateAdminAdsConfig(form)
      await reload()
      setMessage("Ad network settings saved.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  if (loading && !data) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Loading ad config…</p>
  }

  return (
    <>
      <AdminPageHeader
        title="Configuration — Ad network"
        description="Global ad behavior (skip timers, frequency, GAF rule)."
      />
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {message && <p className="text-sm text-muted-foreground mb-4">{message}</p>}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Timing & frequency</h3>
          <div>
            <Label>Shorts interstitial every N swipes</Label>
            <Input
              type="number"
              className="mt-1 w-32"
              value={form.shortsInterstitialEveryNSwipes}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  shortsInterstitialEveryNSwipes: Number(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <Label>Movie preroll skip (seconds)</Label>
            <Input
              type="number"
              className="mt-1 w-32"
              value={form.moviePrerollSkipSeconds}
              onChange={(e) =>
                setForm((f) => ({ ...f, moviePrerollSkipSeconds: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <Label>Shorts skip after (seconds)</Label>
            <Input
              type="number"
              className="mt-1 w-32"
              value={form.shortsSkipSeconds}
              onChange={(e) =>
                setForm((f) => ({ ...f, shortsSkipSeconds: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <Label>GAF allocation rule key</Label>
            <Input
              className="mt-1"
              value={form.gafRuleKey}
              onChange={(e) => setForm((f) => ({ ...f, gafRuleKey: e.target.value }))}
            />
          </div>
          <div>
            <Label>Impression revenue CPM (USD)</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              className="mt-1 w-32"
              value={form.impressionRevenueCpmUsd}
              onChange={(e) =>
                setForm((f) => ({ ...f, impressionRevenueCpmUsd: Number(e.target.value) }))
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              USD earned per 1,000 ad impressions for revenue ledger.
            </p>
          </div>
          <Button className="rounded-full" disabled={busy} onClick={() => void save()}>
            Save network settings
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Placement toggles</h3>
          {PLACEMENTS.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <Label htmlFor={p.id}>{p.label}</Label>
              <Switch
                id={p.id}
                checked={form.placements[p.id]}
                onCheckedChange={(checked) =>
                  setForm((f) => ({
                    ...f,
                    placements: { ...f.placements, [p.id]: checked },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
