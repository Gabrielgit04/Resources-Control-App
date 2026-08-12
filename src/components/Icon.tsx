import type { HTMLAttributes } from 'react'

interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  name: string
  fill?: boolean
  weight?: number
  size?: number
}

export function Icon({ name, fill = false, weight = 400, size = 24, className = '', style, ...rest }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
        ...style,
      }}
      {...rest}
    >
      {name}
    </span>
  )
}
