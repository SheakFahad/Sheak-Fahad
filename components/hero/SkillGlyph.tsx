import type { HeroSkill } from '@/lib/content/types'

/** Minimal line glyphs for the hero skill stations (stroke = currentColor). */
export function SkillGlyph({ icon, className }: { icon: HeroSkill['icon']; className?: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      {icon === 'layers' && (
        <g {...common}>
          <path d="M12 3 3 8l9 5 9-5-9-5Z" />
          <path d="m3 13 9 5 9-5" />
          <path d="m3 17.5 9 5 9-5" opacity=".5" />
        </g>
      )}
      {icon === 'pen' && (
        <g {...common}>
          <path d="M4 20 8.5 8.5 15.5 15.5 4 20Z" />
          <path d="m15.5 15.5 4-4a1.5 1.5 0 0 0 0-2.1l-4.9-4.9a1.5 1.5 0 0 0-2.1 0l-4 4" />
          <circle cx="10.2" cy="13.8" r="1.4" />
        </g>
      )}
      {icon === 'chart' && (
        <g {...common}>
          <path d="M4 20V4" />
          <path d="M4 20h16" />
          <path d="m7 15 4-5 3 3 5-7" />
          <circle cx="19" cy="6" r="1.2" />
        </g>
      )}
      {icon === 'atom' && (
        <g {...common}>
          <circle cx="12" cy="12" r="1.6" />
          <ellipse cx="12" cy="12" rx="9" ry="3.6" />
          <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" />
        </g>
      )}
      {icon === 'play' && (
        <g {...common}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="m10 9 5 3-5 3V9Z" />
        </g>
      )}
      {icon === 'globe' && (
        <g {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3Z" />
        </g>
      )}
    </svg>
  )
}
