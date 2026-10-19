import type { ReactNode } from 'react'
import {
  getProductWhatsAppLink,
  type OrderProduct,
  type ProductOrderOptions,
} from '@/lib/whatsapp'

interface WhatsAppOrderButtonProps {
  product: OrderProduct
  orderOptions?: ProductOrderOptions
  className?: string
  children: ReactNode
  /**
   * Optional accessible name for icon-only usages.
   * Defaults to a name derived from the product so the link is never
   * nameless if a caller forgets to pass one.
   */
  ariaLabel?: string
}

export default function WhatsAppOrderButton({
  product,
  orderOptions,
  className = '',
  children,
  ariaLabel,
}: WhatsAppOrderButtonProps) {
  const href = getProductWhatsAppLink(product, orderOptions)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel ?? `Order on WhatsApp (${product.name})`}
      // Keeps the click inside the button so the surrounding product card's
      // "View Details" action is not triggered as well.
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </a>
  )
}
