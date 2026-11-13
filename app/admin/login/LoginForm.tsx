'use client'

import { useActionState } from 'react'
import { signIn, type LoginState } from './actions'

export function LoginForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, { error: null })
  return (
    <form action={action} className="mt-8 grid gap-4" noValidate>
      <label className="grid gap-1.5 text-sm font-semibold">
        Email
        <input name="email" type="email" autoComplete="username" required disabled={disabled} className="admin-input" />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        Password
        <input name="password" type="password" autoComplete="current-password" required minLength={8} disabled={disabled} className="admin-input" />
      </label>
      {state.error && (
        <p role="alert" className="rounded-lg bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending || disabled} className="admin-btn admin-btn--primary mt-2 w-full">
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
