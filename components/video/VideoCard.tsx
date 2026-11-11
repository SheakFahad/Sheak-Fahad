'use client'

import Image from 'next/image'
import { useState } from 'react'

export interface VideoCardData {
  id: string
  title: string
  description: string | null
  provider: 'youtube' | 'vimeo' | 'storage'
  externalId: string | null
  src: string | null
  poster: { src: string; alt: string } | null
  aspect: '16:9' | '9:16' | '1:1'
  meta: string[]
}

const ratio = { '16:9': '16 / 9', '9:16': '9 / 16', '1:1': '1 / 1' } as const

/** Lite embed: shows the poster first, loads the player only on click (fast, privacy-friendly). */
export function VideoCard({ video, playLabel }: { video: VideoCardData; playLabel: string }) {
  const [playing, setPlaying] = useState(false)
  const embed =
    video.provider === 'youtube' && video.externalId
      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.externalId)}?autoplay=1&rel=0`
      : video.provider === 'vimeo' && video.externalId
        ? `https://player.vimeo.com/video/${encodeURIComponent(video.externalId)}?autoplay=1`
        : null

  return (
    <article className="glass overflow-hidden rounded-[var(--radius-card)]">
      <div className="relative bg-black" style={{ aspectRatio: ratio[video.aspect] }}>
        {playing ? (
          embed ? (
            <iframe
              src={embed}
              title={video.title}
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              className="absolute inset-0 size-full"
            />
          ) : video.src ? (
            <video src={video.src} controls autoPlay playsInline className="absolute inset-0 size-full" poster={video.poster?.src} />
          ) : null
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0" aria-label={`${playLabel}: ${video.title}`}>
            {video.poster && <Image src={video.poster.src} alt="" fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover opacity-90" />}
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-16 place-items-center rounded-full text-white shadow-[var(--glow)] transition-transform duration-300 [background:var(--grad)] group-hover:scale-110">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="ml-1 size-6" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg">{video.title}</h3>
        {video.meta.length > 0 && <p className="mt-1 font-mono text-xs text-[var(--text-2)]">{video.meta.join(' · ')}</p>}
        {video.description && <p className="mt-3 text-sm text-[var(--text-2)]">{video.description}</p>}
      </div>
    </article>
  )
}
