"use client"

import { useEffect, useState } from "react"
import { fetchAdminOverview } from "@/lib/api/admin"

export type AdminBadges = {
  reports: number
  applications: number
  payouts: number
  live: number
}

const EMPTY: AdminBadges = {
  reports: 0,
  applications: 0,
  payouts: 0,
  live: 0,
}

export function useAdminBadges(refreshKey?: string) {
  const [badges, setBadges] = useState<AdminBadges>(EMPTY)

  useEffect(() => {
    void fetchAdminOverview()
      .then((o) =>
        setBadges({
          reports: o.pendingReports,
          applications:
            o.pendingApplications ??
            o.pendingStreamerApplications + o.pendingVerticalCreatorApplications,
          payouts: o.pendingPayouts,
          live: o.liveNow,
        }),
      )
      .catch(() => setBadges(EMPTY))
  }, [refreshKey])

  return badges
}
