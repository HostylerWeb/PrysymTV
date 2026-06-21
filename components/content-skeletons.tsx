import { Skeleton } from "@/components/ui/skeleton"

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
          <Skeleton className="w-full aspect-video rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
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
          <Skeleton className="w-36 h-36 rounded-xl" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

export function WatchPageSkeleton() {
  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <div className="max-w-6xl mx-auto w-full">
        <Skeleton className="w-full aspect-video rounded-none md:rounded-xl" />
        <div className="px-4 pt-4 space-y-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </main>
  )
}

export function PodcastPageSkeleton() {
  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20 px-4 py-6 space-y-8">
      <Skeleton className="h-8 w-48" />
      <CardRowSkeleton />
      <Skeleton className="h-6 w-40" />
      <VideoGridSkeleton count={6} />
    </main>
  )
}
