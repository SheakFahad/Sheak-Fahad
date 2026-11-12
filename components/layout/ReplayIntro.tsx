'use client'

import { useLocale } from 'next-intl'
import { GATEWAY_STORAGE_KEY } from '@/lib/site/theme'

/** Lets visitors watch the welcome intro again (it is otherwise shown once per browser). */
export function ReplayIntro({ label }: { label: string }) {
  const locale = useLocale()
  return (
    <button
      type="button"
      onClick={() => {
        try {
          localStorage.removeItem(GATEWAY_STORAGE_KEY)
          sessionStorage.removeItem('sf-nexus-intro')
        } catch {}
        window.location.href = locale === 'en' ? '/' : `/${locale}`
      }}
      className="inline-flex min-h-10 items-center gap-2 hover:text-[var(--text)]"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v5h5" />
      </svg>
      {label}
    </button>
  )
}
