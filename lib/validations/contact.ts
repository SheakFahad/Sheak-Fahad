import { z } from 'zod'

export const MESSAGE_CATEGORIES = ['general', 'project', 'job', 'collaboration', 'other'] as const

/** Shared by the client form and (Phase 7) the /api/contact route handler. */
export const contactSchema = z.object({
  name: z.string().trim().min(1, 'name').max(100, 'name'),
  email: z.email('email').trim().max(200, 'email'),
  subject: z.string().trim().max(150).optional().default(''),
  category: z.enum(MESSAGE_CATEGORIES).default('general'),
  message: z.string().trim().min(10, 'message').max(4000, 'message'),
  /** Honeypot — must stay empty. */
  website: z.string().max(0).optional().default(''),
})
