import React from 'react'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import Providers from '@/components/Providers'
import { PageErrorWrapper } from '@/components/ErrorBoundaryWrapper'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <PageErrorWrapper>
              {children}
            </PageErrorWrapper>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}