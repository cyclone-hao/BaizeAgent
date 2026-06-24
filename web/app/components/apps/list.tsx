'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  useRouter,
} from 'next/navigation'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { useDebounceFn } from 'ahooks'
import {
  RiApps2Line,
  RiDragDropLine,
  RiExchange2Line,
  RiFile4Line,
  RiMessage3Line,
  RiRobot3Line,
  RiArrowLeftLine,
  RiArrowRightLine,
} from '@remixicon/react'
import AppCard from './app-card'
import NewAppCard from './new-app-card'
import useAppsQueryState from './hooks/use-apps-query-state'
import { useDSLDragDrop } from './hooks/use-dsl-drag-drop'
import type { AppListResponse } from '@/models/app'
import { fetchAppList } from '@/service/apps'
import { useAppContext } from '@/context/app-context'
import { NEED_REFRESH_APP_LIST_KEY } from '@/config'
import { CheckModal } from '@/hooks/use-pay'
import TabSliderNew from '@/app/components/base/tab-slider-new'
import { useTabSearchParams } from '@/hooks/use-tab-searchparams'
import Input from '@/app/components/base/input'
import { useStore as useTagStore } from '@/app/components/base/tag-management/store'
import TagFilter from '@/app/components/base/tag-management/filter'
import CheckboxWithLabel from '@/app/components/datasets/create/website/base/checkbox-with-label'
import dynamic from 'next/dynamic'
import Empty from './empty'
import Footer from './footer'
import { useGlobalPublicStore } from '@/context/global-public-context'

const PAGE_SIZE = 10

const TagManagementModal = dynamic(() => import('@/app/components/base/tag-management'), {
  ssr: false,
})
const CreateFromDSLModal = dynamic(() => import('@/app/components/app/create-from-dsl-modal'), {
  ssr: false,
})

