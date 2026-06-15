'use client'
import { useTranslation } from 'react-i18next'
import { PlusIcon } from '@heroicons/react/20/solid'
import Button from '../../base/button'
import cn from '@/utils/classnames'
import type { App } from '@/models/explore'
import AppIcon from '@/app/components/base/app-icon'
import { AppTypeIcon } from '../../app/type-selector'
export type AppCardProps = {
  app: App
  canCreate: boolean
  onCreate: () => void
  onViewDetail?: () => void
  isExplore: boolean
}

const modeLabels: Record<string, string> = {
  'chat': 'Chatbot',
  'agent-chat': 'Agent',
  'advanced-chat': 'Chatflow',
  'completion': 'Completion',
  'workflow': 'Workflow',
}

const AppCard = ({
  app,
  canCreate,
  onCreate,
  onViewDetail,
  isExplore,
}: AppCardProps) => {
  const { t } = useTranslation()
  const { app: info } = app
  return (
    <div
      className={cn('group relative col-span-1 flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-components-panel-border bg-components-panel-on-panel-item-bg shadow-xs transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg')}
      onClick={onViewDetail}
    >
      {/* Header: icon + name + type badge */}
      <div className="flex items-start gap-3.5 px-5 pb-3 pt-5">
        <div className="relative shrink-0">
          <AppIcon
            size="xl"
            iconType={info.icon_type}
            icon={info.icon}
            background={info.icon_background}
            imageUrl={info.icon_url}
          />
          <AppTypeIcon
            wrapperClassName="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-[5px] border border-divider-regular outline outline-components-panel-on-panel-item-bg"
            className="h-3.5 w-3.5"
            type={info.mode}
          />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="truncate text-[15px] font-semibold leading-5 text-text-secondary" title={info.name}>
            {info.name}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-md bg-state-base-hover px-1.5 py-0.5 text-[11px] font-medium leading-tight text-text-tertiary">
              {modeLabels[info.mode] || info.mode}
            </span>
            <span className="inline-flex items-center rounded-md bg-state-base-hover px-1.5 py-0.5 text-[11px] font-medium leading-tight text-text-tertiary">
              {app.category}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="flex-1 px-5 pb-5">
        <div className="line-clamp-3 text-sm leading-relaxed text-text-tertiary group-hover:line-clamp-2">
          {app.description}
        </div>
      </div>

      {/* Bottom: install count + add button */}
      <div className="flex items-center justify-between border-t border-divider-subtle px-5 py-3">
        <span className="text-xs text-text-quaternary">
          {app.install_count} {t('explore.appDetail.installCount')}
        </span>
        {isExplore && canCreate && (
          <Button
            variant="primary"
            className="h-7"
            onClick={(e) => {
              e.stopPropagation()
              onCreate()
            }}
          >
            <PlusIcon className="mr-1 h-3.5 w-3.5" />
            <span className="text-xs">{t('explore.appCard.addToWorkspace')}</span>
          </Button>
        )}
      </div>
    </div>
  )
}

export default AppCard
