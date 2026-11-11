'use client'

import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

// Register once on the client. All GSAP plugins are free (incl. SplitText) since 3.13.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip, useGSAP)
  gsap.defaults({ ease: 'power3.out', duration: 0.9 })
}

export { gsap, Flip, ScrollTrigger, SplitText, useGSAP }
