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

const defaultFeatured = {
  title: "The Last Frontier",
  poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop",
  year: "2024",
  rating: "9.2",
  duration: "2h 34m",
  genre: "Sci-Fi",
  description: "An epic journey through uncharted territories where courage meets destiny. Follow the remarkable story of explorers facing the unknown."
}

const defaultMovies = [
  { id: "1", title: "Interstellar", poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&h=450&fit=crop", year: "2023", rating: "9.0", genre: "Sci-Fi" },
  { id: "2", title: "The Dark Knight", poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&h=450&fit=crop", year: "2022", rating: "9.1", genre: "Action" },
  { id: "3", title: "Inception", poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=450&fit=crop", year: "2023", rating: "8.8", genre: "Thriller" },
  { id: "4", title: "Pulp Fiction", poster: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=450&fit=crop", year: "2022", rating: "8.9", genre: "Drama" },
  { id: "5", title: "The Matrix", poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&h=450&fit=crop", year: "2024", rating: "8.7", genre: "Sci-Fi" },
  { id: "6", title: "Fight Club", poster: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=300&h=450&fit=crop", year: "2023", rating: "8.8", genre: "Drama" },
  { id: "7", title: "Forrest Gump", poster: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=300&h=450&fit=crop", year: "2022", rating: "8.8", genre: "Drama" },
  { id: "8", title: "The Godfather", poster: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=300&h=450&fit=crop", year: "2021", rating: "9.2", genre: "Drama" },
]

const trendingMovies = [
  { id: "1", title: "Dune: Part Two", poster: "https://images.unsplash.com/photo-1547499417-29204c97a0c6?w=300&h=170&fit=crop", rating: "9.3", views: "15.2M" },
  { id: "2", title: "Oppenheimer", poster: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&h=170&fit=crop", rating: "9.1", views: "12.8M" },
  { id: "3", title: "Barbie", poster: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=170&fit=crop", rating: "8.5", views: "18.5M" },
]

const newReleases = [
  { id: "1", title: "Deadpool 3", poster: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=300&h=450&fit=crop", year: "2024", rating: "8.9", isNew: true },
  { id: "2", title: "Avatar 3", poster: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&h=450&fit=crop", year: "2024", rating: "9.0", isNew: true },
  { id: "3", title: "Mission Impossible", poster: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=300&h=450&fit=crop", year: "2024", rating: "8.7", isNew: true },
  { id: "4", title: "Guardians Vol. 4", poster: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=450&fit=crop", year: "2024", rating: "8.6", isNew: true },
]

export default function MoviesPage() {
  const [activeTab, setActiveTab] = useState("movies")
  const [activeGenre, setActiveGenre] = useState("All")
  const [activeYear, setActiveYear] = useState("All Years")
  const [sortBy, setSortBy] = useState("Popularity")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [featuredMovie, setFeaturedMovie] = useState(defaultFeatured)
  const [movies, setMovies] = useState(defaultMovies)
  const [trendingFromApi, setTrendingFromApi] = useState(trendingMovies)
  const [newReleasesFromApi, setNewReleasesFromApi] = useState(newReleases)

  useEffect(() => {
    void fetchMoviesFeed(1).then((res) => {
      if (!res.items.length) return
      const mapped = res.items.map((m) => ({
        id: m.id,
        title: m.title,
        poster: videoThumbnail(m.thumbnailUrl),
        year: String(m.releaseYear ?? new Date().getFullYear()),
        rating: "8.5",
        genre: m.category ?? "Drama",
        views: formatViewCount(m.viewsCount),
      }))
      setMovies(mapped)
      setTrendingFromApi(
        mapped.slice(0, 3).map((m) => ({
          id: m.id,
          title: m.title,
          poster: m.poster,
          rating: m.rating,
          views: m.views,
        })),
      )
      setNewReleasesFromApi(
        mapped.slice(0, 4).map((m) => ({
          id: m.id,
          title: m.title,
          poster: m.poster,
          year: m.year,
          rating: m.rating,
          isNew: true,
        })),
      )
    })
    void fetchFeaturedMovie().then(({ item }) => {
      if (!item) return
      setFeaturedMovie({
        title: item.title,
        poster: videoThumbnail(item.thumbnailUrl),
        year: String(item.releaseYear ?? "2024"),
        rating: "9.0",
        duration: formatDuration(item.durationSeconds),
        genre: item.category ?? "Drama",
        description: item.tagline ?? item.title,
      })
    })
  }, [])

  const filteredMovies = movies.filter(movie => {
    const matchesGenre = activeGenre === "All" || movie.genre === activeGenre;
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = activeYear === "All Years" || movie.year === activeYear;
    return matchesGenre && matchesSearch && matchesYear;
  }).sort((a, b) => {
    if (sortBy === "Rating") return Number(b.rating) - Number(a.rating);
    if (sortBy === "Newest") return Number(b.year) - Number(a.year);
    if (sortBy === "A-Z") return a.title.localeCompare(b.title);
    return 0; // Popularity
  });

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <div className="max-w-7xl mx-auto w-full">
      {/* Featured Movie Hero */}
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
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              {featuredMovie.rating}
            </span>
            <span>{featuredMovie.year}</span>
            <span>{featuredMovie.duration}</span>
          </div>
          <p className="text-sm text-foreground/70 line-clamp-2 max-w-lg mb-4">{featuredMovie.description}</p>
          <div className="flex items-center gap-3">
            <Link href="/movie/the-last-frontier">
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

      {/* Trending Now */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Trending Now</h2>
          <button className="text-sm text-primary font-medium">See All</button>
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
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {movie.rating}
                      </span>
                      <span>{movie.views} views</span>
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

      {/* New Releases */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">New Releases</h2>
          <button className="text-sm text-primary font-medium">See All</button>
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
                  {movie.isNew && (
                    <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                      NEW
                    </span>
                  )}
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-medium text-foreground">{movie.rating}</span>
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
                    <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-medium text-foreground">{movie.rating}</span>
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
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {movie.rating}
                      </span>
                      <span>{movie.year}</span>
                      <span className="px-2 py-0.5 rounded bg-secondary">{movie.genre}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      An incredible cinematic experience that will keep you on the edge of your seat.
                    </p>
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
