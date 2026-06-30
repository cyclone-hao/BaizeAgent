'use client'

import cn from '@/utils/classnames'
import { VIDEO_PROMPT_TEMPLATES } from './config'

type VideoPromptTemplatesProps = {
  onSelect: (prompt: string) => void
}

const VideoPromptTemplates = ({ onSelect }: VideoPromptTemplatesProps) => {
  return (
    <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-4 py-1.5">
      <span className="shrink-0 text-[11px] text-text-quaternary">模板:</span>
      {VIDEO_PROMPT_TEMPLATES.map(tpl => (
        <button
          key={tpl.label}
          type="button"
          className={cn(
            'shrink-0 rounded-full border border-divider-regular bg-transparent px-2.5 py-1 text-[11px] font-medium text-text-tertiary transition-all duration-150',
            'hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 hover:shadow-xs hover:shadow-rose-500/10',
          )}
          onClick={() => onSelect(tpl.prompt)}
        >
          <span className="mr-1">{tpl.icon}</span>
          <span>{tpl.label}</span>
        </button>
      ))}
    </div>
  )
}

export default VideoPromptTemplates
