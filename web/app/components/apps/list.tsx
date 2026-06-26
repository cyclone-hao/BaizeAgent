'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  useRouter,
} from 'next/navigation'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { useDebounceFn } from 'ahooks'
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiFileDownloadLine,
  RiRobot3Line,
  RiSparklingFill,
} from '@remixicon/react'
import AppListItem from './app-list-item'
import useAppsQueryState from './hooks/use-apps-query-state'
import type { AppListResponse } from '@/models/app'
import { fetchAppList } from '@/service/apps'
import { useAppContext } from '@/context/app-context'
import { useProviderContext } from '@/context/provider-context'
import { NEED_REFRESH_APP_LIST_KEY } from '@/config'
import { CheckModal } from '@/hooks/use-pay'
import Input from '@/app/components/base/input'
import { useStore as useTagStore } from '@/app/components/base/tag-management/store'
import dynamic from 'next/dynamic'
import Empty from './empty'
import { useEventEmitterContextContext } from '@/context/event-emitter'
import { CreateApp } from '@/app/components/app/create-app-modal'
import type { AppMode } from '@/types/app'

const PAGE_SIZE = 10

const TagManagementModal = dynamic(() => import('@/app/components/base/tag-management'), {
  ssr: false,
})

const CreateFromDSLModal = dynamic(() => import('@/app/components/app/create-from-dsl-modal'), {
  ssr: false,
})

const WorkflowBuilderInline = dynamic(() => import('@/app/components/apps/workflow-builder/inline'), {
  ssr: false,
})

