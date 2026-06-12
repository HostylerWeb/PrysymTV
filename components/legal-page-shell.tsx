"use client"

import { useState, type ReactNode } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { LAST_UPDATED } from "@/lib/legal/company"

type LegalPageShellProps = {
  title: string
  description?: string
  children: ReactNode
}

export function LegalPageShell({ title, description, children }: LegalPageShellProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-3xl md:text-5xl font-black text-foreground mb-3">{title}</h1>
        {description && (
          <p className="text-muted-foreground mb-6 max-w-2xl">{description}</p>
        )}
        <p className="text-sm text-muted-foreground mb-10">Last updated: {LAST_UPDATED}</p>
        <div className="prose prose-invert max-w-none text-muted-foreground legal-content">
          {children}
        </div>
        <p className="mt-12 text-xs text-muted-foreground border-t border-border pt-6">
          This document is provided for informational purposes. It does not constitute legal advice.
          Consult qualified counsel for advice specific to your situation.
        </p>
      </div>
      <Footer />
      <BottomNavigation activeTab="none" onTabChange={() => {}} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
