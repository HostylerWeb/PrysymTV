"use client"

import { useState } from "react"
import type { AdminDateRangeValue } from "@/lib/admin/date-range"
import { dateRangeQueryParams } from "@/lib/admin/date-range"

export function useAdminListDateFilter() {
  const [dateRange, setDateRange] = useState<AdminDateRangeValue | null>(null)
  const dateParams = dateRangeQueryParams(dateRange)
  const dateDeps = [dateRange?.dateFrom, dateRange?.dateTo] as const
  return { dateRange, setDateRange, dateParams, dateDeps }
}
