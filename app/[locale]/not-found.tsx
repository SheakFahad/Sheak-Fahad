import { getTranslations } from 'next-intl/server'
import { ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/primitives'

export default async function NotFound() {
  const t = await getTranslations('common')
  return (
    <section className="flex min-h-[80dvh] items-center pt-32 pb-16">
      <Container className="text-center">
        <p className="font-mono text-sm text-[var(--cyan)]">404</p>
        <h1 className="mt-4 text-[clamp(2.5rem,7vw,6rem)] font-bold">
          <span className="text-gradient">{t('notFoundTitle')}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[var(--text-2)]">{t('notFoundText')}</p>
        <div className="mt-10 flex justify-center">
          <ButtonLink href="/" size="lg">
            {t('goHome')}
          </ButtonLink>
        </div>
      </Container>
    </section>
  )
}
