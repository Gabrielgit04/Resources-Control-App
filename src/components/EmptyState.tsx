import { Icon } from '@/components/Icon'

interface EmptyStateProps {
  icon: string
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-surface-container text-on-surface-variant mb-4">
        <Icon name={icon} size={28} />
      </div>
      <h4 className="font-display font-semibold text-lg text-on-surface mb-1">{title}</h4>
      {description && <p className="text-sm text-on-surface-variant max-w-sm">{description}</p>}
    </div>
  )
}
