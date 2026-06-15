'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { RiArrowRightSLine, RiCompass3Line } from '@remixicon/react'
import Category from '@/app/components/explore/category'
import AppCard from '@/app/components/explore/app-card'
import { fetchAppDetail, fetchAppList } from '@/service/explore'
import { useTabSearchParams } from '@/hooks/use-tab-searchparams'
import CreateAppModal from '@/app/components/explore/create-app-modal'
import type { CreateAppModalProps } from '@/app/components/explore/create-app-modal'
import type { App } from '@/models/explore'
import Loading from '@/app/components/base/loading'
import { DSLImportMode } from '@/models/app'
import { useImportDSL } from '@/hooks/use-import-dsl'
import DSLConfirmModal from '@/app/components/app/create-from-dsl-modal/dsl-confirm-modal'
import { useAppContext } from '@/context/app-context'
import { useTranslation } from 'react-i18next'

// 根据屏幕宽度返回 2 行对应的卡片数量
// 容器最大宽度 1400px，按实际可用空间计算
function useDisplayLimit(): number {
  const [limit, setLimit] = useState(6)
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth
      if (w >= 1800)
        setLimit(8)
      else if (w >= 1400)
        setLimit(6)
      else
        setLimit(4)
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])
  return limit
}

const AgentPlaza = () => {
  const { isCurrentWorkspaceEditor } = useAppContext()
  const { t } = useTranslation()
  const displayLimit = useDisplayLimit()

  // 使用翻译后的"全部"文本作为标识（中文为"推荐"，英文为"Recommended"）
  const allCategoriesText = t('explore.apps.allCategories')

  const [currCategory, setCurrCategory] = useTabSearchParams({
    defaultTab: allCategoriesText,
    disableSearchParams: false,
  })

  const {
    data: { categories, allList },
    isLoading,
  } = useSWR(
    ['/explore/apps'],
    () =>
      fetchAppList().then(({ categories, recommended_apps }) => ({
        categories,
        allList: recommended_apps.sort((a, b) => a.position - b.position),
      })),
    {
      fallbackData: {
        categories: [],
        allList: [],
      },
    },
  )

  const filteredList = useMemo(() => {
    if (!allList || allList.length === 0)
      return []
    return allList.filter(item => currCategory === allCategoriesText || item.category === currCategory)
  }, [currCategory, allList])

  const displayList = filteredList.slice(0, displayLimit)
  const hasMore = filteredList.length > displayLimit

  const [currApp, setCurrApp] = useState<App | null>(null)
  const [isShowCreateModal, setIsShowCreateModal] = useState(false)
  const [showDSLConfirmModal, setShowDSLConfirmModal] = useState(false)

  const {
    handleImportDSL,
    handleImportDSLConfirm,
    versions,
    isFetching,
  } = useImportDSL()

  const onCreate: CreateAppModalProps['onConfirm'] = async ({
    name,
    icon_type,
    icon,
    icon_background,
    description,
  }) => {
    const { export_data } = await fetchAppDetail(currApp?.app.id as string)
    const payload = {
      mode: DSLImportMode.YAML_CONTENT,
      yaml_content: export_data,
      name,
      icon_type,
      icon,
      icon_background,
      description,
    }
    await handleImportDSL(payload, {
      onSuccess: () => setIsShowCreateModal(false),
      onPending: () => setShowDSLConfirmModal(true),
    })
  }

  const onConfirmDSL = useCallback(async () => {
    await handleImportDSLConfirm({})
  }, [handleImportDSLConfirm])

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loading type="area" />
      </div>
    )
  }

  if (!categories || categories.length === 0)
    return null

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-primary-50 to-primary-100">
            <RiCompass3Line className="h-3.5 w-3.5 text-primary-500" />
          </div>
          <h2 className="text-base font-semibold text-text-secondary">智能体广场</h2>
        </div>
        {hasMore && (
          <Link
            href="/explore/apps"
            className="flex items-center gap-0.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            查看更多
            <RiArrowRightSLine className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Category Tabs */}
      <div className="mb-3">
        <Category
          list={categories}
          value={currCategory}
          onChange={setCurrCategory}
          allCategoriesEn={allCategoriesText}
        />
      </div>

      {/* App Grid */}
      {displayList.length === 0
        ? (
          <div className="rounded-xl border border-dashed border-divider-regular bg-state-base-hover px-4 py-12 text-center text-sm text-text-quaternary">
            暂无匹配的智能体
          </div>
        )
        : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {displayList.map(app => (
              <AppCard
                key={app.app_id}
                isExplore
                app={app}
                canCreate={isCurrentWorkspaceEditor}
                onCreate={() => {
                  setCurrApp(app)
                  setIsShowCreateModal(true)
                }}
              />
            ))}
          </div>
        )}

      {/* Create Modal */}
      {isShowCreateModal && (
        <CreateAppModal
          appIconType={currApp?.app.icon_type || 'emoji'}
          appIcon={currApp?.app.icon || ''}
          appIconBackground={currApp?.app.icon_background || ''}
          appIconUrl={currApp?.app.icon_url}
          appName={currApp?.app.name || ''}
          appDescription={currApp?.app.description || ''}
          show={isShowCreateModal}
          onConfirm={onCreate}
          confirmDisabled={isFetching}
          onHide={() => setIsShowCreateModal(false)}
        />
      )}

      {/* DSL Confirm Modal */}
      {showDSLConfirmModal && (
        <DSLConfirmModal
          versions={versions}
          onCancel={() => setShowDSLConfirmModal(false)}
          onConfirm={onConfirmDSL}
          confirmDisabled={isFetching}
        />
      )}
    </div>
  )
}

export default React.memo(AgentPlaza)
