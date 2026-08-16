import { useEffect, useState, type ReactNode } from 'react'

interface ModalProps<T> {
  open: boolean
  onClose: () => void
  panelClassName?: string
  payload?: T | null
  children: ReactNode | ((payload: T) => ReactNode)
}

export function Modal<T>({ open, onClose, panelClassName = '', payload = null, children }: ModalProps<T>) {
  const [visible, setVisible] = useState(open)
  const [lastPayload, setLastPayload] = useState<T | null>(null)

  useEffect(() => {
    if (payload !== null && payload !== undefined) {
      setLastPayload(payload)
    }
  }, [payload])

  useEffect(() => {
    if (open) {
      setVisible(true)
      return
    }
    const timer = setTimeout(() => setVisible(false), 300)
    return () => clearTimeout(timer)
  }, [open])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[60] overflow-y-auto bg-black/40 ${
        open ? 'animate-in fade-in' : 'animate-out fade-out'
      } duration-300`}
      onClick={onClose}
    >
      <div className={`flex min-h-full items-center justify-center p-4 ${open ? '' : 'pointer-events-none'}`}>
        <div
          className={`${panelClassName} ${
            open ? 'animate-in fade-in zoom-in-95' : 'animate-out fade-out zoom-out-95'
          } duration-300`}
          onClick={(e) => e.stopPropagation()}
        >
          {typeof children === 'function' ? children(lastPayload as T) : children}
        </div>
      </div>
    </div>
  )
}
