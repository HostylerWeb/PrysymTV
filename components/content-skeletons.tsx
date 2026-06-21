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
