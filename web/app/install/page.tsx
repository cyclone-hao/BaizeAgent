'use client'
import React from 'react'
import Header from '../signin/_header'
import BrandingPanel from '../signin/branding-panel'
import InstallForm from './installForm'
import cn from '@/utils/classnames'
import { useGlobalPublicStore } from '@/context/global-public-context'

const Install = () => {
  const { systemFeatures } = useGlobalPublicStore()
  return (
    <div className={cn('flex min-h-screen w-full bg-background-default-burn')}>
      {/* Left branding panel - hidden on mobile */}
      <BrandingPanel />

      {/* Right form panel */}
      <div className={cn('flex w-full flex-col items-center lg:w-1/2')}>
        <div className={cn('flex w-full shrink-0 flex-col rounded-none border-0 bg-background-default-subtle lg:m-6 lg:min-h-[calc(100vh-48px)] lg:rounded-2xl lg:border lg:border-effects-highlight')}>
          <Header />
          <InstallForm />
          {!systemFeatures.branding.enabled && <div className='px-8 py-6 text-sm font-normal text-text-tertiary'>
            © {new Date().getFullYear()} 白泽智能体平台. All rights reserved.
          </div>}
        </div>
      </div>
    </div>
  )
}

export default Install
