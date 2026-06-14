'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  RiDragDropLine,
  RiEqualizer2Line,
} from '@remixicon/react'
import { useBoolean } from 'ahooks'
import InstallFromLocalPackage from '../install-plugin/install-from-local-package'
import {
  PluginPageContextProvider,
  usePluginPageContext,
} from './context'
import InstallPluginButton from './install-plugin-dropdown'
import MarketplaceGate from './marketplace-gate'
import { useUploader } from './use-uploader'
import useReferenceSetting from './use-reference-setting'
import DebugInfo from './debug-info'
import PluginTasks from './plugin-tasks'
import Button from '@/app/components/base/button'
import Tooltip from '@/app/components/base/tooltip'
import cn from '@/utils/classnames'
import ReferenceSettingModal from '@/app/components/plugins/reference-setting-modal/modal'
import { SUPPORT_INSTALL_LOCAL_FILE_EXTENSIONS } from '@/config'
import { noop } from 'lodash-es'
import useDocumentTitle from '@/hooks/use-document-title'

export type PluginPageProps = {
  plugins: React.ReactNode
}
const PluginPage = ({
  plugins,
}: PluginPageProps) => {
  const { t } = useTranslation()
  useDocumentTitle(t('plugin.metadata.title'))

  const {
    referenceSetting,
    canManagement,
    canDebugger,
    canSetPermissions,
    setReferenceSettings,
  } = useReferenceSetting()
  const [showPluginSettingModal, {
    setTrue: setShowPluginSettingModal,
    setFalse: setHidePluginSettingModal,
  }] = useBoolean(false)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const containerRef = usePluginPageContext(v => v.containerRef)

  const handleFileChange = (file: File | null) => {
    if (!file || !file.name.endsWith('.difypkg')) {
      setCurrentFile(null)
      return
    }

    setCurrentFile(file)
  }
  const uploaderProps = useUploader({
    onFileChange: handleFileChange,
    containerRef,
    enabled: canManagement,
  })

  const { dragging, fileUploader, fileChangeHandle, removeFile } = uploaderProps
  return (
    <div
      id='plugin-container'
      ref={containerRef}
      style={{ scrollbarGutter: 'stable' }}
      className='relative flex grow flex-col overflow-y-auto rounded-t-xl bg-components-panel-bg'
    >
      <div
        className='sticky top-0 z-10 flex min-h-[60px] items-center gap-1 self-stretch bg-components-panel-bg px-12 pb-2 pt-4'
      >
        <div className='flex w-full items-center justify-between'>
          <h2 className='title-xl-semi-bold text-text-primary'>
            {t('plugin.installedPlugins')}
          </h2>
          <div className='flex shrink-0 items-center gap-1'>
            <MarketplaceGate />
            <PluginTasks />
            {canManagement && (
              <InstallPluginButton />
            )}
            {
              canDebugger && (
                <DebugInfo />
              )
            }
            {
              canSetPermissions && (
                <Tooltip
                  popupContent={t('plugin.privilege.title')}
                >
                  <Button
                    className='group h-full w-full p-2 text-components-button-secondary-text'
                    onClick={setShowPluginSettingModal}
                  >
                    <RiEqualizer2Line className='h-4 w-4' />
                  </Button>
                </Tooltip>
              )
            }
          </div>
        </div>
      </div>
      {plugins}
      {dragging && (
        <div
          className="absolute inset-0 m-0.5 rounded-2xl border-2 border-dashed border-components-dropzone-border-accent
              bg-[rgba(139,92,246,0.14)] p-2">
        </div>
      )}
      <div className={`flex items-center justify-center gap-2 py-4 ${dragging ? 'text-text-accent' : 'text-text-quaternary'}`}>
        <RiDragDropLine className="h-4 w-4" />
        <span className="system-xs-regular">{t('plugin.installModal.dropPluginToInstall')}</span>
      </div>
      {currentFile && (
        <InstallFromLocalPackage
          file={currentFile}
          onClose={removeFile ?? noop}
          onSuccess={noop}
        />
      )}
      <input
        ref={fileUploader}
        className="hidden"
        type="file"
        id="fileUploader"
        accept={SUPPORT_INSTALL_LOCAL_FILE_EXTENSIONS}
        onChange={fileChangeHandle ?? noop}
      />

      {showPluginSettingModal && (
        <ReferenceSettingModal
          payload={referenceSetting!}
          onHide={setHidePluginSettingModal}
          onSave={setReferenceSettings}
        />
      )}
    </div>
  )
}

const PluginPageWithContext = (props: PluginPageProps) => {
  return (
    <PluginPageContextProvider>
      <PluginPage {...props} />
    </PluginPageContextProvider>
  )
}

export default PluginPageWithContext
