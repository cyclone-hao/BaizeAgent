'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { RiBuildingLine, RiGlobalLine, RiLockLine, RiVerifiedBadgeLine } from '@remixicon/react'
import type { App } from '@/types/app'
import AppIcon from '@/app/components/base/app-icon'
import { useAppContext } from '@/context/app-context'
import { getRedirection } from '@/utils/app-redirection'
import Tooltip from '@/app/components/base/tooltip'
import { AccessMode } from '@/models/access-control'
import { formatTime } from '@/utils/time'
import { AppTypeIcon } from '@/app/components/app/type-selector'
import AppCardOperations from './app-card-operations'

export type AppCardProps = {
  app: App
  onRefresh?: () => void
}

const AppCard = ({ app, onRefresh }: AppCardProps) => {
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
    <>
      <div
        onClick={(e) => {
          e.preventDefault()
          getRedirection(isCurrentWorkspaceEditor, app, push)
        }}
        className='group relative col-span-1 inline-flex h-[160px] cursor-pointer flex-col rounded-xl border-[1px] border-solid border-components-card-border bg-components-card-bg shadow-sm transition-all duration-200 ease-in-out hover:shadow-lg'
      >
        <div className='flex h-[66px] shrink-0 grow-0 items-center gap-3 px-[14px] pb-3 pt-[14px]'>
          <div className='relative shrink-0'>
            <AppIcon
              size="large"
              iconType={app.icon_type}
              icon={app.icon}
              background={app.icon_background}
              imageUrl={app.icon_url}
            />
            <AppTypeIcon type={app.mode} wrapperClassName='absolute -bottom-0.5 -right-0.5 w-4 h-4 shadow-sm' className='h-3 w-3' />
          </div>
          <div className='w-0 grow py-[1px]'>
            <div className='flex items-center text-sm font-semibold leading-5 text-text-secondary'>
              <div className='truncate' title={app.name}>{app.name}</div>
            </div>
            <div className='flex items-center gap-1 text-[10px] font-medium leading-[18px] text-text-tertiary'>
              <div className='truncate' title={app.author_name}>{app.author_name}</div>
              <div>·</div>
              <div className='truncate' title={EditTimeText}>{EditTimeText}</div>
            </div>
          </div>
          <div className='flex h-5 w-5 shrink-0 items-center justify-center'>
            {app.access_mode === AccessMode.PUBLIC && <Tooltip asChild={false} popupContent={t('app.accessItemsDescription.anyone')}>
              <RiGlobalLine className='h-4 w-4 text-text-quaternary' />
            </Tooltip>}
            {app.access_mode === AccessMode.SPECIFIC_GROUPS_MEMBERS && <Tooltip asChild={false} popupContent={t('app.accessItemsDescription.specific')}>
              <RiLockLine className='h-4 w-4 text-text-quaternary' />
            </Tooltip>}
            {app.access_mode === AccessMode.ORGANIZATION && <Tooltip asChild={false} popupContent={t('app.accessItemsDescription.organization')}>
              <RiBuildingLine className='h-4 w-4 text-text-quaternary' />
            </Tooltip>}
            {app.access_mode === AccessMode.EXTERNAL_MEMBERS && <Tooltip asChild={false} popupContent={t('app.accessItemsDescription.external')}>
              <RiVerifiedBadgeLine className='h-4 w-4 text-text-quaternary' />
            </Tooltip>}
          </div>
        </div>
        <div className='title-wrapper h-[90px] px-[14px] text-xs leading-normal text-text-tertiary'>
          <div
            className='line-clamp-2'
            title={app.description}
          >
            {app.description}
          </div>
        </div>
        <div className='absolute bottom-1 left-0 right-0 flex h-[42px] shrink-0 items-center pb-[6px] pl-[14px] pr-[6px] pt-1'>
          {isCurrentWorkspaceEditor && (
            <div className='!hidden shrink-0 group-hover:!flex'>
              <AppCardOperations app={app} onRefresh={onRefresh} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default React.memo(AppCard)
