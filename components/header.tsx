"use client"

import { Search, Cast } from "lucide-react"
import Link from "next/link"

interface HeaderProps {
  onSearchClick: () => void
}

export function Header({ onSearchClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-none">
      <div className="flex items-center justify-between px-4 py-4 pointer-events-auto md:ml-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <img src="/logo.webp" alt="Prysym TV" className="h-8 w-auto object-contain" />
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
            <Cast className="w-5 h-5 text-foreground" />
          </button>
          <button 
            onClick={onSearchClick}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <Search className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </header>
  )
}
