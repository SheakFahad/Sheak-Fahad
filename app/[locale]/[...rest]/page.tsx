import { notFound } from 'next/navigation'

/** Any unknown multi-segment path renders the localized not-found page. */
export default function CatchAll() {
  notFound()
}
