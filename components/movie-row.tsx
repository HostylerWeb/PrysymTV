"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { MovieCard } from "./movie-card"

interface Movie {
  id: string
  title: string
  poster: string
  year: string
  rating: number
  genre: string
}

interface MovieRowProps {
  title: string
  movies: Movie[]
  showViewAll?: boolean
  viewAllHref?: string
  hideHeader?: boolean
}

export function MovieRow({
  title,
  movies,
  showViewAll = true,
  viewAllHref = "/movies",
  hideHeader = false,
}: MovieRowProps) {
  return (
    <section className="py-2">
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 md:px-8 mb-3">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {showViewAll && viewAllHref && (
            <Link
              href={viewAllHref}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
      <div className="flex gap-3 px-4 md:px-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
        {movies.map((movie) => (
          <div key={movie.id} className="snap-start">
            <MovieCard {...movie} />
          </div>
        ))}
      </div>
    </section>
  )
}
