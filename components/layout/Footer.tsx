import { TransitionLink } from '@/components/motion/TransitionLink'
import { SocialIcons } from '@/components/shared/SocialIcons'
import type { NavItem, SocialItem } from './nav-types'
import { SFMark } from './SFMark'

interface Props {
  siteName: string
  tagline: string
  items: NavItem[]
  socials: SocialItem[]
  labels: { tagline: string; explore: string; connect: string; rights: string; backToTop: string }
}

export function Footer({ siteName, tagline, items, socials, labels }: Props) {
  const year = new Date().getFullYear()
  return (
    <footer className="relative mt-24 border-t border-[var(--line)] bg-[var(--bg-2)]/60">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <SFMark className="size-12" />
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold">{siteName}</p>
          </div>
          <p className="mt-4 max-w-sm text-[var(--text-2)]">{tagline}</p>
          <p className="mt-6 font-[family-name:var(--font-display)] text-2xl leading-tight md:text-3xl">
            <span className="text-gradient">{labels.tagline}</span>
          </p>
        </div>

        <nav aria-label={labels.explore}>
          <p className="eyebrow mb-4">{labels.explore}</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 md:grid-cols-1">
            {items.map(i => (
              <li key={i.key}>
                <TransitionLink href={i.href} className="inline-flex min-h-10 items-center text-[var(--text-2)] hover:text-[var(--text)]">
                  {i.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="eyebrow mb-4">{labels.connect}</p>
          <SocialIcons items={socials} label={labels.connect} size="sm" />
        </div>
      </div>
      <div className="border-t border-[var(--line)]">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-sm text-[var(--text-2)] sm:flex-row">
          <p>
            © {year} {siteName}. {labels.rights}
          </p>
          <a href="#top" className="inline-flex min-h-10 items-center gap-2 hover:text-[var(--text)]">
            {labels.backToTop} <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
