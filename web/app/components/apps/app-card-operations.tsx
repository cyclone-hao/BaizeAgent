'use client'

import React, { useCallback, useState } from 'react'
import { useContext } from 'use-context-selector'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { RiMoreFill } from '@remixicon/react'
import cn from '@/utils/classnames'
import type { App } from '@/types/app'
import Toast, { ToastContext } from '@/app/components/base/toast'
import { copyApp, deleteApp, exportAppConfig, updateAppInfo } from '@/service/apps'
import type { DuplicateAppModalProps } from '@/app/components/app/duplicate-modal'
import { useAppContext } from '@/context/app-context'
import CustomPopover, { type HtmlContentProps } from '@/app/components/base/popover'
import Divider from '@/app/components/base/divider'
import { basePath } from '@/utils/var'
import { getRedirection } from '@/utils/app-redirection'
import { useProviderContext } from '@/context/provider-context'
import { NEED_REFRESH_APP_LIST_KEY } from '@/config'
import type { CreateAppModalProps } from '@/app/components/explore/create-app-modal'
import type { EnvironmentVariable } from '@/app/components/workflow/types'
import { fetchWorkflowDraft } from '@/service/workflow'
import { fetchInstalledAppList } from '@/service/explore'
import { useGlobalPublicStore } from '@/context/global-public-context'
import { useGetUserCanAccessApp } from '@/service/access-control'
import dynamic from 'next/dynamic'

const EditAppModal = dynamic(() => import('@/app/components/explore/create-app-modal'), {
  ssr: false,
})
const DuplicateAppModal = dynamic(() => import('@/app/components/app/duplicate-modal'), {
  ssr: false,
})
const SwitchAppModal = dynamic(() => import('@/app/components/app/switch-app-modal'), {
  ssr: false,
})
const Confirm = dynamic(() => import('@/app/components/base/confirm'), {
  ssr: false,
})
const DSLExportConfirmModal = dynamic(() => import('@/app/components/workflow/dsl-export-confirm-modal'), {
  ssr: false,
})
const AccessControl = dynamic(() => import('@/app/components/app/app-access-control'), {
  ssr: false,
})

export type AppCardOperationsProps = {
  app: App
  onRefresh?: () => void
  triggerClassName?: string
}

