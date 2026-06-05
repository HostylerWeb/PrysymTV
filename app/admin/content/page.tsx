"use client"

import Link from "next/link"
import { Film, MessageSquare, Mic, Clapperboard, Smartphone } from "lucide-react"
import { AdminKpiCard } from "@/components/admin/admin-kpi-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminContentStats } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"

export default function AdminContentOverviewPage() {
  const { data: s, loading, error } = useAdminQuery(fetchAdminContentStats, [])

  if (loading && !s) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Loading content stats…</p>
  }

  if (error || !s) {
    return <p className="text-sm text-destructive py-12 text-center">{error ?? "Failed to load"}</p>
  }

  return (
    <>
      <AdminPageHeader
        title="Content library"
        description="Browse, moderate, and remove uploaded videos, verticals, podcasts, and comments."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Content" }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <AdminKpiCard label="Videos" value={s.videos} icon={Film} href="/admin/content/videos" />
        <AdminKpiCard label="Shorts" value={s.shorts} icon={Smartphone} href="/admin/content/shorts" />
        <AdminKpiCard label="Movies" value={s.movies} icon={Clapperboard} href="/admin/content/movies" />
        <AdminKpiCard
          label="Vertical series"
          value={s.verticalSeries}
          sub={`${s.verticalEpisodes} episodes`}
          icon={Film}
          href="/admin/content/verticals"
        />
        <AdminKpiCard
          label="Podcast shows"
          value={s.podcastShows}
          sub={`${s.podcastEpisodes} episodes`}
          icon={Mic}
          href="/admin/content/podcasts"
        />
        <AdminKpiCard label="Comments" value={s.comments} icon={MessageSquare} href="/admin/content/comments" />
        <AdminKpiCard label="Total video views" value={s.totalViews.toLocaleString()} icon={Film} />
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-2">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/admin/content/comments">Moderate comments</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/admin/moderation">Report queue</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/admin/config/programs">Program categories</Link>
          </Button>
        </div>
      </section>
    </>
  )
}
