import { createElement, type CSSProperties, type ReactNode } from 'react'
import { useInView } from '@/hooks/use-in-view'
import { cn } from '@/lib/utils'

interface RevealProps {
  as?: 'div' | 'section' | 'li'
  children: ReactNode
  className?: string
  delay?: number
}

export function Reveal({ as = 'div', children, className, delay = 0 }: RevealProps) {
  const { ref, inView } = useInView<HTMLElement>()
  const style: CSSProperties = delay ? { transitionDelay: `${delay}ms` } : {}
  return createElement(
    as,
    {
      ref: ref as never,
      className: cn('reveal', inView && 'reveal-visible', className),
      style,
    },
    children
  )
}
