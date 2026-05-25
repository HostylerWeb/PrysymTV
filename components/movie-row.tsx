"use client"

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
}

export function MovieRow({ title, movies, showViewAll = true }: MovieRowProps) {
  return (
    <section className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {showViewAll && (
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Scrollable Row */}
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
        {movies.map((movie) => (
          <div key={movie.id} className="snap-start">
            <MovieCard {...movie} />
          </div>
        ))}
      </div>
    </section>
  )
}
