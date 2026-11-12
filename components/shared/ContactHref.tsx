'use client'

import { useState, type AnchorHTMLAttributes } from 'react'
import { isProtected, revealUrl } from '@/lib/utils/protect'

/**
 * Anchor for social/contact links. Protected channels render a harmless fallback href and resolve the
 * real address only on hover, focus or click, so it never appears in the page source.
 */
export function ContactHref({ url, fallback = '/contact', ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { url: string; fallback?: string }) {
  const guarded = isProtected(url)
  const [href, setHref] = useState(guarded ? fallback : url)
  const reveal = () => {
    if (guarded && href === fallback) setHref(revealUrl(url))
  }
  const external = !guarded && url.startsWith('http')
  const real = guarded ? revealUrl(url) : url
  const opensApp = guarded && real.startsWith('http')
  return (
    <a
      {...rest}
      href={href}
      target={external || opensApp ? '_blank' : undefined}
      rel={external || opensApp ? 'noopener noreferrer' : undefined}
      onPointerEnter={reveal}
      onFocus={reveal}
      onTouchStart={reveal}
      onClick={e => {
        if (guarded && href === fallback) {
          e.preventDefault()
          const r = revealUrl(url)
          setHref(r)
          if (r.startsWith('http')) window.open(r, '_blank', 'noopener,noreferrer')
          else window.location.href = r
        }
        rest.onClick?.(e)
      }}
    />
  )
}
