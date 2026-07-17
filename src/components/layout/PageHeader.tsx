'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  back?: boolean
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, back = false, action }: Props) {
  const router = useRouter()
  return (
    <div
      className="sticky top-0 z-30 flex items-center gap-3 px-4 py-4"
      style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}
    >
      {back && (
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 -ml-1"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      <div className="flex-1">
        <h1 className="text-base font-semibold" style={{ color: 'var(--charcoal)' }}>{title}</h1>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
