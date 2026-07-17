'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }))
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-center" toastOptions={{
        style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px', borderRadius: '12px' },
        success: { style: { borderLeft: '4px solid #0F5132' } },
        error: { style: { borderLeft: '4px solid #991b1b' } },
      }} />
    </QueryClientProvider>
  )
}
