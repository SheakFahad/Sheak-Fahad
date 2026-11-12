import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { buildAssistantContext } from '@/lib/assistant/context'
import { getSiteSettings } from '@/lib/content/repository'

/**
 * Fahad's AI Assistant — server-side only. The API key never reaches the browser.
 * GET  → { configured } so the UI can show an honest state.
 * POST → { answer, action } grounded ONLY in published portfolio data.
 * When no key is configured the endpoint answers 503 and the UI uses the offline portfolio guide.
 */

const MODEL = process.env.ASSISTANT_MODEL || 'claude-opus-5-5'
const configured = () => Boolean(process.env.ANTHROPIC_API_KEY)

const bodySchema = z.object({
  locale: z.enum(['en', 'bn']).default('en'),
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(1000) }))
    .min(1)
    .max(16),
})

// Best-effort in-memory rate limit per IP (moves to the database in Phase 4).
const hits = new Map<string, number[]>()
function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter(t => now - t < 10 * 60_000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 20
}

const RULES = `You are "Fahad AI Assistant", the guide on Sheak Fahad's personal portfolio website. You speak about Sheak in the third person.
Rules:
- Answer ONLY from the verified facts below. If something is not in the facts, say plainly that it has not been published on the portfolio yet — never guess, never invent dates, numbers, employers, clients, skills, places or achievements.
- Never write an email address or a phone/WhatsApp number. For contact, point to the Contact page icons and form.
- Never state GPA/CGPA or other exam results.
- Keep answers short: 1–4 sentences, plain text, no markdown headings or tables.
- Reply in the visitor's language (English or Bangla).
- When a page on the site is the natural next step, end with exactly one final line: "ACTION: <path>" using a path from the "Site pages" list. Otherwise omit the line.`

export async function GET() {
  const settings = await getSiteSettings()
  return Response.json({ configured: configured() && settings.features.assistant })
}

export async function POST(req: Request) {
  const settings = await getSiteSettings()
  if (!settings.features.assistant || !configured()) {
    return Response.json({ error: 'not_configured' }, { status: 503 })
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (limited(ip)) return Response.json({ error: 'rate_limited' }, { status: 429 })

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }
  if (body.messages[0]?.role !== 'user') return Response.json({ error: 'invalid_request' }, { status: 400 })

  const { facts, actions } = await buildAssistantContext(body.locale)
  const client = new Anthropic()

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 1500,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: `${RULES}\n\n${facts}`, cache_control: { type: 'ephemeral' } }],
      messages: body.messages.map(m => ({ role: m.role, content: m.content })),
    })

    if (response.stop_reason === 'refusal') {
      return Response.json({ answer: null, action: null, refused: true })
    }
    const text = response.content
      .flatMap(b => (b.type === 'text' ? [b.text] : []))
      .join('\n')
      .trim()
    const match = text.match(/\n?ACTION:\s*(\S+)\s*$/)
    const href = match?.[1]
    const action = href ? (actions.find(a => a.href === href) ?? null) : null
    const answer = (match ? text.slice(0, match.index) : text).trim()
    return Response.json({ answer, action })
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return Response.json({ error: 'busy' }, { status: 429 })
    if (error instanceof Anthropic.AuthenticationError) return Response.json({ error: 'not_configured' }, { status: 503 })
    if (error instanceof Anthropic.APIError) return Response.json({ error: 'upstream' }, { status: 502 })
    return Response.json({ error: 'upstream' }, { status: 502 })
  }
}
