"use client"

import { Plus } from "lucide-react"
import type { MockStory } from "@/lib/mock-data"

interface StoriesRowProps {
  stories: MockStory[]
  onStoryClick?: (story: MockStory) => void
}

export function StoriesRow({ stories, onStoryClick }: StoriesRowProps) {
  return (
    <div className="flex gap-3 px-4 py-4 overflow-x-auto scrollbar-hide">
      <button
        type="button"
        className="flex flex-col items-center gap-2 flex-shrink-0"
        onClick={() => onStoryClick?.(stories[0])}
      >
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center border-2 border-dashed border-muted-foreground/50">
          <Plus className="w-6 h-6 text-muted-foreground" />
        </div>
        <span className="text-xs text-muted-foreground">Your Story</span>
      </button>

      {stories.map((story) => (
        <button
          key={story.id}
          type="button"
          onClick={() => onStoryClick?.(story)}
          className="flex flex-col items-center gap-2 flex-shrink-0"
        >
          <div
            className={`w-16 h-16 rounded-full p-0.5 ${
              story.isLive
                ? "bg-gradient-to-tr from-primary to-orange-500"
                : story.hasNew
                  ? "bg-gradient-to-tr from-primary/60 to-primary"
                  : "bg-muted"
            }`}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-background p-0.5">
              <img src={story.avatar} alt={story.name} className="w-full h-full rounded-full object-cover" />
            </div>
          </div>
          <span className="text-xs text-foreground truncate max-w-[64px]">
            {story.isLive ? <span className="text-primary font-medium">LIVE</span> : story.name}
          </span>
        </button>
      ))}
    </div>
  )
}
