"use client"

type Props = {
  title: string;
  buckets: string[];
  values: number[];
  valuePrefix?: string;
  valueSuffix?: string;
  formatValue?: (n: number) => string;
};

function defaultFormat(n: number, prefix = "", suffix = "") {
  if (n >= 1000) return `${prefix}${(n / 1000).toFixed(1)}k${suffix}`;
  if (Number.isInteger(n)) return `${prefix}${n}${suffix}`;
  return `${prefix}${n.toFixed(1)}${suffix}`;
}

export function AdminMiniChart({
  title,
  buckets,
  values,
  valuePrefix = "",
  valueSuffix = "",
  formatValue,
}: Props) {
  const max = Math.max(...values, 1);
  const fmt = formatValue ?? ((n) => defaultFormat(n, valuePrefix, valueSuffix));

  return (
    <div className="rounded-xl border border-border bg-card p-5 min-h-[220px] flex flex-col">
      <p className="font-medium text-sm mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-4">
        {buckets[0]} → {buckets[buckets.length - 1]}
      </p>
      {values.every((v) => v === 0) ? (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
          No data in this range yet
        </div>
      ) : (
        <div className="flex-1 flex items-end gap-0.5 min-h-[120px]">
          {values.map((v, i) => (
            <div key={buckets[i]} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div
                className="w-full rounded-t bg-primary/80 min-h-[4px] transition-all"
                style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
                title={`${buckets[i]}: ${fmt(v)}`}
              />
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
        <span>{fmt(values[values.length - 1] ?? 0)} latest</span>
        <span>peak {fmt(Math.max(...values))}</span>
      </div>
    </div>
  );
}
