const SkeletonPulse = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700/50 ${className || ''}`} />
)

export default function AppsLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header area */}
      <div className="flex shrink-0 items-center justify-between px-12 pb-4 pt-6">
        <SkeletonPulse className="h-7 w-32" />
        <div className="flex items-center gap-2">
          <SkeletonPulse className="h-9 w-52 rounded-xl" />
          <SkeletonPulse className="h-9 w-24 rounded-xl" />
          <SkeletonPulse className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 items-center gap-6 border-b border-gray-200 px-12 dark:border-gray-700">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-5 w-16" />
        ))}
      </div>

      {/* App cards grid */}
      <div className="flex-1 overflow-y-auto px-12 py-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-3 flex items-center gap-3">
                <SkeletonPulse className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="flex-1">
                  <SkeletonPulse className="mb-1 h-4 w-28" />
                  <SkeletonPulse className="h-3 w-16" />
                </div>
              </div>
              <SkeletonPulse className="mb-3 h-3 w-full" />
              <SkeletonPulse className="mb-3 h-3 w-4/5" />
              <div className="mt-4 flex items-center justify-between">
                <SkeletonPulse className="h-4 w-20" />
                <SkeletonPulse className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
