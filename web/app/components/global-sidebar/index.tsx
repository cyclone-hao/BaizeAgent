'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  RiBook2Fill,
  RiBook2Line,
  RiCompass3Fill,
  RiCompass3Line,
  RiHammerFill,
  RiHammerLine,
  RiHome4Fill,
  RiHome4Line,
  RiRobot2Fill,
  RiRobot2Line,
} from '@remixicon/react'
import SidebarNavItem from './nav-item'
import { useEventEmitterContextContext } from '@/context/event-emitter'
import { useProviderContext } from '@/context/provider-context'
import AccountDropdown from '@/app/components/header/account-dropdown'
import { Group } from '@/app/components/base/icons/src/vender/other'
import cn from '@/utils/classnames'
import dynamic from 'next/dynamic'

const CreateAppModal = dynamic(() => import('@/app/components/app/create-app-modal'), { ssr: false })
const CreateAppTemplateDialog = dynamic(() => import('@/app/components/app/create-app-dialog'), { ssr: false })
const CreateFromDSLModal = dynamic(() => import('@/app/components/app/create-from-dsl-modal'), { ssr: false })
const WorkflowBuilderDialog = dynamic(() => import('@/app/components/apps/workflow-builder'), { ssr: false })

const SIDEBAR_STORAGE_KEY = 'global-sidebar-expand'

const GlobalSidebar = () => {
  const pathname = usePathname()
  const [expand, setExpand] = useState(false)
  const [hideSidebar, setHideSidebar] = useState(false)
  const { eventEmitter } = useEventEmitterContextContext()
  const { onPlanInfoChanged } = useProviderContext()

  // Create dialog state
  const [createDialog, setCreateDialog] = useState<{
    type: 'app' | 'workflow' | 'dsl' | 'template' | null
    defaultAppMode?: 'advanced-chat' | 'agent-chat'
  }>({ type: null })

  const closeDialog = useCallback(() => setCreateDialog({ type: null }), [])

  const handleCreateSuccess = useCallback(() => {
    onPlanInfoChanged()
    closeDialog()
  }, [onPlanInfoChanged, closeDialog])

  // Load persisted state
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (saved === 'expand')
      setExpand(true)
  }, [])

  // Persist state
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, expand ? 'expand' : 'collapse')
  }, [expand])

  // Listen for workflow canvas maximize event
  const inWorkflowCanvas = pathname.endsWith('/workflow')
  const isPipelineCanvas = pathname.endsWith('/pipeline')

  eventEmitter?.useSubscription((v: any) => {
    if (v?.type === 'workflow-canvas-maximize')
      setHideSidebar(v.payload)
  })

  const handleToggle = useCallback(() => {
    setExpand(prev => !prev)
  }, [])

  if (hideSidebar && (inWorkflowCanvas || isPipelineCanvas))
    return null

  return (
    <div
      className={cn(
        'flex h-full shrink-0 flex-col bg-background-default-subtle transition-all duration-200',
        expand ? 'w-[216px]' : 'w-[60px]',
      )}
    >
      {/* Top: Logo */}
      <div
        className="flex h-[56px] shrink-0 cursor-pointer items-center gap-2 border-b border-divider-subtle px-3"
        onClick={handleToggle}
      >
        <img
          src="/logo/logo1.png"
          alt="白泽智能体平台 logo"
          className={cn('shrink-0 object-contain', expand ? 'h-7' : 'h-6')}
        />
        {expand && (
          <span className="text-xs font-semibold text-primary-600">白泽智能体平台</span>
        )}
      </div>

      {/* Middle: Navigation */}
      <nav className="flex grow flex-col gap-y-1 px-2 py-3">
        <SidebarNavItem
          expand={expand}
          icon={<RiHome4Line className="h-5 w-5" />}
          activeIcon={<RiHome4Fill className="h-5 w-5" />}
          text="首页"
          href="/home"
          activeSegment="home"
        />
        <SidebarNavItem
          expand={expand}
          icon={<RiRobot2Line className="h-5 w-5" />}
          activeIcon={<RiRobot2Fill className="h-5 w-5" />}
          text="智能体编排"
          href="/apps"
          activeSegment={['apps', 'app']}
        />
        <SidebarNavItem
          expand={expand}
          icon={<RiCompass3Line className="h-5 w-5" />}
          activeIcon={<RiCompass3Fill className="h-5 w-5" />}
          text="智能体应用广场"
          href="/explore/apps"
          activeSegment="explore"
        />
        <SidebarNavItem
          expand={expand}
          icon={<RiBook2Line className="h-5 w-5" />}
          activeIcon={<RiBook2Fill className="h-5 w-5" />}
          text="Graph知识库"
          href="/datasets"
          activeSegment="datasets"
        />
        <SidebarNavItem
          expand={expand}
          icon={<Group className="h-5 w-5" />}
          activeIcon={<Group className="h-5 w-5" />}
          text="Skills插件管理"
          href="/plugins"
          activeSegment="plugins"
        />
        <SidebarNavItem
          expand={expand}
          icon={<RiHammerLine className="h-5 w-5" />}
          activeIcon={<RiHammerFill className="h-5 w-5" />}
          text="MCP工具"
          href="/tools"
          activeSegment="tools"
        />
      </nav>

      {/* Bottom: Account */}
      <div className={cn(
        'shrink-0 border-t border-divider-subtle',
        expand ? 'p-3' : 'flex items-center justify-center p-3',
      )}>
        <AccountDropdown />
      </div>

      {/* Create dialogs */}
      {createDialog.type === 'app' && (
        <CreateAppModal
          show
          onClose={closeDialog}
          onSuccess={handleCreateSuccess}
          onCreateFromTemplate={() => setCreateDialog({ type: 'template' })}
          defaultAppMode={createDialog.defaultAppMode}
        />
      )}
      {createDialog.type === 'template' && (
        <CreateAppTemplateDialog
          show
          onClose={closeDialog}
          onSuccess={handleCreateSuccess}
          onCreateFromBlank={() => setCreateDialog({ type: 'app' })}
        />
      )}
      {createDialog.type === 'dsl' && (
        <CreateFromDSLModal
          show
          onClose={closeDialog}
          onSuccess={handleCreateSuccess}
        />
      )}
      {createDialog.type === 'workflow' && (
        <WorkflowBuilderDialog
          show
          onClose={closeDialog}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  )
}

export default React.memo(GlobalSidebar)
