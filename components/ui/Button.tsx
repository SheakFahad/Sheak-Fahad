import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { cn } from '@/lib/utils/cn'
import { Magnetic } from './Magnetic'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const base =
  'relative inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-[background,color,box-shadow,border-color] duration-300 disabled:pointer-events-none disabled:opacity-50'
const variants: Record<Variant, string> = {
  primary: 'text-white shadow-[var(--glow)] [background:var(--grad)] hover:brightness-110',
  secondary: 'glass text-[var(--text)] hover:border-[var(--line-strong)]',
  ghost: 'text-[var(--text-2)] hover:text-[var(--text)]',
}
const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-[0.95rem]',
  lg: 'px-8 py-4 text-base',
}

function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

interface Common {
  variant?: Variant
  size?: Size
  magnetic?: boolean
  children: ReactNode
  className?: string
}

export function Button({
  variant,
  size,
  magnetic,
  className,
  children,
  type = 'button',
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  const el = (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  )
  return magnetic ? <Magnetic>{el}</Magnetic> : el
}

/** Link styled as a button. Internal hrefs (starting with "/") use the page transition. */
export function ButtonLink({
  href,
  variant,
  size,
  magnetic,
  className,
  children,
  ...rest
}: Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const cls = buttonClass(variant, size, className)
  const internal = href.startsWith('/') && !href.startsWith('//')
  const el = internal ? (
    <TransitionLink href={href} className={cls} {...rest}>
      {children}
    </TransitionLink>
  ) : (
    <a href={href} className={cls} {...rest}>
      {children}
    </a>
  )
  return magnetic ? <Magnetic>{el}</Magnetic> : el
}
