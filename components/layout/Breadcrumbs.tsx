import { TransitionLink } from '@/components/motion/TransitionLink'
import { jsonLd as serialize } from '@/lib/utils/json-ld'

export interface Crumb {
  label: string
  href?: string
}

/** Visible breadcrumbs + BreadcrumbList JSON-LD. The last crumb is the current page. */
export function Breadcrumbs({ items, label, siteUrl }: { items: Crumb[]; label: string; siteUrl?: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href && siteUrl ? { item: new URL(c.href, siteUrl).toString() } : {}),
    })),
  }
  return (
    <nav aria-label={label} className="font-mono text-xs text-[var(--text-2)]">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((c, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2">
              {c.href && !last ? (
                <TransitionLink href={c.href} className="hover:text-[var(--text)]">
                  {c.label}
                </TransitionLink>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={last ? 'text-[var(--text)]' : undefined}>
                  {c.label}
                </span>
              )}
              {!last && <span aria-hidden="true">/</span>}
            </li>
          )
        })}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(jsonLd) }} />
    </nav>
  )
}
