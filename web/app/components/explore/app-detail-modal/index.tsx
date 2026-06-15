'use client'
import { useTranslation } from 'react-i18next'
import { RiCloseLine, RiDownload2Line } from '@remixicon/react'
import Modal from '@/app/components/base/modal'
import Button from '@/app/components/base/button'
import AppIcon from '@/app/components/base/app-icon'
import type { App } from '@/models/explore'
import { AppTypeIcon } from '@/app/components/app/type-selector'
import { noop } from 'lodash-es'

type AppDetailModalProps = {
  app: App | null
  show: boolean
  onHide: () => void
  onAddToWorkspace: () => void
}

const modeLabels: Record<string, string> = {
  'chat': 'Chatbot',
  'agent-chat': 'Agent',
  'advanced-chat': 'Chatflow',
  'completion': 'Completion',
  'workflow': 'Workflow',
}

const AppDetailModal = ({
  app,
  show,
  onHide,
  onAddToWorkspace,
}: AppDetailModalProps) => {
  const { t } = useTranslation()

  if (!app)
    return null

  const { app: info } = app

  return (
    <Modal
      isShow={show}
      onClose={noop}
      className="!max-w-[520px] px-8 pb-8"
    >
      {/* Close button */}
      <div className="absolute right-4 top-4 cursor-pointer p-2" onClick={onHide}>
        <RiCloseLine className="h-4 w-4 text-text-tertiary" />
      </div>

      {/* Header: Icon + Name + Type */}
      <div className="flex items-start gap-4 pr-8 pt-2">
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
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-6 text-text-primary">
            {info.name}
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-state-base-hover px-2 py-0.5 text-xs font-medium text-text-secondary">
              {modeLabels[info.mode] || info.mode}
            </span>
            <span className="inline-flex items-center rounded-md bg-state-base-hover px-2 py-0.5 text-xs font-medium text-text-tertiary">
              {app.category}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-6">
        <div className="mb-2 text-sm font-medium text-text-secondary">
          {t('explore.appDetail.description')}
        </div>
        <div className="max-h-[200px] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-text-tertiary">
          {app.description || t('explore.appDetail.noDescription')}
        </div>
      </div>

      {/* Info bar */}
      <div className="mt-6 flex items-center gap-6 rounded-xl bg-state-base-hover px-4 py-3">
        <div>
          <div className="text-xs text-text-quaternary">{t('explore.appDetail.installCount')}</div>
          <div className="mt-0.5 text-sm font-semibold text-text-secondary">{app.install_count}</div>
        </div>
        <div className="h-8 w-px bg-divider-regular" />
        <div>
          <div className="text-xs text-text-quaternary">{t('explore.appDetail.category')}</div>
          <div className="mt-0.5 text-sm font-semibold text-text-secondary">{app.category}</div>
        </div>
        {app.copyright && (
          <>
            <div className="h-8 w-px bg-divider-regular" />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-text-quaternary">{t('explore.appDetail.copyright')}</div>
              <div className="mt-0.5 truncate text-sm text-text-tertiary">{app.copyright}</div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onHide}>{t('common.operation.close')}</Button>
        <Button variant="primary" onClick={onAddToWorkspace}>
          <RiDownload2Line className="mr-1 h-4 w-4" />
          {t('explore.appDetail.addToWorkspace')}
        </Button>
      </div>
    </Modal>
  )
}

export default AppDetailModal
