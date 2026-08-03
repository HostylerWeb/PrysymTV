import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import { ConfirmProvider } from '@/contexts/confirm-context'
import { OAuthConfigProvider } from '@/contexts/oauth-config-context'
import { ThemeProvider } from '@/components/theme-provider'
import { WebPushRegistrar } from '@/components/web-push-registrar'
import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/providers/query-provider'
import './globals.css'

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: 'Prysym TV - Movies, Live & Videos',
  description: 'Your ultimate streaming destination for movies, live streams, and videos',
  openGraph: {
    title: 'Prysym TV - Movies, Live & Videos',
    description: 'Your ultimate streaming destination for movies, live streams, and videos',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prysym TV - Movies, Live & Videos',
    description: 'Your ultimate streaming destination for movies, live streams, and videos',
  },
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="prysym-theme">
            <OAuthConfigProvider>
              <AuthProvider>
                <ConfirmProvider>
                  <WebPushRegistrar />
                  {children}
                  <Toaster />
                </ConfirmProvider>
              </AuthProvider>
            </OAuthConfigProvider>
          </ThemeProvider>
        </QueryProvider>
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  )
}
