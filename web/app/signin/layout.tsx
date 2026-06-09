'use client'
import Header from './_header'
import BrandingPanel from './branding-panel'
import cn from '@/utils/classnames'
import { useGlobalPublicStore } from '@/context/global-public-context'
import useDocumentTitle from '@/hooks/use-document-title'

export default function SignInLayout({ children }: any) {
  const { systemFeatures } = useGlobalPublicStore()
  useDocumentTitle('')
  return <>
    <div className={cn('flex min-h-screen w-full bg-background-default-burn')}>
      {/* Left branding panel - hidden on mobile */}
      <BrandingPanel />

      {/* Right form panel */}
      <div className={cn('flex w-full flex-col items-center lg:w-1/2')}>
        <div className={cn('flex w-full shrink-0 flex-col items-center rounded-none border-0 bg-background-default-subtle lg:m-6 lg:min-h-[calc(100vh-48px)] lg:rounded-2xl lg:border lg:border-effects-highlight')}>
          <Header />
          <div className={cn('flex w-full grow flex-col items-center justify-center px-6 md:px-[108px]')}>
            <div className='flex flex-col md:w-[400px]'>
              {children}
            </div>
          </div>
          {systemFeatures.branding.enabled === false && <div className='system-xs-regular px-8 py-6 text-text-tertiary'>
            © {new Date().getFullYear()} AgentFlow. All rights reserved.
          </div>}
        </div>
      </div>
    </div>
  </>
}
