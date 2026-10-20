import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import ChangePasswordForm from '@/components/admin/ChangePasswordForm'

export default function AdminChangePasswordPage() {
  return (
    <div className="animate-fade-in-up space-y-6">
      <header>
        <p className="eyebrow">Security</p>
        <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
          Change Password
        </h1>
        <div className="rule-gold mt-4 w-28" aria-hidden="true" />
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          Update the password for this admin account. Your current password is
          required, and you will stay signed in on this device afterwards.
        </p>
      </header>

      <ChangePasswordForm />

      <div>
        <Link
          to="/admin/dashboard"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
