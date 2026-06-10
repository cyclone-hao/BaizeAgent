'use client'

import { memo } from 'react'
import { RiBrainLine, RiSearchLine } from '@remixicon/react'
import cn from '@/utils/classnames'
import { HOME_CHAT_LABELS } from './config'

type ChatTogglesProps = {
  deepThinking: boolean
  smartSearch: boolean
  onDeepThinkingChange: (v: boolean) => void
  onSmartSearchChange: (v: boolean) => void
  disabled?: boolean
}

const ToggleChip = ({
  icon: Icon,
  label,
  active,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  onClick: () => void
  disabled?: boolean
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all',
      active
        ? 'border-primary-300 bg-primary-50 text-primary-600'
        : 'border-divider-regular bg-transparent text-text-tertiary hover:border-components-input-border-hover hover:text-text-secondary',
      disabled && 'cursor-not-allowed opacity-50',
    )}
  >
    <Icon className="h-3.5 w-3.5" />
    <span>{label}</span>
  </button>
)

const ChatToggles = ({
  deepThinking,
  smartSearch,
  onDeepThinkingChange,
  onSmartSearchChange,
  disabled,
}: ChatTogglesProps) => {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <ToggleChip
        icon={RiBrainLine}
        label={HOME_CHAT_LABELS.deepThinking}
        active={deepThinking}
        onClick={() => onDeepThinkingChange(!deepThinking)}
        disabled={disabled}
      />
      <ToggleChip
        icon={RiSearchLine}
        label={HOME_CHAT_LABELS.smartSearch}
        active={smartSearch}
        onClick={() => onSmartSearchChange(!smartSearch)}
        disabled={disabled}
      />
    </div>
  )
}

export default memo(ChatToggles)
