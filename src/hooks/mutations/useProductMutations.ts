import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { addProduct, deleteProduct, editProduct } from '@/lib/api'
import { productKeys } from '@/lib/queryKeys'
import type { AdminFormProduct } from '@/types/product'

export interface UpdateProductVariables {
  /** The product's reference. */
  id: string
  /** The new values, including any newly uploaded images. */
  product: AdminFormProduct
}

/**
 * Drops every cached product view.
 *
 * Called when the admin session ends: the data fetched during the session
 * must not survive it, so the next session starts from the server rather
 * than from whatever the previous one left behind.
 */
export function useClearProductCache(): () => void {
  const queryClient = useQueryClient()

  return useCallback(() => {
    queryClient.removeQueries({ queryKey: productKeys.all })
  }, [queryClient])
}

/**
 * The product write operations.
 *
 * Every successful mutation invalidates the PRODUCT family — the shop
 * pages, the admin table, the dashboard statistics and the product pages.
 * That is one targeted invalidation rather than a blanket cache clear:
 * unrelated queries (the admin status, for instance) are left alone, and
 * the pages that are on screen refetch in the background.
 *
 * The affected product's own detail entry is invalidated explicitly too,
 * so a renamed product shows its new name immediately rather than after
 * the next unrelated refetch.
 */
export function useProductMutations() {
  const queryClient = useQueryClient()

  const invalidateProducts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: productKeys.all })
  }, [queryClient])

  const createProduct = useMutation({
    mutationFn: (product: AdminFormProduct) => addProduct(product),
    onSuccess: invalidateProducts,
  })

  const updateProduct = useMutation({
    mutationFn: ({ id, product }: UpdateProductVariables) =>
      editProduct(id, product),
    onSuccess: async (_data, variables) => {
      await invalidateProducts()
      // The product just edited is the one most likely to be on screen.
      await queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      })
    },
  })

  const removeProduct = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: invalidateProducts,
  })

  return { createProduct, updateProduct, removeProduct }
}

export default useProductMutations
