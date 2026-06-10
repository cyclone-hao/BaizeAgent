'use client'

import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { useAppContext } from '@/context/app-context'
import { fetchAppList } from '@/service/apps'
import AppIcon from '@/app/components/base/app-icon'
import { getRedirection } from '@/utils/app-redirection'
import type { AppListResponse } from '@/models/app'

type RecentlyUsedProps = {
  limit?: number
}

const RecentlyUsed = ({ limit = 8 }: RecentlyUsedProps) => {
  const router = useRouter()
  const { isCurrentWorkspaceEditor } = useAppContext()

  const { data, isLoading } = useSWR(
    { url: 'apps', params: { page: 1, limit } },
    fetchAppList as any,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  )

  const apps = (data as AppListResponse)?.data || []

  const handleAppClick = (app: { id: string; mode: any }) => {
    getRedirection(isCurrentWorkspaceEditor, app, (href: string) => {
      router.push(href)
    })
  }

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-text-secondary">最近使用</h2>
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[88px] min-w-[200px] animate-pulse rounded-xl bg-state-base-hover"
            />
          ))}
        </div>
      </div>
    )
  }

  if (!apps.length) {
    return (
      <div className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-text-secondary">最近使用</h2>
        <div className="rounded-xl border border-dashed border-divider-regular bg-state-base-hover px-4 py-6 text-center text-sm text-text-quaternary">
          暂无最近使用的应用，去智能体广场看看吧
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <h2 className="mb-3 text-base font-semibold text-text-secondary">最近使用</h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {apps.map(app => (
          <div
            key={app.id}
            className="group flex min-w-[200px] max-w-[240px] cursor-pointer items-start gap-3 rounded-xl border-[0.5px] border-components-card-border bg-components-card-bg p-3 transition-all duration-200 hover:shadow-md"
            onClick={() => handleAppClick(app)}
          >
            <AppIcon
              size="medium"
              iconType={app.icon_type}
              icon={app.icon}
              background={app.icon_background}
              imageUrl={app.icon_url}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text-secondary">
                {app.name}
              </div>
              <div className="mt-0.5 line-clamp-2 text-xs text-text-quaternary">
                {app.description || '暂无描述'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentlyUsed
