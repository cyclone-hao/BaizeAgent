'use client'
import React from 'react'
import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'
import Tooltip from '@/app/components/base/tooltip'
import cn from '@/utils/classnames'

type SidebarNavItemProps = {
  expand: boolean
  icon: React.ReactNode
  activeIcon: React.ReactNode
  text: string
  href: string
  activeSegment: string | string[]
}

const SidebarNavItem = ({
  expand,
  icon,
  activeIcon,
  text,
  href,
  activeSegment,
}: SidebarNavItemProps) => {
  const segment = useSelectedLayoutSegment()
  const isActivated = Array.isArray(activeSegment)
    ? activeSegment.includes(segment!)
    : segment === activeSegment

  const content = (
    <Link
      href={href}
      className={cn(
        'flex items-center rounded-xl text-sm font-medium transition-colors',
        expand
          ? 'gap-3 px-3 py-2.5'
          : 'justify-center px-0 py-2.5',
        isActivated
          ? 'bg-components-main-nav-nav-button-bg-active text-components-main-nav-nav-button-text-active shadow-sm'
          : 'text-text-tertiary hover:bg-state-base-hover hover:text-text-secondary',
      )}
    >
      <div className="flex h-5 w-5 shrink-0 items-center justify-center">
        {isActivated ? activeIcon : icon}
      </div>
      {expand && <span className="truncate">{text}</span>}
    </Link>
  )

  // Show tooltip only when collapsed
  if (!expand) {
    return (
      <Tooltip
        popupContent={text}
        position="right"
      >
        {content}
      </Tooltip>
    )
  }

  return content
}

export default React.memo(SidebarNavItem)
