import type { AssistantEntry } from '@/lib/nexus/types'

const tokens = (s: string) => s.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []

/**
 * Offline portfolio guide: keyword retrieval over verified entries. Deterministic,
 * never generates text — it can only return an answer that was built from published data.
 */
export function localAnswer(query: string, kb: AssistantEntry[]): AssistantEntry | null {
  const words = tokens(query)
  if (!words.length) return null
  let best: AssistantEntry | null = null
  let bestScore = 0
  for (const e of kb) {
    let score = 0
    for (const w of words) {
      if (w.length < 3 && /^[a-z0-9]+$/.test(w)) continue // skip short Latin words (is, do, my…)
      if (e.keywords.includes(w)) score += 2
      else if (w.length >= 5 && e.keywords.some(k => k.length >= 5 && (k.startsWith(w) || w.startsWith(k)))) score += 1
    }
    if (score > bestScore) {
      best = e
      bestScore = score
    }
  }
  return bestScore > 0 ? best : null
}
