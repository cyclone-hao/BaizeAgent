import React from 'react'
import type { ReactNode } from 'react'
import SwrInitializer from '@/app/components/swr-initializer'
import { AppContextProvider } from '@/context/app-context'
import GA, { GaType } from '@/app/components/base/ga'
import { EventEmitterContextProvider } from '@/context/event-emitter'
import { ProviderContextProvider } from '@/context/provider-context'
import { ModalContextProvider } from '@/context/modal-context'
import GotoAnything from '@/app/components/goto-anything'
import GlobalSidebar from '@/app/components/global-sidebar'

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <GA gaType={GaType.admin} />
      <SwrInitializer>
        <AppContextProvider>
          <EventEmitterContextProvider>
            <ProviderContextProvider>
              <ModalContextProvider>
                <div className="flex h-screen overflow-hidden">
                  <GlobalSidebar />
                  <div className="flex min-w-0 grow flex-col overflow-hidden">
                    <div className="flex flex-1 flex-col overflow-hidden">
                      {children}
                    </div>
                    <div className="shrink-0 border-t border-divider-subtle py-2 text-center text-xs text-text-quaternary">
                      © 2026 中国广电 - 中广数智科技（北京）有限责任公司
                    </div>
                  </div>
                </div>
                <GotoAnything />
              </ModalContextProvider>
            </ProviderContextProvider>
          </EventEmitterContextProvider>
        </AppContextProvider>
      </SwrInitializer>
    </>
  )
}
export default Layout
