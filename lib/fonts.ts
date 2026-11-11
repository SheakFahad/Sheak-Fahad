import { Anek_Bangla, JetBrains_Mono, Manrope, Noto_Sans_Bengali, Unbounded } from 'next/font/google'

export const unbounded = Unbounded({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-unbounded', display: 'swap' })
export const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-manrope', display: 'swap' })
export const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains', display: 'swap' })
// Bangla faces load only when Bangla glyphs are used (unicode-range), so English pages stay light.
export const anekBangla = Anek_Bangla({ subsets: ['bengali'], weight: ['500', '600', '700'], variable: '--font-anek-bangla', display: 'swap', preload: false })
export const notoBengali = Noto_Sans_Bengali({ subsets: ['bengali'], weight: ['400', '500', '600', '700'], variable: '--font-noto-bengali', display: 'swap', preload: false })

export const fontVariables = [unbounded, manrope, jetbrains, anekBangla, notoBengali].map(f => f.variable).join(' ')
