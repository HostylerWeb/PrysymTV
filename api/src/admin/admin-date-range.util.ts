export type AdminDateRangeInput = {
  range?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type ResolvedAdminDateRange = {
  start: Date;
  end: Date;
  label: string;
  buckets: string[];
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function dayBucketsBetween(start: Date, end: Date, maxDays = 366): string[] {
  const from = startOfDay(start);
  const to = startOfDay(end);
  const buckets: string[] = [];
  const cursor = new Date(from);
  while (cursor <= to && buckets.length < maxDays) {
    buckets.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}

export function resolveAdminDateRange(
  input: AdminDateRangeInput = {},
): ResolvedAdminDateRange {
  const end = input.dateTo ? endOfDay(new Date(input.dateTo)) : endOfDay(new Date());

  if (input.dateFrom) {
    const start = startOfDay(new Date(input.dateFrom));
    const label =
      input.dateTo && input.dateTo !== input.dateFrom
        ? `${input.dateFrom} – ${input.dateTo}`
        : input.dateFrom;
    return {
      start,
      end,
      label,
      buckets: dayBucketsBetween(start, end),
    };
  }

  const days =
    input.range === '7d' ? 7 : input.range === '90d' ? 90 : 30;
  const start = startOfDay(new Date(end));
  start.setDate(start.getDate() - (days - 1));
  const rangeLabel =
    input.range === '7d' || input.range === '90d' ? input.range : '30d';

  return {
    start,
    end,
    label: rangeLabel,
    buckets: dayBucketsBetween(start, end),
  };
}

export function createdAtFilter(input: AdminDateRangeInput):
  | { gte?: Date; lte?: Date }
  | undefined {
  if (!input.dateFrom && !input.dateTo) return undefined;
  const { start, end } = resolveAdminDateRange(input);
  return { gte: start, lte: end };
}
