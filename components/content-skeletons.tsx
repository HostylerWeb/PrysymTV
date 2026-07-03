import { Skeleton } from "@/components/ui/skeleton"

const bone = "bg-muted/60"

export function PageLoadingSkeleton({ label = "Loading…" }: { label?: string }) {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 md:pl-20">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </main>
  )
}

export function VideoGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className={`w-full aspect-video rounded-xl ${bone}`} />
          <Skeleton className={`h-4 w-3/4 ${bone}`} />
          <Skeleton className={`h-3 w-1/2 ${bone}`} />
        </div>
      ))}
    </div>
  )
}

export function CardRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shrink-0 w-36 space-y-2">
          <Skeleton className={`w-36 h-36 rounded-xl ${bone}`} />
          <Skeleton className={`h-3 w-24 ${bone}`} />
        </div>
      ))}
    </div>
  )
}

export function WatchPageSkeleton() {
  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <div className="max-w-6xl mx-auto w-full">
        <Skeleton className={`w-full aspect-video rounded-none md:rounded-xl ${bone}`} />

        <div className="px-4 pt-4 space-y-4">
          <div className="space-y-2">
            <Skeleton className={`h-6 w-full max-w-xl ${bone}`} />
            <Skeleton className={`h-4 w-36 ${bone}`} />
          </div>

          <div className="flex gap-2 overflow-hidden pb-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className={`h-9 w-[4.5rem] rounded-full shrink-0 ${bone}`} />
            ))}
          </div>

          <div className="flex items-center justify-between py-3 border-y border-border">
            <div className="flex items-center gap-3">
              <Skeleton className={`w-10 h-10 rounded-full shrink-0 ${bone}`} />
              <div className="space-y-2">
                <Skeleton className={`h-4 w-28 ${bone}`} />
                <Skeleton className={`h-3 w-16 ${bone}`} />
              </div>
            </div>
            <Skeleton className={`h-9 w-24 rounded-full ${bone}`} />
          </div>

          <div className="space-y-2 py-1">
            <Skeleton className={`h-3 w-full ${bone}`} />
            <Skeleton className={`h-3 w-full ${bone}`} />
            <Skeleton className={`h-3 w-[80%] max-w-md ${bone}`} />
          </div>

          <div className="py-3 border-t border-border space-y-4">
            <Skeleton className={`h-5 w-40 ${bone}`} />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className={`w-8 h-8 rounded-full shrink-0 ${bone}`} />
                <div className="flex-1 space-y-2 pt-0.5">
                  <Skeleton className={`h-3 w-28 ${bone}`} />
                  <Skeleton className={`h-3 w-full ${bone}`} />
                  <Skeleton className={`h-3 w-[85%] ${bone}`} />
                </div>
              </div>
            ))}
          </div>

          <div className="py-4 border-t border-border space-y-4">
            <Skeleton className={`h-5 w-24 ${bone}`} />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className={`w-40 aspect-video rounded-lg shrink-0 ${bone}`} />
                <div className="flex-1 space-y-2 py-1 min-w-0">
                  <Skeleton className={`h-4 w-full ${bone}`} />
                  <Skeleton className={`h-4 w-[92%] ${bone}`} />
                  <Skeleton className={`h-3 w-32 mt-1 ${bone}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

export function PodcastPageSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <Skeleton className={`w-full h-72 md:h-[420px] rounded-none ${bone}`} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-10">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className={`h-8 w-20 rounded-full shrink-0 ${bone}`} />
          ))}
        </div>

        <section className="space-y-4">
          <Skeleton className={`h-7 w-44 ${bone}`} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className={`w-full aspect-square rounded-2xl ${bone}`} />
                <Skeleton className={`h-4 w-full ${bone}`} />
                <Skeleton className={`h-3 w-2/3 ${bone}`} />
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className={`h-7 w-40 ${bone}`} />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-secondary/20">
                <Skeleton className={`w-7 h-7 rounded ${bone}`} />
                <Skeleton className={`w-12 h-12 rounded-xl shrink-0 ${bone}`} />
                <div className="flex-1 space-y-2">
                  <Skeleton className={`h-4 w-full max-w-sm ${bone}`} />
                  <Skeleton className={`h-3 w-40 ${bone}`} />
                </div>
                <Skeleton className={`hidden sm:block h-3 w-16 ${bone}`} />
              </div>
            ))}
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <Skeleton className={`h-7 w-36 ${bone}`} />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/20">
                  <Skeleton className={`w-5 h-5 rounded ${bone}`} />
                  <Skeleton className={`w-10 h-10 rounded-full shrink-0 ${bone}`} />
                  <div className="flex-1 space-y-2">
                    <Skeleton className={`h-4 w-28 ${bone}`} />
                    <Skeleton className={`h-3 w-20 ${bone}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function VerticalsPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className={`w-8 h-8 rounded-lg ${bone}`} />
        <Skeleton className={`h-8 w-36 md:h-9 md:w-44 ${bone}`} />
      </div>
      <div className="space-y-2 mb-8 max-w-2xl">
        <Skeleton className={`h-4 w-full ${bone}`} />
        <Skeleton className={`h-4 w-[85%] ${bone}`} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className={`w-full aspect-[9/16] rounded-xl ${bone}`} />
            <Skeleton className={`h-4 w-full ${bone}`} />
            <Skeleton className={`h-3 w-2/3 ${bone}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionHeaderSkeleton() {
  return (
    <div className="flex items-end justify-between gap-4 px-4 md:px-8 mb-4">
      <div className="flex items-start gap-3">
        <Skeleton className={`w-1 h-9 rounded-full shrink-0 ${bone}`} />
        <div className="space-y-2">
          <Skeleton className={`h-3 w-16 ${bone}`} />
          <Skeleton className={`h-6 w-36 md:w-44 ${bone}`} />
        </div>
      </div>
      <Skeleton className={`h-4 w-16 hidden sm:block ${bone}`} />
    </div>
  )
}

function HorizontalCardRowSkeleton({
  count = 5,
  cardClass,
}: {
  count?: number
  cardClass: string
}) {
  return (
    <div className="min-w-0 w-full overflow-hidden">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 px-4 md:px-8">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="shrink-0 space-y-2">
            <Skeleton className={`${cardClass} ${bone}`} />
            <Skeleton className={`h-3 w-20 ${bone}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function HomeFeedSkeleton() {
  return (
    <div className="animate-in fade-in duration-300 space-y-0">
      <div className="px-4 md:px-8 py-4">
        <Skeleton className={`h-24 w-full rounded-xl ${bone}`} />
      </div>

      <section className="py-6 border-t border-border/40">
        <SectionHeaderSkeleton />
        <div className="min-w-0 w-full overflow-hidden">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 px-4 md:px-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-end shrink-0 gap-2">
                <Skeleton className={`w-10 h-14 rounded ${bone}`} />
                <div className="space-y-2 w-[140px] md:w-[168px]">
                  <Skeleton className={`w-full aspect-video rounded-lg ${bone}`} />
                  <Skeleton className={`h-3 w-full ${bone}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-6 border-t border-border/40">
        <SectionHeaderSkeleton />
        <HorizontalCardRowSkeleton count={4} cardClass="w-64 aspect-video rounded-lg" />
      </section>

      <section className="py-6 border-t border-border/40 px-4 md:px-8">
        <div className="flex items-start gap-3 mb-4">
          <Skeleton className={`w-1 h-9 rounded-full shrink-0 ${bone}`} />
          <div className="space-y-2">
            <Skeleton className={`h-3 w-24 ${bone}`} />
            <Skeleton className={`h-6 w-48 ${bone}`} />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 md:gap-4">
          <Skeleton className={`col-span-2 lg:col-span-7 min-h-[220px] md:min-h-[300px] rounded-2xl ${bone}`} />
          <div className="col-span-2 lg:col-span-5 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className={`aspect-[9/13] rounded-2xl ${bone}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-6 border-t border-border/40">
        <SectionHeaderSkeleton />
        <HorizontalCardRowSkeleton count={6} cardClass="w-[140px] md:w-[160px] aspect-[2/3] rounded-lg" />
      </section>
    </div>
  )
}

export function HomeDualSpotlightSkeleton() {
  return (
    <section className="py-6 md:py-8 border-t border-border/40 animate-in fade-in duration-300">
      <div className="grid md:grid-cols-2 gap-8 px-4 md:px-8 min-w-0">
        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className={`h-5 w-20 ${bone}`} />
            <Skeleton className={`h-4 w-14 ${bone}`} />
          </div>
          <div className="min-w-0 w-full overflow-hidden">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[88px] sm:w-[100px] space-y-2">
                  <Skeleton className={`w-full aspect-[9/16] rounded-xl ${bone}`} />
                  <Skeleton className={`h-3 w-full ${bone}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className={`h-5 w-24 ${bone}`} />
            <Skeleton className={`h-4 w-14 ${bone}`} />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className={`w-14 h-14 rounded-lg shrink-0 ${bone}`} />
                <div className="flex-1 space-y-2">
                  <Skeleton className={`h-4 w-full max-w-[200px] ${bone}`} />
                  <Skeleton className={`h-3 w-28 ${bone}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function MoviesPageSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <Skeleton className={`w-full aspect-[16/10] md:aspect-[21/9] rounded-none ${bone}`} />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={`h-8 w-20 rounded-full shrink-0 ${bone}`} />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className={`w-full aspect-[2/3] rounded-lg ${bone}`} />
              <Skeleton className={`h-4 w-full ${bone}`} />
              <Skeleton className={`h-3 w-2/3 ${bone}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function VideosBrowseSkeleton() {
  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className={`h-9 w-20 rounded-full ${bone}`} />
        ))}
      </div>
      <VideoGridSkeleton count={8} />
    </div>
  )
}

export function MovieDetailSkeleton() {
  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto w-full">
        <Skeleton className={`w-full aspect-video md:aspect-[21/9] ${bone}`} />
        <div className="px-4 md:px-8 py-6 space-y-4">
          <Skeleton className={`h-8 w-full max-w-lg ${bone}`} />
          <Skeleton className={`h-4 w-48 ${bone}`} />
          <div className="flex gap-2">
            <Skeleton className={`h-10 w-32 rounded-full ${bone}`} />
            <Skeleton className={`h-10 w-28 rounded-full ${bone}`} />
          </div>
          <div className="space-y-2 pt-4">
            <Skeleton className={`h-3 w-full ${bone}`} />
            <Skeleton className={`h-3 w-full ${bone}`} />
            <Skeleton className={`h-3 w-[80%] ${bone}`} />
          </div>
        </div>
      </div>
    </main>
  )
}

export function PodcastEpisodeSkeleton() {
  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20 animate-in fade-in duration-300">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className={`h-4 w-32 ${bone}`} />
        <Skeleton className={`w-full aspect-video rounded-2xl ${bone}`} />
        <Skeleton className={`h-8 w-full max-w-md ${bone}`} />
        <Skeleton className={`h-4 w-40 ${bone}`} />
        <div className="space-y-2">
          <Skeleton className={`h-3 w-full ${bone}`} />
          <Skeleton className={`h-3 w-full ${bone}`} />
          <Skeleton className={`h-3 w-[70%] ${bone}`} />
        </div>
      </div>
    </main>
  )
}

export function ShortsPageSkeleton() {
  return (
    <main className="h-screen bg-black overflow-hidden md:pl-20 flex items-center justify-center">
      <div className="w-full max-w-[420px] mx-auto px-4 space-y-4 animate-in fade-in duration-300">
        <Skeleton className={`w-full aspect-[9/16] rounded-2xl bg-white/10`} />
        <div className="flex justify-center gap-3">
          <Skeleton className={`w-10 h-10 rounded-full bg-white/10`} />
          <Skeleton className={`w-10 h-10 rounded-full bg-white/10`} />
          <Skeleton className={`w-10 h-10 rounded-full bg-white/10`} />
        </div>
      </div>
    </main>
  )
}

export function StoreProductSkeleton() {
  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20 animate-in fade-in duration-300">
      <div className="sticky top-0 z-50 border-b border-border/80 bg-background/90 h-14" />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-8">
          <div className="space-y-4">
            <Skeleton className={`w-full aspect-square max-h-[480px] rounded-2xl ${bone}`} />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className={`w-16 h-16 rounded-lg shrink-0 ${bone}`} />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className={`h-8 w-full max-w-sm ${bone}`} />
            <Skeleton className={`h-6 w-24 ${bone}`} />
            <Skeleton className={`h-4 w-full ${bone}`} />
            <Skeleton className={`h-4 w-[90%] ${bone}`} />
            <Skeleton className={`h-12 w-full rounded-full mt-4 ${bone}`} />
            <Skeleton className={`h-12 w-full rounded-full ${bone}`} />
          </div>
        </div>
      </div>
    </main>
  )
}

export function StoreCartSkeleton() {
  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20 animate-in fade-in duration-300">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6">
        <Skeleton className={`h-4 w-28 ${bone}`} />
        <Skeleton className={`h-8 w-36 ${bone}`} />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-2xl border border-border/60">
            <Skeleton className={`w-20 h-20 rounded-xl shrink-0 ${bone}`} />
            <div className="flex-1 space-y-2">
              <Skeleton className={`h-4 w-full max-w-[200px] ${bone}`} />
              <Skeleton className={`h-3 w-16 ${bone}`} />
              <Skeleton className={`h-5 w-14 ${bone}`} />
            </div>
          </div>
        ))}
        <Skeleton className={`h-32 w-full rounded-2xl ${bone}`} />
        <Skeleton className={`h-12 w-full rounded-full ${bone}`} />
      </div>
    </main>
  )
}

export function VerticalSeriesDetailSkeleton() {
  return (
    <main className="min-h-screen bg-background pb-20 md:pb-8 md:pl-20 animate-in fade-in duration-300">
      <div className="sticky top-0 z-50 border-b border-border/80 bg-background/90 h-14" />
      <div className="max-w-6xl mx-auto px-4 md:px-10 py-6 md:py-10">
        <Skeleton className={`h-4 w-28 mb-6 ${bone}`} />
        <div className="md:grid md:grid-cols-[minmax(280px,360px)_1fr] md:gap-12">
          <Skeleton className={`aspect-[9/16] max-h-[520px] w-full max-w-sm mx-auto rounded-2xl ${bone}`} />
          <div className="space-y-4 mt-8 md:mt-0">
            <Skeleton className={`h-4 w-32 ${bone}`} />
            <Skeleton className={`h-10 w-full max-w-md ${bone}`} />
            <Skeleton className={`h-4 w-full max-w-lg ${bone}`} />
            <Skeleton className={`h-4 w-full max-w-lg ${bone}`} />
            <Skeleton className={`h-12 w-40 rounded-full mt-4 ${bone}`} />
            <div className="space-y-3 pt-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className={`h-16 w-full rounded-xl ${bone}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export function ProfilePageSkeleton() {
  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20 animate-in fade-in duration-300">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto w-full">
          <Skeleton className={`w-10 h-10 rounded-full ${bone}`} />
          <Skeleton className={`h-5 w-20 ${bone}`} />
          <div className="w-10" />
        </div>
      </div>
      <div className="px-4 py-10 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Skeleton className={`w-24 h-24 md:w-32 md:h-32 rounded-full shrink-0 ${bone}`} />
          <div className="flex-1 space-y-3 w-full max-w-md">
            <Skeleton className={`h-6 w-40 mx-auto md:mx-0 ${bone}`} />
            <Skeleton className={`h-4 w-28 mx-auto md:mx-0 ${bone}`} />
            <Skeleton className={`h-10 w-48 rounded-full mx-auto md:mx-0 ${bone}`} />
          </div>
        </div>
        <div className="flex gap-2 overflow-hidden border-b border-border pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className={`h-8 w-20 rounded-full shrink-0 ${bone}`} />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={`w-full aspect-video rounded-xl ${bone}`} />
          ))}
        </div>
      </div>
    </main>
  )
}
