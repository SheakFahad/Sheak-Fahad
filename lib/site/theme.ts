export const THEME_STORAGE_KEY = 'sf-theme'

/**
 * Inline <head> script: applies the saved theme before first paint (no flash), enables
 * JS-driven reveal styles only when the user has not requested reduced motion.
 */
export function themeBootScript(defaultTheme: 'dark' | 'light') {
  const d = defaultTheme === 'light' ? 'light' : 'dark'
  return `(function(){var d=document.documentElement;try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');d.dataset.theme=(t==='light'||t==='dark')?t:'${d}'}catch(e){d.dataset.theme='${d}'}try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('js-motion')}catch(e){}})()`
}
