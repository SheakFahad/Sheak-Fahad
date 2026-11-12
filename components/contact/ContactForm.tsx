'use client'

import { revealUrl } from '@/lib/utils/protect'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { SelectInput, TextArea, TextInput } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { contactSchema, MESSAGE_CATEGORIES } from '@/lib/validations/contact'

interface Props {
  /** Protected (opaque) URLs — decoded in the browser only when the visitor sends. */
  emailUrl: string | null
  whatsappUrl: string | null
  labels: {
    title: string
    name: string
    email: string
    subject: string
    category: string
    message: string
    send: string
    sendWhatsApp: string
    sending: string
    invalid: string
    note: string
    categories: Record<(typeof MESSAGE_CATEGORIES)[number], string>
    errors: { name: string; email: string; message: string }
  }
}

type Errors = Partial<Record<'name' | 'email' | 'message', string>>

/**
 * Contact form. Until the database is connected (Phase 7) it hands the validated message to the
 * visitor's email app or WhatsApp — both real, working channels (no fake submit).
 */
export function ContactForm({ emailUrl, whatsappUrl, labels }: Props) {
  const toast = useToast()
  const [errors, setErrors] = useState<Errors>({})

  const read = (form: HTMLFormElement) => {
    const parsed = contactSchema.safeParse(Object.fromEntries(new FormData(form)))
    if (!parsed.success) {
      const e: Errors = {}
      for (const issue of parsed.error.issues) {
        const k = issue.path[0]
        if (k === 'name' || k === 'email' || k === 'message') e[k] = labels.errors[k]
      }
      setErrors(e)
      toast(labels.invalid, 'error')
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return null
    }
    setErrors({})
    return parsed.data
  }

  const body = (d: { message: string; name: string; email: string; category: string }) =>
    `${d.message}\n\n— ${d.name} (${d.email})\n[${labels.categories[d.category as keyof typeof labels.categories]}]`

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = read(e.currentTarget)
    const email = emailUrl ? revealUrl(emailUrl).replace(/^mailto:/, '') : ''
    if (!d || d.website || !email) return
    const subject = d.subject || `${labels.categories[d.category]} — ${d.name}`
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body(d))}`
    toast(labels.sending, 'success')
  }

  const onWhatsApp = (form: HTMLFormElement | null) => {
    const whatsappDigits = whatsappUrl ? (revealUrl(whatsappUrl).match(/wa\.me\/(\d+)/)?.[1] ?? '') : ''
    if (!form || !whatsappDigits) return
    const d = read(form)
    if (!d || d.website) return
    const text = (d.subject ? `${d.subject}\n` : '') + body(d)
    window.open(`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <form noValidate onSubmit={onSubmit} className="glass grid gap-5 rounded-[var(--radius-panel)] p-6 md:p-10" aria-labelledby="contact-form-title">
      <h2 id="contact-form-title" className="text-2xl md:text-3xl">
        {labels.title}
      </h2>
      <div className="grid gap-5 md:grid-cols-2">
        <TextInput name="name" label={labels.name} autoComplete="name" required maxLength={100} error={errors.name} />
        <TextInput name="email" type="email" label={labels.email} autoComplete="email" required maxLength={200} error={errors.email} />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <TextInput name="subject" label={labels.subject} maxLength={150} />
        <SelectInput name="category" label={labels.category} options={MESSAGE_CATEGORIES.map(c => ({ value: c, label: labels.categories[c] }))} />
      </div>
      <TextArea name="message" label={labels.message} required maxLength={4000} rows={6} error={errors.message} />
      {/* Honeypot: hidden from people and assistive tech */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p className="text-xs text-[var(--text-2)]">{labels.note}</p>
      <div className="flex flex-wrap gap-3">
        {emailUrl && (
          <Button type="submit" size="lg" magnetic>
            {labels.send}
          </Button>
        )}
        {whatsappUrl && (
          <Button type="button" variant="secondary" size="lg" onClick={e => onWhatsApp(e.currentTarget.form)}>
            {labels.sendWhatsApp}
          </Button>
        )}
      </div>
    </form>
  )
}
