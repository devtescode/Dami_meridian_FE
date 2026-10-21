import { useQuery } from '@tanstack/react-query'

import { getAdminStatus } from '@/lib/api'
import { adminKeys } from '@/lib/queryKeys'
import { ADMIN_STATUS_STALE_TIME } from '@/lib/queryClient'

export interface UseAdminStatusQueryResult {
  /** Whether an admin account exists. Null until the answer arrives. */
  adminExists: boolean | null
  /** True while the request is in flight. */
  isLoading: boolean
  /** The failure message, or null. */
  error: string | null
  /** Re-issues the request. */
  refetch: () => void
}

/**
 * Whether an admin account has been registered.
 *
 * The answer changes at most once in the life of the deployment, so it is
 * cached for five minutes. The login and register screens both ask for
 * it, and they share this one request instead of each making their own.
 */
export function useAdminStatusQuery(): UseAdminStatusQueryResult {
  const query = useQuery({
    queryKey: adminKeys.status(),
    queryFn: ({ signal }) => getAdminStatus({ signal }),
    staleTime: ADMIN_STATUS_STALE_TIME,
  })

  return {
    adminExists: query.data?.adminExists ?? null,
    isLoading: query.isFetching,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? 'Could not reach the server. Please try again.'
          : null,
    refetch: () => {
      void query.refetch()
    },
  }
}

export default useAdminStatusQuery
