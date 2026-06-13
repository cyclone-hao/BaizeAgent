'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RiBook2Line, RiCheckLine, RiCloseLine, RiSearchLine } from '@remixicon/react'
import { fetchDatasets } from '@/service/datasets'
import type { DataSet } from '@/models/datasets'
import cn from '@/utils/classnames'
import type { DatasetSelection } from './use-chat-assistant'

type DatasetSelectorProps = {
  selected: DatasetSelection[]
  onChange: (sel: DatasetSelection[]) => void
  disabled?: boolean
}

const DatasetSelector = ({ selected, onChange, disabled }: DatasetSelectorProps) => {
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [allDatasets, setAllDatasets] = useState<DataSet[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const loadingRef = useRef(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const PAGE_SIZE = 20
  const hasSelected = selected.length > 0

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (debounceTimer.current)
      clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setSearch(value)
    }, 300)
  }, [])

  const loadPage = useCallback(async (pageNum: number, keyword: string, append: boolean) => {
    if (loadingRef.current)
      return
    loadingRef.current = true
    setIsLoading(true)
    try {
      const res = await fetchDatasets({ url: '/datasets', params: { page: pageNum, limit: PAGE_SIZE, keyword: keyword || undefined } })
      const pageData = (res as any)?.data || []
      const more = (res as any)?.has_more || false
      if (append)
        setAllDatasets(prev => [...prev, ...pageData])
      else
        setAllDatasets(pageData)
      setHasMore(more)
    }
    catch (err) {
      console.error('Failed to load datasets:', err)
    }
    finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (debounceTimer.current)
        clearTimeout(debounceTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!open)
      return
    setPage(1)
    loadPage(1, search, false)
  }, [open, search, loadPage])

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1
    setPage(nextPage)
    loadPage(nextPage, search, true)
  }, [page, search, loadPage])

  const selectedIds = new Set(selected.map(d => d.id))

  const handleToggle = (ds: DataSet) => {
    if (selectedIds.has(ds.id))
      onChange(selected.filter(d => d.id !== ds.id))
    else
      onChange([...selected, { id: ds.id, name: ds.name }])
  }

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter(d => d.id !== id))
  }

  const handleOpenToggle = () => {
    if (disabled) return
    setOpen(!open)
    if (!open) {
      setSearchInput('')
      setSearch('')
      setAllDatasets([])
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  return (
    <div className="relative inline-flex items-center gap-1.5">
      {/* Toggle button — matches 深度思考 / 联网搜索 style */}
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200',
          hasSelected
            ? 'border-emerald-300 bg-emerald-50 text-emerald-600 shadow-xs shadow-emerald-500/10'
            : 'border-divider-regular bg-transparent text-text-tertiary hover:border-components-input-border-hover hover:text-text-secondary',
          disabled && 'cursor-not-allowed opacity-50',
        )}
        onClick={handleOpenToggle}
        disabled={disabled}
      >
        <RiBook2Line className="h-3.5 w-3.5" />
        <span>知识库</span>
        {hasSelected && (
          <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold leading-none text-white">
            {selected.length}
          </span>
        )}
      </button>

      {/* Selected chips — inline after toggle */}
      {selected.map(ds => (
        <span
          key={ds.id}
          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600"
        >
          <span className="max-w-[80px] truncate">{ds.name}</span>
          <button
            type="button"
            className="rounded-full transition-colors hover:bg-emerald-200/60"
            onClick={(e) => handleRemove(ds.id, e)}
          >
            <RiCloseLine className="h-3 w-3" />
          </button>
        </span>
      ))}

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-20 mb-1.5 w-[320px] rounded-xl border border-components-panel-border bg-components-panel-bg shadow-lg">
            {/* Header */}
            <div className="border-b border-divider-subtle px-3 py-2">
              <div className="flex items-center gap-2 rounded-lg bg-components-input-bg-normal px-2.5 py-1.5">
                <RiSearchLine className="h-3.5 w-3.5 shrink-0 text-text-quaternary" />
                <input
                  ref={inputRef}
                  className="w-full bg-transparent text-xs text-text-primary outline-none placeholder:text-text-quaternary"
                  placeholder="搜索知识库..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>

            {/* Dataset List */}
            <div className="max-h-[280px] overflow-y-auto p-1.5">
              {isLoading && allDatasets.length === 0
                ? (
                  <div className="px-3 py-8 text-center text-xs text-text-quaternary">
                    加载中...
                  </div>
                )
                : allDatasets.length === 0
                  ? (
                    <div className="px-3 py-8 text-center text-xs text-text-quaternary">
                      {search ? '未找到匹配的知识库' : '暂无知识库'}
                      <br />
                      <span>请先在知识库页面创建</span>
                    </div>
                  )
                  : (
                    <>
                      {allDatasets.map(ds => (
                        <button
                          key={ds.id}
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                            selectedIds.has(ds.id) ? 'bg-emerald-50' : 'hover:bg-state-base-hover',
                          )}
                          onClick={() => handleToggle(ds)}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-text-secondary">
                              {ds.name}
                            </div>
                            <div className="truncate text-[11px] text-text-quaternary">
                              {ds.document_count} 篇文档
                              {ds.description ? ` · ${ds.description}` : ''}
                            </div>
                          </div>
                          {!ds.embedding_available && (
                            <span className="shrink-0 rounded bg-util-colors-orange-orange-50 px-1 py-0.5 text-[10px] text-orange-600">
                              不可用
                            </span>
                          )}
                          {selectedIds.has(ds.id) && (
                            <RiCheckLine className="h-4 w-4 shrink-0 text-emerald-600" />
                          )}
                        </button>
                      ))}
                      {hasMore && (
                        <button
                          type="button"
                          className="w-full rounded-lg px-3 py-2 text-center text-xs text-primary-600 hover:bg-state-base-hover"
                          onClick={handleLoadMore}
                        >
                          加载更多...
                        </button>
                      )}
                    </>
                  )}
            </div>

            {/* Footer hint */}
            {hasSelected && (
              <div className="border-t border-divider-subtle px-3 py-1.5 text-[11px] text-text-quaternary">
                已选择 {selected.length} 个知识库，对话时将自动检索相关内容
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default DatasetSelector
