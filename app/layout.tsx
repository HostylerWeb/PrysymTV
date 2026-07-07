import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import { OAuthProviders } from '@/components/oauth-providers'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Prysym TV - Movies, Live & Videos',
  description: 'Your ultimate streaming destination for movies, live streams, and videos',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/favicon.webp',
        type: 'image/webp',
      },
    ],
    apple: '/favicon.webp',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <OAuthProviders>
          <AuthProvider>
            {children}
          </AuthProvider>
        </OAuthProviders>
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  )
}
