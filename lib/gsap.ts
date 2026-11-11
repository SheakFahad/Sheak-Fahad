'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

// Register once on the client. All GSAP plugins are free (incl. SplitText) since 3.13.
// Page-specific plugins (e.g. Flip) are imported/registered where they are used to keep the shared bundle small.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)
  gsap.defaults({ ease: 'power3.out', duration: 0.9 })
}

export { gsap, ScrollTrigger, SplitText, useGSAP }
