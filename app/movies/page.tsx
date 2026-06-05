"use client"

import { useState, useEffect } from "react"
import { Play, Star, ChevronDown, Filter, Grid3X3, List, Info, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { fetchFeaturedMovie, fetchMoviesFeed } from "@/lib/api/videos-feed"
import { formatDuration, formatViewCount, videoThumbnail } from "@/lib/format-media"

const genres = ["All", "Action", "Comedy", "Drama", "Thriller", "Sci-Fi", "Horror", "Romance", "Documentary"]

type MovieCard = {
  id: string
  title: string
  poster: string
  year: string
  genre: string
  views: string
  likes: string
}

type FeaturedMovie = MovieCard & {
  duration: string
  description: string
}

export default function MoviesPage() {
  const [activeTab, setActiveTab] = useState("movies")
  const [activeGenre, setActiveGenre] = useState("All")
  const [activeYear, setActiveYear] = useState("All Years")
  const [sortBy, setSortBy] = useState("Popularity")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [featuredMovie, setFeaturedMovie] = useState<FeaturedMovie | null>(null)
  const [movies, setMovies] = useState<MovieCard[]>([])
  const [trendingFromApi, setTrendingFromApi] = useState<MovieCard[]>([])
  const [newReleasesFromApi, setNewReleasesFromApi] = useState<MovieCard[]>([])

  useEffect(() => {
    void Promise.all([fetchMoviesFeed(1), fetchFeaturedMovie()])
      .then(([res, featured]) => {
        const mapRow = (m: (typeof res.items)[number]): MovieCard => ({
          id: m.id,
          title: m.title,
          poster: videoThumbnail(m.thumbnailUrl),
          year: String(m.releaseYear ?? new Date().getFullYear()),
          genre: m.category ?? "Drama",
          views: formatViewCount(m.viewsCount),
          likes: formatViewCount(m.likesCount ?? 0),
        })
        const mapped = res.items.map(mapRow)
        setMovies(mapped)
        setTrendingFromApi(mapped.slice(0, 3))
        setNewReleasesFromApi(mapped.slice(0, 4))
        if (featured.item) {
          const item = featured.item
          setFeaturedMovie({
            ...mapRow(item),
            duration: formatDuration(item.durationSeconds),
            description: item.tagline ?? item.title,
          })
        } else if (mapped[0]) {
          setFeaturedMovie({
            ...mapped[0],
            duration: formatDuration(res.items[0]?.durationSeconds ?? 0),
            description: res.items[0]?.tagline ?? mapped[0].title,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredMovies = movies.filter(movie => {
    const matchesGenre = activeGenre === "All" || movie.genre === activeGenre;
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = activeYear === "All Years" || movie.year === activeYear;
    return matchesGenre && matchesSearch && matchesYear;
  }).sort((a, b) => {
    if (sortBy === "Rating") return Number(b.likes.replace(/\D/g, "") || 0) - Number(a.likes.replace(/\D/g, "") || 0);
    if (sortBy === "Newest") return Number(b.year) - Number(a.year);
    if (sortBy === "A-Z") return a.title.localeCompare(b.title);
    return 0; // Popularity
  });

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <div className="max-w-7xl mx-auto w-full">
      {loading ? (
        <div className="py-24 text-center text-muted-foreground">Loading movies…</div>
      ) : !featuredMovie && movies.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground px-4">
          No movies published yet. Upload a movie from your profile settings.
        </div>
      ) : featuredMovie ? (
      <div className="relative w-full aspect-[16/10] md:aspect-[21/9]">
        <img
          src={featuredMovie.poster}
          alt={featuredMovie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-primary/90 text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">NEW</span>
            <span className="text-sm text-foreground/80">{featuredMovie.genre}</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">{featuredMovie.title}</h1>
          <div className="flex items-center gap-3 text-sm text-foreground/80 mb-3">
            <span>{featuredMovie.views} views</span>
            <span>{featuredMovie.likes} likes</span>
            <span>{featuredMovie.year}</span>
            <span>{featuredMovie.duration}</span>
          </div>
          <p className="text-sm text-foreground/70 line-clamp-2 max-w-lg mb-4">{featuredMovie.description}</p>
          <div className="flex items-center gap-3">
            <Link href={`/movie/${featuredMovie.id}`}>
              <Button className="rounded-full gap-2">
                <Play className="w-5 h-5 fill-current" />
                Play Now
              </Button>
            </Link>
            <Button variant="secondary" className="rounded-full gap-2">
              <Plus className="w-5 h-5" />
              My List
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Info className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      ) : null}

      {/* Genre Filter */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                activeGenre === genre 
                  ? "bg-foreground text-background" 
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              )}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {trendingFromApi.length > 0 && (
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Trending Now</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {trendingFromApi.map((movie, index) => (
            <Link key={movie.id} href={`/movie/${movie.id}`}>
              <div className="flex-shrink-0 w-[260px] cursor-pointer group">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute top-2 left-2 text-4xl font-black text-white/30">
                    #{index + 1}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="text-sm font-semibold text-white mb-1">{movie.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <span>{movie.views} views</span>
                      <span>{movie.likes} likes</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-foreground/90 flex items-center justify-center">
                      <Play className="w-6 h-6 text-background fill-background ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      )}

      {newReleasesFromApi.length > 0 && (
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">New Releases</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {newReleasesFromApi.map((movie) => (
            <Link key={movie.id} href={`/movie/${movie.id}`}>
              <div className="flex-shrink-0 w-[130px] cursor-pointer group">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                    NEW
                  </span>
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs font-medium text-foreground">
                    {movie.views}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-10 h-10 text-white fill-white" />
                  </div>
                </div>
                <h3 className="text-xs font-medium text-foreground line-clamp-1">{movie.title}</h3>
                <p className="text-xs text-muted-foreground">{movie.year}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      )}

      {/* All Movies Section */}
      <div className="px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
          <h2 className="text-lg font-semibold text-foreground">All Movies</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-48 pl-9 pr-8 py-2 rounded-lg bg-secondary text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                viewMode === "grid" ? "bg-secondary" : "hover:bg-secondary/50"
              )}
            >
              <Grid3X3 className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-colors hidden md:flex",
                viewMode === "list" ? "bg-secondary" : "hover:bg-secondary/50"
              )}
            >
              <List className="w-5 h-5 text-foreground" />
            </button>
            
            <div className="flex items-center gap-2 ml-auto md:ml-2">
              <div className="relative">
                <select 
                  value={activeGenre}
                  onChange={(e) => setActiveGenre(e.target.value)}
                  className="appearance-none bg-secondary text-foreground text-sm font-medium pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer border border-transparent hover:border-border"
                >
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>{genre === "All" ? "All Genres" : genre}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              <div className="relative">
                <select 
                  value={activeYear}
                  onChange={(e) => setActiveYear(e.target.value)}
                  className="appearance-none bg-secondary text-foreground text-sm font-medium pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer border border-transparent hover:border-border"
                >
                  <option value="All Years">All Years</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              
              <div className="relative">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-secondary text-foreground text-sm font-medium pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer border border-transparent hover:border-border"
                >
                  <option value="Popularity">Sort: Popularity</option>
                  <option value="Rating">Sort: Top Rated</option>
                  <option value="Newest">Sort: Newest</option>
                  <option value="A-Z">Sort: A-Z</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {filteredMovies.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No movies found matching "{searchQuery}"</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4 lg:gap-6">
            {filteredMovies.map((movie) => (
              <Link key={movie.id} href={`/movie/${movie.id}`}>
                <div className="cursor-pointer group">
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs font-medium text-foreground">
                      {movie.views}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-10 h-10 text-white fill-white" />
                    </div>
                  </div>
                  <h3 className="text-xs font-medium text-foreground line-clamp-1">{movie.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{movie.year}</span>
                    <span>•</span>
                    <span>{movie.genre}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMovies.map((movie) => (
              <Link key={movie.id} href={`/movie/${movie.id}`}>
                <div className="flex gap-3 cursor-pointer group p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="relative w-24 aspect-[2/3] rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="text-sm font-semibold text-foreground mb-1">{movie.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>{movie.views} views</span>
                      <span>{movie.year}</span>
                      <span className="px-2 py-0.5 rounded bg-secondary">{movie.genre}</span>
                    </div>
                  </div>
                  <Button variant="secondary" size="icon" className="rounded-full self-center">
                    <Play className="w-5 h-5 fill-current" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>

      <Footer />

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
