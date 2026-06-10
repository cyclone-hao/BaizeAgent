'use client'

import { useRef, useState } from 'react'
import useSWR from 'swr'
import { RiArrowDownSLine, RiCheckLine } from '@remixicon/react'
import { fetchAppList } from '@/service/apps'
import AppIcon from '@/app/components/base/app-icon'
import type { AppMode } from '@/types/app'
import type { AppListResponse } from '@/models/app'
import cn from '@/utils/classnames'

/** Only chat-compatible app modes (support chat-messages API) */
const CHAT_COMPATIBLE_MODES: AppMode[] = ['advanced-chat', 'agent-chat', 'chat']

const MODE_LABELS: Record<string, string> = {
  'advanced-chat': 'Chatflow',
  'agent-chat': 'Agent',
  'chat': '对话',
}

type AppSelectorProps = {
  value: string
  onChange: (appId: string) => void
}

const AppSelector = ({ value, onChange }: AppSelectorProps) => {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const { data, isLoading } = useSWR(
    { url: 'apps', params: { page: 1, limit: 50 } },
    fetchAppList as any,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  )

  const allApps = (data as AppListResponse)?.data || []
  const chatApps = allApps.filter(app => CHAT_COMPATIBLE_MODES.includes(app.mode))
  const selectedApp = chatApps.find(app => app.id === value) || null

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors',
          selectedApp
            ? 'border-divider-regular bg-components-panel-on-panel-item-bg text-text-secondary hover:bg-state-base-hover'
            : 'border-primary-300 bg-primary-50 text-primary-600 hover:bg-primary-100',
        )}
        onClick={() => setOpen(!open)}
      >
        {selectedApp
          ? (
            <>
              <AppIcon
                size="xs"
                iconType={selectedApp.icon_type}
                icon={selectedApp.icon}
                background={selectedApp.icon_background}
                imageUrl={selectedApp.icon_url}
              />
              <span className="max-w-[160px] truncate">{selectedApp.name}</span>
            </>
          )
          : (
            <span>选择对话应用</span>
          )}
        <RiArrowDownSLine className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="absolute left-0 top-full z-20 mt-1 w-[300px] rounded-xl border border-components-panel-border bg-components-panel-bg shadow-lg">
            {/* Header */}
            <div className="border-b border-divider-subtle px-3 py-2">
              <span className="text-xs font-medium text-text-tertiary">
                选择对话应用
              </span>
            </div>

            {/* List */}
            <div className="max-h-[280px] overflow-y-auto p-1.5">
              {isLoading
                ? (
                  <div className="px-3 py-6 text-center text-xs text-text-quaternary">
                    加载中...
                  </div>
                )
                : chatApps.length === 0
                  ? (
                    <div className="px-3 py-6 text-center text-xs text-text-quaternary">
                      暂无对话类型应用
                      <br />
                      <span className="text-text-quaternary">请先在工作室创建 Chatflow 或 Agent 应用</span>
                    </div>
                  )
                  : (
                    chatApps.map(app => (
                      <button
                        key={app.id}
                        type="button"
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                          app.id === value
                            ? 'bg-primary-50'
                            : 'hover:bg-state-base-hover',
                        )}
                        onClick={() => {
                          onChange(app.id)
                          setOpen(false)
                        }}
                      >
                        <AppIcon
                          size="small"
                          iconType={app.icon_type}
                          icon={app.icon}
                          background={app.icon_background}
                          imageUrl={app.icon_url}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-text-secondary">
                            {app.name}
                          </div>
                          <div className="truncate text-xs text-text-quaternary">
                            {MODE_LABELS[app.mode] || app.mode}
                            {app.description ? ` · ${app.description}` : ''}
                          </div>
                        </div>
                        {app.id === value && (
                          <RiCheckLine className="h-4 w-4 shrink-0 text-primary-600" />
                        )}
                      </button>
                    ))
                  )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AppSelector