const AppCardOperations = ({ app, onRefresh, triggerClassName }: AppCardOperationsProps) => {
  const { t } = useTranslation()
  const { notify } = useContext(ToastContext)
  const systemFeatures = useGlobalPublicStore(s => s.systemFeatures)
  const { isCurrentWorkspaceEditor } = useAppContext()
  const { onPlanInfoChanged } = useProviderContext()
  const { push } = useRouter()

  const [showEditModal, setShowEditModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [showSwitchModal, setShowSwitchModal] = useState<boolean>(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showAccessControl, setShowAccessControl] = useState(false)
  const [secretEnvList, setSecretEnvList] = useState<EnvironmentVariable[]>([])

  const onConfirmDelete = useCallback(async () => {
    try {
      await deleteApp(app.id)
      notify({ type: 'success', message: t('app.appDeleted') })
      if (onRefresh)
        onRefresh()
      onPlanInfoChanged()
    }
    catch (e: any) {
      let errorMessage = t('app.appDeleteFailed')
      if ('message' in e)
        errorMessage += `: ${e.message}`
      notify({
        type: 'error',
        message: errorMessage,
      })
    }
    setShowConfirmDelete(false)
  }, [app.id, notify, onPlanInfoChanged, onRefresh, t])

  const onEdit: CreateAppModalProps['onConfirm'] = useCallback(async ({
    name,
    icon_type,
    icon,
    icon_background,
    description,
    use_icon_as_answer_icon,
    max_active_requests,
  }) => {
    try {
      await updateAppInfo({
        appID: app.id,
        name,
        icon_type,
        icon,
        icon_background,
        description,
        use_icon_as_answer_icon,
        max_active_requests,
      })
      setShowEditModal(false)
      notify({
        type: 'success',
        message: t('app.editDone'),
      })
      if (onRefresh)
        onRefresh()
    }
    catch (e: any) {
      notify({
        type: 'error',
        message: e.message || t('app.editFailed'),
      })
    }
  }, [app.id, notify, onRefresh, t])

  const onCopy: DuplicateAppModalProps['onConfirm'] = async ({ name, icon_type, icon, icon_background }) => {
    try {
      const newApp = await copyApp({
        appID: app.id,
        name,
        icon_type,
        icon,
        icon_background,
        mode: app.mode,
      })
      setShowDuplicateModal(false)
      notify({
        type: 'success',
        message: t('app.newApp.appCreated'),
      })
      localStorage.setItem(NEED_REFRESH_APP_LIST_KEY, '1')
      if (onRefresh)
        onRefresh()
      onPlanInfoChanged()
      getRedirection(isCurrentWorkspaceEditor, newApp, push)
    }
    catch {
      notify({ type: 'error', message: t('app.newApp.appCreateFailed') })
    }
  }

  const onExport = async (include = false) => {
    try {
      const { data } = await exportAppConfig({
        appID: app.id,
        include,
      })
      const a = document.createElement('a')
      const file = new Blob([data], { type: 'application/yaml' })
      const url = URL.createObjectURL(file)
      a.href = url
      a.download = `${app.name}.yml`
      a.click()
      URL.revokeObjectURL(url)
    }
    catch {
      notify({ type: 'error', message: t('app.exportFailed') })
    }
  }

  const exportCheck = async () => {
    if (app.mode !== 'workflow' && app.mode !== 'advanced-chat') {
      onExport()
      return
    }
    try {
      const workflowDraft = await fetchWorkflowDraft(`/apps/${app.id}/workflows/draft`)
      const list = (workflowDraft.environment_variables || []).filter(env => env.value_type === 'secret')
      if (list.length === 0) {
        onExport()
        return
      }
      setSecretEnvList(list)
    }
    catch {
      notify({ type: 'error', message: t('app.exportFailed') })
    }
  }

  const onSwitch = () => {
    if (onRefresh)
      onRefresh()
    setShowSwitchModal(false)
  }

  const onUpdateAccessControl = useCallback(() => {
    if (onRefresh)
      onRefresh()
    setShowAccessControl(false)
  }, [onRefresh, setShowAccessControl])

  const Operations = (props: HtmlContentProps) => {
    const { data: userCanAccessApp, isLoading: isGettingUserCanAccessApp } = useGetUserCanAccessApp({ appId: app?.id, enabled: (!!props?.open && systemFeatures.webapp_auth.enabled) })
    const onMouseLeave = async () => {
      props.onClose?.()
    }
    const onClickSettings = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      props.onClick?.()
      e.preventDefault()
      setShowEditModal(true)
    }
    const onClickDuplicate = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      props.onClick?.()
      e.preventDefault()
      setShowDuplicateModal(true)
    }
    const onClickExport = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      props.onClick?.()
      e.preventDefault()
      exportCheck()
    }
    const onClickSwitch = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      props.onClick?.()
      e.preventDefault()
      setShowSwitchModal(true)
    }
    const onClickDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      props.onClick?.()
      e.preventDefault()
      setShowConfirmDelete(true)
    }
    const onClickAccessControl = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      props.onClick?.()
      e.preventDefault()
      setShowAccessControl(true)
    }
    const onClickInstalledApp = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      props.onClick?.()
      e.preventDefault()
      try {
        const { installed_apps }: any = await fetchInstalledAppList(app.id) || {}
        if (installed_apps?.length > 0)
          window.open(`${basePath}/explore/installed/${installed_apps[0].id}`, '_blank')
        else
          throw new Error('No app found in Explore')
      }
      catch (e: any) {
        Toast.notify({ type: 'error', message: `${e.message || e}` })
      }
    }
    return (
      <div className="relative flex w-full flex-col py-1" onMouseLeave={onMouseLeave}>
        <button type="button" className='mx-1 flex h-8 cursor-pointer items-center gap-2 rounded-lg px-3 hover:bg-state-base-hover' onClick={onClickSettings}>
          <span className='system-sm-regular text-text-secondary'>{t('app.editApp')}</span>
        </button>
        <Divider className="my-1" />
        <button className='mx-1 flex h-8 cursor-pointer items-center gap-2 rounded-lg px-3 hover:bg-state-base-hover' onClick={onClickDuplicate}>
          <span className='system-sm-regular text-text-secondary'>{t('app.duplicate')}</span>
        </button>
        <button className='mx-1 flex h-8 cursor-pointer items-center gap-2 rounded-lg px-3 hover:bg-state-base-hover' onClick={onClickExport}>
          <span className='system-sm-regular text-text-secondary'>{t('app.export')}</span>
        </button>
        {(app.mode === 'completion' || app.mode === 'chat') && (
          <>
            <Divider className="my-1" />
            <button
              className='mx-1 flex h-8 cursor-pointer items-center rounded-lg px-3 hover:bg-state-base-hover'
              onClick={onClickSwitch}
            >
              <span className='text-sm leading-5 text-text-secondary'>{t('app.switch')}</span>
            </button>
          </>
        )}
        {
          (!systemFeatures.webapp_auth.enabled)
            ? <>
              <Divider className="my-1" />
              <button className='mx-1 flex h-8 cursor-pointer items-center gap-2 rounded-lg px-3 hover:bg-state-base-hover' onClick={onClickInstalledApp}>
                <span className='system-sm-regular text-text-secondary'>{t('app.openInExplore')}</span>
              </button>
            </>
            : !(isGettingUserCanAccessApp || !userCanAccessApp?.result) && (
              <>
                <Divider className="my-1" />
                <button className='mx-1 flex h-8 cursor-pointer items-center gap-2 rounded-lg px-3 hover:bg-state-base-hover' onClick={onClickInstalledApp}>
                  <span className='system-sm-regular text-text-secondary'>{t('app.openInExplore')}</span>
                </button>
              </>
            )
        }
        <Divider className="my-1" />
        {
          systemFeatures.webapp_auth.enabled && isCurrentWorkspaceEditor && <>
            <button className='mx-1 flex h-8 cursor-pointer items-center rounded-lg px-3 hover:bg-state-base-hover' onClick={onClickAccessControl}>
              <span className='text-sm leading-5 text-text-secondary'>{t('app.accessControl')}</span>
            </button>
            <Divider className="my-1" />
          </>
        }
        <button
          className='group mx-1 flex h-8 cursor-pointer items-center gap-2 rounded-lg px-3 py-[6px] hover:bg-state-destructive-hover'
          onClick={onClickDelete}
        >
          <span className='system-sm-regular text-text-secondary group-hover:text-text-destructive'>
            {t('common.operation.delete')}
          </span>
        </button>
      </div>
    )
  }

  return (
    <>
      {isCurrentWorkspaceEditor && (
        <CustomPopover
          htmlContent={<Operations />}
          position="br"
          trigger="click"
          btnElement={
            <div
              className={cn(
                'flex h-8 w-8 cursor-pointer items-center justify-center rounded-md',
                triggerClassName,
              )}
            >
              <RiMoreFill className='h-4 w-4 text-text-tertiary' />
            </div>
          }
          btnClassName={open =>
            cn(
              open ? '!bg-state-base-hover !shadow-none' : '!bg-transparent',
              'h-8 w-8 rounded-md border-none !p-2 hover:!bg-state-base-hover',
            )
          }
          popupClassName={
            (app.mode === 'completion' || app.mode === 'chat')
              ? '!w-[256px] translate-x-[-224px]'
              : '!w-[216px] translate-x-[-128px]'
          }
          className={'!z-20 h-fit'}
        />
      )}
      {showEditModal && (
        <EditAppModal
          isEditModal
          appName={app.name}
          appIconType={app.icon_type}
          appIcon={app.icon}
          appIconBackground={app.icon_background}
          appIconUrl={app.icon_url}
          appDescription={app.description}
          appMode={app.mode}
          appUseIconAsAnswerIcon={app.use_icon_as_answer_icon}
          max_active_requests={app.max_active_requests ?? null}
          show={showEditModal}
          onConfirm={onEdit}
          onHide={() => setShowEditModal(false)}
        />
      )}
      {showDuplicateModal && (
        <DuplicateAppModal
          appName={app.name}
          icon_type={app.icon_type}
          icon={app.icon}
          icon_background={app.icon_background}
          icon_url={app.icon_url}
          show={showDuplicateModal}
          onConfirm={onCopy}
          onHide={() => setShowDuplicateModal(false)}
        />
      )}
      {showSwitchModal && (
        <SwitchAppModal
          show={showSwitchModal}
          appDetail={app}
          onClose={() => setShowSwitchModal(false)}
          onSuccess={onSwitch}
        />
      )}
      {showConfirmDelete && (
        <Confirm
          title={t('app.deleteAppConfirmTitle')}
          content={t('app.deleteAppConfirmContent')}
          isShow={showConfirmDelete}
          onConfirm={onConfirmDelete}
          onCancel={() => setShowConfirmDelete(false)}
        />
      )}
      {secretEnvList.length > 0 && (
        <DSLExportConfirmModal
          envList={secretEnvList}
          onConfirm={onExport}
          onClose={() => setSecretEnvList([])}
        />
      )}
      {showAccessControl && (
        <AccessControl app={app} onConfirm={onUpdateAccessControl} onClose={() => setShowAccessControl(false)} />
      )}
    </>
  )
}

export default React.memo(AppCardOperations)
