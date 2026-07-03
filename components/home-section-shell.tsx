"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { ReactNode } from "react"

type HomeSectionShellProps = {
  eyebrow?: string
  title: string
  href?: string
  children: ReactNode
  id?: string
  badge?: ReactNode
}

export function HomeSectionShell({ eyebrow, title, href, children, id, badge }: HomeSectionShellProps) {
  return (
    <section id={id} className="py-6 md:py-8 border-t border-border/40 first:border-t-0 min-w-0 overflow-hidden">
      <div className="flex items-end justify-between gap-4 px-4 md:px-8 mb-4">
        <div className="flex items-start gap-3">
          <span className="w-1 h-9 md:h-10 rounded-full bg-primary shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">{title}</h2>
              {badge}
            </div>
          </div>
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-0.5 text-sm text-muted-foreground hover:text-primary transition-colors shrink-0"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
