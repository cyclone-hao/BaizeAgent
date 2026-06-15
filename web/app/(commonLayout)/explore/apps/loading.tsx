const SkeletonPulse = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700/50 ${className || ''}`} />
)

export default function ExploreAppsLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Title + description */}
      <div className="shrink-0 px-12 pt-6">
        <SkeletonPulse className="mb-2 h-7 w-40" />
        <SkeletonPulse className="h-4 w-96" />
      </div>

      {/* Category tabs + search */}
      <div className="mt-6 flex items-center justify-between px-12">
        <div className="flex items-center gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonPulse key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>
        <SkeletonPulse className="h-9 w-[200px] rounded-xl" />
      </div>

      {/* App cards grid */}
      <div className="mt-5 flex-1 overflow-y-auto px-8 sm:px-12">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3.5 px-5 pb-3 pt-5">
                <SkeletonPulse className="h-12 w-12 shrink-0 rounded-xl" />
                <div className="flex-1">
                  <SkeletonPulse className="mb-1.5 h-5 w-32" />
                  <div className="flex gap-1.5">
                    <SkeletonPulse className="h-5 w-14 rounded-md" />
                    <SkeletonPulse className="h-5 w-14 rounded-md" />
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5">
                <SkeletonPulse className="mb-2 h-4 w-full" />
                <SkeletonPulse className="h-4 w-4/5" />
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-gray-700">
                <SkeletonPulse className="h-3 w-20" />
                <SkeletonPulse className="h-7 w-28 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
