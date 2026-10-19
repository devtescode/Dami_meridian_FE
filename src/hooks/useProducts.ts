import { useCallback, useEffect, useState } from 'react'
import { getProducts } from '@/lib/api'
import type { Product } from '@/types/product'

interface UseProductsResult {
  products: Product[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Loads the product catalogue from the backend.
 * Shared by the storefront grid and the admin dashboard so both stay in sync
 * and error/loading behaviour is identical.
 */
export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getProducts()
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      setProducts([])
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong loading the collection.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { products, isLoading, error, refetch: load }
}
