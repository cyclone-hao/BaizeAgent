'use client'

import { useRef, useState } from 'react'
import { RiAddLine } from '@remixicon/react'
import Button from '@/app/components/base/button'
import InstallFromLocalPackage from '@/app/components/plugins/install-plugin/install-from-local-package'
import { useTranslation } from 'react-i18next'
import { SUPPORT_INSTALL_LOCAL_FILE_EXTENSIONS } from '@/config'
import { noop } from 'lodash-es'

const InstallPluginButton = () => {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file)
      setSelectedFile(file)
  }

  return (
    <>
      <Button
        className='h-full w-full p-2 text-components-button-secondary-text'
        onClick={() => fileInputRef.current?.click()}
      >
        <RiAddLine className='h-4 w-4' />
        <span className='pl-1'>{t('plugin.installPlugin')}</span>
      </Button>
      <input
        type='file'
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept={SUPPORT_INSTALL_LOCAL_FILE_EXTENSIONS}
      />
      {selectedFile && (
        <InstallFromLocalPackage
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onSuccess={noop}
        />
      )}
    </>
  )
}

export default InstallPluginButton
