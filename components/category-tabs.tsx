"use client"

import { cn } from "@/lib/utils"

const categories = [
  { id: "all", label: "All" },
  { id: "movies", label: "Movies" },
  { id: "live", label: "Live" },
  { id: "videos", label: "Videos" },
  { id: "series", label: "Series" },
  { id: "trending", label: "Trending" },
]

interface CategoryTabsProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-2 px-4 py-3">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              activeCategory === category.id
                ? "bg-foreground text-background"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  )
}
