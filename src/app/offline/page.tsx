'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--forest)' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'rgba(255,255,255,0.1)' }}>
        <span className="text-4xl">📶</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
        You are offline
      </h1>
      <p className="text-sm mb-6" style={{ color: '#b3d9c4' }}>
        No internet connection detected. Your last viewed balance and transactions are still available — navigate to a page you have already visited.
      </p>
      <button
        onClick={() => window.location.href = '/dashboard'}
        className="px-6 py-3 rounded-2xl font-medium text-sm"
        style={{ background: '#D4AF37', color: '#0F5132' }}>
        Go to Dashboard
      </button>
      <p className="text-xs mt-6" style={{ color: '#7ab89a' }}>
        MUTAN Cooperative · Cached data available
      </p>
    </div>
  )
}
