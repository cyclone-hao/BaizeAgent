'use client'

import { useRef, useState } from 'react'
import { RiArrowDownSLine, RiCheckLine, RiSearchLine } from '@remixicon/react'
import cn from '@/utils/classnames'
import type { FlatModel, ModelSelection } from './use-chat-assistant'

// ── Model Row ──

const ModelRow = ({
  model,
  isSelected,
  onSelect,
  showProvider,
}: {
  model: FlatModel
  isSelected: boolean
  onSelect: () => void
  showProvider?: boolean
}) => (
  <button
    type="button"
    className={cn(
      'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors',
      isSelected ? 'bg-primary-50' : 'hover:bg-state-base-hover',
    )}
    onClick={onSelect}
  >
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-medium text-text-secondary">
        {model.modelLabel}
      </div>
      {showProvider && (
        <div className="truncate text-[11px] text-text-quaternary">
          {model.providerLabel}
        </div>
      )}
    </div>
    {model.features.length > 0 && (
      <div className="flex shrink-0 gap-1">
        {model.features.includes('vision') && (
          <span className="rounded bg-util-colors-blue-blue-50 px-1 py-0.5 text-[10px] text-blue-600">视觉</span>
        )}
        {(model.features.includes('tool-call') || model.features.includes('multi-tool-call')) && (
          <span className="rounded bg-util-colors-orange-orange-50 px-1 py-0.5 text-[10px] text-orange-600">工具</span>
        )}
      </div>
    )}
    {isSelected && <RiCheckLine className="h-4 w-4 shrink-0 text-primary-600" />}
  </button>
)

// ── Model Selector ──

type ModelSelectorProps = {
  models: FlatModel[]
  selected: ModelSelection | null
  onChange: (sel: ModelSelection) => void
}

const ModelSelector = ({ models, selected, onChange }: ModelSelectorProps) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Group models by provider
  const grouped = models.reduce<Record<string, { label: string; models: FlatModel[] }>>((acc, m) => {
    if (!acc[m.provider])
      acc[m.provider] = { label: m.providerLabel, models: [] }
    acc[m.provider].models.push(m)
    return acc
  }, {})

  // Filter by search
  const filtered = search.trim()
    ? models.filter(m =>
      m.modelLabel.toLowerCase().includes(search.toLowerCase())
        || m.model.toLowerCase().includes(search.toLowerCase())
        || m.providerLabel.toLowerCase().includes(search.toLowerCase()),
    )
    : null

  const selectedLabel = selected
    ? models.find(m => m.provider === selected.provider && m.model === selected.model)?.modelLabel || selected.model
    : '选择模型'

  const handleSelect = (m: FlatModel) => {
    onChange({ provider: m.provider, model: m.model, mode: m.mode })
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
          selected
            ? 'border-divider-regular bg-components-panel-on-panel-item-bg text-text-secondary hover:bg-state-base-hover'
            : 'border-primary-300 bg-primary-50 text-primary-600 hover:bg-primary-100',
        )}
        onClick={() => {
          setOpen(!open)
          setTimeout(() => inputRef.current?.focus(), 50)
        }}
      >
        <span className="max-w-[140px] truncate">{selectedLabel}</span>
        <RiArrowDownSLine className={cn('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => {
            setOpen(false)
            setSearch('')
          }} />
          <div className="absolute right-0 top-full z-20 mt-1 w-[300px] rounded-xl border border-components-panel-border bg-components-panel-bg shadow-lg">
            {/* Search */}
            <div className="border-b border-divider-subtle px-3 py-2">
              <div className="flex items-center gap-2 rounded-lg bg-components-input-bg-normal px-2.5 py-1.5">
                <RiSearchLine className="h-3.5 w-3.5 shrink-0 text-text-quaternary" />
                <input
                  ref={inputRef}
                  className="w-full bg-transparent text-xs text-text-primary outline-none placeholder:text-text-quaternary"
                  placeholder="搜索模型..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Model List */}
            <div className="max-h-[320px] overflow-y-auto p-1.5">
              {models.length === 0
                ? (
                  <div className="px-3 py-8 text-center text-xs text-text-quaternary">
                    暂无可用模型
                    <br />
                    <span>请先在模型供应商中配置模型</span>
                  </div>
                )
                : filtered !== null && filtered.length === 0
                  ? (
                    <div className="px-3 py-6 text-center text-xs text-text-quaternary">
                      未找到匹配的模型
                    </div>
                  )
                  : filtered !== null
                    ? (
                      // Flat filtered list
                      filtered.map(m => (
                        <ModelRow
                          key={`${m.provider}/${m.model}`}
                          model={m}
                          isSelected={!!(selected && selected.provider === m.provider && selected.model === m.model)}
                          onSelect={() => handleSelect(m)}
                          showProvider
                        />
                      ))
                    )
                    : (
                      // Grouped by provider
                      Object.entries(grouped).map(([provider, { label, models: groupModels }]) => (
                        <div key={provider} className="mb-1">
                          <div className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-text-quaternary">
                            {label}
                          </div>
                          {groupModels.map(m => (
                            <ModelRow
                              key={`${m.provider}/${m.model}`}
                              model={m}
                              isSelected={!!(selected && selected.provider === m.provider && selected.model === m.model)}
                              onSelect={() => handleSelect(m)}
                            />
                          ))}
                        </div>
                      ))
                    )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ModelSelector
