import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

const control =
  'w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-2)]/70 transition-colors focus:border-[var(--cyan)] focus:outline-none aria-[invalid=true]:border-[var(--danger)]'

interface FieldProps {
  label: string
  error?: string
  hint?: string
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode
}

/** Label + control + hint/error wiring with correct aria attributes. */
function Field({ label, error, hint, children }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errId = error ? `${id}-err` : undefined
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && (
        <p id={hintId} className="text-xs text-[var(--text-2)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="text-xs text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  )
}

export function TextInput({ label, error, hint, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  return (
    <Field label={label} error={error} hint={hint}>
      {({ id, describedBy, invalid }) => (
        <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={cn(control, className)} {...rest} />
      )}
    </Field>
  )
}

export function TextArea({ label, error, hint, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: string }) {
  return (
    <Field label={label} error={error} hint={hint}>
      {({ id, describedBy, invalid }) => (
        <textarea id={id} aria-describedby={describedBy} aria-invalid={invalid} className={cn(control, 'min-h-36', className)} {...rest} />
      )}
    </Field>
  )
}

export function SelectInput({
  label,
  error,
  hint,
  options,
  className,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; hint?: string; options: { value: string; label: string }[] }) {
  return (
    <Field label={label} error={error} hint={hint}>
      {({ id, describedBy, invalid }) => (
        <select id={id} aria-describedby={describedBy} aria-invalid={invalid} className={cn(control, className)} {...rest}>
          {options.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  )
}
