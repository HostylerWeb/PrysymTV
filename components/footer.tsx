import Link from 'next/link'

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background py-8 mt-12 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground text-center md:text-left">
          &copy; {new Date().getFullYear()} Prysym TV. All rights reserved.
        </div>
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-sm text-muted-foreground">
          <Link href="/advertise" className="hover:text-foreground transition-colors">Advertise</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link href="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link>
          <Link href="/guidelines" className="hover:text-foreground transition-colors">Community Guidelines</Link>
        </div>
      </div>
    </footer>
  )
}
