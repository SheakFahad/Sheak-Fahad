/**
 * Private contact channels (email, WhatsApp, phone) are never shipped as readable text — not in HTML,
 * the RSC payload, tooltips or metadata. The server replaces their URL with an opaque token; the browser
 * decodes it only when the visitor activates the icon.
 */
const PREFIX = 'protected:'
const PRIVATE = /^(mailto:|tel:|https?:\/\/(wa\.me|api\.whatsapp\.com)\/)/i

const b64 = (s: string) => (typeof btoa === 'function' ? btoa(s) : Buffer.from(s, 'binary').toString('base64'))
const unb64 = (s: string) => (typeof atob === 'function' ? atob(s) : Buffer.from(s, 'base64').toString('binary'))

export const isPrivateUrl = (url: string) => PRIVATE.test(url)
export const isProtected = (url: string) => url.startsWith(PREFIX)

export function protectUrl(url: string): string {
  if (!isPrivateUrl(url)) return url
  return PREFIX + b64(encodeURIComponent(url).split('').reverse().join(''))
}

export function revealUrl(value: string): string {
  if (!isProtected(value)) return value
  try {
    return decodeURIComponent(unb64(value.slice(PREFIX.length)).split('').reverse().join(''))
  } catch {
    return ''
  }
}
