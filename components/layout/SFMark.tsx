/** "SF" monogram inside an orbit ring — the brand mark. */
export function SFMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sf-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--blue)" />
          <stop offset="0.5" stopColor="var(--cyan)" />
          <stop offset="1" stopColor="var(--violet)" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" fill="none" stroke="url(#sf-grad)" strokeWidth="1.5" />
      <ellipse cx="24" cy="24" rx="23" ry="8" fill="none" stroke="url(#sf-grad)" strokeWidth="1" opacity="0.6" transform="rotate(-24 24 24)" />
      <text
        x="24"
        y="29.5"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontWeight="700"
        fontSize="15"
        fill="var(--text)"
        letterSpacing="-0.5"
      >
        SF
      </text>
    </svg>
  )
}
