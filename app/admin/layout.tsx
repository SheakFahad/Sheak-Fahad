import '../globals.css'
import type { Metadata } from 'next'
import { fontVariables } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'Admin — Sheak Fahad',
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={fontVariables}>
      <body className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">{children}</body>
    </html>
  )
}
