import './globals.css'
import type { Metadata } from 'next'
import { ClientProviders } from './client-providers'
import LogViewer from './log-viewer'

export const metadata: Metadata = {
  title: 'MWA Test dApp',
  description: 'Testing Mobile Wallet Adapter issue #1364',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientProviders>
          {children}
          <LogViewer />
        </ClientProviders>
      </body>
    </html>
  )
}
