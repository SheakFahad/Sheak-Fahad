'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

type Tone = 'info' | 'success' | 'error'
interface ToastItem {
  id: number
  text: string
  tone: Tone
}
type Push = (text: string, tone?: Tone) => void

const ToastContext = createContext<Push>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback<Push>((text, tone = 'info') => {
    const id = Date.now() + Math.random()
    setItems(list => [...list, { id, text, tone }])
    setTimeout(() => setItems(list => list.filter(t => t.id !== id)), 5000)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[95] flex flex-col items-center gap-2 px-4"
      >
        {items.map(t => (
          <div
            key={t.id}
            className={cn(
              'glass pointer-events-auto rounded-full px-5 py-3 text-sm shadow-lg',
              t.tone === 'success' && 'border-[var(--success)]',
              t.tone === 'error' && 'border-[var(--danger)]',
            )}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
