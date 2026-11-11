import Image from 'next/image'
import type { MediaRef } from '@/lib/content/types'
import { cn } from '@/lib/utils/cn'

interface Props {
  media: MediaRef
  className?: string
  sizes?: string
  priority?: boolean
  aspect?: string
}

/**
 * Cinematic frame for photos. Effects (gradient border, corner ticks, glow) live on the FRAME only.
 * The photo itself is rendered untouched — no filters, blend modes or overlays on the image.
 */
export function FramedPhoto({ media, className, sizes = '(min-width: 1024px) 40vw, 90vw', priority, aspect = '4 / 5' }: Props) {
  const position = `${Math.round((media.focal_x ?? 0.5) * 100)}% ${Math.round((media.focal_y ?? 0.5) * 100)}%`
  return (
    <figure className={cn('relative isolate', className)}>
      <div aria-hidden="true" className="absolute -inset-6 -z-10 rounded-[40px] opacity-60 blur-3xl [background:var(--grad)]" />
      <div className="rounded-[var(--radius-panel)] p-[1.5px] [background:var(--grad)]">
        <div className="relative overflow-hidden rounded-[calc(var(--radius-panel)-1.5px)] bg-[var(--bg-2)]" style={{ aspectRatio: aspect }}>
          <Image src={media.src} alt={media.alt} fill sizes={sizes} priority={priority} className="object-cover" style={{ objectPosition: position }} />
        </div>
      </div>
      {/* corner ticks */}
      <span aria-hidden="true" className="absolute -top-3 -left-3 size-6 border-t-2 border-l-2 border-[var(--cyan)]" />
      <span aria-hidden="true" className="absolute -right-3 -bottom-3 size-6 border-r-2 border-b-2 border-[var(--violet)]" />
    </figure>
  )
}
