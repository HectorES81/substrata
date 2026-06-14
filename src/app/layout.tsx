import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Substrata',
  description: 'A psychometrically grounded personality profiling platform that reveals the layers of who you are.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
