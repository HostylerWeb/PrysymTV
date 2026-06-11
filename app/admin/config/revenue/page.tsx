"use client"

import { useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminRevenueRules, updateAdminRevenueRule } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function bpsToPct(bps: number) {
  return (bps / 100).toFixed(1)
}

function pctToBps(pct: string) {
  return Math.round(parseFloat(pct) * 100)
}

export default function AdminConfigRevenuePage() {
  const { data: rules, loading, error, reload } = useAdminQuery(fetchAdminRevenueRules, [])
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [form, setForm] = useState({
    creator: "",
    platform: "",
    gaf: "",
    creatorDevFund: "",
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const selectRule = (ruleKey: string) => {
    const rule = rules?.find((r) => r.ruleKey === ruleKey)
    if (!rule) return
    setActiveKey(ruleKey)
    setForm({
      creator: bpsToPct(rule.creatorBps),
      platform: bpsToPct(rule.platformBps),
      gaf: bpsToPct(rule.gafBps),
      creatorDevFund: bpsToPct(rule.creatorDevFundBps),
    })
    setSaveError(null)
  }

  const save = async () => {
    if (!activeKey) return
    setSaving(true)
    setSaveError(null)
    try {
      await updateAdminRevenueRule(activeKey, {
        creatorBps: pctToBps(form.creator),
        platformBps: pctToBps(form.platform),
        gafBps: pctToBps(form.gaf),
        creatorDevFundBps: pctToBps(form.creatorDevFund),
      })
      await reload()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed — splits must total 100%")
    } finally {
      setSaving(false)
    }
  }

  if (loading && !rules) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Loading rules…</p>
  }

  if (error) {
    return <p className="text-sm text-destructive py-12 text-center">{error}</p>
  }

  const active = rules?.find((r) => r.ruleKey === activeKey)

  return (
    <>
      <AdminPageHeader
        title="Configuration — Revenue"
        description="Edit how each revenue type is split between creator, platform, GAF, and creator dev fund. Total must equal 100%."
      />

      <p className="text-sm text-muted-foreground mb-6 rounded-xl border border-border bg-card p-4">
        These rules control <strong>revenue splits</strong>, not customer-facing prices. Set the
        Prysym Membership price under{" "}
        <a href="/admin/config/economy" className="text-primary underline">
          Configuration → Economy
        </a>
        . Rule names may still show legacy dollar amounts in older databases — edit the name on
        each rule if needed.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          {(rules ?? []).map((r) => (
            <button
              key={r.ruleKey}
              type="button"
              onClick={() => selectRule(r.ruleKey)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                activeKey === r.ruleKey
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-secondary/30"
              }`}
            >
              <p className="font-medium">{r.name}</p>
              <p className="text-xs font-mono text-muted-foreground">{r.ruleKey}</p>
            </button>
          ))}
        </div>

        {active ? (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <p className="font-medium">{active.name}</p>
            {active.description && (
              <p className="text-sm text-muted-foreground">{active.description}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Creator %</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={form.creator}
                  onChange={(e) => setForm((f) => ({ ...f, creator: e.target.value }))}
                  step={0.1}
                />
              </div>
              <div>
                <Label>Platform %</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={form.platform}
                  onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                  step={0.1}
                />
              </div>
              <div>
                <Label>GAF %</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={form.gaf}
                  onChange={(e) => setForm((f) => ({ ...f, gaf: e.target.value }))}
                  step={0.1}
                />
              </div>
              <div>
                <Label>Creator dev fund %</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={form.creatorDevFund}
                  onChange={(e) => setForm((f) => ({ ...f, creatorDevFund: e.target.value }))}
                  step={0.1}
                />
              </div>
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            <Button className="rounded-full" disabled={saving} onClick={() => void save()}>
              {saving ? "Saving…" : "Save rule"}
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Select a rule to edit
          </div>
        )}
      </div>
    </>
  )
}
