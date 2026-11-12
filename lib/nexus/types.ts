/** Serializable shapes passed from the NEXUS server component to client components. */

export interface FeaturedProject {
  slug: string
  title: string
  type: string
  summary: string | null
  href: string
  cover: { src: string; alt: string; focalX: number; focalY: number } | null
  /** Cover is an illustrative concept visual — labelled as such, never presented as a product screenshot. */
  isConcept: boolean
}

export interface AssistantEntry {
  id: string
  question: string
  keywords: string[]
  answer: string
  href: string | null
  linkLabel: string
}
