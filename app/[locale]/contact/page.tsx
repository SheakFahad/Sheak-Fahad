import { getTranslations } from 'next-intl/server'
import { ContactForm } from '@/components/contact/ContactForm'
import { SectionHero } from '@/components/shared/SectionHero'
import { SocialIcons } from '@/components/shared/SocialIcons'
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
  // Private channel URLs are already opaque tokens (lib/utils/protect.ts) — decoded only in the browser on send
  const emailUrl = socials.find(s => s.platform === 'email')?.url ?? null
  const whatsappUrl = socials.find(s => s.platform === 'whatsapp')?.url ?? null

  return (
    <>
      <SectionHero stationKey="contact" title={section.title} eyebrow={section.eyebrow} intro={section.intro} />
      <section className="pb-16">
        <Container className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="grid content-start gap-6">
            {/* Contact details are never printed as text — recognisable icons with accessible names only */}
            <GlassCard data-reveal className="transmission-card">
              <p className="eyebrow">{t('channels')}</p>
              <SocialIcons items={direct} label={t('channels')} size="lg" className="mt-5" />
            </GlassCard>
            {social.length > 0 && (
              <GlassCard data-reveal className="transmission-card">
                <p className="eyebrow">{t('social')}</p>
                <SocialIcons items={social} label={t('social')} size="lg" className="mt-5" />
              </GlassCard>
            )}
            <div aria-hidden="true" className="transmission-beacon" data-reveal>
              <span />
              <span />
              <span />
            </div>
          </div>
          <div data-reveal>
            <ContactForm
              emailUrl={emailUrl}
              whatsappUrl={whatsappUrl}
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
