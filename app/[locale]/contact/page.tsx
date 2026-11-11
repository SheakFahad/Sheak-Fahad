import { getTranslations } from 'next-intl/server'
import { ContactForm } from '@/components/contact/ContactForm'
import { SectionHero } from '@/components/shared/SectionHero'
import { Container, GlassCard } from '@/components/ui/primitives'
import { getSocialLinks } from '@/lib/content/repository'
import { requireSection, sectionMetadata } from '@/lib/site/section'

export const generateMetadata = async ({ params }: PageProps<'/[locale]/contact'>) => sectionMetadata('contact', (await params).locale)

export default async function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  const { locale } = await params
  const { section } = await requireSection('contact', locale)
  const [t, socials] = await Promise.all([getTranslations('contactPage'), getSocialLinks()])
  const onContact = socials.filter(s => s.show_on_contact)
  const direct = onContact.filter(s => s.platform === 'email' || s.platform === 'whatsapp' || s.platform === 'phone')
  const social = onContact.filter(s => !direct.includes(s))
  const email = socials.find(s => s.platform === 'email')?.url.replace(/^mailto:/, '') ?? null
  const whatsappDigits = socials.find(s => s.platform === 'whatsapp')?.url.match(/wa\.me\/(\d+)/)?.[1] ?? null

  return (
    <>
      <SectionHero title={section.title} eyebrow={section.eyebrow} intro={section.intro} />
      <section className="pb-16">
        <Container className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="grid content-start gap-8">
            <div>
              <p className="eyebrow mb-4">{t('channels')}</p>
              <ul className="grid gap-3">
                {direct.map(s => (
                  <li key={s.platform} data-reveal>
                    <a
                      href={s.url}
                      target={s.url.startsWith('http') ? '_blank' : undefined}
                      rel={s.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="group block rounded-[var(--radius-card)]"
                    >
                      <GlassCard interactive className="flex items-center justify-between gap-4">
                        <span>
                          <span className="block text-sm text-[var(--text-2)]">{s.label}</span>
                          <span className="mt-1 block font-[family-name:var(--font-display)] text-lg break-all md:text-xl">{s.handle ?? s.url}</span>
                        </span>
                        <span aria-hidden="true" className="text-xl transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </GlassCard>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {social.length > 0 && (
              <div data-reveal>
                <p className="eyebrow mb-4">{t('social')}</p>
                <ul className="flex flex-wrap gap-2">
                  {social.map(s => (
                    <li key={s.platform}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm hover:border-[var(--line-strong)]"
                      >
                        {s.label} <span aria-hidden="true">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div data-reveal>
            <ContactForm
              email={email}
              whatsappDigits={whatsappDigits}
              labels={{
                title: t('formTitle'),
                name: t('name'),
                email: t('email'),
                subject: t('subject'),
                category: t('category'),
                message: t('message'),
                send: t('send'),
                sendWhatsApp: t('sendWhatsApp'),
                sending: t('sending'),
                invalid: t('invalid'),
                note: t('fallbackNote'),
                categories: {
                  general: t('categories.general'),
                  project: t('categories.project'),
                  job: t('categories.job'),
                  collaboration: t('categories.collaboration'),
                  other: t('categories.other'),
                },
                errors: { name: t('errors.name'), email: t('errors.email'), message: t('errors.message') },
              }}
            />
          </div>
        </Container>
      </section>
    </>
  )
}
