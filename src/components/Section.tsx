import type { ReactNode } from 'react'

/** Consistent horizontal rhythm for every section. */
export function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}

/**
 * Section wrapper providing the standard vertical rhythm, optional
 * `eyebrow` kicker, serif heading, gold rule and supporting copy.
 */
export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  align = 'center',
  className = '',
  contentClassName = '',
}: {
  id?: string
  eyebrow?: string
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  align?: 'center' | 'left'
  className?: string
  contentClassName?: string
}) {
  const alignment =
    align === 'center' ? 'items-center text-center mx-auto' : 'items-start text-left'

  return (
    <section id={id} className={`relative py-20 sm:py-24 lg:py-28 ${className}`}>
      <Container>
        {(eyebrow || title || description) && (
          <div
            className={`flex flex-col ${alignment} mb-14 sm:mb-16 max-w-3xl`}
          >
            {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
            {title && (
              <h2 className="text-4xl sm:text-5xl lg:text-6xl leading-[1.08] text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl">
                {description}
              </p>
            )}
            <div className="rule-gold w-24 mt-8" aria-hidden="true" />
          </div>
        )}
        <div className={contentClassName}>{children}</div>
      </Container>
    </section>
  )
}

/** Small uppercase label used for badges and metadata. */
export function MetaLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </span>
  )
}
