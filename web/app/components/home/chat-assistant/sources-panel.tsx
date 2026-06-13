'use client'

import { RiGlobalLine } from '@remixicon/react'
import type { WebSearchResult } from '@/service/web-search'

type SourcesPanelProps = {
  sources: WebSearchResult[]
}

const SourcesPanel = ({ sources }: SourcesPanelProps) => {
  return (
    <div className="mt-2 rounded-lg border border-divider-subtle bg-background-body p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs text-text-tertiary">
        <RiGlobalLine className="h-3.5 w-3.5" />
        <span>搜索来源（{sources.length} 条）</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, i) => (
          <a
            key={i}
            id={`source-${i + 1}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 rounded-lg border border-divider-subtle bg-components-card-bg px-2.5 py-1.5 text-xs transition-colors hover:border-primary-300 hover:bg-primary-50"
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-util-colors-indigo-indigo-50 text-[10px] font-medium text-primary-600">
              {i + 1}
            </span>
            <span className="max-w-[180px] truncate text-text-secondary group-hover:text-primary-600">
              {source.title}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

export default SourcesPanel
