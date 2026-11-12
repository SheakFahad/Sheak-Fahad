export const THEME_STORAGE_KEY = 'sf-theme'
export const GATEWAY_STORAGE_KEY = 'sf-gateway-seen'

/**
 * Inline <head> script: applies the saved theme before first paint (no flash), enables
 * JS-driven reveal styles only when the user has not requested reduced motion, and marks the
 * first visit to the homepage so the Welcome gateway shows without a flash of the hero.
 */
export function themeBootScript(defaultTheme: 'dark' | 'light') {
  const d = defaultTheme === 'light' ? 'light' : 'dark'
  return `(function(){var d=document.documentElement;try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');d.dataset.theme=(t==='light'||t==='dark')?t:'${d}'}catch(e){d.dataset.theme='${d}'}try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('js-motion')}catch(e){}try{var p=location.pathname;if(p.length>1&&p.charAt(p.length-1)==='/')p=p.slice(0,-1);if((p==='/'||p==='/bn')&&!localStorage.getItem('${GATEWAY_STORAGE_KEY}')&&!/[?&]nogate/.test(location.search))d.dataset.gate='1'}catch(e){}})()`
}
