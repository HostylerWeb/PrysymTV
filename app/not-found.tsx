"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-12 md:pl-20 flex flex-col">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-7xl font-bold text-muted-foreground/30 mb-2">404</p>
        <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Button asChild className="rounded-full">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
      <Footer />
      <BottomNavigation />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
