import { LucideIcon } from 'lucide-react'
interface Props { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }
export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--forest-light)' }}>
        <Icon size={24} style={{ color: 'var(--forest)' }} />
      </div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      {description && <p className="text-xs text-gray-400 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
