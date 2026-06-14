'use client'

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RiLink } from '@remixicon/react'
import Modal from '@/app/components/base/modal'
import Button from '@/app/components/base/button'
import Input from '@/app/components/base/input'

const MARKETPLACE_URL = 'https://marketplace.dify.ai'
const ACCESS_PASSWORD = '123'

const MarketplaceGate = () => {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleOpen = useCallback(() => {
    setShowModal(true)
    setPassword('')
    setError(false)
  }, [])

  const handleClose = useCallback(() => {
    setShowModal(false)
    setPassword('')
    setError(false)
  }, [])

  const handleConfirm = useCallback(() => {
    if (password === ACCESS_PASSWORD) {
      window.open(MARKETPLACE_URL, '_blank')
      handleClose()
    }
    else {
      setError(true)
    }
  }, [password, handleClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter')
      handleConfirm()
  }, [handleConfirm])

  return (
    <>
      <Button
        variant='secondary-accent'
        className='px-3'
        onClick={handleOpen}
      >
        <RiLink className='mr-1 h-4 w-4' />
        {t('plugin.marketplaceGate.button')}
      </Button>

      <Modal
        isShow={showModal}
        onClose={handleClose}
        title={t('plugin.marketplaceGate.title')}
        closable
      >
        <div className='mt-4'>
          <Input
            type='password'
            value={password}
            onChange={e => {
              setPassword(e.target.value)
              if (error)
                setError(false)
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('plugin.marketplaceGate.passwordPlaceholder')}
            className={error ? 'border-components-input-border-destructive' : ''}
            autoFocus
          />
          {error && (
            <p className='body-xs-regular mt-1 text-text-destructive'>
              {t('plugin.marketplaceGate.wrongPassword')}
            </p>
          )}
        </div>
        <div className='mt-5 flex justify-end gap-2'>
          <Button onClick={handleClose}>
            {t('common.operation.cancel')}
          </Button>
          <Button
            variant='primary'
            onClick={handleConfirm}
          >
            {t('plugin.marketplaceGate.confirm')}
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default MarketplaceGate
