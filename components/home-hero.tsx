"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Play, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type HomeHeroMovieReason = "new_release" | "trending"

export type HomeFeaturedMovie = {
  id: string
  title: string
  poster: string
  genre: string
  year: string
  channel: string
  reason: HomeHeroMovieReason
}

type HomeHeroProps = {
  slides: HomeFeaturedMovie[]
  loading?: boolean
}

const HERO_LABELS: Record<HomeHeroMovieReason, string> = {
  new_release: "Recently added",
  trending: "Popular on Prysym",
}

const AUTOPLAY_MS = 6500

function HomeHeroSkeleton() {
  return (
    <section className="relative w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-2 md:pt-4">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-border/60 min-h-[min(56vh,540px)] md:min-h-[460px] bg-muted/40 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
          <div className="relative z-10 flex flex-col justify-end h-full min-h-[inherit] p-6 md:p-10 max-w-xl space-y-3">
            <div className="h-3 w-24 rounded-full bg-muted" />
            <div className="h-10 w-3/4 max-w-md rounded-lg bg-muted" />
            <div className="h-4 w-1/2 max-w-xs rounded bg-muted" />
            <div className="h-12 w-36 rounded-full bg-muted mt-2" />
          </div>
        </div>
      </div>
    </section>
  )
}

function BrandHero() {
  return (
    <section className="relative w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 md:pt-6">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 via-card to-background px-6 py-12 md:py-16">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              <Sparkles className="w-4 h-4" />
              Prysym TV
            </p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              Where content creates community wealth
            </h1>
            <p className="text-muted-foreground mt-4 text-base md:text-lg max-w-lg">
              Stream movies, verticals, live creators, and more — all in one place built for community.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/videos">
                <Button size="lg" className="rounded-full px-8">Explore videos</Button>
              </Link>
              <Link href="/verticals">
                <Button size="lg" variant="outline" className="rounded-full px-8">Browse series</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function HomeHero({ slides, loading = false }: HomeHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const count = slides.length

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return
      setActiveIndex(((index % count) + count) % count)
    },
    [count],
  )

  useEffect(() => {
    setActiveIndex(0)
  }, [count])

  useEffect(() => {
    if (count <= 1 || isPaused) return
    timerRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % count)
    }, AUTOPLAY_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [count, isPaused, activeIndex])

  if (loading) return <HomeHeroSkeleton />
  if (count === 0) return <BrandHero />

  const active = slides[activeIndex]

  return (
    <section className="relative w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-2 md:pt-4">
        <div
          className="group relative overflow-hidden rounded-2xl md:rounded-3xl border border-border/60 bg-black min-h-[min(56vh,540px)] md:min-h-[460px]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {slides.map((slide, index) => (
            <img
              key={slide.id}
              src={slide.poster}
              alt=""
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-opacity ease-out",
                index === activeIndex ? "opacity-100" : "opacity-0",
              )}
              style={{
                transitionDuration: "1000ms",
                transform: index === activeIndex ? "scale(1.06)" : "scale(1)",
                transitionProperty: "opacity, transform",
                ...(index === activeIndex ? { transitionDuration: `${AUTOPLAY_MS}ms, ${AUTOPLAY_MS}ms` } : {}),
              }}
            />
          ))}

          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/40 to-transparent" />

          <div
            key={active.id}
            className="relative z-10 flex flex-col justify-end h-full min-h-[inherit] p-6 md:p-10 max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
              {HERO_LABELS[active.reason]}
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight line-clamp-2">
              {active.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              {active.genre} · {active.year} · {active.channel}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/movie/${active.id}`}>
                <Button size="lg" className="rounded-full gap-2 px-8 h-12 text-base font-semibold">
                  <Play className="w-5 h-5 fill-current" />
                  Watch now
                </Button>
              </Link>
            </div>
          </div>

          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous"
                onClick={() => goTo(activeIndex - 1)}
                className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/40 backdrop-blur-sm items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/70"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={() => goTo(activeIndex + 1)}
                className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/40 backdrop-blur-sm items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/70"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="absolute bottom-6 md:bottom-8 right-6 md:right-10 z-20 flex items-center gap-1.5">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`Go to slide ${index + 1}`}
                    onClick={() => goTo(index)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-white/40 hover:bg-white/60",
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
