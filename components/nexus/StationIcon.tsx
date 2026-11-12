import type { StationIconKey } from '@/lib/content/types'

/** Line icons for NEXUS stations (24px grid, currentColor). Keys are stored on `site_sections.icon`. */
const PATHS: Record<StationIconKey, string> = {
  home: 'M3 11.5 12 4l9 7.5M5.5 9.5V20h4.5v-5.5h4V20h4.5V9.5',
  user: 'M12 12.5a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5ZM4 20.5c1.2-3.6 4.3-5.5 8-5.5s6.8 1.9 8 5.5',
  trend: 'M3 20h18M5 16l4.5-5 3.5 3 6-7.5M15 6.5h4v4',
  cap: 'M2.5 9 12 4.5 21.5 9 12 13.5 2.5 9ZM6.5 11v4.6c1.5 1.5 3.4 2.4 5.5 2.4s4-.9 5.5-2.4V11M21.5 9v5.5',
  stack: 'm12 3.5 9 4.5-9 4.5L3 8l9-4.5ZM3 12.5l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5',
  flask: 'M9.5 3.5h5M10.5 3.5v5.2L4.8 18.4a1.4 1.4 0 0 0 1.2 2.1h12a1.4 1.4 0 0 0 1.2-2.1l-5.7-9.7V3.5M7.5 14h9',
  play: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM10 8.5v7l6-3.5-6-3.5Z',
  layers: 'M4 7h10M4 12h16M4 17h7M17 4.5v5M14.5 7h5M14 14.5l2.5 2.5 4-4.5',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H4.5a3 3 0 0 0 3.7 4.3M16 6h3.5a3 3 0 0 1-3.7 4.3M12 13v4M8.5 20.5h7M9.5 17h5v3.5h-5z',
  map: 'M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4ZM9 4v14M15 6v14',
  image: 'M4 5h16v14H4zM4 15.5l4.5-4.5 4 4 2.5-2.5 5 5M15.5 9.5a1.5 1.5 0 1 0 0-.01',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18M12 9.5l.9 1.6 1.6.9-1.6.9-.9 1.6-.9-1.6-1.6-.9 1.6-.9.9-1.6Z',
  send: 'M21 3.5 10 14M21 3.5 14.5 21 10 14l-6.5-4.5L21 3.5Z',
}

export function StationIcon({ name, className }: { name: StationIconKey | null | undefined; className?: string }) {
  const d = PATHS[name ?? 'spark'] ?? PATHS.spark
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}
