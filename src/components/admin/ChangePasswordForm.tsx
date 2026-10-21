import { useRef, useState, type FormEvent, type RefObject } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import Swal from 'sweetalert2'

import { useChangePasswordMutation } from '@/hooks/mutations/useAuthMutations'
import { ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'

/** Minimum length the backend expects for a new password. */
const MIN_PASSWORD_LENGTH = 8

type FieldKey = 'currentPassword' | 'newPassword' | 'confirmPassword'

interface PasswordValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type FieldErrors = Partial<Record<FieldKey, string>>

const EMPTY_VALUES: PasswordValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

const FIELD_ORDER: FieldKey[] = [
  'currentPassword',
  'newPassword',
  'confirmPassword',
]

/** Pure validation — reused for live hints and for blocking the submit. */
function validate(values: PasswordValues): FieldErrors {
  const errors: FieldErrors = {}

  if (!values.currentPassword.trim()) {
    errors.currentPassword = 'Current password is required.'
  }

  if (!values.newPassword) {
    errors.newPassword = 'New password is required.'
  } else if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your new password.'
  } else if (values.newPassword !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error?: string
  hint?: string
  isVisible: boolean
  onToggleVisibility: () => void
  toggleLabel: string
  autoComplete: string
  inputRef: RefObject<HTMLInputElement | null>
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  isVisible,
  onToggleVisibility,
  toggleLabel,
  autoComplete,
  inputRef,
}: PasswordFieldProps) {
  // The feedback element is always present so screen readers announce the
  // change when an error replaces the hint.
  const feedbackId = `${id}-feedback`

  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
      >
        {label} <span className="text-primary">*</span>
      </label>

      <div className="relative mt-2">
        <input
          id={id}
          ref={inputRef}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          required
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={feedbackId}
          className="h-12 w-full rounded-lg border border-border bg-surface-2 px-4 pr-12 text-sm text-foreground placeholder:text-subtle transition-colors focus:border-primary/60"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          aria-label={toggleLabel}
          aria-pressed={isVisible}
          className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-primary"
        >
          {isVisible ? (
            <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
          ) : (
            <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="mt-2 min-h-[1rem]">
        <p
          id={feedbackId}
          aria-live="polite"
          className={cn(
            'text-xs',
            error ? 'text-destructive-text' : 'text-subtle',
          )}
        >
          {error ?? hint ?? ''}
        </p>
      </div>
    </div>
  )
}

export default function ChangePasswordForm() {
  const [values, setValues] = useState<PasswordValues>(EMPTY_VALUES)
  const [visible, setVisible] = useState<Record<FieldKey, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [hasAttempted, setHasAttempted] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // The mutation owns the in-flight state; the form only owns its inputs.
  const changePasswordMutation = useChangePasswordMutation()
  const isSubmitting = changePasswordMutation.isPending

  const fieldRefs = {
    currentPassword: useRef<HTMLInputElement>(null),
    newPassword: useRef<HTMLInputElement>(null),
    confirmPassword: useRef<HTMLInputElement>(null),
  }

  const errors = validate(values)

  // Errors stay hidden until a field is touched so the form is not red on
  // first paint, but a submit attempt reveals every problem at once.
  const errorFor = (field: FieldKey): string | undefined =>
    touched[field] || hasAttempted ? errors[field] : undefined

  const handleChange = (field: FieldKey, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }))
    setTouched((previous) => ({ ...previous, [field]: true }))
    setFormError(null)
  }

  const handleBlur = (field: FieldKey) => {
    setTouched((previous) => ({ ...previous, [field]: true }))
  }

  const toggleVisibility = (field: FieldKey) => {
    setVisible((previous) => ({ ...previous, [field]: !previous[field] }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasAttempted(true)
    setFormError(null)

    const nextErrors = validate(values)
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field])

    // Block the request until the form is genuinely valid.
    if (firstInvalid) {
      fieldRefs[firstInvalid].current?.focus()
      return
    }

    try {
      const result = await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })

      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2800,
        timerProgressBar: true,
      }).fire({
        icon: 'success',
        title: 'Password updated',
        text:
          result?.message || 'Your new password is now active.',
      })

      // Clear every field so the next change starts from a clean slate.
      setValues(EMPTY_VALUES)
      setTouched({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      })
      setVisible({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      })
      setHasAttempted(false)
    } catch (error) {
      // The API client surfaces the backend's own wording (e.g. "Current
      // password is incorrect") — show it instead of a generic message.
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Could not update your password. Please try again.',
      )
      fieldRefs.currentPassword.current?.focus()
    }
  }

  return (
    <section className="animate-fade-in-up">
      <div className="card-luxury w-full max-w-lg rounded-xl p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30"
          >
            <KeyRound className="h-5 w-5 text-primary" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-2xl text-foreground">
              Change Password
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a strong password you have not used before. You will stay
              signed in on this device.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
          <PasswordField
            id="current-password"
            label="Current Password"
            value={values.currentPassword}
            onChange={(value) => handleChange('currentPassword', value)}
            onBlur={() => handleBlur('currentPassword')}
            error={errorFor('currentPassword')}
            isVisible={visible.currentPassword}
            onToggleVisibility={() => toggleVisibility('currentPassword')}
            toggleLabel={
              visible.currentPassword
                ? 'Hide current password'
                : 'Show current password'
            }
            autoComplete="current-password"
            inputRef={fieldRefs.currentPassword}
          />

          <PasswordField
            id="new-password"
            label="New Password"
            value={values.newPassword}
            onChange={(value) => handleChange('newPassword', value)}
            onBlur={() => handleBlur('newPassword')}
            error={errorFor('newPassword')}
            hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            isVisible={visible.newPassword}
            onToggleVisibility={() => toggleVisibility('newPassword')}
            toggleLabel={
              visible.newPassword ? 'Hide new password' : 'Show new password'
            }
            autoComplete="new-password"
            inputRef={fieldRefs.newPassword}
          />

          <PasswordField
            id="confirm-password"
            label="Confirm New Password"
            value={values.confirmPassword}
            onChange={(value) => handleChange('confirmPassword', value)}
            onBlur={() => handleBlur('confirmPassword')}
            error={errorFor('confirmPassword')}
            isVisible={visible.confirmPassword}
            onToggleVisibility={() => toggleVisibility('confirmPassword')}
            toggleLabel={
              visible.confirmPassword
                ? 'Hide confirm new password'
                : 'Show confirm new password'
            }
            autoComplete="new-password"
            inputRef={fieldRefs.confirmPassword}
          />

          {/* Server-side failures (e.g. wrong current password) land here.
              The live region stays mounted so the message is announced. */}
          <div aria-live="polite">
            {formError ? (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-text">
                {formError}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-gold btn-gold-hover inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </section>
  )
}
