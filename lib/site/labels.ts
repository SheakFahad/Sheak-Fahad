import 'server-only'
import { getTranslations } from 'next-intl/server'

/** Labels for MediaGallery/Lightbox (client components need plain strings). */
export async function galleryLabels() {
  const [g, c] = await Promise.all([getTranslations('gallery'), getTranslations('common')])
  return { open: g('open'), close: c('close'), previous: c('previous'), next: c('next') }
}