const List = () => {
  const { t } = useTranslation()
  const { systemFeatures } = useGlobalPublicStore()
  const router = useRouter()
  const { isCurrentWorkspaceEditor, isCurrentWorkspaceDatasetOperator } = useAppContext()
  const showTagManagementModal = useTagStore(s => s.showTagManagementModal)
  const [activeTab, setActiveTab] = useTabSearchParams({
    defaultTab: 'all',
  })
  const { query: { tagIDs = [], keywords = '', isCreatedByMe: queryIsCreatedByMe = false }, setQuery } = useAppsQueryState()
  const [isCreatedByMe, setIsCreatedByMe] = useState(queryIsCreatedByMe)
  const [tagFilterValue, setTagFilterValue] = useState<string[]>(tagIDs)
  const [searchKeywords, setSearchKeywords] = useState(keywords)
  const [currentPage, setCurrentPage] = useState(1)
  const newAppCardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showCreateFromDSLModal, setShowCreateFromDSLModal] = useState(false)
  const [droppedDSLFile, setDroppedDSLFile] = useState<File | undefined>()
  const setKeywords = useCallback((keywords: string) => {
    setQuery(prev => ({ ...prev, keywords }))
  }, [setQuery])
  const setTagIDs = useCallback((tagIDs: string[]) => {
    setQuery(prev => ({ ...prev, tagIDs }))
  }, [setQuery])

  const handleDSLFileDropped = useCallback((file: File) => {
    setDroppedDSLFile(file)
    setShowCreateFromDSLModal(true)
  }, [])

  const { dragging } = useDSLDragDrop({
    onDSLFileDropped: handleDSLFileDropped,
    containerRef,
    enabled: isCurrentWorkspaceEditor,
  })

  // Build query params
  const queryParams: any = {
    page: currentPage,
    limit: PAGE_SIZE,
    name: searchKeywords,
    is_created_by_me: isCreatedByMe,
  }
  if (activeTab !== 'all')
    queryParams.mode = activeTab
  if (tagIDs.length)
    queryParams.tag_ids = tagIDs

  const { data, isLoading, error, mutate } = useSWR<AppListResponse>(
    { url: 'apps', params: queryParams },
    fetchAppList,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 500,
    },
  )

  const anchorRef = useRef<HTMLDivElement>(null)
  const options = [
    { value: 'all', text: t('app.types.all'), icon: <RiApps2Line className='mr-1 h-[14px] w-[14px]' /> },
    { value: 'workflow', text: t('app.types.workflow'), icon: <RiExchange2Line className='mr-1 h-[14px] w-[14px]' /> },
    { value: 'advanced-chat', text: t('app.types.advanced'), icon: <RiMessage3Line className='mr-1 h-[14px] w-[14px]' /> },
    { value: 'chat', text: t('app.types.chatbot'), icon: <RiMessage3Line className='mr-1 h-[14px] w-[14px]' /> },
    { value: 'agent-chat', text: t('app.types.agent'), icon: <RiRobot3Line className='mr-1 h-[14px] w-[14px]' /> },
    { value: 'completion', text: t('app.types.completion'), icon: <RiFile4Line className='mr-1 h-[14px] w-[14px]' /> },
  ]

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
  }, [activeTab, isCreatedByMe, tagIDs, searchKeywords])

  const { run: handleSearch } = useDebounceFn(() => {
    setSearchKeywords(keywords)
  }, { wait: 500 })
  const handleKeywordsChange = (value: string) => {
    setKeywords(value)
    handleSearch()
  }

  const { run: handleTagsUpdate } = useDebounceFn(() => {
    setTagIDs(tagFilterValue)
  }, { wait: 500 })
  const handleTagsChange = (value: string[]) => {
    setTagFilterValue(value)
    handleTagsUpdate()
  }

  const handleCreatedByMeChange = useCallback(() => {
    const newValue = !isCreatedByMe
    setIsCreatedByMe(newValue)
    setQuery(prev => ({ ...prev, isCreatedByMe: newValue }))
  }, [isCreatedByMe, setQuery])

  return (
    <>
      <div ref={containerRef} className='relative flex h-0 shrink-0 grow flex-col overflow-y-auto bg-background-body'>
        {dragging && (
          <div className="absolute inset-0 z-50 m-0.5 rounded-2xl border-2 border-dashed border-components-dropzone-border-accent bg-[rgba(21,90,239,0.14)] p-2">
          </div>
        )}

        <div className='sticky top-0 z-10 flex flex-wrap items-center justify-between gap-y-2 bg-background-body px-12 pb-2 pt-4 leading-[56px]'>
          <TabSliderNew
            value={activeTab}
            onChange={setActiveTab}
            options={options}
          />
          <div className='flex items-center gap-2'>
            <CheckboxWithLabel
              className='mr-2'
              label={t('app.showMyCreatedAppsOnly')}
              isChecked={isCreatedByMe}
              onChange={handleCreatedByMeChange}
            />
            <TagFilter type='app' value={tagFilterValue} onChange={handleTagsChange} />
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
          ? <div className='relative grid grow grid-cols-1 content-start gap-4 px-12 pt-2 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 2k:grid-cols-6'>
            {isCurrentWorkspaceEditor
              && <NewAppCard ref={newAppCardRef} onSuccess={mutate} selectedAppType={activeTab} />}
            {data.data.map(app => (
              <AppCard key={app.id} app={app} onRefresh={mutate} />
            ))}
          </div>
          : <div className='relative grid grow grid-cols-1 content-start gap-4 overflow-hidden px-12 pt-2 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 2k:grid-cols-6'>
            {isCurrentWorkspaceEditor
              && <NewAppCard ref={newAppCardRef} className='z-10' onSuccess={mutate} selectedAppType={activeTab} />}
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

        {isCurrentWorkspaceEditor && (
          <div
            className={`flex items-center justify-center gap-2 py-4 ${dragging ? 'text-text-accent' : 'text-text-quaternary'}`}
            role="region"
            aria-label={t('app.newApp.dropDSLToCreateApp')}
          >
            <RiDragDropLine className="h-4 w-4" />
            <span className="system-xs-regular">{t('app.newApp.dropDSLToCreateApp')}</span>
          </div>
        )}
        {!systemFeatures.branding.enabled && (
          <Footer />
        )}
        <CheckModal />
        {showTagManagementModal && (
          <TagManagementModal type='app' show={showTagManagementModal} />
        )}
      </div>

      {showCreateFromDSLModal && (
        <CreateFromDSLModal
          show={showCreateFromDSLModal}
          onClose={() => {
            setShowCreateFromDSLModal(false)
            setDroppedDSLFile(undefined)
          }}
          onSuccess={() => {
            setShowCreateFromDSLModal(false)
            setDroppedDSLFile(undefined)
            mutate()
          }}
          droppedFile={droppedDSLFile}
        />
      )}
    </>
  )
}

export default List
