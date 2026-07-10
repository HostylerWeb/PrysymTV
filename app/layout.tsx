import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import { ConfirmProvider } from '@/contexts/confirm-context'
import { OAuthConfigProvider } from '@/contexts/oauth-config-context'
import { ThemeProvider } from '@/components/theme-provider'
import { WebPushRegistrar } from '@/components/web-push-registrar'
import { CompleteProfileBanner } from '@/components/complete-profile-banner'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Prysym TV - Movies, Live & Videos',
  description: 'Your ultimate streaming destination for movies, live streams, and videos',
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
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="prysym-theme">
          <OAuthConfigProvider>
            <AuthProvider>
              <ConfirmProvider>
                <WebPushRegistrar />
                <CompleteProfileBanner />
                {children}
                <Toaster />
              </ConfirmProvider>
            </AuthProvider>
          </OAuthConfigProvider>
        </ThemeProvider>
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  )
}
