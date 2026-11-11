'use client'

import { useLocale } from 'next-intl'
import { useTransition } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'

const LOCALES = [
  { code: 'en', short: 'EN', name: 'English' },
  { code: 'bn', short: 'বাং', name: 'বাংলা' },
] as const

export function LocaleSwitcher({ label }: { label: string }) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [pending, start] = useTransition()

  return (
    <div role="group" aria-label={label} className="flex rounded-full border border-[var(--line)] p-0.5">
      {LOCALES.map(l => (
        <button
          key={l.code}
          type="button"
          lang={l.code}
          aria-pressed={locale === l.code}
          aria-label={l.name}
          disabled={pending}
          onClick={() => start(() => router.replace(pathname, { locale: l.code, scroll: false }))}
          className={cn(
            'min-h-9 min-w-10 rounded-full px-2.5 font-mono text-xs transition-colors',
            locale === l.code ? 'bg-[var(--text)] text-[var(--bg)]' : 'text-[var(--text-2)] hover:text-[var(--text)]',
          )}
        >
          {l.short}
        </button>
      ))}
    </div>
  )
}
