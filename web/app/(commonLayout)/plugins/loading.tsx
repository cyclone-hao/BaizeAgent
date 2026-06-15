const SkeletonPulse = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700/50 ${className || ''}`} />
)

export default function PluginsLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header area */}
      <div className="flex shrink-0 items-center justify-between px-12 pb-4 pt-6">
        <SkeletonPulse className="h-7 w-32" />
        <div className="flex items-center gap-2">
          <SkeletonPulse className="h-9 w-36 rounded-xl" />
          <SkeletonPulse className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Plugin list */}
      <div className="flex-1 overflow-y-auto px-12 py-4">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
              <SkeletonPulse className="h-12 w-12 shrink-0 rounded-xl" />
              <div className="flex-1">
                <SkeletonPulse className="mb-2 h-4 w-40" />
                <SkeletonPulse className="mb-1 h-3 w-full" />
                <SkeletonPulse className="h-3 w-2/3" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonPulse className="h-6 w-16 rounded-full" />
                <SkeletonPulse className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
