'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function BottomSheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
        style={{ maxHeight: '90vh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-10 h-1 bg-gray-200 rounded-full absolute top-3 left-1/2 -translate-x-1/2" />
          <h3 className="font-semibold text-base mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 mt-2">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
