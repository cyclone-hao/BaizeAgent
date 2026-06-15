const SkeletonPulse = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700/50 ${className || ''}`} />
)

export default function HomeLoading() {
  return (
    <div className="mx-auto h-full w-full max-w-5xl overflow-y-auto px-6 py-6">
      {/* Greeting skeleton */}
      <div className="mb-5">
        <SkeletonPulse className="h-8 w-64" />
        <SkeletonPulse className="mt-2 h-4 w-48" />
      </div>

      {/* Chat assistant skeleton */}
      <div className="mb-5 flex gap-4" style={{ minHeight: 420 }}>
        {/* History sidebar */}
        <div className="flex w-[220px] shrink-0 flex-col rounded-2xl border border-gray-200 p-3 dark:border-gray-700">
          <SkeletonPulse className="mb-3 h-5 w-24" />
          <div className="flex-1 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonPulse key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
          <SkeletonPulse className="mb-4 h-6 w-40" />
          <div className="flex-1 space-y-4">
            <SkeletonPulse className="h-20 w-3/4" />
            <SkeletonPulse className="ml-auto h-12 w-1/2" />
            <SkeletonPulse className="h-16 w-2/3" />
          </div>
          <SkeletonPulse className="mt-4 h-12 w-full rounded-xl" />
        </div>
      </div>

      {/* Agent plaza skeleton */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <SkeletonPulse className="h-8 w-8 rounded-lg" />
          <SkeletonPulse className="h-6 w-28" />
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-3 flex items-center gap-2">
                <SkeletonPulse className="h-8 w-8 rounded-lg" />
                <SkeletonPulse className="h-4 w-20" />
              </div>
              <SkeletonPulse className="h-3 w-full" />
              <SkeletonPulse className="mt-1 h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
