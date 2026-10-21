import { useMutation, useQueryClient } from '@tanstack/react-query'

import { adminChangePassword, adminLogin, adminRegister } from '@/lib/api'
import { adminKeys } from '@/lib/queryKeys'

export interface AdminLoginVariables {
  email: string
  password: string
}

export interface AdminRegisterVariables {
  fullName: string
  email: string
  password: string
}

/**
 * Signing in.
 *
 * A successful login does not invalidate anything: the catalogue is public
 * and its cached pages are perfectly valid for the signed-in admin too.
 * The admin screens mount afterwards and read the same cache.
 */
export function useAdminLoginMutation() {
  return useMutation({
    mutationFn: ({ email, password }: AdminLoginVariables) =>
      adminLogin(email, password),
  })
}

/**
 * Registering the first admin.
 *
 * The only thing that changes is whether an admin exists, so the status
 * query is the single entry worth invalidating.
 */
export function useAdminRegisterMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fullName, email, password }: AdminRegisterVariables) =>
      adminRegister(fullName, email, password),
    onSuccess: async () => {
      // An admin now exists, so the login screen's "has anybody been
      // registered yet?" answer is stale.
      await queryClient.invalidateQueries({ queryKey: adminKeys.status() })
    },
  })
}

/**
 * Changing the admin password.
 *
 * Nothing about the catalogue changes, so no product query is touched.
 */
export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string
      newPassword: string
    }) => adminChangePassword(currentPassword, newPassword),
  })
}

/** Exposed for the register screen, which needs to refresh the status. */
export { adminKeys }
export default useAdminLoginMutation
