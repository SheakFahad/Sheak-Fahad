import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * Development placeholder for content that is not verified/uploaded yet. Always visibly labelled —
 * it never pretends to be real content and never contains invented personal facts.
 */
export function PlaceholderCard({ badge, title, text, className, aspect, children }: { badge: string; title: string; text?: string; className?: string; aspect?: string; children?: ReactNode }) {
  return (
    <div className={cn('placeholder-card', className)} style={aspect ? { aspectRatio: aspect } : undefined}>
      <span className="placeholder-card__badge">{badge}</span>
      {children}
      <p className="mt-auto font-[family-name:var(--font-display)] text-base">{title}</p>
      {text && <p className="mt-1 text-sm text-[var(--text-2)]">{text}</p>}
    </div>
  )
}
