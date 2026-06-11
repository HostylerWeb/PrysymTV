"use client"

import {
  buildPresetRange,
  type AdminDateRangeValue,
} from "@/lib/admin/date-range"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const PRESETS = ["7d", "30d", "90d"] as const

type Props = {
  value: AdminDateRangeValue | null;
  onChange: (value: AdminDateRangeValue | null) => void;
  className?: string;
  allowClear?: boolean;
  label?: string;
};

export function AdminDateRangePicker({
  value,
  onChange,
  className,
  allowClear = false,
  label = "Date range",
}: Props) {
  if (!value && allowClear) {
    return (
      <div className={className}>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => onChange(buildPresetRange("30d"))}
        >
          Filter by date
        </Button>
      </div>
    )
  }

  if (!value) return null

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-sm text-muted-foreground mr-1">{label}</span>
        {PRESETS.map((preset) => (
          <Button
            key={preset}
            type="button"
            size="sm"
            variant={value.preset === preset ? "default" : "outline"}
            className="rounded-full"
            onClick={() => onChange(buildPresetRange(preset))}
          >
            {preset}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant={value.preset === "custom" ? "default" : "outline"}
          className="rounded-full"
          onClick={() =>
            onChange({
              ...value,
              preset: "custom",
            })
          }
        >
          Custom
        </Button>
        {allowClear && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-full"
            onClick={() => onChange(null)}
          >
            Clear
          </Button>
        )}
      </div>
      {value.preset === "custom" && (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              className="mt-1 w-[160px]"
              value={value.dateFrom}
              max={value.dateTo}
              onChange={(e) =>
                onChange({
                  ...value,
                  preset: "custom",
                  dateFrom: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              className="mt-1 w-[160px]"
              value={value.dateTo}
              min={value.dateFrom}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) =>
                onChange({
                  ...value,
                  preset: "custom",
                  dateTo: e.target.value,
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
