export type AdminDateRangeValue = {
  preset: "7d" | "30d" | "90d" | "custom";
  dateFrom: string;
  dateTo: string;
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildPresetRange(preset: "7d" | "30d" | "90d"): AdminDateRangeValue {
  const end = new Date();
  const start = new Date();
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  start.setDate(start.getDate() - (days - 1));
  return {
    preset,
    dateFrom: toIsoDate(start),
    dateTo: toIsoDate(end),
  };
}

export const DEFAULT_ADMIN_DATE_RANGE: AdminDateRangeValue = buildPresetRange("30d");

export function dateRangeQueryParams(value: AdminDateRangeValue | null | undefined) {
  if (!value) return {};
  return {
    dateFrom: value.dateFrom,
    dateTo: value.dateTo,
    ...(value.preset !== "custom" ? { range: value.preset } : {}),
  };
}

export function formatDateRangeLabel(value: AdminDateRangeValue): string {
  if (value.preset !== "custom") return value.preset;
  if (value.dateFrom === value.dateTo) return value.dateFrom;
  return `${value.dateFrom} – ${value.dateTo}`;
}
