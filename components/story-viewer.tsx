"use client"

import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import type { MockStory } from "@/lib/mock-data"
import Link from "next/link"

interface StoryViewerProps {
  story: MockStory | null
  onClose: () => void
}

export function StoryViewer({ story, onClose }: StoryViewerProps) {
  const [slideIndex, setSlideIndex] = useState(0)

  if (!story) return null

  const slide = story.slides[slideIndex]

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex items-center gap-1 px-2 pt-3">
        {story.slides.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
            <div className={`h-full bg-white transition-all ${i <= slideIndex ? "w-full" : "w-0"}`} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <Link href={`/creator/${story.slug}`} className="flex items-center gap-2">
          <img src={story.avatar} alt={story.name} className="w-8 h-8 rounded-full" />
          <span className="text-white font-semibold text-sm">{story.name}</span>
        </Link>
        <button onClick={onClose} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="relative flex-1 flex items-center justify-center">
        <img src={slide.image} alt="" className="max-h-full max-w-full object-contain" />
        {slide.caption && (
          <p className="absolute bottom-8 left-4 right-4 text-white text-center text-sm">{slide.caption}</p>
        )}
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/80"
          onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
          disabled={slideIndex === 0}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/80"
          onClick={() => {
            if (slideIndex < story.slides.length - 1) setSlideIndex((i) => i + 1)
            else onClose()
          }}
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  )
}