const List = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { isCurrentWorkspaceDatasetOperator } = useAppContext()
  const { onPlanInfoChanged } = useProviderContext()
  const { eventEmitter } = useEventEmitterContextContext()
  const showTagManagementModal = useTagStore(s => s.showTagManagementModal)
  const [showBuilder, setShowBuilder] = useState(false)
  const [showCreateApp, setShowCreateApp] = useState<AppMode | null>(null)
  const { query: { tagIDs = [], keywords = '', isCreatedByMe: queryIsCreatedByMe = false }, setQuery } = useAppsQueryState()
  const [isCreatedByMe] = useState(queryIsCreatedByMe)
  const [searchKeywords, setSearchKeywords] = useState(keywords)
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateFromDSLModal, setShowCreateFromDSLModal] = useState(false)
  const setKeywords = useCallback((keywords: string) => {
    setQuery(prev => ({ ...prev, keywords }))
  }, [setQuery])

  // Build query params
  const queryParams: any = {
    page: currentPage,
    limit: PAGE_SIZE,
    name: searchKeywords,
    is_created_by_me: isCreatedByMe,
  }
  if (tagIDs.length)
    queryParams.tag_ids = tagIDs

  const { data, isLoading, mutate } = useSWR<AppListResponse>(
    { url: 'apps', params: queryParams },
    fetchAppList,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 500,
    },
  )

  useEffect(() => {
    if (localStorage.getItem(NEED_REFRESH_APP_LIST_KEY) === '1') {
      localStorage.removeItem(NEED_REFRESH_APP_LIST_KEY)
      mutate()
    }
  }, [mutate, t])

  useEffect(() => {
    if (isCurrentWorkspaceDatasetOperator)
      return router.replace('/datasets')
  }, [router, isCurrentWorkspaceDatasetOperator])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [isCreatedByMe, tagIDs, searchKeywords])

  // Listen for show-workflow-builder event from sidebar
  eventEmitter?.useSubscription((v: any) => {
    if (v?.type === 'show-workflow-builder')
      setShowBuilder(true)
    if (v?.type === 'show-create-app')
      setShowCreateApp(v.payload?.defaultAppMode || 'advanced-chat')
  })

  const { run: handleSearch } = useDebounceFn(() => {
    setSearchKeywords(keywords)
  }, { wait: 500 })
  const handleKeywordsChange = (value: string) => {
    setKeywords(value)
    handleSearch()
  }

  if (showCreateApp) {
    return (
      <div className='relative flex h-0 shrink-0 grow flex-col overflow-y-auto bg-background-body'>
        <div className='flex items-center gap-3 border-b border-divider-subtle px-6 py-3'>
          <button
            onClick={() => {
              setShowCreateApp(null)
              mutate()
            }}
            className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-text-tertiary hover:bg-state-base-hover hover:text-text-secondary'
          >
            <RiArrowLeftLine className='h-5 w-5' />
          </button>
          <span className='text-base font-semibold text-text-primary'>Agentic 智能体编排</span>
        </div>
        <CreateApp
          defaultAppMode={showCreateApp}
          onClose={() => {
            setShowCreateApp(null)
            mutate()
          }}
          onSuccess={() => {
            onPlanInfoChanged()
            mutate()
          }}
        />
      </div>
    )
  }

  if (showBuilder) {
    return (
      <div className='relative flex h-0 shrink-0 grow flex-col overflow-hidden bg-background-body'>
        <WorkflowBuilderInline onBack={() => {
          setShowBuilder(false)
          mutate()
        }} />
      </div>
    )
  }

  return (
    <>
      <div className='relative flex h-0 shrink-0 grow flex-col overflow-y-auto bg-background-body'>
        <div className='sticky top-0 z-10 flex flex-wrap items-center justify-between gap-y-2 bg-background-body px-12 pb-2 pt-4 leading-[56px]'>
          <h2 className='text-lg font-semibold text-text-primary'>智能体列表</h2>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setShowBuilder(true)}
              className='group flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md'
            >
              <RiSparklingFill className='h-4 w-4 transition-transform group-hover:scale-110' />
              AI 自动编排智能体
            </button>
            <button
              onClick={() => setShowCreateApp('agent-chat')}
              className='group flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-violet-600 hover:to-violet-700 hover:shadow-md'
            >
              <RiRobot3Line className='h-4 w-4 transition-transform group-hover:scale-110' />
              Agentic 智能体编排
            </button>
            <button
              onClick={() => setShowCreateFromDSLModal(true)}
              className='group flex cursor-pointer items-center gap-1.5 rounded-lg border border-components-button-secondary-border bg-components-button-secondary-bg px-3 py-1.5 text-sm font-medium text-components-button-secondary-text shadow-sm transition-all hover:bg-components-button-secondary-bg-hover'
            >
              <RiFileDownloadLine className='h-4 w-4 transition-transform group-hover:scale-110' />
              导入智能体 JSON
            </button>
            <Input
              showLeftIcon
              showClearIcon
              wrapperClassName='w-[200px]'
              value={keywords}
              onChange={e => handleKeywordsChange(e.target.value)}
              onClear={() => handleKeywordsChange('')}
            />
          </div>
        </div>
        {(data && data.total > 0)
          ? <div className='relative grow overflow-x-auto px-12 pt-2'>
            <table className='w-full min-w-[800px] border-collapse'>
              <thead className='sticky top-0 z-10 bg-background-body'>
                <tr className='system-xs-medium-uppercase border-b border-divider-regular text-text-tertiary'>
                  <th className='w-[300px] whitespace-nowrap px-4 py-3 text-left'>智能体</th>
                  <th className='w-[120px] whitespace-nowrap px-4 py-3 text-left'>模式</th>
                  <th className='w-[140px] whitespace-nowrap px-4 py-3 text-left'>作者</th>
                  <th className='w-[180px] whitespace-nowrap px-4 py-3 text-left'>更新时间</th>
                  <th className='w-[80px] whitespace-nowrap px-4 py-3 text-right'>操作</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-transparent'>
                {data.data.map(app => (
                  <AppListItem key={app.id} app={app} onRefresh={mutate} />
                ))}
              </tbody>
            </table>
          </div>
          : <div className='relative grow px-12 pt-2'>
            <Empty />
          </div>}

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="flex items-center justify-center gap-2 px-12 py-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-components-panel-border bg-components-panel-bg text-text-secondary hover:bg-state-base-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RiArrowLeftLine className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.ceil(data.total / PAGE_SIZE) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  disabled={isLoading}
                  className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium ${
                    page === currentPage
                      ? 'bg-primary-600 text-white'
                      : 'border border-components-panel-border bg-components-panel-bg text-text-secondary hover:bg-state-base-hover'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!data.has_more || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-components-panel-border bg-components-panel-bg text-text-secondary hover:bg-state-base-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RiArrowRightLine className="h-4 w-4" />
            </button>
            <span className="ml-2 text-sm text-text-tertiary">
              共 {data.total} 个应用，第 {currentPage}/{Math.ceil(data.total / PAGE_SIZE)} 页
            </span>
          </div>
        )}

        <CheckModal />
        {showTagManagementModal && (
          <TagManagementModal type='app' show={showTagManagementModal} />
        )}
        {showCreateFromDSLModal && (
          <CreateFromDSLModal
            show={showCreateFromDSLModal}
            onClose={() => setShowCreateFromDSLModal(false)}
            onSuccess={() => {
              onPlanInfoChanged()
              mutate()
            }}
          />
        )}
      </div>
    </>
  )
}

export default List
