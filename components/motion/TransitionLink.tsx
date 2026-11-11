'use client'

import type { ComponentProps, MouseEvent } from 'react'
import { Link } from '@/i18n/navigation'
import { useTransitionNavigate } from './PageTransition'

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string }

/** Internal link that plays the curtain transition. External links, new tabs and modifier clicks behave normally. */
export function TransitionLink({ href, onClick, ...rest }: Props) {
  const navigate = useTransitionNavigate()

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (
      e.defaultPrevented ||
      !navigate ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      rest.target === '_blank' ||
      !href.startsWith('/') ||
      href.startsWith('/#')
    )
      return
    e.preventDefault()
    navigate(href)
  }

  return <Link href={href} onClick={handle} {...rest} />
}
