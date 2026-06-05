"use client"

import { useEffect, useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminProgramsConfig, fetchAdminScorecardConfig, updateAdminScorecardConfig } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminConfigScorecardPage() {
  const { data, loading, error, reload } = useAdminQuery(fetchAdminScorecardConfig, [])
  const { data: programs } = useAdminQuery(fetchAdminProgramsConfig, [])
  const [display, setDisplay] = useState({
    showZeroRevenueLines: "hide" as "hide" | "dash" | "zero",
    defaultImpactPeriod: "30d",
  })
  const [modules, setModules] = useState<
    Array<{ module: number; name: string; percent: number; notes: string }>
  >([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!data) return
    setDisplay(data.scorecardDisplay)
    setModules(data.moduleScorecard)
  }, [data])

  const saveModules = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await updateAdminScorecardConfig({ moduleScorecard: modules })
      await reload()
      setMessage("Module scorecard saved.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  const saveDisplay = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await updateAdminScorecardConfig({ scorecardDisplay: display })
      await reload()
      setMessage("Display settings saved.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  if (loading && !data) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Loading scorecard config…</p>
  }

  return (
    <>
      <AdminPageHeader
        title="Configuration — Mission scorecard"
        description="Impact dashboard display, module progress, GAF program copy."
      />
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {message && <p className="text-sm text-muted-foreground mb-4">{message}</p>}

      <Tabs defaultValue="modules">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="display">Display settings</TabsTrigger>
          <TabsTrigger value="gaf">GAF programs</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="mt-4 space-y-3">
          {modules.map((m, index) => (
            <div
              key={m.module}
              className="rounded-xl border border-border bg-card p-4 grid sm:grid-cols-[1fr_80px_1fr_auto] gap-3 items-start"
            >
              <div>
                <p className="font-medium text-sm">
                  Module {m.module}: {m.name}
                </p>
              </div>
              <div>
                <Label className="text-xs">% complete</Label>
                <Input
                  type="number"
                  className="mt-1 h-8"
                  value={m.percent}
                  onChange={(e) => {
                    const next = [...modules]
                    next[index] = { ...m, percent: Number(e.target.value) }
                    setModules(next)
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea
                  className="mt-1 min-h-[60px] text-sm"
                  value={m.notes}
                  onChange={(e) => {
                    const next = [...modules]
                    next[index] = { ...m, notes: e.target.value }
                    setModules(next)
                  }}
                />
              </div>
            </div>
          ))}
          <Button className="rounded-full" disabled={busy} onClick={() => void saveModules()}>
            Save module scorecard
          </Button>
        </TabsContent>

        <TabsContent value="display" className="mt-4 max-w-xl space-y-4">
          <div>
            <Label>Show zero-value revenue lines</Label>
            <select
              className="mt-1 w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm"
              value={display.showZeroRevenueLines}
              onChange={(e) =>
                setDisplay((d) => ({
                  ...d,
                  showZeroRevenueLines: e.target.value as "hide" | "dash" | "zero",
                }))
              }
            >
              <option value="hide">Hide when $0</option>
              <option value="dash">Show as —</option>
              <option value="zero">Show $0.00</option>
            </select>
          </div>
          <div>
            <Label>Default impact period</Label>
            <Input
              className="mt-1"
              value={display.defaultImpactPeriod}
              onChange={(e) =>
                setDisplay((d) => ({ ...d, defaultImpactPeriod: e.target.value }))
              }
            />
          </div>
          <Button className="rounded-full" disabled={busy} onClick={() => void saveDisplay()}>
            Save display settings
          </Button>
        </TabsContent>

        <TabsContent value="gaf" className="mt-4">
          <p className="text-xs text-muted-foreground mb-4">
            GAF program pillars are managed under Programs config (content discovery metadata).
          </p>
          <ul className="space-y-2">
            {(programs ?? []).map((p) => (
              <li
                key={p.slug}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
              >
                <div>
                  <p className="font-medium">{p.label}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {p.vertical.replace(/_/g, " ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </>
  )
}
