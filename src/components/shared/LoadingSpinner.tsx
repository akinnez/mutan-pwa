export function LoadingSpinner({ size = 32 }: { size?: number }) {
  return (
    <div className="flex justify-center items-center py-12">
      <div
        className="rounded-full border-2 animate-spin"
        style={{
          width: size, height: size,
          borderColor: '#e2e8f0',
          borderTopColor: 'var(--forest)',
        }}
      />
    </div>
  )
}
