"use client"

import { useEffect, useState } from "react"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import {
  fetchAdminUserImpact,
  updateAdminUserImpact,
  type AdminUserImpact,
} from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function currentPeriodMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function AdminUserImpactTab({ userId }: { userId: string }) {
  const [periodMonth, setPeriodMonth] = useState(currentPeriodMonth());
  const [form, setForm] = useState<AdminUserImpact | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { data, loading, error, reload } = useAdminQuery(
    () => fetchAdminUserImpact(userId, periodMonth),
    [userId, periodMonth],
  );

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = async () => {
    if (!form) return;
    setBusy(true);
    setMessage(null);
    try {
      await updateAdminUserImpact(userId, form);
      await reload();
      setMessage("Impact scorecard saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const setNum = (key: keyof AdminUserImpact, value: string) => {
    if (!form) return;
    const n = value === "" ? 0 : Number(value);
    setForm({ ...form, [key]: n });
  };

  if (loading && !form) {
    return <p className="text-sm text-muted-foreground">Loading impact data…</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!form) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label>Period (YYYY-MM)</Label>
          <Input
            type="month"
            className="mt-1 w-40"
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
          />
        </div>
        <Button className="rounded-full" disabled={busy} onClick={() => void save()}>
          Save impact metrics
        </Button>
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div>
        <h3 className="font-semibold text-sm mb-3">Mission impact</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Jobs supported" value={form.jobsSupported} onChange={(v) => setNum("jobsSupported", v)} />
          <Field label="Businesses funded" value={form.businessesFunded} onChange={(v) => setNum("businessesFunded", v)} />
          <Field label="GAF dollars invested" value={form.dollarsInvested} onChange={(v) => setNum("dollarsInvested", v)} step="0.01" />
          <Field label="Workforce opportunities" value={form.workforceOpportunities} onChange={(v) => setNum("workforceOpportunities", v)} />
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">Financial breakdown</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Total earnings (USD)" value={form.earningsUsd} onChange={(v) => setNum("earningsUsd", v)} step="0.01" />
          <Field label="Ad revenue" value={form.adRevenueUsd} onChange={(v) => setNum("adRevenueUsd", v)} step="0.01" />
          <Field label="Sponsorship" value={form.sponsorshipRevenueUsd} onChange={(v) => setNum("sponsorshipRevenueUsd", v)} step="0.01" />
          <Field label="Merchandise" value={form.merchandiseRevenueUsd} onChange={(v) => setNum("merchandiseRevenueUsd", v)} step="0.01" />
          <Field label="Donations" value={form.donationsUsd} onChange={(v) => setNum("donationsUsd", v)} step="0.01" />
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">Performance</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Watch hours" value={form.watchHours} onChange={(v) => setNum("watchHours", v)} step="0.1" />
          <Field label="Subscribers" value={form.subscriberCount} onChange={(v) => setNum("subscriberCount", v)} />
          <Field label="Retention rate (0–1)" value={form.retentionRate ?? 0} onChange={(v) => setNum("retentionRate", v)} step="0.01" />
          <Field label="Engagement score" value={form.engagementScore ?? 0} onChange={(v) => setNum("engagementScore", v)} step="0.1" />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step={step}
        className="mt-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
