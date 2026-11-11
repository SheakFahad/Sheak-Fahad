import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export function Container({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('container-x', className)} {...rest} />
}

export function GlassCard({
  className,
  interactive,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'glass rounded-[var(--radius-card)] p-6',
        interactive &&
          'transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 hover:border-[var(--line-strong)] hover:shadow-[var(--glow)]',
        className,
      )}
      {...rest}
    />
  )
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-[var(--line)] px-3 py-1 font-mono text-xs text-[var(--text-2)]',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('eyebrow', className)}>{children}</p>
}

export function EmptyState({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="glass mx-auto max-w-2xl rounded-[var(--radius-panel)] px-6 py-14 text-center" data-reveal>
      <div aria-hidden="true" className="mx-auto mb-6 size-14 rounded-full [background:var(--grad)] opacity-80 blur-[1px]" />
      <h2 className="text-2xl md:text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-[var(--text-2)]">{text}</p>
      {children ? <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div> : null}
    </div>
  )
}
