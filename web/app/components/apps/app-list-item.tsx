'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import type { App } from '@/types/app'
import AppIcon from '@/app/components/base/app-icon'
import { useAppContext } from '@/context/app-context'
import { getRedirection } from '@/utils/app-redirection'
import { formatTime } from '@/utils/time'
import { AppTypeIcon, AppTypeLabel } from '@/app/components/app/type-selector'
import AppCardOperations from './app-card-operations'

export type AppListItemProps = {
  app: App
  onRefresh?: () => void
}

const AppListItem = ({ app, onRefresh }: AppListItemProps) => {
  const { t } = useTranslation()
  const { isCurrentWorkspaceEditor } = useAppContext()
  const { push } = useRouter()

  const EditTimeText = useMemo(() => {
    const timeText = formatTime({
      date: (app.updated_at || app.created_at) * 1000,
      dateFormat: `${t('datasetDocuments.segment.dateTimeFormat')}`,
    })
    return `${t('datasetDocuments.segment.editedAt')} ${timeText}`
  }, [app.updated_at, app.created_at])

  return (
    <tr
      onClick={(e) => {
        e.preventDefault()
        getRedirection(isCurrentWorkspaceEditor, app, push)
      }}
      className='cursor-pointer border-b border-divider-regular transition-colors duration-200 hover:bg-state-base-hover'
    >
      <td className='px-4 py-3'>
        <div className='flex items-center gap-3'>
          <div className='relative shrink-0'>
            <AppIcon
              size="large"
              iconType={app.icon_type}
              icon={app.icon}
              background={app.icon_background}
              imageUrl={app.icon_url}
            />
          </div>
          <div className='min-w-0 flex-1 overflow-hidden'>
            <div
              className='truncate whitespace-nowrap text-sm font-semibold leading-5 text-text-secondary'
              title={app.name}
            >
              {app.name}
            </div>
            <div
              className='mt-0.5 line-clamp-1 text-xs leading-normal text-text-tertiary'
              title={app.description}
            >
              {app.description || '-'}
            </div>
          </div>
        </div>
      </td>
      <td className='whitespace-nowrap px-4 py-3'>
        <div className='flex items-center gap-1.5'>
          <AppTypeIcon type={app.mode} className='h-3.5 w-3.5' wrapperClassName='h-5 w-5' />
          <AppTypeLabel type={app.mode} className='system-sm-medium text-text-secondary' />
        </div>
      </td>
      <td className='whitespace-nowrap px-4 py-3'>
        <span className='system-sm-regular text-text-secondary' title={app.author_name}>
          {app.author_name}
        </span>
      </td>
      <td className='whitespace-nowrap px-4 py-3'>
        <span className='system-sm-regular text-text-tertiary' title={EditTimeText}>
          {EditTimeText}
        </span>
      </td>
      <td className='whitespace-nowrap px-4 py-3 text-right' onClick={e => e.stopPropagation()}>
        <div className='flex items-center justify-end'>
          <AppCardOperations app={app} onRefresh={onRefresh} />
        </div>
      </td>
    </tr>
  )
}

export default React.memo(AppListItem)
