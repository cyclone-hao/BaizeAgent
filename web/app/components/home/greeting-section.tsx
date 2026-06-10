'use client'

import { useCallback, useMemo } from 'react'
import Input from '@/app/components/base/input'

type GreetingSectionProps = {
  userName: string
  searchKeywords: string
  onSearchChange: (keywords: string) => void
}

const SUGGESTED_PROMPTS = [
  '帮我写一份周报',
  '分析这段数据',
  '翻译以下文档',
  '生成产品需求文档',
  '整理会议纪要',
  '优化代码性能',
]

const getGreeting = (): string => {
  const hour = new Date().getHours()
  if (hour < 6)
    return '夜深了'
  if (hour < 9)
    return '早上好'
  if (hour < 12)
    return '上午好'
  if (hour < 14)
    return '中午好'
  if (hour < 18)
    return '下午好'
  return '晚上好'
}

const GreetingSection = ({
  userName,
  searchKeywords,
  onSearchChange,
}: GreetingSectionProps) => {
  const greeting = useMemo(() => getGreeting(), [])

  const handlePromptClick = useCallback((prompt: string) => {
    onSearchChange(prompt)
  }, [onSearchChange])

  const handleClear = useCallback(() => {
    onSearchChange('')
  }, [onSearchChange])

  return (
    <div className="mb-8">
      {/* Greeting */}
      <h1 className="mb-1 text-2xl font-semibold text-text-secondary">
        {greeting}，{userName || '用户'}
      </h1>
      <p className="mb-6 text-sm text-text-tertiary">
        有什么我可以帮你的？
      </p>

      {/* Search Input */}
      <div className="mb-4 max-w-2xl">
        <Input
          showLeftIcon
          showClearIcon
          size="large"
          placeholder="输入问题，或描述你需要完成的任务"
          value={searchKeywords}
          onChange={e => onSearchChange(e.target.value)}
          onClear={handleClear}
        />
      </div>

      {/* Suggested Prompts */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map(prompt => (
          <button
            key={prompt}
            className="rounded-lg border border-divider-regular bg-components-panel-on-panel-item-bg px-3 py-1.5 text-xs text-text-tertiary transition-colors hover:border-components-input-border-hover hover:bg-state-base-hover hover:text-text-secondary"
            onClick={() => handlePromptClick(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default GreetingSection
