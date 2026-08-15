import { useCountUp } from '@/hooks/use-count-up'

interface AnimatedNumberProps {
  value: number
  formatter?: (value: number) => string
  duration?: number
  className?: string
}

export function AnimatedNumber({ value, formatter, duration = 800, className }: AnimatedNumberProps) {
  const display = useCountUp(value, duration)
  const text = formatter ? formatter(display) : String(Math.round(display * 100) / 100)
  return <span className={className}>{text}</span>
}
